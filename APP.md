```
// .gitignore
node_modules/
.env


```

```
// .nvmrc
v20.8.0


```

```
// .remdignore
*.png
*.svg
*.ico
.git/
*-lock.*
LICENSE
*.otf
*.pdf
mail_body
chromedriver
.next/
.vercel/
APP.md

```

```json
// package.json
{
  "name": "@brngdsn/remd",
  "version": "0.3.0",
  "description": "A CLI tool to recursively compile files into a single markdown file.",
  "type": "module",
  "bin": {
    "remd": "./bin/remd.js"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/brngdsn/remd.git"
  },
  "scripts": {
    "start": "node ./bin/remd.js"
  },
  "bugs": {
    "url": "https://github.com/brngdsn/remd/issues"
  },
  "homepage": "https://github.com/brngdsn/remd#readme",
  "dependencies": {
    "chalk": "^5.2.0",
    "commander": "^13.1.0",
    "fast-glob": "^3.3.3",
    "ignore": "^5.2.0",
    "tiktoken": "^1.0.20"
  },
  "engines": {
    "node": ">=20.8.0"
  }
}

```

```markdown
// README.md
# remd

**remd** is a CLI tool designed for AI web-based development that allows you to quickly compile your entire project into a single Markdown file. This unified file is perfect for providing complete project context when working with AI tools.

---

## Features

- **Recursive Compilation**: Gathers all project files (excluding those specified in your `.gitignore` and additional default ignore rules) into one Markdown document.
- **Syntax Highlighting**: Automatically infers and applies code fence languages based on file extensions.
- **Token Counting**: Uses [tiktoken](https://www.npmjs.com/package/tiktoken) to count the number of tokens in the generated Markdown, useful for context size estimation.
- **Easy CLI Usage**: Run the tool from your terminal with a simple command.

---

## Installation

Ensure you have Node.js version **>= 20.8.0** installed.

You can install **remd** globally via npm:

```bash
npm install -g @brngdsn/remd
```

Or run it directly with npx:

```bash
npx @brngdsn/remd [outputFileName]
```

---

## Usage

Run the following command from your project directory:

```bash
remd [outputFileName]
```

- **outputFileName** (optional): The name of the Markdown file to generate. Defaults to `APP.md` if not provided.

For example, to generate a file named `project-context.md`:

```bash
remd project-context.md
```

**What It Does:**

1. **Reads Ignore Patterns**: The tool checks your `.gitignore` (if present) and applies additional default ignore rules (like image files, lock files, etc.).
2. **Collects Files**: It recursively scans your project for all files (while respecting ignore rules).
3. **Generates Markdown**: Each file's content is wrapped in a code fence with the correct language identifier (determined by the file extension) and prefixed with a comment indicating the file path.
4. **Counts Tokens**: After assembling the Markdown content, it counts the tokens using tiktoken.
5. **Writes Output**: The final Markdown file is saved to your current directory.

---

## Example Output

A snippet of the generated Markdown might look like:

```js
// src/index.js
import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
// ...
```

Each section in the Markdown file corresponds to a file from your project, making it easy to navigate and review your entire codebase in one document.

---

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request. For any issues, please open an issue on [GitHub](https://github.com/brngdsn/remd/issues).

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- Built with [Chalk](https://www.npmjs.com/package/chalk) for colorful terminal output.
- Utilizes [fast-glob](https://www.npmjs.com/package/fast-glob) for efficient file searching.
- Powered by [tiktoken](https://www.npmjs.com/package/tiktoken) for token counting.

---

Happy coding!
```

```js
// bin/remd.js
#!/usr/bin/env node
import '../src/index.js';


```

```js
// src/index.js
import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import ignore from 'ignore';
import fg from 'fast-glob';
import tiktoken from 'tiktoken';
import { Command } from 'commander';
const { encoding_for_model: encodingForModel } = tiktoken;

const program = new Command();

program
  .name('remd')
  .description('Compile source code files into a Markdown document and manage ignore rules.')
  .version('1.0.0');

// "init" subcommand to create a .remdignore file
program
  .command('init')
  .description('Initialize a .remdignore file')
  .option('-d, --default', 'Include default ignore patterns')
  .action(async (options) => {
    const remdIgnorePath = path.join(process.cwd(), '.remdignore');
    let content = '';
    if (options.default) {
      content = `*.png
