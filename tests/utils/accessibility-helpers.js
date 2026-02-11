// tests/utils/accessibility-helpers.js
import AxeBuilder from '@axe-core/playwright';

export class AccessibilityHelper {
  constructor(page) {
    this.page = page;
    this.violations = [];
  }

  async setupAxe() {
    // AxeBuilder handles injection automatically, no need for manual injection
    this.axeBuilder = new AxeBuilder({ page: this.page });
  }

  async runAxeCheck(context = null, options = {}) {
    try {
      const axeBuilder = new AxeBuilder({ page: this.page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .options(options);
      
      if (context) {
        axeBuilder.include(context);
      }
      
      const results = await axeBuilder.analyze();
      
      if (results.violations && results.violations.length > 0) {
        this.violations.push(...results.violations);
        return { passed: false, violations: results.violations };
      }
      
      return { passed: true, violations: [] };
    } catch (error) {
      console.error('Axe check failed:', error);
      return { passed: false, violations: [], error: error.message };
    }
  }

  async getElementSelector(element) {
    return await element.evaluate((el) => {
      // Generate a unique selector for the element
      const path = [];
      let current = el;
      
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let selector = current.nodeName.toLowerCase();
        
        if (current.id) {
          selector += `#${current.id}`;
          path.unshift(selector);
          break;
        } else {
          let sibling = current;
          let nth = 1;
          while (sibling = sibling.previousElementSibling) {
            if (sibling.nodeName.toLowerCase() === selector) nth++;
          }
          if (nth !== 1) selector += `:nth-of-type(${nth})`;
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      return path.join(' > ');
    });
  }

  createFailureReport(url, selector, description, wcagCriterion, suggestion, severity, metadata = {}) {
    return {
      timestamp: new Date().toISOString(),
      url,
      selector,
      description,
      wcagCriterion,
      suggestion,
      severity,
      metadata
    };
  }

  async checkColorContrast(element) {
    return await element.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      const fontSize = computedStyle.fontSize;
      
      // Convert colors to hex for contrast calculation
      const rgb2hex = (rgb) => {
        const match = rgb.match(/\d+/g);
        if (!match) return null;
        const hex = ((1 << 24) + (parseInt(match[0]) << 16) + (parseInt(match[1]) << 8) + parseInt(match[2])).toString(16).slice(1);
        return `#${hex}`;
      };
      
      return {
        color: rgb2hex(color),
        backgroundColor: rgb2hex(backgroundColor),
        fontSize: parseFloat(fontSize),
        element: el.tagName.toLowerCase()
      };
    });
  }

  async checkKeyboardNavigation() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[contenteditable="true"]'
    ].join(', ');

