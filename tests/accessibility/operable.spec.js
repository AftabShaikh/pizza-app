// tests/accessibility/operable.spec.js
import { test, expect } from '@playwright/test';
import { AccessibilityHelper } from '../utils/accessibility-helpers.js';

test.describe('WCAG 2 - Operable', () => {
  let accessibilityHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityHelper(page);
    await page.goto('/');
  });

  test.describe('2.1 Keyboard Accessible', () => {
    test('2.1.1 All functionality available via keyboard', async ({ page }) => {
      const failures = [];
      
      // Get all interactive elements
      const interactiveElements = await page.locator('a, button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])').all();
      
      for (const element of interactiveElements) {
        // Test if element is focusable
        try {
          await element.focus();
          const isFocused = await element.evaluate(el => document.activeElement === el);
          
          if (!isFocused) {
            const selector = await accessibilityHelper.getElementSelector(element);
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              `Interactive ${tagName} element is not keyboard accessible`,
              '2.1.1',
              'Ensure all interactive elements can receive keyboard focus',
              'high',
              { 
                location: await element.boundingBox(),
                elementType: tagName
              }
            ));
          } else {
            // Test if element can be activated via keyboard
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            
            if (tagName === 'button' || tagName === 'a') {
              // Try to activate with Enter key
              await page.keyboard.press('Enter');
              await page.waitForTimeout(100);
              
              // Try to activate with Space key (for buttons)
              if (tagName === 'button') {
                await element.focus();
                await page.keyboard.press('Space');
                await page.waitForTimeout(100);
              }
            }
          }
        } catch (error) {
          const selector = await accessibilityHelper.getElementSelector(element);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Element cannot be focused with keyboard',
            '2.1.1',
            'Add proper tabindex or ensure element is inherently focusable',
            'high',
            { 
              location: await element.boundingBox(),
              error: error.message
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('2.1.2 No keyboard trap', async ({ page }) => {
      const failures = [];
      
      // Test keyboard navigation doesn't get trapped
      const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      
      if (focusableElements.length > 1) {
        // Start from first focusable element
        await focusableElements[0].focus();
        
        // Tab through all elements and ensure we can navigate freely
        for (let i = 0; i < focusableElements.length + 2; i++) { // +2 to test cycling
          const beforeTabElement = await page.evaluate(() => document.activeElement);
          await page.keyboard.press('Tab');
          await page.waitForTimeout(50);
          const afterTabElement = await page.evaluate(() => document.activeElement);
          
          // Check if we're stuck on the same element (potential trap)
          const isStuck = await page.evaluate((before, after) => {
            return before === after && before !== document.body;
          }, beforeTabElement, afterTabElement);
          
          if (isStuck && i > 0) {
            const selector = await page.evaluate(el => {
              return el.getAttribute('data-testid') || 
                     el.id && '#' + el.id ||
                     el.tagName.toLowerCase();
            }, beforeTabElement);
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              'Keyboard focus appears to be trapped on element',
              '2.1.2',
              'Ensure Tab key can move focus to next element and Shift+Tab to previous',
              'high',
              { 
                trapPosition: i,
                totalFocusableElements: focusableElements.length
              }
            ));
            break; // Exit loop if we detect a trap
          }
        }
        
        // Test reverse tab navigation
        await page.keyboard.press('Shift+Tab');
        await page.waitForTimeout(50);
        
        // Test Escape key can exit focus traps if they exist
        await page.keyboard.press('Escape');
        await page.waitForTimeout(50);
      }

      expect(failures).toHaveLength(0);
    });

    test('2.1.4 Character key shortcuts', async ({ page }) => {
      const failures = [];
      
      // Test for problematic single-character shortcuts
      const testKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
      
      for (const key of testKeys) {
        const beforeUrl = page.url();
        const beforeActiveElement = await page.evaluate(() => document.activeElement);
        
        // Press single character key
        await page.keyboard.press(key);
        await page.waitForTimeout(100);
        
        const afterUrl = page.url();
        const afterActiveElement = await page.evaluate(() => document.activeElement);
        
        // Check if single key press caused unwanted action
        const causedNavigation = beforeUrl !== afterUrl;
        const changedFocus = beforeActiveElement !== afterActiveElement;
        
        if (causedNavigation) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            'page',
            `Single character key '${key}' triggered navigation without modifier keys`,
            '2.1.4',
            'Use modifier keys (Ctrl, Alt, etc.) for character-based shortcuts or make them configurable',
            'medium',
            { 
              key,
              beforeUrl,
              afterUrl
            }
          ));
          
          // Navigate back to continue testing
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      }

      expect(failures).toHaveLength(0);
    });
  });

  test.describe('2.4 Navigable (Level AA)', () => {
    test('2.4.5 Multiple ways to find pages', async ({ page }) => {
      const failures = [];
      const navigationMethods = {
        siteMap: 'a[href*="sitemap"], a[href*="site-map"], a:has-text("sitemap"), a:has-text("site map")',
        search: 'input[type="search"], [role="search"], form:has(input[type="search"]), .search',
        breadcrumbs: '.breadcrumb, [aria-label*="breadcrumb"], nav:has-text("breadcrumb"), .breadcrumbs',
        tableOfContents: '.toc, .table-of-contents, nav:has-text("contents")',
        mainNavigation: 'nav, .navigation, .main-nav, .navbar, header nav'
      };

      let methodsFound = 0;
      const foundMethods = [];

      for (const [method, selector] of Object.entries(navigationMethods)) {
        const elements = await page.locator(selector);
        const count = await elements.count();
        
        if (count > 0) {
          methodsFound++;
          foundMethods.push(method);
        }
      }

      if (methodsFound < 2) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'page navigation',
          `Only ${methodsFound} navigation method found. WCAG requires at least 2 methods.`,
          '2.4.5',
          'Implement at least two navigation methods: site map, search, breadcrumbs, table of contents, or comprehensive navigation menu',
          'medium',
          { 
            foundMethods,
            methodsFound,
            requiredMethods: 2
          }
        ));
      }

      expect(failures).toHaveLength(0);
    });

    test('2.4.6 Headings and labels are informative', async ({ page }) => {
      const failures = [];
      
      // Check headings
      const headingResults = await accessibilityHelper.checkHeadingHierarchy();
      
      headingResults.issues.forEach(issue => {
        let message, remediation;
        
        switch (issue.type) {
          case 'empty-heading':
            message = `Empty ${issue.element} heading found`;
            remediation = 'Provide descriptive heading text or remove empty heading';
            break;
          case 'skipped-level':
            message = `Heading level skipped from h${issue.from} to h${issue.to}`;
            remediation = 'Use proper heading hierarchy without skipping levels';
            break;
          default:
            message = `Heading structure issue: ${issue.type}`;
            remediation = 'Fix heading hierarchy and ensure all headings have descriptive text';
        }
        
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          issue.element || 'heading',
          message,
          '2.4.6',
          remediation,
          issue.type === 'empty-heading' ? 'high' : 'medium',
          { 
            issue,
            headingHierarchy: headingResults.hierarchy
          }
        ));
      });

      // Check for generic or non-descriptive headings
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      
      for (const heading of headings) {
        const text = await heading.textContent();
        const tagName = await heading.evaluate(el => el.tagName);
        
        if (text && text.trim().length > 0) {
          // Check for non-descriptive text
          const nonDescriptivePatterns = [
            /^(title|heading|header)$/i,
            /^(click here|read more|more)$/i,
            /^(welcome|hello)$/i,
            /^(page|section|content)$/i
          ];
          
          const isNonDescriptive = nonDescriptivePatterns.some(pattern => pattern.test(text.trim()));
          
          if (isNonDescriptive || text.trim().length < 3) {
            const selector = await accessibilityHelper.getElementSelector(heading);
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              `Non-descriptive heading: "${text}"`,
              '2.4.6',
              'Make heading text more descriptive of the content that follows',
              'medium',
              { 
                location: await heading.boundingBox(),
                headingLevel: tagName,
                headingText: text
              }
            ));
          }
        }
      }

      // Check form labels
      const labels = await page.locator('label').all();
      
      for (const label of labels) {
        const text = await label.textContent();
        
        if (!text || text.trim().length === 0) {
          const selector = await accessibilityHelper.getElementSelector(label);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Empty form label found',
            '2.4.6',
            'Provide descriptive label text',
            'high',
            { location: await label.boundingBox() }
          ));
        } else if (text.trim().length < 2) {
          const selector = await accessibilityHelper.getElementSelector(label);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Label text too short: "${text}"`,
            '2.4.6',
            'Provide more descriptive label text',
            'medium',
            { 
              location: await label.boundingBox(),
              labelText: text
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('2.4.7 Focus visible', async ({ page }) => {
      const failures = [];
      const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
      
      for (const element of focusableElements) {
        await element.focus();
        
        const focusResult = await accessibilityHelper.checkFocusIndicator(element);
        
        if (!focusResult.hasVisibleFocus) {
          const selector = await accessibilityHelper.getElementSelector(element);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'No visible focus indicator',
            '2.4.7',
            'Add CSS focus styles (outline, box-shadow, or border changes) with sufficient contrast',
            'high',
            { 
              location: await element.boundingBox(),
              focusStyles: focusResult.styles
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('2.4.1 Skip navigation links', async ({ page }) => {
      const failures = [];
      
      // Look for skip links
      const skipLinks = await page.locator('a[href*="#"], a:has-text("skip"), a:has-text("jump")').all();
      let hasSkipToContent = false;
      
      for (const link of skipLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (href && href.startsWith('#') && 
            text && (text.toLowerCase().includes('skip') || 
                    text.toLowerCase().includes('jump') || 
                    text.toLowerCase().includes('main'))) {
          hasSkipToContent = true;
          
          // Test if skip link works
          await link.click();
          await page.waitForTimeout(100);
          
          const targetElement = await page.locator(href).first();
          const targetExists = await targetElement.count() > 0;
          
          if (!targetExists) {
            const selector = await accessibilityHelper.getElementSelector(link);
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              `Skip link target "${href}" does not exist`,
              '2.4.1',
              'Ensure skip link targets exist and are properly marked with IDs',
              'medium',
              { 
                location: await link.boundingBox(),
                href,
                linkText: text
              }
            ));
          }
        }
      }
      
      // Check if page has repetitive navigation that would benefit from skip links
      const navigationElements = await page.locator('nav, .navigation, .menu').all();
      
      if (navigationElements.length > 0 && !hasSkipToContent) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'page',
          'Page has navigation but no skip links found',
          '2.4.1',
          'Add skip navigation links to help keyboard users bypass repetitive content',
          'medium',
          { navigationElementsFound: navigationElements.length }
        ));
      }

      expect(failures).toHaveLength(0);
    });

    test('2.4.2 Page titles are descriptive', async ({ page }) => {
      const failures = [];
      
      const pageTitle = await page.title();
      
      if (!pageTitle || pageTitle.trim().length === 0) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'title',
          'Page has no title',
          '2.4.2',
          'Add a descriptive <title> element to the page',
          'high'
        ));
      } else if (pageTitle.trim().length < 4) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'title',
          `Page title too short: "${pageTitle}"`,
          '2.4.2',
          'Make page title more descriptive and informative',
          'medium',
          { pageTitle }
        ));
      } else {
        // Check for generic titles
        const genericPatterns = [
          /^(untitled|page|document|home|welcome)$/i,
          /^(new page|blank|default)$/i
        ];
        
        const isGeneric = genericPatterns.some(pattern => pattern.test(pageTitle.trim()));
        
        if (isGeneric) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            'title',
            `Generic page title: "${pageTitle}"`,
            '2.4.2',
            'Use specific, descriptive page titles that identify the page content or purpose',
            'medium',
            { pageTitle }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('2.4.3 Focus order is logical', async ({ page }) => {
      const failures = [];
      
      // Get all focusable elements in DOM order
      const focusableElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
        return elements.map((el, index) => ({
          index,
          tagName: el.tagName.toLowerCase(),
          id: el.id,
          className: el.className,
          textContent: el.textContent?.substring(0, 30),
          tabIndex: el.tabIndex,
          boundingBox: el.getBoundingClientRect()
        }));
      });
      
      // Test tab order
      if (focusableElements.length > 1) {
        await page.keyboard.press('Tab'); // Move focus away from address bar
        
        const tabOrder = [];
        let currentElement = null;
        
        for (let i = 0; i < Math.min(focusableElements.length, 10); i++) { // Limit to prevent infinite loops
          await page.keyboard.press('Tab');
          await page.waitForTimeout(50);
          
          currentElement = await page.evaluate(() => {
            const active = document.activeElement;
            if (active && active !== document.body) {
              return {
                tagName: active.tagName.toLowerCase(),
                id: active.id,
                className: active.className,
                textContent: active.textContent?.substring(0, 30),
                tabIndex: active.tabIndex,
                boundingBox: active.getBoundingClientRect()
              };
            }
            return null;
          });
          
          if (currentElement) {
            tabOrder.push(currentElement);
          }
        }
        
        // Analyze tab order for logical flow (top to bottom, left to right)
        for (let i = 1; i < tabOrder.length; i++) {
          const prev = tabOrder[i - 1];
          const curr = tabOrder[i];
          
          // Check if focus jumps unexpectedly (major position changes)
          const verticalJump = Math.abs(curr.boundingBox.top - prev.boundingBox.top) > 200;
          const leftwardJump = curr.boundingBox.left < prev.boundingBox.left - 100 && 
                              curr.boundingBox.top < prev.boundingBox.top;
          
          if (verticalJump || leftwardJump) {
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              'focus order',
              `Focus order appears illogical: jumped from ${prev.tagName}${prev.id ? '#' + prev.id : ''} to ${curr.tagName}${curr.id ? '#' + curr.id : ''}`,
              '2.4.3',
              'Ensure tab order follows a logical sequence (usually top to bottom, left to right)',
              'medium',
              { 
                prevElement: prev,
                currElement: curr,
                tabOrderIndex: i
              }
            ));
          }
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('2.4.4 Link purpose is clear', async ({ page }) => {
      const failures = [];
      
      const links = await page.locator('a[href]').all();
      const linkTexts = new Map(); // Track duplicate link texts
      
      for (const link of links) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        const linkText = text?.trim() || ariaLabel || title || '';
        
        // Check for missing or inadequate link text
        if (!linkText) {
          const selector = await accessibilityHelper.getElementSelector(link);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Link has no accessible text',
            '2.4.4',
            'Add descriptive link text, aria-label, or title attribute',
            'high',
            { 
              location: await link.boundingBox(),
              href
            }
          ));
        } else if (linkText.length < 3) {
          const selector = await accessibilityHelper.getElementSelector(link);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Link text too short: "${linkText}"`,
            '2.4.4',
            'Provide more descriptive link text that explains the link purpose',
            'medium',
            { 
              location: await link.boundingBox(),
              href,
              linkText
            }
          ));
        } else {
          // Check for generic link text
          const genericPatterns = [
            /^(click here|here|more|read more|link)$/i,
            /^(go|view|see|check|download)$/i,
            /^(page|article|document|file)$/i
          ];
          
          const isGeneric = genericPatterns.some(pattern => pattern.test(linkText));
          
          if (isGeneric) {
            const selector = await accessibilityHelper.getElementSelector(link);
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              `Generic link text: "${linkText}"`,
              '2.4.4',
              'Use specific, descriptive link text that clearly indicates the link destination or purpose',
              'medium',
              { 
                location: await link.boundingBox(),
                href,
                linkText
              }
            ));
          }
          
          // Track duplicate link texts
          if (!linkTexts.has(linkText)) {
            linkTexts.set(linkText, []);
          }
          linkTexts.get(linkText).push({ link, href });
        }
      }
      
      // Check for duplicate link texts pointing to different destinations
      linkTexts.forEach((links, text) => {
        if (links.length > 1) {
          const uniqueHrefs = [...new Set(links.map(l => l.href))];
          
          if (uniqueHrefs.length > 1) {
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              'multiple links',
              `Multiple links with same text "${text}" point to different destinations`,
              '2.4.4',
              'Make link text unique or add additional context to distinguish between different destinations',
              'medium',
              { 
                linkText: text,
                destinations: uniqueHrefs,
                linkCount: links.length
              }
            ));
          }
        }
      });

      expect(failures).toHaveLength(0);
    });
  });
});