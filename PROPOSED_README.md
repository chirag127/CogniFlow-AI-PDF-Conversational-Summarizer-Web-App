# ✨ CogniFlow AI ✨

[![CI/CD Pipeline](https://github.com/chirag127/CogniFlow-AI-PDF-Conversational-Summarizer-Web-App/actions/workflows/ci.yml/badge.svg)](https://github.com/chirag127/CogniFlow-AI-PDF-Conversational-Summarizer-Web-App/actions/workflows/ci.yml)
[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![GitHub stars](https://img.shields.io/github/stars/chirag127/CogniFlow-AI-PDF-Conversational-Summarizer-Web-App.svg?style=social&label=Star)](https://github.com/chirag127/CogniFlow-AI-PDF-Conversational-Summarizer-Web-App)

**Transform dense PDFs into clear, conversational audio with the power of AI.**

CogniFlow AI is a modern web application designed to make information more accessible. It ingests PDF documents and uses the cutting-edge Cerebras Inference API to convert complex text into a natural, easy-to-understand format suitable for Text-to-Speech (TTS) systems.

## 🚀 Features

- **🧠 AI-Powered Transformation**: Leverages large language models to simplify and clarify technical content.
- **✂️ Smart Chunking**: Breaks down large documents into manageable pieces for reliable processing.
- **⚡ Concurrent Processing**: Utilizes a "Turbo Mode" for parallel processing of document chunks.
- **🔄 Model Fallback**: Automatically retries with different models to ensure high availability.
- **📄 PDF Output**: Generates a new, easy-to-read PDF with the transformed text.
- **🔐 Secure & Private**: All processing is done in your browser; your files and API keys never leave your machine.
- **Modern UI**: A clean, responsive, and intuitive interface built with React and Tailwind CSS.

## 🏛️ Architecture

```
/
├── .github/              # CI/CD workflows and templates
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Modules for external services (AI, PDF, storage)
│   ├── styles/           # Global styles and Tailwind config
│   ├── types/            # TypeScript type definitions
│   └── ...               # App entrypoint and main files
├── .gitignore
├── AGENTS.md             # Directives for AI agents
├── LICENSE
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- A [Cerebras API Key](https://www.cerebras.net/sign-up-for-free-access-to-the-cerebras-software-platform/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/chirag127/CogniFlow-AI-PDF-Conversational-Summarizer-Web-App.git
    cd CogniFlow-AI-PDF-Conversational-Summarizer-Web-App
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your API key:**
    - The application will prompt you for your Cerebras API key in the settings panel. This key is stored securely in your browser's local storage and is never transmitted to any server.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 📜 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Enjoying CogniFlow AI?</b> Give it a star to show your support! ⭐
</p>