    const focusableElements = await this.page.locator(focusableSelectors).all();
    const results = [];

    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i];
      
      try {
        await element.focus();
        const isFocused = await element.evaluate(el => document.activeElement === el);
        const hasVisibleFocus = await element.evaluate(el => {
          const style = window.getComputedStyle(el, ':focus');
          return style.outline !== 'none' || style.boxShadow !== 'none' || style.border !== style.getPropertyValue('border');
        });
        
        results.push({
          element: await this.getElementSelector(element),
          canFocus: isFocused,
          hasVisibleFocus,
          tabIndex: await element.getAttribute('tabindex')
        });
      } catch (error) {
        results.push({
          element: await this.getElementSelector(element),
          canFocus: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async checkHeadingStructure() {
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    const structure = [];
    
    for (const heading of headings) {
      const level = await heading.evaluate(el => parseInt(el.tagName.charAt(1)));
      const text = await heading.textContent();
      const selector = await this.getElementSelector(heading);
      
      structure.push({ level, text: text.trim(), selector });
    }
    
    // Check for proper heading hierarchy
    const violations = [];
    for (let i = 1; i < structure.length; i++) {
      const current = structure[i];
      const previous = structure[i - 1];
      
      if (current.level > previous.level + 1) {
        violations.push({
          selector: current.selector,
          issue: `Heading level ${current.level} follows heading level ${previous.level}, skipping levels`,
          recommendation: 'Ensure heading levels increase by only one level at a time'
        });
      }
    }
    
    return { structure, violations };
  }

  async checkFormLabels() {
    const formElements = await this.page.locator('input:not([type="hidden"]), select, textarea').all();
    const results = [];
    
    for (const element of formElements) {
      const id = await element.getAttribute('id');
      const label = await element.getAttribute('aria-label');
      const labelledBy = await element.getAttribute('aria-labelledby');
      const describedBy = await element.getAttribute('aria-describedby');
      const type = await element.getAttribute('type');
      
      let hasLabel = false;
      let labelText = '';
      
      // Check for explicit label
      if (id) {
        const explicitLabel = await this.page.locator(`label[for="${id}"]`).first();
        if (await explicitLabel.count() > 0) {
          hasLabel = true;
          labelText = await explicitLabel.textContent();
        }
      }
      
      // Check for implicit label (wrapped)
      if (!hasLabel) {
        const implicitLabel = await element.locator('xpath=ancestor::label').first();
        if (await implicitLabel.count() > 0) {
          hasLabel = true;
          labelText = await implicitLabel.textContent();
        }
      }
      
      // Check for ARIA labels
      if (!hasLabel && (label || labelledBy)) {
        hasLabel = true;
        labelText = label || 'ARIA labeled';
      }
      
      results.push({
        selector: await this.getElementSelector(element),
        hasLabel,
        labelText: labelText?.trim(),
        type,
        hasDescription: !!describedBy
      });
    }
    
    return results;
  }

  async checkLinkPurpose() {
    const links = await this.page.locator('a[href]').all();
    const results = [];
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = (await link.textContent())?.trim();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      const selector = await this.getElementSelector(link);
      
      // Check for vague link text
      const vagueTexts = ['click here', 'read more', 'more', 'here', 'link'];
      const isVague = vagueTexts.some(vague => 
        text?.toLowerCase().includes(vague) && text.length < 15
      );
      
      results.push({
        selector,
        href,
        text,
        ariaLabel,
        title,
        isVague,
        hasMeaningfulText: text && text.length > 2 && !isVague
      });
    }
    
    return results;
  }

  async checkImageAlternatives() {
    const images = await this.page.locator('img').all();
    const results = [];
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');
      const selector = await this.getElementSelector(img);
      
      const isDecorative = alt === '' || role === 'presentation';
      const hasAlternative = alt !== null || ariaLabel;
      
      results.push({
        selector,
        src,
        alt,
        ariaLabel,
        role,
        isDecorative,
        hasAlternative,
        altLength: alt?.length || 0
      });
    }
    
    return results;
  }

  async generateReport() {
    return {
      timestamp: new Date().toISOString(),
      url: await this.page.url(),
      violations: this.violations,
      summary: {
        total: this.violations.length,
        critical: this.violations.filter(v => v.severity === 'critical').length,
        serious: this.violations.filter(v => v.severity === 'serious').length,
        moderate: this.violations.filter(v => v.severity === 'moderate').length,
        minor: this.violations.filter(v => v.severity === 'minor').length
      }
    };
  }

  // WCAG 2.1 specific tests
  async checkResizeText() {
    // Save original viewport
    const originalViewport = this.page.viewportSize();
    
    // Test at 200% zoom (WCAG 1.4.4)
    await this.page.setViewportSize({
      width: Math.floor(originalViewport.width / 2),
      height: Math.floor(originalViewport.height / 2)
    });
    
    // Check if content is still usable
    const hasHorizontalScroll = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // Check if text is readable
    const textElements = await this.page.locator('p, div, span, a, button, label').all();
    const textReadability = [];
    
    for (const element of textElements.slice(0, 10)) { // Sample first 10 elements
      const isVisible = await element.isVisible();
      const text = await element.textContent();
      
      if (text && text.trim()) {
        textReadability.push({
          selector: await this.getElementSelector(element),
          isVisible,
          textLength: text.trim().length
        });
      }
    }
    
    // Restore viewport
    await this.page.setViewportSize(originalViewport);
    
    return {
      hasHorizontalScroll,
      textReadability,
      passedResizeTest: !hasHorizontalScroll && textReadability.every(t => t.isVisible)
    };
  }

  async checkReflow() {
    // Test reflow at 320px width (WCAG 1.4.10)
    const originalViewport = this.page.viewportSize();
    
    await this.page.setViewportSize({ width: 320, height: 568 });
    
    const hasHorizontalScroll = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > 320;
    });
    
    // Check if all content is accessible without horizontal scrolling
    const interactiveElements = await this.page.locator('button, a, input, select, textarea').all();
    const accessibleElements = [];
    
    for (const element of interactiveElements) {
      const box = await element.boundingBox();
      const isAccessible = box && box.x >= 0 && box.x + box.width <= 320;
      
      accessibleElements.push({
        selector: await this.getElementSelector(element),
        isAccessible,
        boundingBox: box
      });
    }
    
    await this.page.setViewportSize(originalViewport);
    
    return {
      hasHorizontalScroll,
      accessibleElements,
      passedReflowTest: !hasHorizontalScroll && accessibleElements.every(e => e.isAccessible)
    };
  }
}

export default AccessibilityHelper;