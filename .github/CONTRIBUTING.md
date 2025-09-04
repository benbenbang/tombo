# Contributing to Tombo

Thank you for your interest in contributing! 🎉

> 📚 **For comprehensive contributing guidelines, visit the [development documentation](https://benbenbang.github.io/tombo/development/contributing/)**

## 🚀 Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/tombo.git
cd tombo

# 2. Set up development environment
npm install && nox -s setup

# 3. Start development
npm run watch           # Watch mode for TypeScript
# Press F5 in VS Code to test in Extension Development Host

# 4. Validate changes
npm run compile && npm run lint
```

## 🎯 Current Focus Areas

**High Priority:**
- 🔥 Provider implementations and VS Code integration
- 🔥 TOML parser enhancements for PEP 621/518/660
- 🔥 Comprehensive testing suite
- 🔥 Performance optimizations and caching

**Good First Issues:**
- Add package descriptions to completion items
- Implement basic hover provider
- Add configuration validation
- Improve error messages

## 🏗 Architecture Overview

Tombo uses modern TypeScript with clean architecture:
```
src/
├── api/          # PyPI integration layer
├── core/         # Configuration and error handling
├── extension/    # Extension lifecycle management
└── providers/    # VS Code integration providers
```

## 📖 Complete Documentation

- **🏗 [Technical Architecture](https://benbenbang.github.io/tombo/development/architecture/)** - Deep dive into codebase structure
- **📘 [API Reference](https://benbenbang.github.io/tombo/development/api-reference/)** - Complete API documentation
- **🧪 [Testing Guidelines](https://benbenbang.github.io/tombo/development/contributing/#testing-guidelines)** - Unit and integration testing
- **🎯 [Code Standards](https://benbenbang.github.io/tombo/development/contributing/#code-quality-standards)** - TypeScript patterns and best practices

## 💡 Questions or Issues?

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/benbenbang/tombo/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/benbenbang/tombo/discussions)
- 📖 **Documentation**: [Full Contributing Guide](https://benbenbang.github.io/tombo/development/contributing/)

---

**Visit [benbenbang.github.io/tombo](https://benbenbang.github.io/tombo/) for the complete and easy to read documentation.**
