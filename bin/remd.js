#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import chalk from 'chalk';
import pkg from 'ignore';
const { createIgnore } = pkg;

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
  '.sh': 'bash'
};

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
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Recursively scan the provided directory, respecting .gitignore if present.
 *
 * @param {string} startDir - The directory to start reading from.
 * @returns {Promise<string[]>} - Array of file paths (relative).
 */
async function scanDirectory(startDir) {
  let gitignoreContent = '';
  try {
    // Attempt to read .gitignore from the start directory
    const gitignorePath = path.join(startDir, '.gitignore');
    gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
  } catch {
    // If there's no .gitignore, ignore silently
  }

  // Create an ignore instance based on .gitignore
  const ig = createIgnore().add(gitignoreContent);

  const filesList = [];

  async function recurse(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(startDir, fullPath);

      // If the path is ignored by .gitignore, skip it
      if (ig.ignores(relPath)) {
        continue;
      }

      // If it's a directory, recurse deeper
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

async function main() {
  try {
    // Grab CLI argument if provided, default to 'APP.md'
    const outputFileName = process.argv[2] || 'APP.md';
    const currentDir = process.cwd();

    // Recursively collect all files in the current directory, respecting .gitignore
    const allFiles = await scanDirectory(currentDir);

    // Prepare the final markdown content
    let combinedMarkdown = '';

    for (const file of allFiles) {
      const filePath = path.join(currentDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const language = guessLanguage(filePath);

        combinedMarkdown += `\n\`\`\`${language}\n`;
        combinedMarkdown += `// ${file}\n`;
        combinedMarkdown += `${content}\n`;
        combinedMarkdown += '```\n';
      } catch {
        // If file read fails, skip it
      }
    }

    // Calculate tokens from the final combined markdown
    const totalTokens = countTokens(combinedMarkdown);

    // Write to the specified output markdown file
    await fs.writeFile(path.join(currentDir, outputFileName), combinedMarkdown, 'utf8');

    // Log results
    console.log(chalk.green(`Successfully created ${outputFileName}`));
    console.log(chalk.blue(`Token count: ${totalTokens}`));
  } catch (err) {
    console.error(chalk.red('An error occurred:'), err);
    process.exit(1);
  }
}

main();

