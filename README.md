# Tombo - Modern Python Package Manager for VS Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/benbenbang.tombo)](https://marketplace.visualstudio.com/items?itemName=benbenbang.tombo)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Tombo is a **modern, production-ready** VS Code extension that revolutionizes Python dependency management. Built with a clean TypeScript architecture, it provides intelligent PyPI integration, robust caching, and seamless support for both modern `pyproject.toml` and classic `requirements.txt` files.

**A star to the project is a big motivation boost!** ⭐

## Quick Start

**Get Tombo running in 2 minutes:**

1. **[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=benbenbang.tombo)**
2. **Open any Python project** with `pyproject.toml` or `requirements.txt`
3. **Type version constraints** (`numpy>=`) and get intelligent completion
4. **Hover over package names** for rich metadata

**Try it now:** [Download from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=benbenbang.tombo) | [View Documentation](https://benbenbang.github.io/tombo/)

## Key Features

**Intelligent PyPI Integration**
- Real-time version suggestions with smart caching (90% faster response times)
- Comprehensive metadata including package descriptions, release dates, and compatibility
- Advanced filtering for pre-releases, yanked versions, and Python compatibility

**Universal Python Standards Support**
- Modern Python packaging: Full PEP 621/518/660 compliance for `pyproject.toml`
- Legacy compatibility: Complete support for all `requirements*.txt` variants
- Smart parsing: Handles complex dependency specifications and version constraints

**Visual Intelligence & Performance**
- Smart decorators: Visual indicators for compatibility, warnings, and errors
- Rich hover information: Detailed package information without leaving your editor
- Smart caching: LRU cache with configurable TTL reduces API calls by ~90%
- Network resilience: Exponential backoff, rate limiting, and connectivity checks

## Supported Formats

**Works instantly with:**

```toml
# pyproject.toml - PEP 621
[project]
dependencies = [
    "requests>=",           # <- Type here for version completion
    "numpy==",              # <- Exact version suggestions
    "django~=4.0",          # <- Compatible release options
]
```

```toml
# pyproject.toml - Poetry
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2."            # <- Caret constraint completion
click = "~8.1"              # <- Tilde constraint completion
```

```txt
# requirements.txt
requests>=2.               # <- Traditional pip constraints
numpy==1.24.               # <- Specific version families
django~=4.2.0              # <- Compatible release operator
```

## Installation

**From VS Code Marketplace (Recommended):**
```bash
# Search for "Tombo - Python Package Manager" in VS Code Extensions
# Or install via command line:
code --install-extension benbenbang.tombo
```

**Local Development:**
```bash
git clone https://github.com/benbenbang/tombo.git
cd tombo
npm install && nox -s setup
npm run watch  # Start development mode
# Press F5 in VS Code to test
```

## Configuration

Configure Tombo via VS Code settings (`Ctrl+,` then search "tombo"):

```json
{
  "tombo.pypiIndexUrl": "https://pypi.org/pypi/",
  "tombo.listPreReleases": false,
  "tombo.requestTimeout": 10000,
  "tombo.cacheTimeoutMinutes": 10,
  "tombo.maxCacheSize": 1000
}
```

## Documentation

**Complete guides available at [benbenbang.github.io/tombo](https://benbenbang.github.io/tombo/):**

- **[Getting Started](https://benbenbang.github.io/tombo/getting-started/installation/)** - Installation and setup
- **[Features Guide](https://benbenbang.github.io/tombo/features/overview/)** - Version completion, hover info, smart caching
- **[Examples](https://benbenbang.github.io/tombo/examples/pep621/)** - PEP 621, Poetry, requirements.txt, real workflows
- **[Troubleshooting](https://benbenbang.github.io/tombo/troubleshooting/common-issues/)** - Common issues and solutions
- **[Development](https://benbenbang.github.io/tombo/development/architecture/)** - Architecture and contributing

## Contributing

We welcome contributions! Quick start:

```bash
git clone https://github.com/benbenbang/tombo.git
cd tombo
npm install && nox -s setup
npm run watch  # Development mode
# Press F5 to test in Extension Development Host
```

See [contributing guidelines](https://benbenbang.github.io/tombo/development/contributing/) for detailed information.

## Requirements

- **VS Code**: 1.75.0 or higher
- **Python Extension**: Required for Python environment detection
- **Node.js**: 14.x+ (for development)
- **Network**: Internet access for PyPI API

## License

This project is licensed under the MIT License - see the [LICENSE](./.github/LICENSE) file for details.

## Inspiration

Inspired by the excellent [crates extension](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates) for Rust package management, but built from the ground up with modern TypeScript patterns for the Python ecosystem.

---

**Visit [benbenbang.github.io/tombo](https://benbenbang.github.io/tombo/) for the complete and easy to read documentation.**

**Built with ❤️ and modern TypeScript for the Python community**