*.svg
*.ico
.git/
*-lock.*
LICENSE
*.otf
*.pdf
mail_body
chromedriver
.next/
.vercel/
`;
    }
    try {
      await fs.writeFile(remdIgnorePath, content, 'utf-8');
      console.log(
        chalk.green(
          `✔ .remdignore file created${options.default ? ' with default ignore patterns' : ''}.`
        )
      );
    } catch (error) {
      console.error(chalk.red('An error occurred while creating .remdignore:'), error);
      process.exit(1);
    }
  });

// Default action: compile files into a Markdown document.
// Accepts an optional output file name argument (defaults to "APP.md").
program
  .argument('[outputFileName]', 'Output Markdown file name', 'APP.md')
  .action(async (outputFileName) => {
    try {
      // Prepare ignore parser with .gitignore (if exists)
      const ig = ignore();
      try {
        const ignorePath = path.join(process.cwd(), '.gitignore');
        const ignoreContent = await fs.readFile(ignorePath, 'utf-8');
        ig.add(ignoreContent);
      } catch {
        // No .gitignore or unable to read it; ignoring silently
      }

      // Also check for .remdignore and add its rules if available
      try {
        const remdIgnorePath = path.join(process.cwd(), '.remdignore');
        const remdIgnoreContent = await fs.readFile(remdIgnorePath, 'utf-8');
        ig.add(remdIgnoreContent);
      } catch {
        // No .remdignore or unable to read it; ignoring silently
      }

      // Gather all files (including dotfiles)
      const allPaths = await fg(['**/*'], { dot: true, cwd: process.cwd() });
      const files = [];

      // Check each file against ignore rules and for directory status
      for (const filePath of allPaths) {
        if (!ig.ignores(filePath)) {
          const absolutePath = path.join(process.cwd(), filePath);
          const stats = await fs.stat(absolutePath);
          if (stats.isFile()) {
            files.push(filePath);
          }
        }
      }

      // Helper to determine code fence language from file extension
      const extensionToLanguage = {
        js: 'js',
        jsx: 'jsx',
        ts: 'ts',
        tsx: 'tsx',
        py: 'python',
        sh: 'bash',
        html: 'html',
        css: 'css',
        json: 'json',
        md: 'markdown',
        yml: 'yaml',
        yaml: 'yaml',
        c: 'c',
        cpp: 'cpp',
        go: 'go',
        rs: 'rust'
      };

      function getLanguageFromExtension(file) {
        const ext = path.extname(file).slice(1).toLowerCase();
        return extensionToLanguage[ext] || '';
      }

      // Build the Markdown output
      const outputLines = [];

      for (const file of files) {
        const absolutePath = path.join(process.cwd(), file);
        const content = await fs.readFile(absolutePath, 'utf-8');
        const language = getLanguageFromExtension(file);

        outputLines.push(`\`\`\`${language}`);
        // Add a comment with the file path for context
        outputLines.push(`// ${file}`);
        outputLines.push(content);
        outputLines.push('```');
        outputLines.push('');
      }

      const finalMarkdown = outputLines.join('\n');

      // Write the final Markdown file
      await fs.writeFile(path.join(process.cwd(), outputFileName), finalMarkdown, 'utf-8');

      // Count tokens (using GPT-3.5-turbo's encoding)
      const enc = encodingForModel('gpt-3.5-turbo');
      const tokenCount = enc.encode(finalMarkdown).length;

      // Log success
      console.log(
        chalk.green(`✔ Successfully compiled into "${outputFileName}" with ${tokenCount} tokens.`)
      );
    } catch (error) {
      console.error(chalk.red('An error occurred while running remd:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);

```
