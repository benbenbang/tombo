# Features Overview

Tombo brings powerful Python package management capabilities directly to VS Code. Here's everything Tombo can do to supercharge your Python development workflow.

## Core Features

### 🎯 Rich Hover Information

Get comprehensive package details without leaving your editor:

- **📦 Package description** - What the package does
- **🏷️ Latest version** - Current stable release
- **🐍 Python compatibility** - Supported Python versions
- **📅 Version history** - Recent releases with dates
- **🔗 Quick links** - Direct access to PyPI, docs, and source code
- **⚠️ Deprecation warnings** - Know if packages are deprecated

**Example:**
```toml title="pyproject.toml"
[project]
dependencies = [
    "requests",  # ← Hover here to see rich package info
]
```

**What you see:**
```
📦 requests
HTTP library for Python

🏷️ Latest: 2.31.0 (Jul 12, 2023)
🐍 Python: >=3.7
📅 Recent: 2.31.0, 2.30.0, 2.29.0

🔗 PyPI | Documentation | GitHub
```

### ⚡ Intelligent Version Completion

Smart version suggestions as you type:

- **Real-time suggestions** - Version completions as you type
- **Compatibility indicators** - Visual cues for Python compatibility
- **Pre-release support** - Optional alpha/beta/rc versions
- **Yanked version handling** - Deprecated versions shown last
- **Constraint-aware** - Understands `>=`, `~=`, `^`, etc.

**Example:**
```toml title="pyproject.toml"
[project]
dependencies = [
    "numpy>=",  # ← Type here, get version suggestions
]
```

**Completion dropdown shows:**
```
1.24.3    ✅ (Latest stable)
1.24.2    ✅
1.24.1    ✅
1.25.0rc1 🚧 (Pre-release)
1.23.5    ❌ (Yanked)
```

### 🔄 Smart Caching System

Optimized performance with intelligent caching:

- **First lookup online** - Fresh data from PyPI
- **Instant subsequent access** - Lightning-fast from cache
- **Offline capability** - Works without internet after first lookup
- **90% API reduction** - Dramatically fewer network requests
- **Configurable TTL** - Customize cache duration
- **Memory + disk caching** - Persists between sessions

**Performance:**

- **First hover**: ~200-500ms (network dependent)
- **Cached hover**: ~5-10ms (instant)
- **Cache hit rate**: ~95% in typical usage

### 📦 Universal Format Support

Works with all Python packaging standards:

=== "PEP 621 (Modern)"
    ```toml title="pyproject.toml"
    [project]
    dependencies = [
        "requests>=2.28.0",
        "numpy~=1.24",
    ]

    [project.optional-dependencies]
    dev = ["pytest>=7.0"]
    ```

=== "Poetry v1"
    ```toml title="pyproject.toml"
    [tool.poetry.dependencies]
    python = "^3.9"
    requests = "^2.28.0"
    numpy = "~1.24"

    [tool.poetry.group.dev.dependencies]
    pytest = "^7.0"
    ```

=== "Poetry v2"
    ```toml title="pyproject.toml"
    [tool.poetry.dependencies]
    python = "^3.9"
    requests = "^2.28.0"
    pandas = "pandas (>=2.0,<3.0)"  # Parentheses syntax
    ```

=== "Requirements.txt"
    ```txt title="requirements.txt"
    requests>=2.28.0
    numpy~=1.24.0
    pytest>=7.0  # Development dependency
    ```

## Advanced Features

### 🛡️ Error Prevention

Catch common issues before they happen:

- **Version constraint validation** - Invalid syntax highlighting
- **Python compatibility checking** - Warns about incompatible versions
- **Deprecated package detection** - Alerts for deprecated packages
- **Yanked version warnings** - Prevents using withdrawn releases

### 🎨 Visual Indicators

Clear visual feedback in your editor:

- **✅ Compatible versions** - Green indicators for working versions
- **❌ Incompatible versions** - Red indicators for problematic versions
- **🚧 Pre-release markers** - Special indicators for alpha/beta/rc
- **⚠️ Deprecation warnings** - Alerts for deprecated packages
- **📍 Status bar integration** - Current operation status

### 🔍 Quick Actions

Right-click context menu actions:

