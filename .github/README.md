# GitHub and AI Configuration

This directory contains configuration files for GitHub Copilot and AI-assisted development in this project.

## Files Overview

### 📘 copilot-instructions.md
**Comprehensive guidelines for GitHub Copilot**

This is the main reference document that teaches GitHub Copilot (and other AI assistants) how to generate code that follows this project's standards. It includes:

- TypeScript strict type checking guidelines
- Code style and formatting rules (based on Prettier/ESLint config)
- Module system usage (ES Modules with .js extensions)
- Conventional commit message format
- Project architecture and naming conventions
- Error handling patterns
- Async/await best practices
- Security considerations
- MCP (Model Context Protocol) integration recommendations

**Use this when:** You want Copilot to understand the full context of the project's coding standards.

### 🎯 ai-prompts.md
**Curated prompts and examples for AI-assisted development**

A collection of ready-to-use prompts for common development tasks:

- Creating new modules
- Refactoring code
- Adding features
- Fixing bugs
- Writing tests
- Documenting code
- Optimizing performance
- Security reviews

Each prompt template includes context on what to specify and examples of good vs. bad practices.

**Use this when:** You need a starting point for prompting AI assistants for specific tasks.

### ⚙️ copilot.yml
**GitHub Copilot configuration file**

A structured YAML configuration that GitHub Copilot can read to understand project-specific settings:

- Project context summary
- Coding standards enforcement
- Commit message format
- Common patterns to follow
- Anti-patterns to avoid
- Security guidelines
- Performance considerations
- References to other important files

**Use this when:** GitHub Copilot needs quick reference to project rules (automatically loaded by the IDE).

### 🔌 copilot-mcp.json
**Model Context Protocol (MCP) server configuration**

Configuration for MCP servers that can enhance AI capabilities:

- **Filesystem Server**: Provides access to project files
- **GitHub Server**: Integrates with GitHub issues and PRs
- **Git Server**: Enables git operations
- **Memory Server**: Maintains context across sessions

**Use this when:** Setting up advanced AI integrations with MCP-compatible tools.

## How to Use These Files

### For Developers

1. **First Time Setup:**
   - Read `copilot-instructions.md` to understand project standards
   - Review `ai-prompts.md` for common prompt patterns
   - Configure your IDE to recognize these guidelines (most modern IDEs auto-detect)

2. **During Development:**
   - Let GitHub Copilot suggest code based on these guidelines
   - Use prompt templates from `ai-prompts.md` when asking for specific changes
   - Review suggestions to ensure they follow project standards

3. **For Code Reviews:**
   - Reference these guidelines when reviewing AI-generated code
   - Update guidelines when new patterns emerge

### For GitHub Copilot

GitHub Copilot automatically reads:
- `.github/copilot.yml` for quick configuration
- `.github/copilot-instructions.md` for detailed guidelines (if supported by your IDE)

### For Other AI Tools

When using ChatGPT, Claude, or other AI assistants:

1. **Provide Context:** Share relevant sections from `copilot-instructions.md`
2. **Use Prompts:** Copy prompt templates from `ai-prompts.md` and fill in specifics
3. **Reference Standards:** Point to specific sections when asking for refinements

## MCP Server Setup

To use the MCP servers configured in `copilot-mcp.json`:

### Prerequisites

```bash
# Ensure you have Node.js installed (v24.11.0 via nvm)
nvm use

# MCP servers are installed via npx (no installation needed)
```

### GitHub Server Setup

Set your GitHub token as an environment variable:

```bash
# Linux/macOS
export GITHUB_TOKEN=your_github_token_here

# Windows
set GITHUB_TOKEN=your_github_token_here
```

Generate a token at: https://github.com/settings/tokens

Required permissions:
- `repo` (full repository access)
- `read:org` (read organization data)

### Usage with Claude Desktop (Example)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/config.json` on macOS):

```json
{
  "mcpServers": {
    "code-scanner-poc": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/code-scanner-poc"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Custom MCP Servers

Consider building custom MCP servers for:

1. **Linting Server**: Run ESLint and provide real-time feedback
2. **Type Checker Server**: Run TypeScript compiler and show errors
3. **Test Runner Server**: Execute tests and report results
4. **Documentation Server**: Serve project-specific docs

Example custom server structure:

```typescript
// src/mcp-servers/eslint-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ESLint } from 'eslint';

const server = new Server({
  name: 'eslint-mcp-server',
  version: '1.0.0',
});

server.setRequestHandler('lint', async (params) => {
  const eslint = new ESLint();
  const results = await eslint.lintFiles([params.file]);
  return results;
});

server.listen();
```

## Maintenance

### Updating Guidelines

When coding standards change:

1. Update `copilot-instructions.md` with new rules or patterns
2. Update `copilot.yml` with quick reference changes
3. Add new prompt templates to `ai-prompts.md` if needed
4. Test with Copilot to ensure guidelines are effective
5. Commit with: `docs(github): update AI guidelines for [reason]`

### Adding Examples

When you find good AI interaction patterns:

1. Add them to `ai-prompts.md` under the appropriate section
2. Include both the prompt and the expected output
3. Explain why the pattern is effective

### Versioning

These files should be versioned with the codebase:
- Track changes in git
- Update when project standards evolve
- Document breaking changes in commit messages

## Best Practices

### Do's ✅

- **Read the guidelines** before using AI assistance
- **Review AI suggestions** against these standards
- **Provide context** when prompting AI tools
- **Iterate on prompts** if results don't meet standards
- **Update guidelines** when patterns change
- **Share improvements** with the team

### Don'ts ❌

- **Don't blindly accept** AI suggestions without review
- **Don't bypass** linting and type checking
- **Don't ignore** conventional commit format
- **Don't skip** testing AI-generated code
- **Don't forget** to validate security implications
- **Don't leave** TODOs or placeholder code

## Additional Resources

### GitHub Copilot Documentation
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [Customizing Copilot](https://docs.github.com/en/copilot/customizing-copilot)
- [Best Practices](https://docs.github.com/en/copilot/using-github-copilot/best-practices-for-using-github-copilot)

### Model Context Protocol
- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Building MCP Servers](https://modelcontextprotocol.io/docs/building-servers)

### Project-Specific Docs
- [GUIDELINES.md](../GUIDELINES.md) - Technical implementation guidelines
- [README.md](../README.md) - Project overview and setup
- [ESLint Config](../eslint.config.js) - Linting rules
- [TypeScript Config](../tsconfig.json) - Compiler options

## Contributing

To improve these AI guidelines:

1. **Identify gaps**: Notice patterns that AI doesn't handle well
2. **Document solutions**: Add examples of good prompts and code
3. **Test changes**: Verify guidelines improve AI suggestions
4. **Submit PR**: Use conventional commits (e.g., `docs(ai): add retry pattern examples`)
5. **Review impact**: Check if team adoption improves code quality

## Questions?

If you have questions about:
- **Using these guidelines**: Check `ai-prompts.md` for examples
- **Configuring Copilot**: Review `copilot.yml` and Copilot docs
- **MCP setup**: See the MCP Server Setup section above
- **Project standards**: Refer to `copilot-instructions.md`

For project-specific questions, see [GUIDELINES.md](../GUIDELINES.md) or ask the team.
