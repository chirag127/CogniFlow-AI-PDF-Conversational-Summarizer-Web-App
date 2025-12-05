# Contributing to FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App

Thank you for considering contributing to `FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App`! We welcome contributions from the community to make this project even better.

## 1. Code of Conduct

This project adheres to the Contributor Covenant Code of Conduct. Please review our [CODE_OF_CONDUCT.md](https://github.com/chirag127/FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App/blob/main/CODE_OF_CONDUCT.md) to understand what behaviors are expected and unacceptable.

## 2. How to Contribute

We accept contributions in the form of:

*   **Bug Reports:** Please report any bugs you find using the provided issue template.
*   **Feature Requests:** Suggest new features or improvements.
*   **Code Contributions:** Submit pull requests for bug fixes or new features.
*   **Documentation Improvements:** Help us improve our documentation.

### 2.1. Setting Up Your Development Environment

To contribute code, you'll need to set up your local development environment. This project uses a TypeScript/Vite stack.

1.  **Clone the repository:**
    bash
    git clone https://github.com/chirag127/FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App.git
    cd FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App
    

2.  **Install dependencies:**
    bash
    npm install
    # or
    yarn install
    

3.  **Run the development server:**
    bash
    npm run dev
    # or
    yarn dev
    

## 3. Development Workflow

We follow a standard GitHub pull request workflow:

1.  **Fork the repository:** Create your own fork of the `chirag127/FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App` repository.
2.  **Create a new branch:** Make your changes on a new branch with a descriptive name (e.g., `feature/add-new-audio-format` or `fix/pdf-parsing-error`).
    bash
    git checkout -b my-new-feature
    
3.  **Make your changes:** Implement your bug fix or new feature.
4.  **Test your changes:** Ensure your changes are well-tested. Run the linters, formatters, and tests:
    *   **Linting & Formatting:** This project uses Biome. Run `npm run lint:fix` or `yarn lint:fix` to format and fix linting issues.
    *   **Unit Tests:** Run `npm run test` or `yarn test` to execute the unit tests.
    *   **E2E Tests (if applicable):** Follow instructions in the README for E2E testing.
5.  **Commit your changes:** Write clear, concise commit messages.
    bash
    git add .
    git commit -m "feat: Add support for MP3 audio output"
    
6.  **Push to your fork:** Push your branch to your fork on GitHub.
    bash
    git push origin my-new-feature
    
7.  **Open a Pull Request:** Go to the original repository (`chirag127/FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App`) and open a pull request from your branch.

## 4. AI Agent Directives (`AGENTS.md`)

For detailed guidance on the AI agents and architectural principles governing this project, please refer to the [AGENTS.md](https://github.com/chirag127/FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App/blob/main/AGENTS.md) file. This document outlines the project's technology stack (TypeScript, Vite, TailwindCSS, Tauri, Biome, Vitest, Playwright), architectural patterns (Feature-Sliced Design), and AI integration strategies.

## 5. Coding Standards

*   **Language:** TypeScript (Strict Mode enabled).
*   **Formatting & Linting:** Biome is used for consistent code style and quality.
*   **Architecture:** Feature-Sliced Design (FSD) is the preferred architectural pattern.
*   **Testing:** Vitest for unit tests, Playwright for E2E tests.
*   **Commit Messages:** Follow the Conventional Commits specification.

## 6. Submitting Issues

When reporting an issue, please provide as much detail as possible:

*   A clear and concise description of the problem.
*   Steps to reproduce the issue.
*   Environment details (browser, OS, etc.).
*   Screenshots or error logs if applicable.

## 7. Thank You!

We appreciate your effort in contributing to `FluentReader-AI-Powered-PDF-To-Audio-Converter-Web-App`! Your contributions help us build a more accessible and powerful tool.
