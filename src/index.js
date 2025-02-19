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
      content = `APP.md
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

      // Count tokens (using GPT-3.5-turbo's encoding)
      const enc = encodingForModel('gpt-3.5-turbo');
      // Build the Markdown output
      const outputLines = [];

      for (const file of files) {
        const absolutePath = path.join(process.cwd(), file);
        const content = await fs.readFile(absolutePath, 'utf-8');
        const language = getLanguageFromExtension(file);
        try {
          enc.encode(content);
          outputLines.push(`\`\`\`${language}`);
          // Add a comment with the file path for context
          outputLines.push(`// ${file}`);
          outputLines.push(content);
          outputLines.push('```');
          outputLines.push('');
        } catch (warn) {
          console.log(`Warning: Couldn't add \`${file}\`: ${warn}`);
        }
      }

      const finalMarkdown = outputLines.join('\n');

      // Write the final Markdown file
      await fs.writeFile(path.join(process.cwd(), outputFileName), finalMarkdown, 'utf-8');
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
