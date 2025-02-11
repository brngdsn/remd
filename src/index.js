// src/index.js
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import ignore from 'ignore';
import chalk from 'chalk';

const require = createRequire(import.meta.url);

/**
 * Recursively gathers file paths from the given directory.
 *
 * @param {string} dir - The directory to read.
 * @param {ignore.Ignore} ig - The ignore instance (parsed .gitignore patterns).
 * @param {string} rootDir - The root directory where the CLI was called.
 * @return {Promise<string[]>} - List of file paths.
 */
async function gatherFilePaths(dir, ig, rootDir) {
  let paths = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, entryPath);

    // Skip if .gitignore says to ignore
    if (ig.ignores(relativePath)) continue;

    if (entry.isDirectory()) {
      paths = paths.concat(await gatherFilePaths(entryPath, ig, rootDir));
    } else {
      paths.push(entryPath);
    }
  }

  return paths;
}

/**
 * Attempts to guess a language alias for markdown code fencing based on file extension.
 *
 * @param {string} filePath - The file path from which to guess the language.
 * @returns {string} - The detected language for code fences.
 */
function guessLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // Basic mapping for demonstration, can be expanded
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'js';
    case '.ts':
      return 'ts';
    case '.json':
      return 'json';
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.md':
      return 'markdown';
    case '.sh':
      return 'bash';
    case '.yml':
    case '.yaml':
      return 'yaml';
    default:
      return ''; // No specific language
  }
}

/**
 * Calculates an approximate token count by splitting on whitespace.
 *
 * @param {string} text - The text to analyze.
 * @returns {number} - The approximate number of tokens.
 */
function calculateTokens(text) {
  // A naive approach: split on whitespace
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Reads and parses .gitignore if present, returning an ignore instance.
 *
 * @param {string} rootDir - Root directory.
 * @returns {Promise<ignore.Ignore>} - The ignore instance with patterns loaded.
 */
async function parseGitIgnore(rootDir) {
  const ig = ignore();
  try {
    const gitIgnorePath = path.join(rootDir, '.gitignore');
    const gitIgnoreContent = await readFile(gitIgnorePath, 'utf-8');
    ig.add(gitIgnoreContent.split('\n').filter(Boolean));
  } catch {
    // .gitignore doesn't exist or can't be read; proceed without it
  }
  return ig;
}

/**
 * The main function that drives the REMD process.
 *
 * @param {Object} options
 * @param {string} options.rootDir - The directory to start reading files from.
 * @param {string} options.outputFilename - The name of the output markdown file.
 */
export async function main({ rootDir, outputFilename }) {
  const ig = await parseGitIgnore(rootDir);

  // Ensure the output file doesn't get included if it's in the directory
  ig.add(outputFilename);

  console.log(chalk.blue(`Reading files from: ${rootDir}`));

  // Gather all file paths
  const filePaths = await gatherFilePaths(rootDir, ig, rootDir);
  console.log(chalk.green(`Found ${filePaths.length} file(s) to process.`));

  // Compile the markdown content
  let markdownContent = '';
  for (const filePath of filePaths) {
    const relPath = path.relative(rootDir, filePath);
    const codeLang = guessLanguage(filePath);
    const fileData = await readFile(filePath, 'utf-8');

    markdownContent += `\`\`\`${codeLang}\n`;
    markdownContent += `// ${relPath}\n`;
    markdownContent += fileData;
    if (!fileData.endsWith('\n')) {
      markdownContent += '\n';
    }
    markdownContent += `\`\`\`\n\n`;
  }

  // Write the compiled content to the output file
  const outputPath = path.join(rootDir, outputFilename);
  await writeFile(outputPath, markdownContent, 'utf-8');

  // Calculate approximate tokens
  const tokenCount = calculateTokens(markdownContent);
  console.log(chalk.yellow(`\nSuccessfully created "${outputFilename}" with approximately ${tokenCount} tokens.`));
}

