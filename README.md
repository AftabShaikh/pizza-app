# 🍕 Pizza Palace

A modern pizza ordering web application built with Next.js, React, and TypeScript. Browse a menu of classic and gourmet pizzas, customize toppings, manage your cart, and place orders — all through a responsive, accessible interface.

> **Built entirely with [GitHub Copilot](https://github.com/features/copilot)** — from scaffolding and component development to testing and documentation.

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [GitHub Copilot — Agents, Prompts & Skills](#github-copilot--agents-prompts--skills)
- [Testing](#testing)
- [Learn More](#learn-more)

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.1.6 | React framework with App Router, server components, and optimized builds |
| [React](https://react.dev) | 19.2.0 | UI library with React Compiler enabled |
| [TypeScript](https://www.typescriptlang.org) | 5.7.2 | Static type checking across the entire codebase |

### Styling

| Technology | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | 3.4.19 | Utility-first CSS framework |
| [clsx](https://github.com/lukeed/clsx) | 2.1.1 | Conditional class name utility |
| [Heroicons](https://heroicons.com) | 2.2.0 | SVG icon library for React |

### Security & Validation

| Technology | Version | Purpose |
|---|---|---|
| [Helmet](https://helmetjs.github.io) | 8.0.0 | HTTP security headers |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.4.3 | Password hashing |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0.2 | JWT authentication |
| [Zod](https://zod.dev) | 3.23.8 | Schema validation |
| [Joi](https://joi.dev) | 17.13.3 | Object schema validation |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 7.4.1 | API rate limiting |
| [CORS](https://github.com/expressjs/cors) | 2.8.5 | Cross-origin resource sharing |

### Testing

| Technology | Version | Purpose |
|---|---|---|
| [Playwright](https://playwright.dev) | 1.58.2 | End-to-end and accessibility testing |
| [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) | 4.10.2 | Automated WCAG accessibility scanning |
| [Jest](https://jestjs.io) | 29.7.0 | Unit testing framework |
| [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) | 16.1.0 | Component testing utilities |

### Build & Tooling

| Technology | Purpose |
|---|---|
| [ESLint](https://eslint.org) | Linting with Next.js and security rules |
| [PostCSS](https://postcss.org) | CSS processing pipeline |
| [Autoprefixer](https://github.com/postcss/autoprefixer) | Vendor prefix automation |
| [Geist Font](https://vercel.com/font) | Optimized font loading via `next/font` |

---

## Project Structure

```
pizza-app/
├── .github/                  # GitHub Copilot agents, prompts, and skills
│   ├── agents/               # Copilot Chat agent definitions
│   ├── prompts/              # Reusable prompt files
│   └── skills/               # Custom Copilot skills
├── public/                   # Static assets
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx        # Root layout with metadata & providers
│   │   ├── page.tsx          # Home page — pizza menu & filtering
│   │   └── cart/page.tsx     # Shopping cart page
│   ├── components/           # React components
│   │   ├── layout/           # Navbar and layout components
│   │   ├── monitoring/       # Monitoring dashboard
│   │   ├── pizza/            # Pizza card component
│   │   └── ui/               # Reusable UI primitives (Badge, Button, Card)
│   ├── context/              # React Context providers (Cart, Order, User)
│   ├── data/                 # JSON data (pizzas, sizes, toppings, customers, orders)
│   ├── lib/                  # Utility functions, instrumentation, security helpers
│   └── types/                # TypeScript type definitions
├── WCAG-2.1-AA/              # WCAG 2.1 AA accessibility test suite
│   └── tests/                # Playwright accessibility tests
└── test-results/             # Test output and reports
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or later recommended)
- [npm](https://www.npmjs.com) (comes with Node.js)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pizza-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install Playwright browsers** (required for E2E and accessibility tests)

   ```bash
   npx playwright install
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the app.

The page auto-updates as you edit files. Start by modifying `src/app/page.tsx`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint on all TS/TSX/JS/JSX files |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run test:a11y` | Run all WCAG 2.1 AA accessibility tests |
| `npm run test:a11y:headed` | Run accessibility tests in headed browser mode |
| `npm run test:a11y:debug` | Run accessibility tests in debug mode |
| `npm run test:a11y:perceivable` | Run only Perceivable category tests |
| `npm run test:a11y:operable` | Run only Operable category tests |
| `npm run test:a11y:understandable` | Run only Understandable category tests |
| `npm run test:a11y:robust` | Run only Robust category tests |
| `npm run test:a11y:report` | View the Playwright HTML test report |
| `npm run test:security` | Run Playwright security tests |
| `npm run audit:security` | Run npm audit and supply-chain checks |
| `npm run type-check` | Run TypeScript compiler for type checking (no emit) |

---

## GitHub Copilot — Agents, Prompts & Skills

This project includes custom [GitHub Copilot](https://github.com/features/copilot) configuration files under the `.github/` directory to enhance AI-assisted development. These files provide domain-specific expertise directly inside VS Code's Copilot Chat.

### Agents

Agents are autonomous AI personas with specialized knowledge and tool access. They can analyze code, run commands, edit files, and execute multi-step workflows.

| Agent | File | Purpose |
|---|---|---|
| **Accessibility Expert** | [.github/agents/accessibility.md](.github/agents/accessibility.md) | WCAG 2.1 AA compliance specialist. Audits components for accessibility, generates testing plans, creates Playwright test suites with `@axe-core/playwright`, and provides remediation guidance covering all four WCAG principles (Perceivable, Operable, Understandable, Robust). |
| **Security Expert** | [.github/agents/security-expert.md](.github/agents/security-expert.md) | OWASP Top 10:2025 security analyst. Performs vulnerability assessments across all ten categories (Broken Access Control, Injection, Cryptographic Failures, etc.), classifies findings by severity, and delivers production-ready remediation code with CWE references. |

### Prompts

Prompts are reusable, task-specific instruction sets that guide Copilot through multi-step workflows when invoked.

| Prompt | File | Purpose |
|---|---|---|
| **Accessibility Testing Suite** | [.github/prompts/accessibility.prompt.md](.github/prompts/accessibility.prompt.md) | Generates a complete WCAG 2.1 AA compliance testing suite using Playwright. Walks through fetching the WCAG checklist, building a detailed testing plan, implementing test files with mandatory failure-reporting structure, validating coverage, and executing Perceivable category tests. |

### Skills

Skills teach Copilot how to perform specialized tasks that go beyond general coding, such as working with specific file formats.

| Skill | File | Purpose |
|---|---|---|
| **DOCX** | [.github/skills/docx/SKILL.md](.github/skills/docx/SKILL.md) | Enables Copilot to create, read, edit, and manipulate Word documents (`.docx` files). Supports generating reports, memos, and templates with formatting like tables of contents, headings, and page numbers. Uses `docx-js` for creation and XML manipulation for editing. Borrowed from [anthropics/skills](https://github.com/anthropics/skills/blob/main/skills/docx/SKILL.md). |

---

## Testing

### Unit Tests (Jest)

```bash
npm test
```

Runs Jest with `jsdom` environment and React Testing Library for component-level tests.

### Accessibility Tests (Playwright + axe-core)

The project includes a dedicated WCAG 2.1 AA test suite under `WCAG-2.1-AA/`. Tests are organized by the four WCAG principles:

1. **Perceivable** — text alternatives, captions, adaptable structure, color contrast
2. **Operable** — keyboard access, timing, navigation, input modalities
3. **Understandable** — readable content, predictable behavior, input assistance
4. **Robust** — compatible markup, ARIA usage, status messages

```bash
# Run all accessibility tests
npm run test:a11y

# Run a specific category
npm run test:a11y:perceivable

# View the HTML report after a test run
npm run test:a11y:report
```

### Security Tests

```bash
npm run test:security
npm run audit:security
```

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) — features and API reference
- [Learn Next.js](https://nextjs.org/learn) — interactive tutorial
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/) — Web Content Accessibility Guidelines
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/) — web application security risks
- [Playwright Docs](https://playwright.dev/docs/intro) — end-to-end testing

---
