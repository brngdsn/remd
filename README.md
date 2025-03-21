<div align="center">
<h1 align="center">
<img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" width="100" />
<br>remd</h1>
<h3>◦ A CLI tool to recursively compile files into a single Markdown file.</h3>
<h3>◦ Developed with modern Node.js frameworks and tools.</h3>

<p align="center">
<img src="https://img.shields.io/github/license/brngdsn/remd?style=flat-square&color=5D6D7E" alt="GitHub license" />
<img src="https://img.shields.io/github/last-commit/brngdsn/remd?style=flat-square&color=5D6D7E" alt="git-last-commit" />
<img src="https://img.shields.io/github/languages/top/brngdsn/remd?style=flat-square&color=5D6D7E" alt="GitHub top language" />
<img src="https://img.shields.io/github/languages/count/brngdsn/remd?style=flat-square&color=5D6D7E" alt="GitHub repo language count" />
<img src="https://img.shields.io/github/repo-size/brngdsn/remd?style=flat-square&color=5D6D7E" alt="GitHub repo size" />
</p>
<p align="center">
<img src="https://img.shields.io/badge/Node.js-68A063.svg?style=flat-square&logo=Node.js&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/CLI-722E19.svg?style=flat-square" alt="CLI" />
<img src="https://img.shields.io/badge/Chalk-5F6AB6.svg?style=flat-square&logo=Chalk&logoColor=white" alt="Chalk" />
<img src="https://img.shields.io/badge/Commander-6C5B7A.svg?style=flat-square&logo=Commander&logoColor=white" alt="Commander" />
<img src="https://img.shields.io/badge/fast-glob-FFBA00.svg?style=flat-square&logo=fast-glob&logoColor=black" alt="fast-glob" />
<img src="https://img.shields.io/badge/tiktoken-FF8C00.svg?style=flat-square&logo=tiktoken&logoColor=black" alt="tiktoken" />
</p>
</div>

---

## 📖 About the Project

**remd** is a CLI tool designed for AI web-based development that allows you to quickly compile your entire project into a single Markdown file. This unified file is perfect for providing complete project context when working with AI tools. 🧠📄

---

## ✨ Features

- 🔍 **Recursive Compilation**: Gathers all project files (excluding those specified in your `.gitignore` and additional ignore rules) into one Markdown document.
- 🎨 **Syntax Highlighting**: Automatically infers and applies code fence languages based on file extensions.
- 🔢 **Token Counting**: Uses [tiktoken](https://www.npmjs.com/package/tiktoken) to count the number of tokens in the generated Markdown, useful for context size estimation.
- 💻 **Easy CLI Usage**: Run the tool from your terminal with a simple command.
- 🛠️ **Ignore Configuration**: Easily create and manage a `.remdignore` file with a dedicated subcommand (`init`) to add custom or default ignore patterns.

---

## 📥 Installation

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

## 🚀 Usage

### 📌 Compiling Your Project

Run the following command from your project directory:

```bash
remd [outputFileName]
```

- **outputFileName** (optional): The name of the Markdown file to generate. Defaults to `APP.md` if not provided.

For example, to generate a file named `project-context.md`:

```bash
remd project-context.md
```

**🔧 What It Does:**

1. 📜 **Reads Ignore Patterns**: The tool checks your `.gitignore` (if present) and applies additional ignore rules from `.remdignore` (if available).
2. 📂 **Collects Files**: It recursively scans your project for all files (while respecting ignore rules).
3. 📝 **Generates Markdown**: Each file's content is wrapped in a code fence with the correct language identifier (determined by the file extension) and prefixed with a comment indicating the file path.
4. 🔢 **Counts Tokens**: After assembling the Markdown content, it counts the tokens using tiktoken.
5. 💾 **Writes Output**: The final Markdown file is saved to your current directory.

### ⚙️ Initializing Ignore Rules

The `init` subcommand allows you to create a `.remdignore` file in your project directory to specify additional ignore rules. This is particularly useful for excluding files that you don't want to include in the generated Markdown.

**📌 Usage:**

- **Create an empty `.remdignore` file:**  

  ```bash
  remd init
  ```

- **Create a `.remdignore` file with default ignore patterns:**  

  ```bash
  remd init -d
  ```

**📜 Default Ignore Patterns (with `-d` or `--default` flag):**  

```txt
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
```

---

## 📂 Example Output

A snippet of the generated Markdown might look like:

```js
// src/index.js
import path from 'node:path';
import { promises as fs } from 'node:fs';
import chalk from 'chalk';
// ...
```

Each section in the Markdown file corresponds to a file from your project, making it easy to navigate and review your entire codebase in one document. 📖

---

## 🤝 Contributing

Contributions are welcome! 🎉 If you'd like to contribute, please fork the repository and submit a pull request. For any issues, please open an issue on [GitHub](https://github.com/brngdsn/remd/issues).  

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🏆 Acknowledgements

- 🎨 Built with [Chalk](https://www.npmjs.com/package/chalk) for colorful terminal output.
- ⚡ Utilizes [fast-glob](https://www.npmjs.com/package/fast-glob) for efficient file searching.
- 🔢 Powered by [tiktoken](https://www.npmjs.com/package/tiktoken) for token counting.
- 🛠️ CLI commands managed with [Commander](https://www.npmjs.com/package/commander).

---

🎉 **Happy coding!** 🚀  