# Getting Started with OpenWork

OpenWork is an open-source AI agent platform that lets you complete tasks using AI, similar to how developers use Claude Code, Codex, or Gemini CLI.

## Prerequisites

- **Node.js 20+** - Download from [nodejs.org](https://nodejs.org/)
- **pnpm 9+** - Install with `npm install -g pnpm`
- **API Key** - From at least one provider (or Ollama for local models)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/openwork-ai/openwork.git
cd openwork
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure API Keys

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
OPENAI_API_KEY=sk-...
```

### 4. Start the Desktop App

```bash
pnpm dev:desktop
```

## Using OpenWork

### 1. Select a Provider

Open Settings (gear icon) and choose your AI provider:
- **Claude** - Anthropic's Claude models (recommended)
- **Gemini** - Google's Gemini models
- **OpenAI** - GPT models
- **Ollama** - Local models (no API key needed)

### 2. Select a Working Folder

Click "Work in a folder" to choose a directory. OpenWork will have access to read, write, and edit files in this directory.

### 3. Start a Task

Either:
- Click a **Quick Action** (Create a file, Crunch data, etc.)
- Type your own request in the text area

### 4. Watch Progress

OpenWork will:
1. Create an execution plan
2. Execute each step
3. Show real-time progress
4. Complete the task

## Quick Actions

| Action | Description |
|--------|-------------|
| **Create a file** | Generate documents, spreadsheets, or code |
| **Crunch data** | Analyze files and extract insights |
| **Make a prototype** | Create mockups and wireframes |
| **Prep for the day** | Review calendar and prepare summaries |
| **Organize files** | Sort, rename, and categorize documents |
| **Send a message** | Draft emails or messages |

## Using Local Models (Ollama)

1. Install Ollama: https://ollama.ai/
2. Pull a model: `ollama pull llama3.3`
3. Start Ollama: `ollama serve`
4. Select "Local" as your provider in OpenWork

## Troubleshooting

### "API key invalid"
- Check that your API key is correctly entered in Settings
- Ensure your API key has sufficient credits/permissions

### "Ollama not running"
- Start Ollama with `ollama serve`
- Check that it's running on `http://localhost:11434`

### "Permission denied"
- Make sure you've selected a folder you have write access to
- On macOS, you may need to grant Full Disk Access in System Settings

## Next Steps

- Read the [SDK Integration Guide](sdk-integration.md)
- Explore the [API Reference](api-reference.md)
- Join our [Discord community](https://discord.gg/openwork)
