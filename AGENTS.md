AI Instructions
​Architecture: Strictly single-file HTML. No separate .js or .css files.
​Dependencies: Use CDNs only (Tailwind, Chart.js, etc.).
​Tone: Technical but "vibe-oriented." Prioritize elegant UI and mobile responsiveness.
​Context: The user is a Google SE living in Park Slope; assume high technical literacy but low patience for boilerplate.
Coding Conventions & Engineering Standards
Style: Follow Google JavaScript Style Guide (naming conventions, documentation).
Typing: Since this is a single .html file, use JSDoc for type definitions. This allows VS Code (or github.dev) to provide TypeScript-like intellisense and type checking without a compilation step.
Modern JS: Use ES Modules, Optional Chaining (?.), Nullish Coalescing (??), and async/await. Avoid legacy patterns or var.
State Management: Use a simple reactive "Store" pattern (e.g., a proxy-based state object) rather than messy DOM manipulation.
Unit Testing: Implement a "Shadow Test Runner".
Include a runTests() function within a <script type="module"> block that executes when a ?test=true URL parameter is present.
Use basic console.assert or a tiny 10-line describe/it implementation embedded in the file.
Privacy: All data processing (Green Button XML/CSV) must happen locally in the browser. No data should ever be sent to a server.