- **Update to latest** - One-click version updates
- **Change constraint type** - Switch between `>=`, `~=`, `^`
- **Add optional dependency** - Move to optional sections
- **View on PyPI** - Open package page in browser
- **Copy version** - Copy version strings to clipboard

### ⌨️ Keyboard Shortcuts

Efficient keyboard-driven workflow:

| Action | Windows/Linux | macOS | Description |
|--------|---------------|--------|-------------|
| Hover | *Hover mouse* | *Hover mouse* | Show package info |
| Completion | `Ctrl+Space` | `Cmd+Space` | Trigger version completion |
| Go to Definition | `F12` | `F12` | Open PyPI page |
| Quick Info | `Ctrl+K Ctrl+I` | `Cmd+K Cmd+I` | Keyboard hover |
| Format Document | `Shift+Alt+F` | `Shift+Option+F` | Format TOML/requirements |

## File Format Support

### Supported File Types

Tombo automatically activates for these file patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| `pyproject.toml` | Modern Python projects | PEP 621, Poetry, Hatch |
| `requirements*.txt` | Pip requirements files | `requirements.txt`, `requirements-dev.txt` |
| `*.requirements` | Alternative requirements | `base.requirements` |
| `requirements*.in` | Pip-tools input files | `requirements.in` |
| `Pipfile` | Pipenv format | Basic support |
| `pyproject.lock` | Lock files | Read-only support |

### Section Recognition

Tombo understands these dependency sections:

**PEP 621:**

- `project.dependencies` - Runtime dependencies
- `project.optional-dependencies.*` - Optional dependency groups

**Poetry:**

- `tool.poetry.dependencies` - Runtime dependencies
- `tool.poetry.group.*.dependencies` - Dependency groups
- `tool.poetry.dev-dependencies` - Legacy dev dependencies

**Requirements:**
- All lines with package specifications
- Comments and blank lines ignored

## Integration Features

### VS Code Integration

- **Native completion provider** - Seamless VS Code experience
- **Hover provider** - Rich tooltips on hover
- **Status bar integration** - Current operation feedback
- **Output panel logging** - Debug information when needed
- **Command palette** - Cache management commands

### Network Features

- **Proxy support** - Works with corporate proxies
- **Custom PyPI indexes** - Support for private repositories
- **SSL/TLS handling** - Secure HTTPS connections
- **Retry logic** - Robust error handling
- **Rate limiting** - Respectful API usage

### Performance Features

- **Lazy loading** - Only loads when needed
- **Background processing** - Non-blocking operations
- **Memory management** - Efficient resource usage
- **Bundle optimization** - Small extension size (~250KB)
- **Startup optimization** - Fast VS Code startup

## Privacy & Security

### Privacy First Design

- **🔒 Zero telemetry** - No usage tracking
- **🏠 Local processing** - Data stays on your machine
- **🌐 Optional networking** - Only for package lookups
- **🔑 No accounts required** - Works without registration

### Security Features

- **✅ HTTPS only** - Secure PyPI connections
- **🛡️ Input validation** - Prevents malicious input
- **🔍 Source verification** - Validates package data
- **⚡ Minimal permissions** - Least privilege principle

## Extensibility

### Configuration Options

Highly customizable through VS Code settings:

- **PyPI server URL** - Use custom or corporate indexes
- **Cache settings** - TTL, size limits, enable/disable
- **Visual preferences** - Custom decorators and colors
- **Debug options** - Logging levels and outputs
- **Network settings** - Proxy, timeout, retry configuration

### Developer API

For extension developers:

- **Well-documented architecture** - Clean TypeScript codebase
- **Plugin system ready** - Extensible provider pattern
- **Open source** - MIT licensed, community contributions welcome
- **Modern stack** - ES2021, TypeScript, modern VS Code APIs

## What's Next?

Ready to dive deeper into specific features?

- **[Version Completion →](version-completion.md)** - Master intelligent version suggestions
- **[Hover Information →](hover-information.md)** - Learn about rich package tooltips
- **[Smart Caching →](smart-caching.md)** - Understand performance optimization
- **[Usage Examples →](../examples/pep621.md)** - See features in action

Or jump straight to hands-on examples:

- **[PEP 621 Projects →](../examples/pep621.md)** - Modern Python packaging
- **[Poetry Projects →](../examples/poetry.md)** - Poetry dependency management
- **[Requirements Files →](../examples/requirements.md)** - Traditional pip requirements
