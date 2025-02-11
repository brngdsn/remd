#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import chalk from 'chalk';

/**
 * A map of file extensions to syntax highlight languages for code fences.
 */
const extensionToLanguageMap = {
  '.js': 'js',
  '.ts': 'ts',
  '.jsx': 'jsx',
  '.tsx': 'tsx',
  '.json': 'json',
  '.css': 'css',
  '.html': 'html',
  '.md': 'md',
  '.sh': 'bash',
  // Add more if desired
};

/**
 * Recursively scan the current directory (or specified dir)
 * while ignoring certain folders/files.
 *
 * @param {string} startDir - The directory to start reading from.
 * @returns {Promise<string[]>} - Array of file paths (relative).
 */
async function scanDirectory(startDir) {
  const ignoreList = new Set(['node_modules', '.git', '.DS_Store']);
  const filesList = [];

  async function recurse(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (ignoreList.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(startDir, fullPath);

      if (entry.isDirectory()) {
        await recurse(fullPath);
      } else {
        filesList.push(relPath);
      }
    }
  }

  await recurse(startDir);
  return filesList;
}

/**
 * Guess the code fence language from the file extension.
 *
 * @param {string} filePath - The file path.
 * @returns {string} - The language for the fenced code block.
 */
function guessLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return extensionToLanguageMap[ext] || '';
}

/**
 * A basic token counter using whitespace splitting across the entire content.
 * This is a naive approach, but it approximates the number of tokens in the output.
 *
 * @param {string} text
 * @returns {number}
 */
function countTokens(text) {
  return text
    // Split on any kind of whitespace or control characters
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  try {
    // Grab first CLI argument if provided, default to 'APP.md'
    const outputFileName = process.argv[2] || 'APP.md';
    const currentDir = process.cwd();

    // Recursively collect all files in the current directory
    const allFiles = await scanDirectory(currentDir);

    // Prepare the final markdown content
    let combinedMarkdown = '';

    for (const file of allFiles) {
      const filePath = path.join(currentDir, file);

      // Attempt to read file content as UTF-8
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const language = guessLanguage(filePath);

        combinedMarkdown += `\n\`\`\`${language}\n`;
        combinedMarkdown += `// ${file}\n`;
        combinedMarkdown += `${content}\n`;
        combinedMarkdown += '```\n';
      } catch {
        // If we fail to read the file (binary, permission, etc.), skip silently
      }
    }

    // Calculate tokens from the final combined markdown
    const totalTokens = countTokens(combinedMarkdown);

    // Write to the specified output markdown file
    await fs.writeFile(path.join(currentDir, outputFileName), combinedMarkdown, 'utf8');

    // Log result
    console.log(chalk.green(`Successfully created ${outputFileName}`));
    console.log(chalk.blue(`Token count: ${totalTokens}`));
  } catch (err) {
    console.error(chalk.red('An error occurred:'), err);
    process.exit(1);
  }
}

main();

