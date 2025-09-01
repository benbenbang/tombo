# Tombo - Modern Python Package Manager for VS Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/benbenbang.tombo)](https://marketplace.visualstudio.com/items?itemName=benbenbang.tombo)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Tombo is a **modern, production-ready** VS Code extension that revolutionizes Python dependency management. Built with a clean TypeScript architecture, it provides intelligent PyPI integration, robust caching, and seamless support for both modern `pyproject.toml` and classic `requirements.txt` files.

## 📑 Table of Contents

- [Features](#-features) - Core capabilities and intelligent PyPI integration
- [Installation](#-installation) - Quick setup from VS Code Marketplace
- [Quick Start](#-quick-start) - Get started with PEP 621, Poetry, and requirements.txt
- [Configuration](#️-configuration) - Settings and customization options
- [Commands](#commands) - Available commands and usage
- [Modern Architecture](#modern-architecture) - Technical architecture overview
- [Contributing](#contributing) - How to contribute and current focus areas
- [Requirements](#requirements) - System requirements and dependencies
- [Troubleshooting](#-troubleshooting) - Common issues and solutions
- [Is Tombo Right for You?](#-is-tombo-right-for-you) - Feature comparison and use cases
- [Inspiration](#-inspiration)
- [License](#-license) - MIT License information

## ✨ Features

### **Intelligent PyPI Integration**
- **Real-time version suggestions** with smart caching (90% faster response times)
- **Comprehensive metadata** including package descriptions, release dates, and compatibility
- **Advanced filtering** for pre-releases, yanked versions, and Python compatibility
- **Robust error handling** with automatic retry and fallback mechanisms

### **Universal Python Standards Support**
- **Modern Python packaging**: Full PEP 621/518/660 compliance for `pyproject.toml`
- **Legacy compatibility**: Complete support for all `requirements*.txt` variants
- **Smart parsing**: Handles complex dependency specifications and version constraints
- **Future-ready**: Architecture designed for emerging Python packaging standards

### **Visual Intelligence & UX**
- **Smart decorators**: Visual indicators for compatibility, warnings, and errors
- **Contextual completion**: Intelligent suggestions based on your project's Python version
- **Rich hover information**: Detailed package information without leaving your editor
- **Clean, non-intrusive UI** that enhances rather than clutters your workflow

### **Performance & Reliability**
- **Smart caching**: LRU cache with configurable TTL reduces API calls by ~90%
- **Network resilience**: Exponential backoff, rate limiting, and connectivity checks
- **Resource efficiency**: Proper memory management and automatic cleanup
- **Production-grade error handling** with structured logging and debugging support

## 🛠 Installation

### From VS Code Marketplace (Recommended)
```bash
# Search for "Tombo - Python Package Manager" in VS Code Extensions
# Or install via command line:
code --install-extension benbenbang.tombo
```

### Local Development
See [INSTALL.md](./.github/INSTALL.md) for detailed development setup instructions.

## 📚 Quick Start

1. **Open a Python project** with `pyproject.toml` or `requirements.txt`
2. **Start typing dependencies** - completion works with multiple formats:

   **PEP 621 - Instant Completion:**

   ```toml
   # In pyproject.toml - Works instantly!
   [project]
   dependencies = [
       "requests",      # Cursor after package → shows operators (>=, ~=, ==)
       "numpy>=",       # Cursor after >= → shows versions instantly
       "pandas~=1.5",   # Cursor in version → shows alternatives
   ]
   ```

   **Poetry v1 - Perfect Completion:**

   ```toml
   # In pyproject.toml - Works perfectly!
   [tool.poetry.dependencies]
   python = "^3.9.13"   # Cursor between quotes → shows versions
   click = "~8.1"       # Cursor in version → shows alternatives
   requests = ""        # Empty quotes → shows all versions
   ```

   **Requirements.txt - All Formats:**

   ```text
   # All standard formats supported
   requests>=2.28.0     # Cursor in version → instant completion
   django==4.1.7        # Pinned versions work perfectly
   numpy~=1.24.0        # Compatible releases supported
   ```

3. **Experience the intelligence**:

   - Latest versions appear first with 📌 indicators
   - Pre-releases marked with 🧪 if enabled
   - Yanked versions shown with ⚠️ warnings
   - Rich documentation on hover with package details

**💡 See working examples**: Check the `tests/` folder for complete format examples!

## ⚙️ Configuration

Access settings via **File > Preferences > Settings**, then search for "tombo":

| Setting | Default | Description |
|---------|---------|-------------|
| `tombo.pypiIndexUrl` | `https://pypi.org/pypi/` | PyPI index server URL |
| `tombo.listPreReleases` | `false` | Include pre-release versions |
| `tombo.requestTimeout` | `10000` | API request timeout (1-60 seconds) |
| `tombo.cacheTimeoutMinutes` | `10` | Cache TTL in minutes (1-1440) |
| `tombo.maxCacheSize` | `1000` | Maximum cached packages (10-10000) |
| `tombo.retryAttempts` | `3` | Retry attempts for failed requests (1-10) |
| `tombo.compatibleDecorator` | ` ✓` | Symbol for compatible versions |
| `tombo.incompatibleDecorator` | ` ⚠` | Symbol for incompatible versions |
| `tombo.showNotifications` | `onError` | When to show notifications |
| `tombo.enableDebugLogging` | `false` | Enable debug logging to Output Panel |

## Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **Tombo: Update All Dependencies** - Bulk dependency updates
- **Tombo: Refresh Package Versions** - Clear cache and reload

## **Modern Architecture**

Tombo is built with production-grade TypeScript architecture:

```
Clean Architecture
├── PyPI Service Layer      → Single source of truth for API calls
├── Smart Caching           → LRU cache with automatic cleanup
├── Error Handling         → Structured errors with retry logic
├── Configuration Mgmt      → Hot-reloadable VS Code settings
└── VS Code Integration     → Clean provider pattern
```

**Key architectural benefits:**
- **Zero duplicate API calls** - unified PyPI service
- **Memory efficient** - LRU cache with automatic cleanup
- **Network resilient** - exponential backoff and rate limiting
- **Developer friendly** - comprehensive error messages and logging
- **Extensible** - clean interfaces for future enhancements

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for:

### **Current Focus Areas**
- 🚀 **Performance optimization**: Advanced caching strategies
- 📋 **PEP compliance**: Full support for modern Python packaging
- 🧪 **Testing**: Comprehensive test coverage
- 📖 **Documentation**: API docs and usage examples

### **Quick Contributor Start**
```bash
git clone https://github.com/benbenbang/tombo.git
cd tombo
npm install              # Install dependencies
nox -s setup            # Set up Python environment
npm run watch           # Start development mode
# Press F5 in VS Code to test
```

## Requirements

- **VS Code**: 1.75.0 or higher
- **Python Extension**: Required for Python environment detection
- **Node.js**: 14.x+ (for development)
- **Network**: Internet access for PyPI API

## 🐛 Troubleshooting

### **Common Issues**

**No completions appearing?**
- Verify file naming: Must be exactly `pyproject.toml` (not `*-pyproject.toml`)
- Check cursor position: Place cursor after `>=`, `~=`, `==` or inside version quotes
- Try different formats: PEP 621 works instantly, Poetry v1 works perfectly
- Test with examples: Use files in `tests/` folder to verify functionality

**Need detailed debugging?**
1. Enable debug logging: Set `tombo.enableDebugLogging` to `true`
2. Open Output Panel: View → Output → Select "Tombo" from dropdown
3. Trigger completion and check for detailed logs
4. Look for completion triggers, package detection, and API responses

**Performance issues?**
- Check cache settings: Increase `tombo.cacheTimeoutMinutes` (default: 10 min)
- Adjust cache size: Increase `tombo.maxCacheSize` for large projects
- Monitor API calls: Enable debug logging to see cache hit/miss rates
- Network timeout: Adjust `tombo.requestTimeout` if on slow connection

**Extension not loading?**
1. Enable debug logging: `tombo.enableDebugLogging` → `true`
2. Check Tombo Output Panel: View → Output → "Tombo"
3. Look for activation errors and initialization messages
4. Verify Python extension is installed and active

### **⚠️ Known Issues**

**TOML extension conflicts:**
- Other TOML extensions (like "Even Better TOML") may interfere with Tombo's completion
- **Symptoms**: Completion not triggering, extension crashes, conflicting suggestions
- **Solutions**:
  - Temporarily disable other TOML extensions to test Tombo
  - Try different trigger characters (`=`, `~`, `>`, `<`, `space`) if completion doesn't appear
  - Use Tombo's debug logging to identify conflicts: `tombo.enableDebugLogging` → `true`

**Poetry v2 syntax limitations:**
- Poetry v2's parentheses syntax `"pandas (>=2.0,<3.0)"` doesn't honor PEP 621 standards
- **Workaround**: Completion triggers on operators (`=`, `>`, `<`, `~`) but parentheses `( )` require manual typing
- **Example**: Type `pandas >=` → completion works, but `pandas (>=` → you handle the parentheses manually

**File naming requirements:**
- Must be exactly `pyproject.toml` (not `*-pyproject.toml` or similar variants)
- Requirements files must match `requirements*.txt` pattern

More help in [INSTALL.md](./.github/INSTALL.md#troubleshooting).

## 🤔 Is Tombo Right for You?

**Choose Tombo if you:**

### **🐍 Python-First Development**
- Work primarily with Python projects
- Need excellent support for modern Python packaging (PEP 621, Poetry, requirements.txt)
- Want completion that "just works" with your existing workflow

### **🆓 Prefer Open Source Solutions**
- **Completely FREE (open source)** - MIT license, no hidden costs
- Value community-driven development
- Want to contribute or customize features
- Don't need commercial support contracts

### **⚡ Value Performance & Simplicity**
- Want fast, responsive completion (90% fewer API calls with smart caching)
- Prefer lightweight tools without bloat
- Like clean, intuitive interfaces

### **🔒 Privacy-Conscious Development**
- Work on private/confidential projects
- Prefer tools that work offline
- Don't want to create accounts or share usage data

---

### **Consider Alternatives if you:**

### **Multi-Language Projects**
- Work with many languages beyond Python
- Need unified dependency management across `Rust`, `Go`, `JS`, etc.
- **→ Try [Dependi.io](https://dependi.io)** for multi-language support (not affiliated, reason see [Inspiration](#-inspiration))

### **Need Commercial Support**
- Require SLA guarantees and professional support
- Work in enterprise environments with strict vendor requirements
- **→ Consider commercial solutions** with dedicated support teams

### **Want Cutting-Edge Features**
- Need advanced vulnerability scanning
- Want AI-powered dependency suggestions
- **→ Explore premium tools** with advanced feature sets

---

### **📊 Quick Comparison:**

| **Your Priority** | **Tombo** | **Dependi.io** | **Enterprise Tools** |
|-------------------|-----------|----------------|---------------------|
| **Cost** | Free forever | Free + Paid tiers | Usually paid |
| **Python Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Multi-language** | Python only | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Performance** | Very fast | Good | Variable |
| **Privacy** | Complete | Account required | Variable |
| **Open Source** | Yes | Partially | Usually no |

**💡 The best tool is the one that fits your workflow!** We built Tombo for Python developers who want excellent dependency management without complexity or cost.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./.github/LICENSE) file for details.

## 🎯 Inspiration

Inspired by the excellent [crates extension](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates) for Rust package management when I was learning `Rust`, but built from the ground up with modern TypeScript patterns.

## 🙏 Acknowledgments

- **TypeScript community** for excellent tooling and patterns
- **VS Code extension ecosystem** for comprehensive APIs
- **Python packaging community** for evolving standards
- **Contributors** who help make Python dependency management smoother

---

**Built with ❤️ and modern TypeScript for the Python community**
