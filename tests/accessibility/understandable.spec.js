// tests/accessibility/understandable.spec.js
import { test, expect } from '@playwright/test';
import { AccessibilityHelper } from '../utils/accessibility-helpers.js';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 3 - Understandable', () => {
  let accessibilityHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityHelper(page);
    await page.goto('/');
    await accessibilityHelper.setupAxe();
  });

  test.describe('3.1 Readable', () => {
    test('3.1.1 Language of Page (A) - Page language is identified', async ({ page }) => {
      const lang = await page.locator('html').getAttribute('lang');
      
      expect(lang).not.toBeNull();
      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en', 'en-US'
      
      console.log(`✓ Page language detected: ${lang}`);
    });

    test('3.1.2 Language of Parts (AA) - Language changes identified', async ({ page }) => {
      const elementsWithLang = await page.locator('[lang]').all();
      const failures = [];
      
      for (const element of elementsWithLang) {
        const lang = await element.getAttribute('lang');
        const text = await element.textContent();
        const selector = await accessibilityHelper.getElementSelector(element);
        
        // Validate lang attribute format
        if (!lang.match(/^[a-z]{2}(-[A-Z]{2})?$/)) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Invalid language code: "${lang}"`,
            '3.1.2',
            'Use valid ISO 639-1 language codes (e.g., "en", "es", "fr")',
            'medium',
            { lang, textSample: text?.substring(0, 50) }
          ));
        }
      }

      if (failures.length > 0) {
        console.log('Language identification failures:', failures);
        expect(failures).toHaveLength(0);
      } else {
        console.log(`✓ All ${elementsWithLang.length} language changes properly identified`);
      }
    });
  });

  test.describe('3.2 Predictable', () => {
    test('3.2.1 On Focus (A) - Focus changes do not trigger unexpected behavior', async ({ page }) => {
      const focusableElements = await page.locator(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).all();
      
      const failures = [];
      let currentUrl = await page.url();
      
      for (const element of focusableElements.slice(0, 10)) { // Test first 10 elements
        try {
          await element.focus();
          await page.waitForTimeout(100);
          
          const newUrl = await page.url();
          const hasNewWindow = await page.evaluate(() => window.history.length);
          
          // Check if focus caused navigation or unexpected behavior
          if (newUrl !== currentUrl) {
            const selector = await accessibilityHelper.getElementSelector(element);
            failures.push(accessibilityHelper.createFailureReport(
              currentUrl,
              selector,
              'Focus caused page navigation',
              '3.2.1',
              'Focus should not trigger navigation unless expected (e.g., dropdown menus)',
              'high',
              { originalUrl: currentUrl, newUrl }
            ));
            
            // Navigate back for continued testing
            await page.goto(currentUrl);
          }
        } catch (error) {
          // Element might be removed or not focusable, skip
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Focus behavior tested on ${Math.min(focusableElements.length, 10)} elements`);
    });

    test('3.2.2 On Input (A) - Input changes do not cause unexpected behavior', async ({ page }) => {
      const inputElements = await page.locator('input, select, textarea').all();
      const failures = [];
      
      for (const input of inputElements) {
        const tagName = await input.evaluate(el => el.tagName.toLowerCase());
        const type = await input.getAttribute('type');
        const selector = await accessibilityHelper.getElementSelector(input);
        
        try {
          const currentUrl = await page.url();
          
          // Test different input interactions
          if (tagName === 'select') {
            const options = await input.locator('option').all();
            if (options.length > 1) {
              await input.selectOption({ index: 1 });
            }
          } else if (type === 'checkbox' || type === 'radio') {
            await input.check();
          } else if (type !== 'submit' && type !== 'button') {
            await input.fill('test');
            await input.blur(); // Remove focus to trigger change events
          }
          
          await page.waitForTimeout(200);
          const newUrl = await page.url();
          
          // Check if input caused unexpected navigation
          if (newUrl !== currentUrl && type !== 'submit') {
            failures.push(accessibilityHelper.createFailureReport(
              currentUrl,
              selector,
              `Input change caused unexpected navigation (type: ${type})`,
              '3.2.2',
              'Input changes should not cause automatic navigation unless clearly indicated',
              'high',
              { inputType: type, originalUrl: currentUrl, newUrl }
            ));
          }
        } catch (error) {
          // Continue with other elements if one fails
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Input behavior tested on ${inputElements.length} form elements`);
    });

    test('3.2.3 Consistent Navigation (AA) - Navigation is consistent across pages', async ({ page }) => {
      // Get main navigation elements from home page
      const homeNavigation = await page.locator('nav').first();
      const homeNavLinks = await homeNavigation.locator('a').all();
      const homeNavStructure = [];
      
      for (const link of homeNavLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        homeNavStructure.push({ text: text?.trim(), href });
      }
      
      // Test other pages for consistent navigation
      const testPages = ['/cart']; // Add other pages to test
      const failures = [];
      
      for (const testPage of testPages) {
        try {
          await page.goto(testPage);
          await page.waitForLoadState('networkidle');
          
          const pageNavigation = await page.locator('nav').first();
          const pageNavLinks = await pageNavigation.locator('a').all();
          const pageNavStructure = [];
          
          for (const link of pageNavLinks) {
            const text = await link.textContent();
            const href = await link.getAttribute('href');
            pageNavStructure.push({ text: text?.trim(), href });
          }
          
          // Compare navigation structures
          if (pageNavStructure.length !== homeNavStructure.length) {
            failures.push(accessibilityHelper.createFailureReport(
              testPage,
              'nav',
              `Navigation has different number of items (${pageNavStructure.length} vs ${homeNavStructure.length})`,
              '3.2.3',
              'Maintain consistent navigation structure across all pages',
              'medium',
              { homePage: homeNavStructure, currentPage: pageNavStructure }
            ));
          }
          
          // Check for consistent ordering
          for (let i = 0; i < Math.min(homeNavStructure.length, pageNavStructure.length); i++) {
            if (homeNavStructure[i].text !== pageNavStructure[i].text) {
              failures.push(accessibilityHelper.createFailureReport(
                testPage,
                'nav',
                `Navigation item ${i} differs: "${homeNavStructure[i].text}" vs "${pageNavStructure[i].text}"`,
                '3.2.3',
                'Keep navigation items in the same order across pages',
                'medium',
                { expectedText: homeNavStructure[i].text, actualText: pageNavStructure[i].text }
              ));
            }
          }
        } catch (error) {
          console.log(`Could not test page ${testPage}:`, error.message);
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Navigation consistency tested across ${testPages.length + 1} pages`);
    });

    test('3.2.4 Consistent Identification (AA) - Same functionality labeled consistently', async ({ page }) => {
      // Test across multiple pages for consistent labeling
      const testPages = ['/', '/cart'];
      const functionalElements = new Map();
      const failures = [];
      
      for (const testPage of testPages) {
        try {
          await page.goto(testPage);
          await page.waitForLoadState('networkidle');
          
          // Find elements with similar functions (buttons, links with same purpose)
          const buttons = await page.locator('button').all();
          const links = await page.locator('a[href]').all();
          
          for (const button of buttons) {
            const text = (await button.textContent())?.trim().toLowerCase();
            const ariaLabel = await button.getAttribute('aria-label');
            const title = await button.getAttribute('title');
            
            const label = ariaLabel || title || text;
            if (label) {
              const key = `button:${text}`;
              if (functionalElements.has(key) && functionalElements.get(key) !== label) {
                failures.push(accessibilityHelper.createFailureReport(
                  testPage,
                  await accessibilityHelper.getElementSelector(button),
                  `Inconsistent button labeling: "${functionalElements.get(key)}" vs "${label}"`,
                  '3.2.4',
                  'Use consistent labels for buttons with the same function across pages',
                  'medium',
                  { expectedLabel: functionalElements.get(key), actualLabel: label }
                ));
              } else {
                functionalElements.set(key, label);
              }
            }
          }
          
          // Similar check for links with similar purposes
          for (const link of links) {
            const text = (await link.textContent())?.trim().toLowerCase();
            const href = await link.getAttribute('href');
            const ariaLabel = await link.getAttribute('aria-label');
            
            if (text && text.includes('home') || href === '/') {
              const label = ariaLabel || text;
              const key = 'link:home';
              if (functionalElements.has(key) && functionalElements.get(key) !== label) {
                failures.push(accessibilityHelper.createFailureReport(
                  testPage,
                  await accessibilityHelper.getElementSelector(link),
                  `Inconsistent home link labeling: "${functionalElements.get(key)}" vs "${label}"`,
                  '3.2.4',
                  'Use consistent labels for links with the same purpose',
                  'medium',
                  { expectedLabel: functionalElements.get(key), actualLabel: label }
                ));
              } else {
                functionalElements.set(key, label);
              }
            }
          }
        } catch (error) {
          console.log(`Could not test page ${testPage}:`, error.message);
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Consistent identification tested across ${testPages.length} pages`);
    });
  });

  test.describe('3.3 Input Assistance', () => {
    test('3.3.1 Error Identification (A) - Form errors are clearly identified', async ({ page }) => {
      // Look for forms and try to submit invalid data
      const forms = await page.locator('form').all();
      const failures = [];
      
      for (const form of forms) {
        const requiredInputs = await form.locator('input[required], select[required], textarea[required]').all();
        
        if (requiredInputs.length > 0) {
          try {
            // Try to submit form with empty required fields
            const submitButton = await form.locator('button[type="submit"], input[type="submit"]').first();
            if (await submitButton.count() > 0) {
              await submitButton.click();
              await page.waitForTimeout(500);
              
              // Check for error messages
              const errorElements = await form.locator('[role="alert"], .error, [aria-invalid="true"]').all();
              
              if (errorElements.length === 0) {
                failures.push(accessibilityHelper.createFailureReport(
                  await page.url(),
                  await accessibilityHelper.getElementSelector(form),
                  'Form submission errors not clearly identified',
                  '3.3.1',
                  'Add error messages with role="alert" or aria-invalid="true" for validation errors',
                  'high',
                  { requiredFieldsCount: requiredInputs.length }
                ));
              } else {
                // Check if error messages are properly associated with fields
                for (const errorElement of errorElements) {
                  const errorText = await errorElement.textContent();
                  const hasId = await errorElement.getAttribute('id');
                  
                  if (errorText && errorText.trim().length < 5) {
                    failures.push(accessibilityHelper.createFailureReport(
                      await page.url(),
                      await accessibilityHelper.getElementSelector(errorElement),
                      `Error message too generic: "${errorText.trim()}"`,
                      '3.3.1',
                      'Provide specific, descriptive error messages',
                      'medium',
                      { errorText: errorText.trim() }
                    ));
                  }
                }
              }
            }
          } catch (error) {
            // Form might not behave as expected, continue testing
          }
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Error identification tested on ${forms.length} forms`);
    });

    test('3.3.2 Labels or Instructions (A) - Labels and instructions provided', async ({ page }) => {
      const formResults = await accessibilityHelper.checkFormLabels();
      const failures = [];
      
      for (const result of formResults) {
        if (!result.hasLabel) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            result.selector,
            `Form element missing label (type: ${result.type})`,
            '3.3.2',
            'Add a visible label, aria-label, or aria-labelledby attribute',
            'high',
            { elementType: result.type }
          ));
        }
      }
      
      // Check for instruction text near form elements
      const complexInputs = await page.locator('input[type="password"], input[type="email"], input[pattern]').all();
      
      for (const input of complexInputs) {
        const type = await input.getAttribute('type');
        const pattern = await input.getAttribute('pattern');
        const describedBy = await input.getAttribute('aria-describedby');
        const title = await input.getAttribute('title');
        
        if ((type === 'password' || pattern) && !describedBy && !title) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            await accessibilityHelper.getElementSelector(input),
            `Complex input (${type}) missing instructions`,
            '3.3.2',
            'Provide instructions for complex inputs using aria-describedby or title attributes',
            'medium',
            { inputType: type, hasPattern: !!pattern }
          ));
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Labels and instructions checked for ${formResults.length} form elements`);
    });

    test('3.3.3 Error Suggestion (AA) - Suggestions provided for fixing errors', async ({ page }) => {
      // This is a more advanced test that would need real form validation
      // For now, we'll check if error messages contain helpful information
      const errorElements = await page.locator('[role="alert"], .error, [aria-describedby*="error"]').all();
      const failures = [];
      
      for (const errorElement of errorElements) {
        const errorText = await errorElement.textContent();
        const selector = await accessibilityHelper.getElementSelector(errorElement);
        
        if (errorText && errorText.trim()) {
          const text = errorText.trim().toLowerCase();
          
          // Check if error message provides constructive guidance
          const hasGuidance = text.includes('please') || 
                             text.includes('must') || 
                             text.includes('should') || 
                             text.includes('required') ||
                             text.includes('format') ||
                             text.includes('example');
          
          if (!hasGuidance && text.length < 20) {
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              `Error message lacks helpful suggestion: "${errorText.trim()}"`,
              '3.3.3',
              'Provide specific guidance on how to correct the error',
              'medium',
              { errorMessage: errorText.trim() }
            ));
          }
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Error suggestions checked on ${errorElements.length} error elements`);
    });

    test('3.3.4 Error Prevention (AA) - Prevention for legal/financial/data submissions', async ({ page }) => {
      // Check for confirmation dialogs or review steps before critical actions
      const criticalButtons = await page.locator(
        'button:has-text("delete"), button:has-text("remove"), button:has-text("order"), button:has-text("purchase"), button:has-text("pay")'
      ).all();
      
      const failures = [];
      
      for (const button of criticalButtons) {
        const text = (await button.textContent())?.toLowerCase() || '';
        const selector = await accessibilityHelper.getElementSelector(button);
        
        // Look for confirmation mechanisms
        const hasConfirmation = await button.evaluate(el => {
          // Check if button has onclick with confirm()
          const onclick = el.onclick?.toString() || '';
          return onclick.includes('confirm(') || 
                 el.hasAttribute('data-confirm') ||
                 el.closest('form')?.hasAttribute('data-confirm');
        });
        
        if ((text.includes('delete') || text.includes('remove') || text.includes('order')) && !hasConfirmation) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Critical action "${text}" lacks confirmation mechanism`,
            '3.3.4',
            'Add confirmation dialog or review step for destructive/financial actions',
            'high',
            { buttonText: text }
          ));
        }
      }
      
      // Check for forms with review capability
      const forms = await page.locator('form').all();
      for (const form of forms) {
        const hasRevert = await form.locator('button:has-text("back"), button:has-text("edit"), button:has-text("cancel")').count();
        const hasSubmit = await form.locator('button[type="submit"], input[type="submit"]').count();
        
        if (hasSubmit > 0 && hasRevert === 0) {
          // This might be a simple form, but we should encourage reversible submissions
          console.log('Consider adding reversible submission capability to forms');
        }
      }
      
      expect(failures).toHaveLength(0);
      console.log(`✓ Error prevention checked on ${criticalButtons.length} critical actions`);
    });
  });

  test.afterEach(async ({ page }) => {
    // Run comprehensive axe check for this page
    try {
      const axeResults = await accessibilityHelper.runAxeCheck();
      if (axeResults.passed) {
        console.log('✓ Axe accessibility check passed');
      } else {
        console.log('Axe violations found:', axeResults.violations?.length || 0);
      }
    } catch (error) {
      console.log('Axe check error:', error.message);
    }
  });
});