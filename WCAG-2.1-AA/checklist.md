# WebAIM's WCAG 2.1 AA Checklist

> Source: [https://webaim.org/standards/wcag/checklist](https://webaim.org/standards/wcag/checklist)
>
> **Important:** This is NOT the Web Content Accessibility Guidelines (WCAG) 2 itself. It is a checklist that presents recommendations for implementing the most common accessibility principles and techniques for those seeking WCAG conformance. The language used here significantly simplifies and condenses the official WCAG 2.2 specification and supporting materials.

---

## 1. Perceivable

**Web content is made available to the senses — sight, hearing, and/or touch.**

### Guideline 1.1 — Provide text alternatives for any non-text content

#### [1.1.1 Non-text Content](https://www.w3.org/TR/WCAG22/#non-text-content) (Level A)

- Images, image buttons, and image map hot spots have appropriate, equivalent [alternative text](https://webaim.org/techniques/alttext/).
- Images that do not convey content, are decorative, or contain content that is already conveyed in text are given empty alternative text (`alt=""`) or implemented as CSS backgrounds. All linked images have descriptive alternative text.
- Equivalent alternatives to complex images are provided in context or on a separate linked page.
- Form buttons have a descriptive value.
- Inputs have associated [accessible names](https://webaim.org/articles/label-name/).
- Embedded multimedia is identified via accessible text.
- Frames and iframes are appropriately [titled](https://webaim.org/techniques/frames/).

### Guideline 1.2 — Provide alternatives for time-based media

#### [1.2.1 Audio-only and Video-only (Prerecorded)](https://www.w3.org/TR/WCAG22/#audio-only-and-video-only-prerecorded) (Level A)

- A [descriptive transcript](https://webaim.org/techniques/captions/#transcripts) of relevant content is provided for non-live audio-only (audio podcasts, MP3 files, etc.).
- A descriptive transcript or [audio description](https://webaim.org/techniques/captions/#ad) of relevant content is provided for non-live video-only, unless the video is decorative.

#### [1.2.2 Captions (Prerecorded)](https://www.w3.org/TR/WCAG22/#captions-prerecorded) (Level A)

- [Synchronized captions](https://webaim.org/techniques/captions/) are provided for non-live video (YouTube videos, etc.).

#### [1.2.3 Audio Description or Media Alternative (Prerecorded)](https://www.w3.org/TR/WCAG22/#audio-description-or-media-alternative-prerecorded) (Level A)

- A descriptive transcript or audio description is provided for non-live video.
- NOTE: Only required if there is relevant visual content that is not presented in the audio.

#### [1.2.4 Captions (Live)](https://www.w3.org/TR/WCAG22/#captions-live) (Level AA)

- Synchronized captions are provided for live media that contains audio (audio-only broadcasts, web casts, video conferences, etc.).

#### [1.2.5 Audio Description (Prerecorded)](https://www.w3.org/TR/WCAG22/#audio-description-prerecorded) (Level AA)

- Audio descriptions are provided for non-live video.
- NOTE: Only required if there is relevant visual content that is not presented in the audio.
- While not required at Level AA, for optimal accessibility WebAIM recommends descriptive transcripts in addition to audio descriptions.

### Guideline 1.3 — Create content that can be presented in different ways without losing information or structure

#### [1.3.1 Info and Relationships](https://www.w3.org/TR/WCAG22/#info-and-relationships) (Level A)

- [Semantic markup](https://webaim.org/techniques/semanticstructure/) is appropriately used to designate headings, regions/landmarks, lists, emphasized or special text, etc.
- [Tables](https://webaim.org/techniques/tables/data) are used for tabular data and data cells are associated with their headers. Data table captions, if present, are associated to data tables.
- [Text labels](https://webaim.org/techniques/forms/controls) are associated with form inputs. Related form controls are grouped with fieldset/legend. ARIA labelling may be used when standard HTML is insufficient.

#### [1.3.2 Meaningful Sequence](https://www.w3.org/TR/WCAG22/#meaningful-sequence) (Level A)

- The [reading and navigation order](https://webaim.org/techniques/screenreader/#linearization) (determined by code order) is logical and intuitive.

#### [1.3.3 Sensory Characteristics](https://www.w3.org/TR/WCAG22/#sensory-characteristics) (Level A)

- Instructions do not rely upon shape, size, or visual location (e.g., "Click the square icon to continue" or "Instructions are in the right-hand column").
- Instructions do not rely upon sound (e.g., "A beeping sound indicates you may continue.").

#### [1.3.4 Orientation](https://www.w3.org/TR/WCAG22/#orientation) (Level AA)

- Orientation of web content is not restricted to only portrait or landscape, unless a specific orientation is necessary.

#### [1.3.5 Identify Input Purpose](https://www.w3.org/TR/WCAG22/#identify-input-purpose) (Level AA)

- Input fields that collect [certain types of user information](https://www.w3.org/TR/WCAG22/#input-purposes) have an appropriate `autocomplete` attribute defined.

### Guideline 1.4 — Make it easier for users to see and hear content including separating foreground from background

#### [1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color) (Level A)

- Color is not used as the sole method of conveying content or distinguishing visual elements.
- Color alone is not used to distinguish [links](https://webaim.org/techniques/hypertext/) from surrounding text unless the [contrast ratio](https://webaim.org/resources/linkcontrastchecker/) between the link and the surrounding text is at least 3:1 and an additional distinction (e.g., it becomes underlined) is provided when the link is hovered over and receives keyboard focus.

#### [1.4.2 Audio Control](https://www.w3.org/TR/WCAG22/#audio-control) (Level A)

- A mechanism is provided to stop, pause, mute, or adjust volume for audio that automatically plays on a page for more than 3 seconds.

#### [1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) (Level AA)

- Text and images of text have a contrast ratio of at least 4.5:1.
- Large text — at least 18 point (typically 24px) or 14 point (typically 18.66px) and bold — has a contrast ratio of at least 3:1.

#### [1.4.4 Resize Text](https://www.w3.org/TR/WCAG22/#resize-text) (Level AA)

- The page is readable and functional when the page is zoomed to 200%.
- NOTE: 1.4.10 (below) introduces additional requirements for zoomed content.

#### [1.4.5 Images of Text](https://www.w3.org/TR/WCAG22/#images-of-text) (Level AA)

- If the same visual presentation can be made using text alone, an image is not used to present that text.

#### [1.4.10 Reflow](https://www.w3.org/TR/WCAG22/#reflow) (Level AA)

- No loss of content or functionality occurs, and horizontal scrolling is avoided when content is presented at a width of 320 pixels.
  - This requires responsive design for most web sites. This is best tested by setting the browser window to 1280 pixels wide and then zooming the page content to 400%.
- Content that requires horizontal scrolling, such as data tables, complex images (such as maps and charts), toolbars, etc. are exempted.

#### [1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast) (Level AA)

- A contrast ratio of at least 3:1 is present for differentiating graphical objects (such as icons and components of charts or graphs) and author-customized interface components (such as buttons, form controls, and focus indicators/outlines).
- At least 3:1 contrast is maintained in the various states (focus, hover, active, etc.) of author-customized interactive components.

#### [1.4.12 Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing) (Level AA)

- No loss of content or functionality occurs when the user adapts paragraph spacing to 2 times the font size, text line height/spacing to 1.5 times the font size, word spacing to .16 times the font size, and letter spacing to .12 times the font size.
- This is best supported by avoiding pixel height definitions for elements that contain text.

#### [1.4.13 Content on Hover or Focus](https://www.w3.org/TR/WCAG22/#content-on-hover-or-focus) (Level AA)

- When additional content is presented on hover or keyboard focus:
  - The newly revealed content can be dismissed (generally via the Esc key) without moving the pointer or keyboard focus, unless the content presents an input error or does not obscure or interfere with other page content.
  - The pointer can be moved to the new content without the content disappearing.
  - The new content must remain visible until the pointer or keyboard focus is moved away from the triggering control, the new content is dismissed, or the new content is no longer relevant.

---

## 2. Operable

**Interface forms, controls, and navigation are operable.**

### Guideline 2.1 — Make all functionality available from a keyboard

#### [2.1.1 Keyboard](https://www.w3.org/TR/WCAG22/#keyboard) (Level A)

- All page functionality is available using the [keyboard](https://webaim.org/techniques/keyboard/), unless the functionality cannot be accomplished in any known way using a keyboard (e.g., free hand drawing).
- Page-specified shortcut keys and accesskeys (accesskey should typically be avoided) do not conflict with existing browser and screen reader shortcuts.

#### [2.1.2 No Keyboard Trap](https://www.w3.org/TR/WCAG22/#no-keyboard-trap) (Level A)

- [Keyboard](https://webaim.org/techniques/keyboard/) focus is never locked or trapped at one particular page element. The user can navigate to and from all navigable page elements using only a keyboard.

#### [2.1.4 Character Key Shortcuts](https://www.w3.org/TR/WCAG22/#character-key-shortcuts) (Level A)

- If a keyboard shortcut uses printable character keys, then the user must be able to disable the key command, change the defined key to a non-printable key (Ctrl, Alt, etc.), or only activate the shortcut when an associated interface component or button is focused.

### Guideline 2.2 — Provide users enough time to read and use content

#### [2.2.1 Timing Adjustable](https://www.w3.org/TR/WCAG22/#timing-adjustable) (Level A)

- If a page or application has a time limit, the user is given options to turn off, adjust, or extend that time limit. This is not a requirement for real-time events (e.g., an auction), where the time limit is absolutely required, or if the time limit is longer than 20 hours.

#### [2.2.2 Pause, Stop, Hide](https://www.w3.org/TR/WCAG22/#pause-stop-hide) (Level A)

- Automatically moving, blinking, or scrolling content (such as carousels, marquees, or animations) that lasts longer than 5 seconds can be paused, stopped, or hidden by the user.
- Automatically updating content (e.g., a dynamically-updating news ticker, chat messages, etc.) can be paused, stopped, or hidden by the user or the user can manually control the timing of the updates.

### Guideline 2.3 — Do not design content in a way that is known to cause seizures

#### [2.3.1 Three Flashes or Below Threshold](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold) (Level A)

- No page content [flashes](https://webaim.org/articles/seizure/) more than 3 times per second unless that flashing content is sufficiently small and the flashes are of low contrast and do not contain too much red.

### Guideline 2.4 — Provide ways to help users navigate, find content, and determine where they are

#### [2.4.1 Bypass Blocks](https://www.w3.org/TR/WCAG22/#bypass-blocks) (Level A)

- A link is provided to [skip navigation](https://webaim.org/techniques/skipnav/) and other page elements that are repeated across web pages.
- While proper use of headings or regions/landmarks is sufficient to meet this success criterion, because keyboard navigation by headings or regions is not supported in most browsers, WebAIM recommends a "skip" link in addition to headings and regions.

#### [2.4.2 Page Titled](https://www.w3.org/TR/WCAG22/#page-titled) (Level A)

- The web page has a descriptive and informative [page title](https://webaim.org/techniques/pagetitle/).

#### [2.4.3 Focus Order](https://www.w3.org/TR/WCAG22/#focus-order) (Level A)

- The navigation order of links, form controls, etc. is logical and intuitive.

#### [2.4.4 Link Purpose (In Context)](https://www.w3.org/TR/WCAG22/#link-purpose-in-context) (Level A)

- The purpose of each link (or image button or image map hotspot) can be determined from the link text alone, or from the link text and its context (e.g., surrounding text, list item, previous heading, or table headers).
- Links with the same text that go to different locations are readily distinguishable.

#### [2.4.5 Multiple Ways](https://www.w3.org/TR/WCAG22/#multiple-ways) (Level AA)

- [Multiple ways](https://webaim.org/techniques/sitetools/) are available to find other web pages on the site — at least two of: a list of related pages, table of contents, site map, site search, or list of all available web pages.

#### [2.4.6 Headings and Labels](https://www.w3.org/TR/WCAG22/#headings-and-labels) (Level AA)

- Page headings and labels for form and interactive controls are informative. Avoid duplicating heading and label text unless the structure provides adequate differentiation between them.

#### [2.4.7 Focus Visible](https://www.w3.org/TR/WCAG22/#focus-visible) (Level AA)

- There is a visible indicator for page elements when they receive keyboard focus.

#### [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum) (Level AA)

- When elements have keyboard focus, they are not entirely covered or hidden by page content.

### Guideline 2.5 — Make it easier for users to operate functionality through various inputs beyond keyboard

#### [2.5.1 Pointer Gestures](https://www.w3.org/TR/WCAG22/#pointer-gestures) (Level A)

- If multipoint or path-based gestures (such as pinching, swiping, or dragging across the screen) are not essential to the functionality, then the functionality can also be performed with a single point activation (such as activating a button).

#### [2.5.2 Pointer Cancellation](https://www.w3.org/TR/WCAG22/#pointer-cancellation) (Level A)

- To help avoid inadvertent activation of controls, avoid non-essential down-event (e.g., `onmousedown`) activation when clicking, tapping, or long pressing the screen.

#### [2.5.3 Label in Name](https://www.w3.org/TR/WCAG22/#label-in-name) (Level A)

- If an interface component (link, button, etc.) presents text (or images of text), the accessible name (label, alternative text, aria-label, etc.) for that component must include the visible text.

#### [2.5.4 Motion Actuation](https://www.w3.org/TR/WCAG22/#motion-actuation) (Level A)

- Functionality that is triggered by moving the device (such as shaking or panning a mobile device) or by user movement (such as waving to a camera) can be disabled and equivalent functionality is provided via standard controls like buttons.

#### [2.5.7 Dragging Movements](https://www.w3.org/TR/WCAG22/#dragging-movements) (Level AA)

- Functionality that uses pointer dragging can also be achieved using a single pointer without dragging (unless dragging is essential).

#### [2.5.8 Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum) (Level AA)

- Pointer input target sizes are at least 24 by 24 pixels unless:
  - A 24 pixel diameter circle centered on the target element does not intersect with any other target or a 24 pixel circle centered on an adjacent target.
  - The functionality can be achieved in some other conformant manner.
  - The target is in a sentence or list.
  - The target size can't be modified or is essential to the functionality.

---

## 3. Understandable

**Information and the operation of user interface must be understandable.**

### Guideline 3.1 — Make text content readable and understandable

#### [3.1.1 Language of Page](https://www.w3.org/TR/WCAG22/#language-of-page) (Level A)

- The language of the page is identified using the `lang` attribute (e.g., `<html lang="en">`).

#### [3.1.2 Language of Parts](https://www.w3.org/TR/WCAG22/#language-of-parts) (Level AA)

- The language of page content that is in a different language is identified using the `lang` attribute (e.g., `<blockquote lang="es">`).

### Guideline 3.2 — Make Web pages appear and operate in predictable ways

#### [3.2.1 On Focus](https://www.w3.org/TR/WCAG22/#on-focus) (Level A)

- When a page element receives focus, it does not result in a substantial change to the page, the spawning of a pop-up window, an additional change of keyboard focus, or any other change that could confuse or disorient the user.

#### [3.2.2 On Input](https://www.w3.org/TR/WCAG22/#on-input) (Level A)

- When a user inputs information or interacts with a control, it does not result in a substantial change to the page, the spawning of a pop-up window, an additional change of keyboard focus, or any other change that could confuse or disorient the user unless the user is informed of the change ahead of time.

#### [3.2.3 Consistent Navigation](https://www.w3.org/TR/WCAG22/#consistent-navigation) (Level AA)

- Navigation links that are repeated on web pages do not change order when navigating through the site.

#### [3.2.4 Consistent Identification](https://www.w3.org/TR/WCAG22/#consistent-identification) (Level AA)

- Elements that have the same functionality across multiple web pages are consistently identified. For example, a search box at the top of the site should always be labeled the same way.

#### [3.2.6 Consistent Help](https://www.w3.org/TR/WCAG22/#consistent-help) (Level A)

- Contact and self-help details or functionality are presented consistently when present on multiple web pages.

### Guideline 3.3 — Help users avoid and correct mistakes

#### [3.3.1 Error Identification](https://www.w3.org/TR/WCAG22/#error-identification) (Level A)

- Required inputs or inputs that require a specific format, value, or length provide this information within the element's label.
- [Form validation](https://webaim.org/techniques/formvalidation/) errors are efficient, intuitive, and accessible. The error is clearly identified, quick access to the problematic element is provided, and the user can easily fix the error and resubmit the form.

#### [3.3.2 Labels or Instructions](https://www.w3.org/TR/WCAG22/#labels-or-instructions) (Level A)

- Inputs are identified by labels or instructions that help users know what information to enter.

#### [3.3.3 Error Suggestion](https://www.w3.org/TR/WCAG22/#error-suggestion) (Level AA)

- If an input error is detected (via client-side or server-side validation), suggestions are provided for fixing the input in a timely and accessible manner.

#### [3.3.4 Error Prevention (Legal, Financial, Data)](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data) (Level AA)

- Submissions, changes, and deletions of legal, financial, or test data can be reversed, verified, or confirmed.

#### [3.3.7 Redundant Entry](https://www.w3.org/TR/WCAG22/#redundant-entry) (Level A)

- Information that a user must re-enter to complete a single-session process must be auto-populated or available for the user to select, unless re-entering the information is essential to the functionality, the information poses security issues, or the previously-entered information is no longer valid.

#### [3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum) (Level AA)

- A cognitive function test (such as remembering a password or solving a puzzle) is not required for any step in an authentication process unless the cognitive function test can be bypassed in some way, can be completed with assistance by some other mechanism, uses object recognition, or uses identification of non-text content provided by the user.

---

## 4. Robust

**Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.**

### Guideline 4.1 — Maximize compatibility with current and future user agents, including assistive technologies

#### [4.1.1 Parsing (Obsolete and removed)](https://www.w3.org/TR/WCAG22/#parsing) (Level A)

- NOTE: This success criterion is no longer useful and as of 2023 has been removed from WCAG. It previously required that significant HTML validation/parsing errors be avoided.

#### [4.1.2 Name, Role, Value](https://www.w3.org/TR/WCAG22/#name-role-value) (Level A)

- Markup is used in a way that facilitates accessibility. This includes following the HTML specifications and using forms, input labels, frame titles, etc. appropriately.
- ARIA is used appropriately to enhance accessibility when HTML is not sufficient.

#### [4.1.3 Status Messages](https://www.w3.org/TR/WCAG22/#status-messages) (Level AA)

- If an important status message is presented and focus is not set to that message, the message must be announced to screen reader users, typically via an ARIA alert or live region.

---

*This checklist is provided as a resource to help implement [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) (W3C Recommendation), which is Copyright © 2017-2023 W3C®.*

*Last updated: Jun 20, 2024*
