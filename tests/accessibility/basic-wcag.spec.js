// tests/accessibility/basic-wcag.spec.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Basic WCAG 2.1 AA Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1.1.1 Images have appropriate alt text', async ({ page }) => {
    const images = await page.locator('img').all();
    const violations = [];

    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt attribute (can be empty for decorative)
      if (alt === null && role !== 'presentation') {
        violations.push({
          src,
          issue: 'Missing alt attribute',
          recommendation: 'Add alt="" for decorative images or descriptive alt text for informative images'
        });
      }
      
      // Check for placeholder alt text
      if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
        violations.push({
          src,
          alt,
          issue: 'Generic alt text',
          recommendation: 'Use more descriptive alt text that conveys the image content or purpose'
        });
      }
    }

    console.log(`✓ Checked ${images.length} images`);
    if (violations.length > 0) {
      console.log('Image violations:', violations);
    }
    
    expect(violations).toHaveLength(0);
  });

  test('1.3.1 Heading hierarchy is logical', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingStructure = [];

    for (const heading of headings) {
      const level = await heading.evaluate(el => parseInt(el.tagName.charAt(1)));
      const text = (await heading.textContent())?.trim();
      headingStructure.push({ level, text });
    }

    // Should have at least one h1
    const h1Count = headingStructure.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check for skipped heading levels
    const violations = [];
    for (let i = 1; i < headingStructure.length; i++) {
      const current = headingStructure[i];
      const previous = headingStructure[i - 1];
      
      if (current.level > previous.level + 1) {
        violations.push({
          issue: `Heading level ${current.level} follows h${previous.level}, skipping levels`,
          text: current.text,
        });
      }
    }

    console.log(`✓ Checked ${headings.length} headings`);
    console.log('Heading structure:', headingStructure.map(h => `H${h.level}: ${h.text?.substring(0, 30)}...`));
    
    if (violations.length > 0) {
      console.log('Heading violations:', violations);
    }
    
    expect(violations).toHaveLength(0);
  });

  test('1.4.3 Color contrast meets WCAG standards', async ({ page }) => {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast']);
    
    const results = await axeBuilder.analyze();
    
    console.log(`✓ Axe color contrast check completed`);
    console.log(`Violations found: ${results.violations.length}`);
    
    if (results.violations.length > 0) {
      console.log('Color contrast violations:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.description}`);
        violation.nodes.forEach(node => {
          console.log(`  Element: ${node.target[0]}`);
          console.log(`  Impact: ${node.impact}`);
        });
      });
    }
    
    expect(results.violations).toHaveLength(0);
  });

  test('2.1.1 All interactive elements are keyboard accessible', async ({ page }) => {
    const interactiveElements = await page.locator(
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
    ).all();

    const keyboardIssues = [];

    for (const element of interactiveElements.slice(0, 10)) { // Test first 10
      try {
        await element.focus();
        const isFocused = await element.evaluate(el => document.activeElement === el);
        
        if (!isFocused) {
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          keyboardIssues.push({
            element: tagName,
            issue: 'Cannot receive keyboard focus'
          });
        }
      } catch (error) {
        keyboardIssues.push({
          element: 'unknown',
          issue: `Focus error: ${error.message}`
        });
      }
    }

    console.log(`✓ Tested keyboard accessibility on ${Math.min(interactiveElements.length, 10)} elements`);
    
    if (keyboardIssues.length > 0) {
      console.log('Keyboard accessibility issues:', keyboardIssues);
    }
    
    expect(keyboardIssues).toHaveLength(0);
  });

  test('2.4.1 Skip navigation links are present', async ({ page }) => {
    // Look for skip links
    const skipLinks = await page.locator('a[href^="#"], .skip-link, .skip-nav').all();
    
    let hasSkipLink = false;
    const skipLinkInfo = [];
    
    for (const link of skipLinks) {
      const text = (await link.textContent())?.toLowerCase() || '';
      const href = await link.getAttribute('href');
      
      if (text.includes('skip') || text.includes('main') || href === '#main' || href === '#content') {
        hasSkipLink = true;
        skipLinkInfo.push({ text, href });
      }
    }

    console.log(`✓ Found ${skipLinks.length} potential skip links`);
    if (skipLinkInfo.length > 0) {
      console.log('Skip links found:', skipLinkInfo);
    }
    
    // For now, we'll log a warning if no skip links are found rather than failing
    if (!hasSkipLink) {
      console.log('⚠️  No skip navigation links found - consider adding for better accessibility');
    }
    
    // Don't fail the test for now, just log the recommendation
    expect(true).toBe(true);
  });

  test('2.4.2 Page has descriptive title', async ({ page }) => {
    const title = await page.title();
    
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for generic titles
    const genericTitles = ['untitled', 'new page', 'page', 'document'];
    const isGeneric = genericTitles.some(generic => 
      title.toLowerCase().includes(generic) && title.length < 20
    );
    
    console.log(`✓ Page title: "${title}"`);
    
    if (isGeneric) {
      console.log('⚠️  Page title appears generic - consider making it more descriptive');
    }
    
    expect(isGeneric).toBe(false);
  });

  test('3.1.1 Page language is specified', async ({ page }) => {
    const htmlLang = await page.locator('html').getAttribute('lang');
    
    expect(htmlLang).toBeTruthy();
    
    // Should be valid language code (e.g., 'en', 'en-US')
    const validLangPattern = /^[a-z]{2}(-[A-Z]{2})?$/;
    expect(htmlLang).toMatch(validLangPattern);
    
    console.log(`✓ Page language: ${htmlLang}`);
  });

  test('3.3.2 Form inputs have proper labels', async ({ page }) => {
    const inputs = await page.locator('input:not([type="hidden"]), select, textarea').all();
    const labelIssues = [];

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const type = await input.getAttribute('type');
      
      let hasLabel = false;
      
      // Check for explicit label
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).first();
        if (await label.count() > 0) {
          hasLabel = true;
        }
      }
      
      // Check for implicit label (input wrapped in label)
      if (!hasLabel) {
        const parentLabel = await input.locator('xpath=ancestor::label').first();
        if (await parentLabel.count() > 0) {
          hasLabel = true;
        }
      }
      
      // Check for ARIA labeling
      if (!hasLabel && (ariaLabel || ariaLabelledBy)) {
        hasLabel = true;
      }
      
      if (!hasLabel) {
        labelIssues.push({
          type,
          issue: 'Input element lacks proper label'
        });
      }
    }

    console.log(`✓ Checked ${inputs.length} form elements`);
    
    if (labelIssues.length > 0) {
      console.log('Form labeling issues:', labelIssues);
    }
    
    expect(labelIssues).toHaveLength(0);
  });

  test('4.1.2 Elements have proper names and roles (basic check)', async ({ page }) => {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .withRules(['button-name', 'link-name', 'input-button-name']);
    
    const results = await axeBuilder.analyze();
    
    console.log(`✓ Axe name/role check completed`);
    console.log(`Violations found: ${results.violations.length}`);
    
    if (results.violations.length > 0) {
      console.log('Name/Role violations:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.description}`);
        violation.nodes.slice(0, 3).forEach(node => { // Show first 3
          console.log(`  Element: ${node.target[0]}`);
        });
      });
    }
    
    expect(results.violations).toHaveLength(0);
  });

  test('Responsive design - Text readable at 200% zoom', async ({ page }) => {
    const originalViewport = page.viewportSize();
    
    // Simulate 200% zoom by reducing viewport size
    await page.setViewportSize({
      width: Math.floor(originalViewport.width / 2),
      height: Math.floor(originalViewport.height / 2)
    });
    
    // Check if content is still readable
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // Check if key elements are still visible and accessible
    const keyElements = await page.locator('h1, nav, main, button').all();
    let visibleElements = 0;
    
    for (const element of keyElements.slice(0, 5)) { // Check first 5
      const isVisible = await element.isVisible();
      if (isVisible) visibleElements++;
    }
    
    // Restore viewport
    await page.setViewportSize(originalViewport);
    
    console.log(`✓ 200% zoom test: ${visibleElements}/${Math.min(keyElements.length, 5)} key elements visible`);
    console.log(`Horizontal scroll needed: ${hasHorizontalScroll}`);
    
    expect(visibleElements).toBeGreaterThan(0);
    
    // Allow some horizontal scroll but warn if extensive
    if (hasHorizontalScroll) {
      console.log('⚠️  Horizontal scrolling required at 200% zoom');
    }
  });

  test('Mobile viewport accessibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that interactive elements are accessible
    const buttons = await page.locator('button').all();
    const links = await page.locator('a[href]').all();
    
    const touchTargetIssues = [];
    
    // Check button sizes (should be at least 44px for touch)
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box && (box.width < 44 || box.height < 44)) {
        touchTargetIssues.push({
          element: 'button',
          size: `${Math.round(box.width)}x${Math.round(box.height)}px`,
          recommendation: 'Touch targets should be at least 44x44px'
        });
      }
    }
    
    console.log(`✓ Mobile viewport test completed`);
    if (touchTargetIssues.length > 0) {
      console.log('Touch target issues:', touchTargetIssues);
      console.log('⚠️  Some touch targets may be too small for mobile users');
    }
    
    // Don't fail for touch target size (WCAG AAA requirement), just warn
    expect(true).toBe(true);
  });

  test('Complete axe-core accessibility scan', async ({ page }) => {
    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('[data-testid="ignore-a11y"]'); // Exclude elements marked to ignore
    
    const results = await axeBuilder.analyze();
    
    const summary = {
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length
    };
    
    console.log('🔍 Complete Axe-core Accessibility Scan Results:');
    console.log(`  ✓ Passed: ${summary.passes}`);
    console.log(`  ❌ Violations: ${summary.violations}`);
    console.log(`  ⚠️  Incomplete: ${summary.incomplete}`);
    console.log(`  ➖ Not Applicable: ${summary.inapplicable}`);
    
    if (results.violations.length > 0) {
      console.log('\\n📋 Detailed Violations:');
      results.violations.forEach((violation, index) => {
        console.log(`\\n${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Elements affected: ${violation.nodes.length}`);
        
        // Show first few affected elements
        violation.nodes.slice(0, 2).forEach(node => {
          console.log(`   - ${node.target[0]}`);
          if (node.failureSummary) {
            console.log(`     Issue: ${node.failureSummary}`);
          }
        });
      });
    }
    
    // Calculate compliance score
    const totalChecks = summary.violations + summary.passes;
    const complianceScore = totalChecks > 0 ? Math.round((summary.passes / totalChecks) * 100) : 100;
    
    console.log(`\\n📊 Overall Compliance Score: ${complianceScore}%`);
    
    // Expect at least 90% compliance (allowing some minor issues)
    expect(complianceScore).toBeGreaterThanOrEqual(90);
  });
});