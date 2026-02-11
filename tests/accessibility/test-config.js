// tests/accessibility/test-config.js
export const wcagConfig = {
  // WCAG 2.1 AA Success Criteria Configuration
  criteria: {
    'perceivable': {
      '1.1.1': {
        name: 'Non-text Content',
        level: 'A',
        description: 'All non-text content has appropriate text alternatives'
      },
      '1.2.1': {
        name: 'Audio-only and Video-only (Prerecorded)',
        level: 'A',
        description: 'Alternatives provided for prerecorded audio-only and video-only content'
      },
      '1.2.2': {
        name: 'Captions (Prerecorded)',
        level: 'A',
        description: 'Captions provided for prerecorded audio content in synchronized media'
      },
      '1.2.3': {
        name: 'Audio Description or Media Alternative (Prerecorded)',
        level: 'A',
        description: 'Alternative for time-based media or audio description provided'
      },
      '1.2.4': {
        name: 'Captions (Live)',
        level: 'AA',
        description: 'Captions provided for all live audio content'
      },
      '1.2.5': {
        name: 'Audio Description (Prerecorded)',
        level: 'AA',
        description: 'Audio description provided for prerecorded video content'
      },
      '1.3.1': {
        name: 'Info and Relationships',
        level: 'A',
        description: 'Information and relationships are programmatically determined'
      },
      '1.3.2': {
        name: 'Meaningful Sequence',
        level: 'A',
        description: 'Content is presented in a meaningful sequence'
      },
      '1.3.3': {
        name: 'Sensory Characteristics',
        level: 'A',
        description: 'Instructions do not rely solely on sensory characteristics'
      },
      '1.3.4': {
        name: 'Orientation',
        level: 'AA',
        description: 'Content does not restrict its view to a single orientation'
      },
      '1.3.5': {
        name: 'Identify Input Purpose',
        level: 'AA',
        description: 'Purpose of input fields can be programmatically determined'
      },
      '1.4.1': {
        name: 'Use of Color',
        level: 'A',
        description: 'Color is not the sole means of conveying information'
      },
      '1.4.2': {
        name: 'Audio Control',
        level: 'A',
        description: 'Audio that plays automatically can be paused, stopped, or muted'
      },
      '1.4.3': {
        name: 'Contrast (Minimum)',
        level: 'AA',
        description: 'Text has contrast ratio of at least 4.5:1 (3:1 for large text)'
      },
      '1.4.4': {
        name: 'Resize text',
        level: 'AA',
        description: 'Text can be resized up to 200% without loss of functionality'
      },
      '1.4.5': {
        name: 'Images of Text',
        level: 'AA',
        description: 'Images of text are avoided except when customizable or essential'
      },
      '1.4.10': {
        name: 'Reflow',
        level: 'AA',
        description: 'Content reflows without horizontal scrolling at 320px width'
      },
      '1.4.11': {
        name: 'Non-text Contrast',
        level: 'AA',
        description: 'UI components and graphics have contrast ratio of at least 3:1'
      },
      '1.4.12': {
        name: 'Text Spacing',
        level: 'AA',
        description: 'No loss of content or functionality when text spacing is adjusted'
      },
      '1.4.13': {
        name: 'Content on Hover or Focus',
        level: 'AA',
        description: 'Content that appears on hover or focus is dismissible, hoverable, and persistent'
      }
    },
    'operable': {
      '2.1.1': {
        name: 'Keyboard',
        level: 'A',
        description: 'All functionality is available via keyboard'
      },
      '2.1.2': {
        name: 'No Keyboard Trap',
        level: 'A',
        description: 'Keyboard focus is not trapped in any component'
      },
      '2.1.4': {
        name: 'Character Key Shortcuts',
        level: 'A',
        description: 'Single-key shortcuts can be disabled or remapped'
      },
      '2.2.1': {
        name: 'Timing Adjustable',
        level: 'A',
        description: 'Time limits can be turned off, adjusted, or extended'
      },
      '2.2.2': {
        name: 'Pause, Stop, Hide',
        level: 'A',
        description: 'Moving, blinking, or auto-updating content can be controlled'
      },
      '2.3.1': {
        name: 'Three Flashes or Below Threshold',
        level: 'A',
        description: 'Content does not flash more than 3 times per second'
      },
      '2.4.1': {
        name: 'Bypass Blocks',
        level: 'A',
        description: 'Mechanism available to bypass blocks of repeated content'
      },
      '2.4.2': {
        name: 'Page Titled',
        level: 'A',
        description: 'Web pages have descriptive titles'
      },
      '2.4.3': {
        name: 'Focus Order',
        level: 'A',
        description: 'Focusable components receive focus in logical order'
      },
      '2.4.4': {
        name: 'Link Purpose (In Context)',
        level: 'A',
        description: 'Purpose of links can be determined from link text or context'
      },
      '2.4.5': {
        name: 'Multiple Ways',
        level: 'AA',
        description: 'Multiple ways are available to locate web pages'
      },
      '2.4.6': {
        name: 'Headings and Labels',
        level: 'AA',
        description: 'Headings and labels describe topic or purpose'
      },
      '2.4.7': {
        name: 'Focus Visible',
        level: 'AA',
        description: 'Keyboard focus indicator is visible'
      },
      '2.5.1': {
        name: 'Pointer Gestures',
        level: 'A',
        description: 'Single pointer alternative for multipoint or path-based gestures'
      },
      '2.5.2': {
        name: 'Pointer Cancellation',
        level: 'A',
        description: 'Single pointer actions can be cancelled'
      },
      '2.5.3': {
        name: 'Label in Name',
        level: 'A',
        description: 'Accessible name contains the visible label text'
      },
      '2.5.4': {
        name: 'Motion Actuation',
        level: 'A',
        description: 'Motion-triggered functions can be disabled'
      }
    },
    'understandable': {
      '3.1.1': {
        name: 'Language of Page',
        level: 'A',
        description: 'Primary language of web page is programmatically determined'
      },
      '3.1.2': {
        name: 'Language of Parts',
        level: 'AA',
        description: 'Language of content passages is programmatically determined'
      },
      '3.2.1': {
        name: 'On Focus',
        level: 'A',
        description: 'Receiving focus does not initiate a change of context'
      },
      '3.2.2': {
        name: 'On Input',
        level: 'A',
        description: 'Changing settings does not automatically cause change of context'
      },
      '3.2.3': {
        name: 'Consistent Navigation',
        level: 'AA',
        description: 'Navigation mechanisms are consistent across pages'
      },
      '3.2.4': {
        name: 'Consistent Identification',
        level: 'AA',
        description: 'Components with same functionality are consistently identified'
      },
      '3.3.1': {
        name: 'Error Identification',
        level: 'A',
        description: 'Input errors are identified and described to the user'
      },
      '3.3.2': {
        name: 'Labels or Instructions',
        level: 'A',
        description: 'Labels or instructions are provided for user input'
      },
      '3.3.3': {
        name: 'Error Suggestion',
        level: 'AA',
        description: 'Suggestions are provided for fixing input errors'
      },
      '3.3.4': {
        name: 'Error Prevention (Legal, Financial, Data)',
        level: 'AA',
        description: 'Submissions are reversible, checked, or confirmed'
      }
    },
    'robust': {
      '4.1.2': {
        name: 'Name, Role, Value',
        level: 'A',
        description: 'Name and role are programmatically determined for UI components'
      },
      '4.1.3': {
        name: 'Status Messages',
        level: 'AA',
        description: 'Status messages are presented to users without receiving focus'
      }
    }
  },

  // Test environment configuration
  testConfig: {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    retries: 1,
    browsers: ['chromium', 'firefox', 'webkit'],
    mobileDevices: ['iPhone 12', 'Pixel 5'],
    viewports: {
      desktop: { width: 1280, height: 720 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 },
      narrow: { width: 320, height: 568 } // For reflow testing
    }
  },

  // Axe-core configuration
  axeConfig: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    rules: {
      // Core WCAG 2.1 AA rules
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-order-semantics': { enabled: true },
      'landmark-unique': { enabled: true },
      'page-has-heading-one': { enabled: true },
      'heading-order': { enabled: true },
      'label': { enabled: true },
      'link-name': { enabled: true },
      'button-name': { enabled: true },
      'image-alt': { enabled: true },
      'bypass': { enabled: true },
      'document-title': { enabled: true }
    },
    // Disable rules that might not apply to all projects
    disabledRules: [
      'color-contrast-enhanced', // AAA level, not required for AA
      'focus-order-semantics', // Sometimes too strict
    ]
  },

  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'junit'],
    outputDir: './test-results',
    includeScreenshots: true,
    includeTraces: false,
    detailLevel: 'full' // 'minimal', 'summary', 'full'
  }
};

export default wcagConfig;