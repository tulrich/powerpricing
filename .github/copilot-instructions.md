# GitHub Copilot Instructions for PowerPricing

## Project Overview
PowerPricing is an electricity bill estimator app for comparing ConEd NYC rate plans (Standard vs Select Pricing Plan). It's a single-file HTML application designed to help users understand complex time-of-use pricing structures, particularly beneficial for heat pump users.

## Architecture Constraints
- **Single-File HTML**: Strictly maintain `index.html` as the single source file. No separate `.js` or `.css` files.
- **Dependencies**: Use CDNs only (Tailwind CSS, Chart.js, JSZip, etc.). Never introduce build tools or npm dependencies for runtime.
- **Privacy-First**: All data processing (Green Button XML/CSV) must happen locally in the browser. Never send user data to servers.

## Code Style & Standards
- **Style Guide**: Follow Google JavaScript Style Guide for naming conventions and documentation.
- **Modern JavaScript**: Use ES Modules, Optional Chaining (`?.`), Nullish Coalescing (`??`), and `async/await`. Avoid legacy patterns like `var`.
- **Type Annotations**: Use JSDoc for type definitions to enable TypeScript-like intellisense in VS Code/github.dev without compilation.
- **State Management**: Use a simple reactive "Store" pattern (proxy-based state object) rather than direct DOM manipulation.

## Testing
- **Unit Tests**: Run via `npm test`, which extracts and tests logic from `index.html`.
- **Test Files**:
  - `test/prepare.js`: Extracts `<script>` content from `index.html`
  - `test/unit/calculations.test.js`: Unit tests for billing calculations
- Always ensure new logic includes corresponding unit tests.

## UI/UX Guidelines
- **Design Tone**: Technical but "vibe-oriented" - prioritize elegant UI and mobile responsiveness.
- **Mobile-First**: Design should work seamlessly on small screens.
- **Minimal Boilerplate**: Keep code concise; avoid unnecessary abstractions.

## Development Workflow
1. **Before Changes**: Always read `index.html` first to understand current implementation.
2. **Testing**: Run `npm test` after making changes to verify calculations.
3. **Incremental**: Make small, focused changes and test frequently.

## Key Technical Context
- Target user: Google SWE with high technical literacy but low patience for boilerplate.
- Rate plans: ConEd Standard (Rate I) vs Select Pricing Plan (Rate IV - Rider Z).
- Data sources: Green Button XML/CSV exports from ConEd, including usage and demand data.
- State structure:
  - `monthManualData`: Manual input per month
  - `monthSourcePref`: Source preference ('auto', 'manual', 'upload')
  - `uploadUpdatedAt`: Timestamp tracking for upload freshness

## Repository Structure
- `index.html`: Main application file (single-file HTML app)
- `README.md`: User documentation and development instructions
- `AGENTS.md`: AI coding conventions (reference but don't duplicate)
- `test/`: Unit test infrastructure using vitest
- `package.json`: Dev dependencies only (vitest for testing)

## Common Tasks
- **Updating Calculations**: Modify logic in `<script>` section of `index.html`, update JSDoc types, add unit tests.
- **UI Changes**: Edit inline styles or Tailwind classes in HTML section.
- **Data Processing**: Enhance XML/CSV parsing in JavaScript section, ensure privacy (no server calls).

## What NOT to Do
- Don't create separate JavaScript or CSS files.
- Don't add build tools, bundlers, or compilation steps for production code.
- Don't send user data to external services.
- Don't add heavyweight dependencies - keep it simple and CDN-based.
- Don't ignore the existing unit test infrastructure.
