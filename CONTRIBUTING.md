# Contributing to OpenWork

Thank you for your interest in contributing to OpenWork! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** to check if the bug has already been reported
2. **Create a new issue** using the bug report template
3. **Include details:**
   - Steps to reproduce the bug
   - Expected behavior
   - Actual behavior
   - Your environment (OS, Node.js version, etc.)

### Suggesting Features

1. **Search existing issues** to check if the feature has already been suggested
2. **Create a new issue** using the feature request template
3. **Describe the feature** and why it would be useful

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Write or update tests** if applicable
5. **Run checks:**
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```
6. **Commit your changes** with a clear message
7. **Push to your fork**
8. **Open a pull request**

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/openwork.git
cd openwork

# Install dependencies
pnpm install

# Start development
pnpm dev:desktop
```

### Project Structure

```
openwork/
├── apps/
│   └── desktop/          # Electron desktop app
├── packages/
│   ├── core/             # Agent orchestration
│   ├── file-tools/       # File operations
│   ├── browser-tools/    # Browser automation
│   ├── sdk-adapters/     # Provider adapters
│   ├── mcp-connectors/   # MCP integrations
│   └── ui/               # Shared components
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all packages in dev mode |
| `pnpm dev:desktop` | Start only the desktop app |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code with Prettier |

## Code Style

- We use TypeScript for all code
- Code is formatted with Prettier
- Follow existing patterns in the codebase

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for new AI provider
fix: resolve file permission issue on macOS
docs: update installation instructions
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if needed
- Add tests for new functionality
- Make sure all checks pass

## Getting Help

- Check the [documentation](docs/getting-started.md)
- Open a [discussion](https://github.com/openwork-ai/openwork/discussions)
- Join our [Discord](https://discord.gg/openwork)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
