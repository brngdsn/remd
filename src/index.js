import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
import ignore from 'ignore';
import fg from 'fast-glob';
import tiktoken from 'tiktoken';
const { encoding_for_model: encodingForModel } = tiktoken;

const [,, outputFileNameArg] = process.argv;
const outputFileName = outputFileNameArg || 'APP.md';

try {
  // Prepare .gitignore parser
  const ig = ignore();
  try {
    const ignorePath = path.join(process.cwd(), '.gitignore');
    const ignoreContent = await fs.readFile(ignorePath, 'utf-8');
    ig.add(ignoreContent);
    ig.add(`*.png`);
    ig.add(`*.svg`);
    ig.add(`*.ico`);
    ig.add(`.git`);
    ig.add(`*-lock.*`);
    ig.add(`LICENSE`);
    ig.add(`*.otf`);
    ig.add(`*.pdf`);
    ig.add(`mail_body`);
    ig.add(`chromedriver`);
  } catch {
    // No .gitignore or unable to read it; ignoring silently
  }

  // Gather all files
  const allPaths = await fg(['**/*'], { dot: true, cwd: process.cwd() });
  const files = [];

  // Check each file against .gitignore and for directory status
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

  // Build output markdown
  const outputLines = [];

  for (const file of files) {
    const absolutePath = path.join(process.cwd(), file);
    const content = await fs.readFile(absolutePath, 'utf-8');
    const language = getLanguageFromExtension(file);

    outputLines.push(`\`\`\`${language}`);
    // Comment with the file path (for context)
    // If you prefer comment syntax for non-js languages, you could adjust dynamically
    outputLines.push(`// ${file}`);
    outputLines.push(content);
    outputLines.push('```');
    outputLines.push('');
  }

  const finalMarkdown = outputLines.join('\n');

  // Write the final Markdown file
  await fs.writeFile(path.join(process.cwd(), outputFileName), finalMarkdown, 'utf-8');

  // Count tokens
  const enc = encodingForModel('gpt-3.5-turbo'); // or another available model
  const tokenCount = enc.encode(finalMarkdown).length;

  // Log success
  console.log(chalk.green(`✔ Successfully compiled into "${outputFileName}" with ${tokenCount} tokens.`));
} catch (error) {
  console.error(chalk.red('An error occurred while running remd:'), error);
  process.exit(1);
}

