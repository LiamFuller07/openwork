# OpenWork

<div align="center">

**AI-powered task automation for everyone**

Complete tasks like developers use Claude Code, Codex, or Gemini CLI - but with a friendly interface designed for non-technical users.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-33-9FEAF9.svg)](https://www.electronjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Quick Start](#quick-start) | [Features](#features) | [Documentation](#documentation) | [Contributing](#contributing)

</div>

---

## Why OpenWork?

**Problem:** Powerful AI coding tools like Claude Code, Codex, and Gemini CLI are built for developers. Non-technical users miss out on AI-powered task automation.

**Solution:** OpenWork brings the same power to everyone through a simple desktop app.

| Feature | Claude Cowork | OpenWork |
|---------|---------------|----------|
| License | Proprietary | **MIT (Open Source)** |
| Price | $200/month | **Free** |
| Models | Claude only | **Any provider** (Claude, GPT, Gemini, Local) |
| Self-hosting | No | **Yes** |
| Customization | Limited | **Full source access** |

## Quick Start

Get running in under 2 minutes:

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation) (`npm install -g pnpm`)
- API key from any provider (or use [Ollama](https://ollama.ai/) for free local models)

### Install and Run

```bash
# Clone the repo
git clone https://github.com/openwork-ai/openwork.git
cd openwork

# Install dependencies
pnpm install

# Set up your API keys
cp .env.example .env
# Edit .env and add at least one API key

# Launch the app
pnpm dev:desktop
```

### First Task

1. **Select a folder** - Choose where OpenWork can read/write files
2. **Pick a provider** - Claude, Gemini, OpenAI, or Ollama
3. **Try a quick action** - Click "Create a file" or type your own request

## Features

### Task Automation

| Capability | Description |
|------------|-------------|
| **File Management** | Read, write, edit files in a sandboxed directory |
| **Task Planning** | AI breaks complex requests into actionable subtasks |
| **Progress Tracking** | Visual checklist showing real-time completion |
| **Browser Automation** | Complete web tasks with browser-use + Playwright |
| **MCP Connectors** | Connect to Google Calendar, Slack, Notion, and more |

### Quick Actions

Pre-built templates to get started instantly:

- **Create a file** - Generate documents, spreadsheets, presentations
- **Crunch data** - Analyze files, extract insights, create summaries
- **Make a prototype** - Design mockups and wireframes
- **Prep for the day** - Review calendar, summarize meetings
- **Organize files** - Sort, rename, categorize documents
- **Send a message** - Draft and send emails or messages

### Multi-Provider Support

Use the AI provider that works best for you:

| Provider | Models | Setup |
|----------|--------|-------|
| **Anthropic** | claude-sonnet-4, claude-opus-4.5 | [Get API key](https://console.anthropic.com/) |
| **Google** | gemini-2.5-pro, gemini-3-pro | [Get API key](https://makersuite.google.com/app/apikey) |
| **OpenAI** | gpt-5, gpt-5-codex, o3 | [Get API key](https://platform.openai.com/api-keys) |
| **Ollama** | llama3.3, qwen2.5, deepseek-r1 | [Install Ollama](https://ollama.ai/) (free, local) |

## Architecture

```
OpenWork Desktop App
+----------------------------------------------------------+
|  React/Electron Frontend                                  |
|  +------------+  +---------------+  +------------------+  |
|  | File       |  | Task Engine   |  | Context          |  |
|  | Browser    |  | + Progress UI |  | Manager          |  |
|  +------------+  +---------------+  +------------------+  |
+----------------------------------------------------------+
                           |
+----------------------------------------------------------+
|  OpenWork Core (TypeScript)                               |
|  - Task planning and decomposition                        |
|  - Tool selection and execution                           |
|  - Progress tracking and reporting                        |
+----------------------------------------------------------+
                           |
+----------------------------------------------------------+
|  SDK Integration Layer                                    |
|  +--------+ +--------+ +--------+ +------------------+    |
|  | Claude | | Gemini | | OpenAI | | Ollama (Local)   |    |
|  +--------+ +--------+ +--------+ +------------------+    |
+----------------------------------------------------------+
```

## Project Structure

```
openwork/
├── apps/
│   └── desktop/          # Electron desktop application
├── packages/
│   ├── core/             # Agent orchestration engine
│   ├── file-tools/       # Sandboxed file operations
│   ├── browser-tools/    # Browser automation
│   ├── sdk-adapters/     # Multi-provider adapters
│   ├── mcp-connectors/   # MCP server integrations
│   └── ui/               # Shared UI components
├── docs/                 # Documentation
└── scripts/              # Build and release scripts
```

## Documentation

- [Getting Started Guide](docs/getting-started.md) - Detailed setup instructions
- [Troubleshooting](docs/getting-started.md#troubleshooting) - Common issues and solutions

## Development

```bash
# Run all packages in dev mode
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build

# Type check
pnpm typecheck

# Format code
pnpm format
```

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** and add tests if applicable
3. **Run tests** with `pnpm test`
4. **Submit a pull request**

See our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

### Good First Issues

Look for issues labeled [`good first issue`](https://github.com/openwork-ai/openwork/labels/good%20first%20issue) to get started.

## Acknowledgments

OpenWork builds on these amazing projects:

- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) - Anthropic
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google
- [OpenAI Codex](https://github.com/openai/codex) - OpenAI
- [browser-use](https://github.com/browser-use/browser-use) - Browser automation for AI
- [Playwright](https://playwright.dev/) - Microsoft

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[Star us on GitHub](https://github.com/openwork-ai/openwork)** to support the project

[Report Bug](https://github.com/openwork-ai/openwork/issues/new?template=bug_report.md) | [Request Feature](https://github.com/openwork-ai/openwork/issues/new?template=feature_request.md) | [Join Discord](https://discord.gg/openwork)

</div>
