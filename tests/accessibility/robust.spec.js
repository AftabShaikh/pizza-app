// tests/accessibility/robust.spec.js
import { test, expect } from '@playwright/test';
import { AccessibilityHelper } from '../utils/accessibility-helpers.js';

test.describe('WCAG 4 - Robust', () => {
  let accessibilityHelper;

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityHelper(page);
    await page.goto('/');
  });

  test.describe('4.1 Compatible', () => {
    test('4.1.1 Parsing - HTML validity', async ({ page }) => {
      const failures = [];
      
      // Check for basic HTML validity issues that affect assistive technologies
      const htmlContent = await page.content();
      
      // Check for duplicate IDs
      const allIds = await page.evaluate(() => {
        const elements = document.querySelectorAll('[id]');
        const ids = Array.from(elements).map(el => el.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        return { allIds: ids, duplicates: [...new Set(duplicates)] };
      });
      
      if (allIds.duplicates.length > 0) {
        for (const duplicateId of allIds.duplicates) {
          const elements = await page.locator(`#${duplicateId}`).all();
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            `#${duplicateId}`,
            `Duplicate ID "${duplicateId}" found on ${elements.length} elements`,
            '4.1.1',
            'Ensure all IDs are unique. Use classes for styling multiple elements.',
            'high',
            { 
              duplicateId,
              elementCount: elements.length,
              wcagTechnique: 'H93'
            }
          ));
        }
      }
      
      // Check for proper nesting of interactive elements
      const nestedInteractiveElements = await page.evaluate(() => {
        const interactive = ['a', 'button', 'input', 'select', 'textarea'];
        const nested = [];
        
        interactive.forEach(tag => {
          const elements = document.querySelectorAll(tag);
          elements.forEach(el => {
            const hasNestedInteractive = interactive.some(innerTag => {
              return el.querySelector(innerTag) !== null;
            });
            
            if (hasNestedInteractive) {
              nested.push({
                outer: tag,
                outerHtml: el.outerHTML.substring(0, 100),
                id: el.id,
                className: el.className
              });
            }
          });
        });
        
        return nested;
      });
      
      nestedInteractiveElements.forEach(nested => {
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          nested.id ? `#${nested.id}` : `.${nested.className.split(' ')[0]}`,
          `Nested interactive elements found: ${nested.outer} contains other interactive elements`,
          '4.1.1',
          'Avoid nesting interactive elements (buttons inside links, etc.). Restructure HTML.',
          'high',
          { 
            outerElement: nested.outer,
            htmlSample: nested.outerHtml,
            wcagTechnique: 'H2'
          }
        ));
      });
      
      // Check for missing closing tags on critical elements
      const criticalElements = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      
      for (const tagName of criticalElements) {
        const openTags = (htmlContent.match(new RegExp(`<${tagName}[^>]*>`, 'gi')) || []).length;
        const closeTags = (htmlContent.match(new RegExp(`</${tagName}>`, 'gi')) || []).length;
        
        if (openTags !== closeTags) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            tagName,
            `Mismatched ${tagName} tags: ${openTags} opening, ${closeTags} closing`,
            '4.1.1',
            'Ensure all opening tags have corresponding closing tags',
            'high',
            { 
              tagName,
              openTags,
              closeTags,
              wcagTechnique: 'H74'
            }
          ));
        }
      }
      
      // Check for invalid HTML attributes
      const elementsWithInvalidAttributes = await page.evaluate(() => {
        const invalid = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(el => {
          // Check for invalid ARIA attributes
          Array.from(el.attributes).forEach(attr => {
            if (attr.name.startsWith('aria-')) {
              const validAriaAttrs = [
                'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
                'aria-expanded', 'aria-haspopup', 'aria-controls', 'aria-owns',
                'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy',
                'aria-disabled', 'aria-readonly', 'aria-required', 'aria-invalid',
                'aria-checked', 'aria-selected', 'aria-pressed', 'aria-level',
                'aria-setsize', 'aria-posinset', 'aria-valuemin', 'aria-valuemax',
                'aria-valuenow', 'aria-valuetext', 'aria-orientation', 'aria-sort',
                'aria-grabbed', 'aria-dropeffect', 'aria-autocomplete', 'aria-multiline',
                'aria-multiselectable', 'aria-activedescendant', 'aria-flowto'
              ];
              
              if (!validAriaAttrs.includes(attr.name)) {
                invalid.push({
                  tagName: el.tagName.toLowerCase(),
                  id: el.id,
                  className: el.className,
                  attribute: attr.name,
                  value: attr.value,
                  type: 'invalid-aria'
                });
              }
            }
          });
        });
        
        return invalid;
      });
      
      elementsWithInvalidAttributes.forEach(issue => {
        const selector = issue.id ? `#${issue.id}` : issue.className ? `.${issue.className.split(' ')[0]}` : issue.tagName;
        
        failures.push(accessibilityHelper.createFailureReport(
          await page.url(),
          selector,
          `Invalid ARIA attribute: ${issue.attribute}="${issue.value}"`,
          '4.1.1',
          'Use only valid ARIA attributes. Check ARIA specification for valid attributes.',
          'medium',
          { 
            element: issue.tagName,
            invalidAttribute: issue.attribute,
            attributeValue: issue.value,
            wcagTechnique: 'ARIA5'
          }
        ));
      });

      expect(failures).toHaveLength(0);
    });

    test('4.1.2 Name, Role, Value', async ({ page }) => {
      const failures = [];
      
      // Check all interactive elements have proper name, role, and value
      const interactiveElements = await page.locator('a, button, input, select, textarea, [role], [tabindex]:not([tabindex="-1"])').all();
      
      for (const element of interactiveElements) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const role = await element.getAttribute('role');
        const ariaLabel = await element.getAttribute('aria-label');
        const ariaLabelledby = await element.getAttribute('aria-labelledby');
        const ariaDescribedby = await element.getAttribute('aria-describedby');
        const type = await element.getAttribute('type');
        const id = await element.getAttribute('id');
        
        // Check for accessible name
        let hasAccessibleName = false;
        let nameSource = '';
        
        // Check for text content
        const textContent = await element.textContent();
        if (textContent && textContent.trim().length > 0) {
          hasAccessibleName = true;
          nameSource = 'textContent';
        }
        
        // Check for aria-label
        if (!hasAccessibleName && ariaLabel && ariaLabel.trim().length > 0) {
          hasAccessibleName = true;
          nameSource = 'aria-label';
        }
        
        // Check for aria-labelledby
        if (!hasAccessibleName && ariaLabelledby) {
          const labellingElement = await page.locator(`#${ariaLabelledby}`).first();
          if (await labellingElement.count() > 0) {
            const labelText = await labellingElement.textContent();
            if (labelText && labelText.trim().length > 0) {
              hasAccessibleName = true;
              nameSource = 'aria-labelledby';
            }
          }
        }
        
        // Check for associated label (for form elements)
        if (!hasAccessibleName && id && ['input', 'select', 'textarea'].includes(tagName)) {
          const label = await page.locator(`label[for="${id}"]`).first();
          if (await label.count() > 0) {
            const labelText = await label.textContent();
            if (labelText && labelText.trim().length > 0) {
              hasAccessibleName = true;
              nameSource = 'label';
            }
          }
        }
        
        // Check for alt attribute (for images)
        if (!hasAccessibleName && tagName === 'img') {
          const alt = await element.getAttribute('alt');
          if (alt !== null) { // alt="" is valid for decorative images
            hasAccessibleName = true;
            nameSource = 'alt';
          }
        }
        
        if (!hasAccessibleName && !['img'].includes(tagName)) {
          const selector = await accessibilityHelper.getElementSelector(element);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `${tagName} element has no accessible name`,
            '4.1.2',
            'Provide accessible name via text content, aria-label, aria-labelledby, or label element',
            'high',
            { 
              location: await element.boundingBox(),
              tagName,
              role,
              type,
              wcagTechnique: 'ARIA6'
            }
          ));
        }
        
        // Check role validity
        if (role) {
          const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
            'contentinfo', 'definition', 'dialog', 'directory', 'document',
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
            'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
            'tooltip', 'tree', 'treegrid', 'treeitem'
          ];
          
          if (!validRoles.includes(role)) {
            const selector = await accessibilityHelper.getElementSelector(element);
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              `Invalid ARIA role: "${role}"`,
              '4.1.2',
              'Use valid ARIA roles. Check ARIA specification for valid role values.',
              'high',
              { 
                location: await element.boundingBox(),
                tagName,
                invalidRole: role,
                wcagTechnique: 'ARIA4'
              }
            ));
          }
        }
        
        // Check for proper state/property values
        const ariaChecked = await element.getAttribute('aria-checked');
        const ariaExpanded = await element.getAttribute('aria-expanded');
        const ariaSelected = await element.getAttribute('aria-selected');
        const ariaPressed = await element.getAttribute('aria-pressed');
        
        // Validate boolean ARIA states
        const booleanStates = {
          'aria-checked': ariaChecked,
          'aria-expanded': ariaExpanded,
          'aria-selected': ariaSelected,
          'aria-pressed': ariaPressed
        };
        
        Object.entries(booleanStates).forEach(([stateName, stateValue]) => {
          if (stateValue !== null && !['true', 'false', 'mixed'].includes(stateValue)) {
            const selector = accessibilityHelper.getElementSelector(element);
            
            failures.push(accessibilityHelper.createFailureReport(
              page.url(),
              selector,
              `Invalid ${stateName} value: "${stateValue}"`,
              '4.1.2',
              'ARIA boolean states should be "true", "false", or "mixed"',
              'medium',
              { 
                tagName,
                ariaState: stateName,
                invalidValue: stateValue,
                wcagTechnique: 'ARIA5'
              }
            ));
          }
        });
      }
      
      // Check form elements have proper values
      const formElements = await page.locator('input, select, textarea').all();
      
      for (const element of formElements) {
        const type = await element.getAttribute('type');
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        // Check checkboxes and radio buttons have proper checked state
        if (type === 'checkbox' || type === 'radio') {
          const checked = await element.isChecked();
          const ariaChecked = await element.getAttribute('aria-checked');
          
          // If element has aria-checked, it should match the actual state
          if (ariaChecked !== null) {
            const expectedAriaChecked = checked ? 'true' : 'false';
            
            if (ariaChecked !== expectedAriaChecked) {
              const selector = await accessibilityHelper.getElementSelector(element);
              
              failures.push(accessibilityHelper.createFailureReport(
                await page.url(),
                selector,
                `aria-checked="${ariaChecked}" doesn't match actual checked state: ${checked}`,
                '4.1.2',
                'Ensure aria-checked attribute reflects the actual state of checkboxes and radio buttons',
                'medium',
                { 
                  location: await element.boundingBox(),
                  type,
                  actualChecked: checked,
                  ariaChecked,
                  wcagTechnique: 'ARIA5'
                }
              ));
            }
          }
        }
      }

      expect(failures).toHaveLength(0);
    });

    test('4.1.3 Status messages (Level AA)', async ({ page }) => {
      const failures = [];
      
      // Check for ARIA live regions and status elements
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"], [role="log"]').all();
      const forms = await page.locator('form').all();
      
      // If there are forms, there should be some way to announce status messages
      if (forms.length > 0) {
        let hasStatusMessaging = liveRegions.length > 0;
        
        // Also check for elements that commonly contain status messages
        const statusElements = await page.locator('.status, .message, .notification, .alert, .success, .error, .warning').all();
        
        if (statusElements.length > 0) {
          // Check if these elements have proper ARIA live properties
          for (const element of statusElements) {
            const ariaLive = await element.getAttribute('aria-live');
            const role = await element.getAttribute('role');
            
            const hasProperAria = ariaLive || ['status', 'alert', 'log'].includes(role);
            
            if (!hasProperAria) {
              const selector = await accessibilityHelper.getElementSelector(element);
              const className = await element.getAttribute('class');
              
              failures.push(accessibilityHelper.createFailureReport(
                await page.url(),
                selector,
                `Status message element "${className}" lacks ARIA live properties`,
                '4.1.3',
                'Add aria-live, role="status", role="alert", or role="log" to status message containers',
                'medium',
                { 
                  location: await element.boundingBox(),
                  className,
                  missingProperties: 'aria-live or status role',
                  wcagTechnique: 'ARIA22'
                }
              ));
            } else {
              hasStatusMessaging = true;
            }
          }
        }
        
        if (!hasStatusMessaging) {
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            'forms',
            'Forms present but no ARIA live regions or status messaging found',
            '4.1.3',
            'Add ARIA live regions for dynamic status updates (success, error, loading messages)',
            'medium',
            { 
              formsCount: forms.length,
              suggestion: 'Add <div aria-live="polite" role="status" id="status-messages"></div>',
              wcagTechnique: 'ARIA19'
            }
          ));
        }
      }
      
      // Check existing live regions have appropriate settings
      for (const liveRegion of liveRegions) {
        const ariaLive = await liveRegion.getAttribute('aria-live');
        const role = await liveRegion.getAttribute('role');
        const ariaAtomic = await liveRegion.getAttribute('aria-atomic');
        
        // Check for appropriate aria-live values
        if (ariaLive && !['polite', 'assertive', 'off'].includes(ariaLive)) {
          const selector = await accessibilityHelper.getElementSelector(liveRegion);
          
          failures.push(accessibilityHelper.createFailureReport(
            await page.url(),
            selector,
            `Invalid aria-live value: "${ariaLive}"`,
            '4.1.3',
            'Use aria-live="polite" for non-urgent updates or aria-live="assertive" for urgent updates',
            'medium',
            { 
              location: await liveRegion.boundingBox(),
              invalidValue: ariaLive,
              validValues: ['polite', 'assertive', 'off'],
              wcagTechnique: 'ARIA19'
            }
          ));
        }
        
        // For alert role, ensure it's used appropriately
        if (role === 'alert') {
          const textContent = await liveRegion.textContent();
          
          // Alert role should be for important, time-sensitive information
          if (!textContent || textContent.trim().length === 0) {
            const selector = await accessibilityHelper.getElementSelector(liveRegion);
            
            failures.push(accessibilityHelper.createFailureReport(
              await page.url(),
              selector,
              'Element with role="alert" is empty',
              '4.1.3',
              'Only use role="alert" for important messages, or use role="status" for less urgent updates',
              'low',
              { 
                location: await liveRegion.boundingBox(),
                wcagTechnique: 'ARIA19'
              }
            ));
          }
        }
      }
      
      // Test dynamic content updates (if possible)
      const interactiveElements = await page.locator('button, input[type="submit"], [role="button"]').all();
      
      for (let i = 0; i < Math.min(interactiveElements.length, 3); i++) { // Test first few elements
        const element = interactiveElements[i];
        const elementText = await element.textContent();
        
        // Skip if element text suggests it might cause navigation
        if (elementText && /submit|send|login|logout|delete/.test(elementText.toLowerCase())) {
          continue;
        }
        
        try {
          // Click element and check for status updates
          await element.click();
          await page.waitForTimeout(500);
          
          // Check if any status messages appeared
          const newStatusElements = await page.locator('[aria-live], [role="status"], [role="alert"], .status, .message, .notification').all();
          
          let hasNewStatus = false;
          
          for (const statusElement of newStatusElements) {
            const statusText = await statusElement.textContent();
            
            if (statusText && statusText.trim().length > 0) {
              hasNewStatus = true;
              
              // Verify it has proper ARIA properties
              const ariaLive = await statusElement.getAttribute('aria-live');
              const role = await statusElement.getAttribute('role');
              
              if (!ariaLive && !['status', 'alert', 'log'].includes(role)) {
                const selector = await accessibilityHelper.getElementSelector(statusElement);
                
                failures.push(accessibilityHelper.createFailureReport(
                  await page.url(),
                  selector,
                  'Dynamic status message appeared without proper ARIA live properties',
                  '4.1.3',
                  'Ensure dynamically inserted status messages have aria-live or appropriate role',
                  'high',
                  { 
                    location: await statusElement.boundingBox(),
                    statusText: statusText.substring(0, 50),
                    triggerElement: await accessibilityHelper.getElementSelector(element),
                    wcagTechnique: 'ARIA22'
                  }
                ));
              }
            }
          }
        } catch (error) {
          // Skip elements that can't be clicked
          continue;
        }
      }

      expect(failures).toHaveLength(0);
    });
  });
});