// bin/remd
#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { main } from '../src/index.js';

// Entry point for the CLI.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  try {
    // Collect CLI arguments, ignoring the first two (node + script path).
    const args = process.argv.slice(2);

    // If a custom markdown filename is passed, use it; otherwise, default to 'APP.md'.
    const outputFilename = args[0] || 'APP.md';

    await main({
      rootDir: process.cwd(),
      outputFilename
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

