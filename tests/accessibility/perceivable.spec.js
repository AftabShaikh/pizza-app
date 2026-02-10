// tests/accessibility/perceivable.spec.js
import { test, expect } from '@playwright/test';
import { AccessibilityHelper } from '../utils/accessibility-helpers.js';

test.describe('WCAG 1 - Perceivable', () => {
  let accessibilityHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityHelper(page);
    await page.goto('/');
  });

  test.describe('1.1 Text Alternatives (Level A Foundation)', () => {
    test('1.1.1 Images have appropriate alt text', async ({ page }) => {
      const images = await page.locator('img').all();
      const failures = [];

      for (const img of images) {
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        const ariaLabel = await img.getAttribute('aria-label');
        
        // Get element location for reporting
        const box = await img.boundingBox();
        const selector = await accessibilityHelper.getElementSelector(img);

        // Check for missing alt attribute (but not empty alt which is valid for decorative images)
        if (alt === null && !ariaLabel && role !== 'presentation' && role !== 'img') {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Image missing alt attribute',
            '1.1.1',
            'Add descriptive alt text or alt="" for decorative images',
            'high',
            { location: box, src }
          ));
        }

        // Check for alt text that's too long
        if (alt && alt.length > 125) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Alt text too long (${alt.length} characters): "${alt.substring(0, 50)}..."`,
            '1.1.1',
            'Keep alt text under 125 characters, use longdesc or adjacent text for detailed descriptions',
            'medium',
            { location: box, src, altTextLength: alt.length }
          ));
        }

        // Check for redundant alt text
        if (alt && (alt.toLowerCase().includes('image of') || alt.toLowerCase().includes('picture of'))) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Redundant alt text: "${alt}"`,
            '1.1.1',
            'Remove redundant phrases like "image of" or "picture of" from alt text',
            'medium',
            { location: box, src }
          ));
        }
      }

      if (failures.length > 0) {
        console.log('Alt Text Failures:', JSON.stringify(failures, null, 2));
      }
      expect(failures).toHaveLength(0);
    });

    test('1.1.1 Form inputs have accessible names', async ({ page }) => {
      const inputs = await page.locator('input, textarea, select').all();
      const failures = [];

      for (const input of inputs) {
        const type = await input.getAttribute('type');
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        const title = await input.getAttribute('title');
        const placeholder = await input.getAttribute('placeholder');
        
        const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
        const hasAccessibleName = ariaLabel || ariaLabelledby || hasLabel || title;
        
        // Skip certain input types that don't require labels
        if (['submit', 'button', 'reset', 'hidden', 'image'].includes(type)) {
          continue;
        }
        
        if (!hasAccessibleName) {
          const selector = await accessibilityHelper.getElementSelector(input);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Form input lacks accessible name',
            '1.1.1',
            'Add label element, aria-label, aria-labelledby, or title attribute',
            'high',
            { 
              location: await input.boundingBox(),
              inputType: type,
              hasPlaceholder: !!placeholder
            }
          ));
        }

        // Check if only using placeholder as label (not sufficient)
        if (!hasAccessibleName && placeholder) {
          const selector = await accessibilityHelper.getElementSelector(input);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Input relies only on placeholder for labeling',
            '1.1.1',
            'Add a proper label in addition to placeholder text',
            'medium',
            { 
              location: await input.boundingBox(),
              placeholder
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('1.1.1 Buttons have accessible names', async ({ page }) => {
      const buttons = await page.locator('button, input[type="button"], input[type="submit"], input[type="reset"]').all();
      const failures = [];

      for (const button of buttons) {
        const text = await button.textContent();
        const value = await button.getAttribute('value');
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledby = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');
        
        const hasAccessibleName = text?.trim() || value || ariaLabel || ariaLabelledby || title;
        
        if (!hasAccessibleName) {
          const selector = await accessibilityHelper.getElementSelector(button);
          const sourceInfo = await accessibilityHelper.getElementSourceInfo(button);
          
          // Use intelligent file mapping
          const likelySourceFile = accessibilityHelper.mapElementToSourceFile(sourceInfo, selector);
          
          failures.push(accessibilityHelper.createFailureReport(
            likelySourceFile,
            selector,
            'Button lacks accessible name',
            '1.1.1',
            'Add button text, value attribute, aria-label, or aria-labelledby',
            'high',
            { 
              location: await button.boundingBox(),
              sourceInfo,
              elementPath: sourceInfo.elementPath,
              reactComponent: sourceInfo.componentName,
              likelySourceFile
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });
  });

  test.describe('1.2 Time-based Media (Level AA)', () => {
    test('1.2.4 Live captions available', async ({ page }) => {
      // Check all pages for video elements
      const videoElements = await page.locator('video').all();
      const failures = [];

      for (const video of videoElements) {
        const isLive = await video.evaluate(el => 
          el.duration === Infinity || 
          el.getAttribute('data-live') === 'true' ||
          el.src?.includes('live') ||
          el.currentSrc?.includes('live')
        );

        if (isLive) {
          const hasCaptions = await video.evaluate(el => {
            const tracks = el.querySelectorAll('track[kind="captions"], track[kind="subtitles"]');
            return tracks.length > 0;
          });

          if (!hasCaptions) {
            const selector = await accessibilityHelper.getElementSelector(video);

            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              'Live video lacks captions',
              '1.2.4',
              'Add <track kind="captions"> elements for live video content',
              'high',
              { location: await video.boundingBox() }
            ));
          }
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('1.2.5 Audio description for prerecorded video', async ({ page }) => {
      const videoElements = await page.locator('video').all();
      const failures = [];

      for (const video of videoElements) {
        const hasAudioDescription = await video.evaluate(el => {
          const tracks = el.querySelectorAll('track[kind="descriptions"]');
          return tracks.length > 0;
        });

        const hasVisualContent = await video.evaluate(el => {
          return el.videoWidth > 0 && el.videoHeight > 0;
        });

        const isPrerecorded = await video.evaluate(el => 
          el.duration !== Infinity && 
          !el.getAttribute('data-live') &&
          !el.src?.includes('live') &&
          !el.currentSrc?.includes('live')
        );

        if (hasVisualContent && isPrerecorded && !hasAudioDescription) {
          const selector = await accessibilityHelper.getElementSelector(video);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Prerecorded video with visual content lacks audio description',
            '1.2.5',
            'Add <track kind="descriptions"> or provide alternative video with audio description',
            'medium',
            { location: await video.boundingBox() }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });
  });

  test.describe('1.3 Adaptable Content', () => {
    test('1.3.4 Orientation not restricted', async ({ page }) => {
      const viewports = [
        { width: 800, height: 600, name: 'landscape' },
        { width: 600, height: 800, name: 'portrait' }
      ];
      
      const failures = [];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForLoadState('networkidle');
        
        const contentAccessibility = await page.evaluate(() => {
          const elements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
          let hiddenElements = 0;
          let cutOffElements = 0;
          
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            
            // Check if element is hidden
            if (rect.width === 0 || rect.height === 0 || styles.display === 'none' || styles.visibility === 'hidden') {
              hiddenElements++;
            }
            
            // Check if element is cut off
            if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
              cutOffElements++;
            }
          });
          
          return {
            totalElements: elements.length,
            hiddenElements,
            cutOffElements,
            hiddenPercentage: (hiddenElements / elements.length) * 100,
            cutOffPercentage: (cutOffElements / elements.length) * 100
          };
        });

        // More than 10% hidden or cut off is problematic
        if (contentAccessibility.hiddenPercentage > 10) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            'page',
            `${contentAccessibility.hiddenElements} interactive elements (${Math.round(contentAccessibility.hiddenPercentage)}%) hidden in ${viewport.name} orientation`,
            '1.3.4',
            'Use responsive design to ensure content works in both orientations',
            'high',
            { viewport, contentAccessibility }
          ));
        }

        if (contentAccessibility.cutOffPercentage > 5) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            'page',
            `${contentAccessibility.cutOffElements} interactive elements (${Math.round(contentAccessibility.cutOffPercentage)}%) cut off in ${viewport.name} orientation`,
            '1.3.4',
            'Ensure all interactive elements are visible and accessible in both orientations',
            'high',
            { viewport, contentAccessibility }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('1.3.5 Input purpose identification', async ({ page }) => {
      const inputsRequiringAutocomplete = [
        { selector: 'input[type="email"]', expectedAutocomplete: 'email' },
        { selector: 'input[name*="phone"], input[type="tel"]', expectedAutocomplete: 'tel' },
        { selector: 'input[name*="name"], input[name*="first"]', expectedAutocomplete: 'given-name' },
        { selector: 'input[name*="last"]', expectedAutocomplete: 'family-name' },
        { selector: 'input[name*="address"]', expectedAutocomplete: 'street-address' },
        { selector: 'input[type="password"]', expectedAutocomplete: 'current-password' },
        { selector: 'input[name*="zip"], input[name*="postal"]', expectedAutocomplete: 'postal-code' },
        { selector: 'input[name*="city"]', expectedAutocomplete: 'address-level2' }
      ];

      const failures = [];

      for (const inputType of inputsRequiringAutocomplete) {
        const elements = await page.locator(inputType.selector).all();
        
        for (const element of elements) {
          const autocomplete = await element.getAttribute('autocomplete');
          
          if (!autocomplete) {
            const selector = await accessibilityHelper.getElementSelector(element);

            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              'Input field missing autocomplete attribute',
              '1.3.5',
              `Add autocomplete="${inputType.expectedAutocomplete}" attribute`,
              'medium',
              { 
                location: await element.boundingBox(),
                expectedAutocomplete: inputType.expectedAutocomplete
              }
            ));
          }
        }
      }

      expect(failures).toHaveLength(0);
    });
  });

  test.describe('1.4 Distinguishable Content (Level AA)', () => {
    test('1.4.3 Color contrast minimum', async ({ page }) => {
      const failures = [];
      
      // Test text elements for color contrast
      const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button, label, span, div').all();
      
      for (const element of textElements) {
        // Skip elements with no visible text
        const text = await element.textContent();
        if (!text?.trim()) continue;

        const contrastResult = await accessibilityHelper.checkColorContrast(element, 4.5);
        
        if (!contrastResult.passes) {
          const selector = await accessibilityHelper.getElementSelector(element);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Insufficient color contrast: ${contrastResult.ratio}:1 (minimum required: ${contrastResult.requirement}:1)`,
            '1.4.3',
            'Increase color contrast between text and background to meet WCAG AA standards',
            'high',
            { 
              location: await element.boundingBox(),
              textSample: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
              contrastDetails: contrastResult
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('1.4.4 Resize text to 200%', async ({ page }) => {
      const originalViewport = page.viewportSize();
      const failures = [];

      // Simulate 200% zoom by reducing viewport size
      await page.setViewportSize({ 
        width: Math.floor(originalViewport.width / 2), 
        height: Math.floor(originalViewport.height / 2) 
      });
      await page.waitForLoadState('networkidle');

      const zoomResults = await page.evaluate(() => {
        // Check for horizontal scrolling
        const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        
        // Check for cut-off content
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, button, a, input, select, textarea');
        const cutOff = [];
        
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 10 || rect.bottom > window.innerHeight + 10) { // 10px tolerance
            cutOff.push({
              tagName: el.tagName,
              index,
              rect: { 
                right: rect.right, 
                bottom: rect.bottom, 
                width: rect.width, 
                height: rect.height 
              },
              text: el.textContent?.substring(0, 30)
            });
          }
        });
        
        return {
          hasHorizontalScroll,
          cutOffElements: cutOff,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        };
      });

      if (zoomResults.hasHorizontalScroll) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'body',
          'Page requires horizontal scrolling at 200% zoom',
          '1.4.4',
          'Implement responsive design that accommodates 200% zoom without horizontal scrolling',
          'high',
          { zoomResults }
        ));
      }

      if (zoomResults.cutOffElements.length > 0) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'multiple elements',
          `${zoomResults.cutOffElements.length} elements are cut off at 200% zoom`,
          '1.4.4',
          'Ensure all content is accessible and readable when zoomed to 200%',
          'high',
          { cutOffElements: zoomResults.cutOffElements }
        ));
      }

      // Restore original viewport
      await page.setViewportSize(originalViewport);
      expect(failures).toHaveLength(0);
    });

    test('1.4.10 Reflow at 320px width', async ({ page }) => {
      const originalViewport = page.viewportSize();
      await page.setViewportSize({ width: 320, height: 568 });
      await page.waitForLoadState('networkidle');
      
      const failures = [];

      const reflowResults = await page.evaluate(() => {
        // Check for horizontal scrolling
        const scrollInfo = {
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflow: window.getComputedStyle(document.documentElement).overflowX
        };

        // Check for content loss or inaccessibility
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        const inaccessible = [];
        
        interactiveElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 10) { // 10px tolerance
            inaccessible.push({
              tagName: el.tagName,
              text: el.textContent?.substring(0, 30),
              position: Math.round(rect.right)
            });
          }
        });

        return {
          scrollInfo,
          inaccessibleElements: inaccessible
        };
      });

      if (reflowResults.scrollInfo.hasHorizontalScroll) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'body',
          `Horizontal scrolling required at 320px (content: ${reflowResults.scrollInfo.scrollWidth}px, viewport: ${reflowResults.scrollInfo.clientWidth}px)`,
          '1.4.10',
          'Implement responsive design that reflows content without horizontal scrolling at 320px width',
          'high',
          { viewport: '320px', scrollInfo: reflowResults.scrollInfo }
        ));
      }

      if (reflowResults.inaccessibleElements.length > 0) {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          'interactive elements',
          `${reflowResults.inaccessibleElements.length} interactive elements are not accessible at 320px width`,
          '1.4.10',
          'Ensure all interactive elements are accessible within 320px viewport',
          'high',
          { 
            viewport: '320px', 
            inaccessibleElements: reflowResults.inaccessibleElements
          }
        ));
      }

      // Restore original viewport
      await page.setViewportSize(originalViewport);
      expect(failures).toHaveLength(0);
    });

    test('1.4.11 Non-text contrast', async ({ page }) => {
      const failures = [];
      
      // Test UI components for 3:1 contrast ratio
      const uiElements = await page.locator('button, input, select, textarea, [role="button"], [role="tab"]').all();
      
      for (const element of uiElements) {
        const contrastResult = await accessibilityHelper.checkColorContrast(element, 3.0);
        
        if (!contrastResult.passes) {
          const selector = await accessibilityHelper.getElementSelector(element);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `UI component contrast insufficient: ${contrastResult.ratio}:1 (minimum: 3:1)`,
            '1.4.11',
            'Increase contrast ratio for UI component borders, backgrounds, and focus indicators',
            'medium',
            { 
              location: await element.boundingBox(),
              contrastDetails: contrastResult
            }
          ));
        }

        // Test focus indicators
        const focusResult = await accessibilityHelper.checkFocusIndicator(element);
        if (!focusResult.hasVisibleFocus) {
          const selector = await accessibilityHelper.getElementSelector(element);

          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            'Focus indicator lacks sufficient contrast or visibility',
            '1.4.11',
            'Improve focus indicator contrast to at least 3:1 and ensure visibility',
            'medium',
            { 
              location: await element.boundingBox(),
              focusStyles: focusResult.styles
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('1.4.12 Text spacing adaptability', async ({ page }) => {
      const spacingResults = await accessibilityHelper.checkTextSpacing();
      const failures = [];

      for (const result of spacingResults) {
        if (result.isClipped) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            result.element,
            'Content clipped with increased text spacing',
            '1.4.12',
            'Avoid fixed heights and allow content to expand with increased spacing',
            'medium',
            { 
              textSample: result.textContent,
              dimensions: {
                original: result.originalDimensions,
                modified: result.newDimensions
              }
            }
          ));
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('1.4.13 Content on hover or focus', async ({ page }) => {
      const failures = [];
      
      // Find elements that might trigger hover/focus content
      const triggerElements = await page.locator('[aria-describedby], [title], [data-tooltip], .tooltip-trigger').all();
      
      for (const trigger of triggerElements) {
        try {
          // Check if element is visible before hovering
          const isVisible = await trigger.isVisible();
          if (!isVisible) continue;
          
          await trigger.hover({ timeout: 5000 });
          await page.waitForTimeout(500); // Allow time for tooltips to appear
          
          // Check if additional content appears
          const additionalContent = await page.evaluate(() => {
            const tooltips = document.querySelectorAll('[role="tooltip"], .tooltip, [data-tooltip-content], .popover');
            return Array.from(tooltips).map(el => ({
              visible: window.getComputedStyle(el).display !== 'none' && 
                      window.getComputedStyle(el).visibility !== 'hidden',
              text: el.textContent?.trim(),
              id: el.id,
              className: el.className
            })).filter(item => item.visible && item.text);
          });

          for (const content of additionalContent) {
            if (content.visible) {
              // Test dismissibility with Escape key
              await page.keyboard.press('Escape');
              await page.waitForTimeout(100);
              
              const stillVisible = await page.evaluate((contentId, contentClass) => {
                let el;
                if (contentId) {
                  el = document.getElementById(contentId);
                } else {
                  el = document.querySelector('.' + contentClass.split(' ')[0]);
                }
                
                return el && 
                       window.getComputedStyle(el).display !== 'none' && 
                       window.getComputedStyle(el).visibility !== 'hidden';
              }, content.id, content.className);

              if (stillVisible) {
                const selector = await accessibilityHelper.getElementSelector(trigger);

                failures.push(accessibilityHelper.createFailureReport(
                  await page.url(),
                  selector,
                  'Additional content cannot be dismissed with Escape key',
                  '1.4.13',
                  'Allow users to dismiss hover/focus content with Escape key without moving focus',
                  'medium',
                  { 
                    location: await trigger.boundingBox(),
                    additionalContent: content
                  }
                ));
              }
            }
          }
        } catch (error) {
          // Skip elements that can't be hovered (hidden, etc.)
          continue;
        }
      }

      expect(failures).toHaveLength(0);
    });
  });
});