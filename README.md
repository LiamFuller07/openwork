# OpenWork

<div align="center">

![OpenWork Logo](docs/assets/logo.svg)

**Open-source alternative to Claude Cowork**

*Universal AI agent platform for everyone*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-33-9FEAF9.svg)](https://www.electronjs.org/)

[Getting Started](#getting-started) • [Features](#features) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## What is OpenWork?

OpenWork is a **100% open-source** AI agent platform that lets non-technical users complete tasks like developers use Claude Code, Codex, or Gemini CLI. Think of it as "Claude Cowork" but:

- **Open Source** - MIT licensed, fork and customize freely
- **Model Agnostic** - Use Claude, GPT, Gemini, or local Ollama models
- **SDK Pluggable** - Integrate any agent SDK (Claude Agent SDK, Gemini CLI, OpenAI Codex)
- **Self-Hostable** - Run entirely on your own infrastructure

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **File Management** | Read, write, edit files in a sandboxed directory |
| **Task Planning** | AI breaks down complex requests into actionable subtasks |
| **Progress Tracking** | Visual checklist showing real-time task completion |
| **Browser Automation** | Complete web tasks using browser-use + Playwright |
| **MCP Connectors** | Connect to Google Calendar, Slack, Notion, and more |

### Quick Actions

Get started instantly with pre-built task templates:

- 📄 **Create a file** - Generate documents, spreadsheets, presentations
- 📊 **Crunch data** - Analyze files, extract insights, create summaries
- 🎨 **Make a prototype** - Design mockups and wireframes
- 📅 **Prep for the day** - Review calendar, summarize meetings
- 📁 **Organize files** - Sort, rename, categorize documents
- ✉️ **Send a message** - Draft and send emails or messages

### Supported AI Providers

| Provider | Models | Status |
|----------|--------|--------|
| **Anthropic Claude** | claude-sonnet-4, claude-opus-4.5 | ✅ Full Support |
| **Google Gemini** | gemini-2.5-pro, gemini-3-pro | ✅ Full Support |
| **OpenAI** | gpt-5, gpt-5-codex, o3 | ✅ Full Support |
| **Ollama (Local)** | llama3.3, qwen2.5, deepseek-r1 | ✅ Full Support |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- API key for at least one provider (or Ollama for local models)

### Installation

```bash
# Clone the repository
git clone https://github.com/openwork-ai/openwork.git
cd openwork

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start the desktop app
pnpm dev:desktop
```

### Quick Start

1. **Launch OpenWork** - Open the desktop application
2. **Select a folder** - Choose a working directory for your files
3. **Pick a provider** - Select Claude, Gemini, OpenAI, or Ollama
4. **Start working** - Use quick actions or type your own task

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        OpenWork Desktop App                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React/Electron Frontend                  │  │
│  │  ┌──────────┐  ┌─────────────────┐  ┌──────────────────┐  │  │
│  │  │  File    │  │  Task Engine    │  │   Context        │  │  │
│  │  │  Browser │  │  + Progress UI  │  │   Manager        │  │  │
│  │  └──────────┘  └─────────────────┘  └──────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              OpenWork Core (TypeScript)                     │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │              Agent Orchestrator                       │  │  │
│  │  │  - Task planning & decomposition                      │  │  │
│  │  │  - Tool selection & execution                         │  │  │
│  │  │  - Progress tracking & reporting                      │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              SDK Integration Layer                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │
│  │  │ Claude   │ │ Gemini   │ │ OpenAI   │ │ Local/Ollama │   │  │
│  │  │ Agent SDK│ │ CLI      │ │ Codex    │ │ Models       │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
openwork/
├── apps/
│   ├── desktop/          # Electron desktop application
│   └── web/              # Web version (optional)
├── packages/
│   ├── core/             # Agent orchestration engine
│   ├── file-tools/       # Sandboxed file operations
│   ├── browser-tools/    # Browser automation (browser-use)
│   ├── sdk-adapters/     # Multi-provider SDK adapters
│   ├── mcp-connectors/   # MCP server integrations
│   └── ui/               # Shared UI components
├── docs/                 # Documentation
└── scripts/              # Build and release scripts
```

## Documentation

- [Getting Started Guide](docs/getting-started.md)
- [SDK Integration](docs/sdk-integration.md)
- [API Reference](docs/api-reference.md)
- [Contributing Guide](CONTRIBUTING.md)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development

```bash
# Run all packages in dev mode
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Type check
pnpm typecheck
```

## Comparison with Claude Cowork

| Feature | Claude Cowork | OpenWork |
|---------|---------------|----------|
| License | Proprietary | MIT (Open Source) |
| Price | Claude Max ($200/mo) | Free |
| Models | Claude only | Any (Claude, GPT, Gemini, Local) |
| Self-hosting | No | Yes |
| Customization | Limited | Full source access |
| MCP Support | Yes | Yes |
| Browser Automation | Claude in Chrome | browser-use + Playwright |

## Acknowledgments

OpenWork builds upon the amazing work of:

- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) - Anthropic
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google
- [OpenAI Codex](https://github.com/openai/codex) - OpenAI
- [browser-use](https://github.com/browser-use/browser-use) - Browser automation for AI
- [Playwright](https://playwright.dev/) - Microsoft

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[Star us on GitHub](https://github.com/openwork-ai/openwork)** ⭐

Built with ❤️ by the OpenWork community

</div>
