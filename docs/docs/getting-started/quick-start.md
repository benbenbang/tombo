# Quick Start

Get up and running with Tombo in 5 minutes! This guide walks you through the core features with hands-on examples.

## Your First Tombo Experience

### Step 1: Open a Python Project

Open any Python project in VS Code that contains:

- `pyproject.toml` (PEP 621 or Poetry format)
- `requirements.txt`
- Any requirements file (`requirements-dev.txt`, `requirements.in`, etc.)

!!! tip "Don't have a project?"
    Create a new file called `pyproject.toml` and follow along!

### Step 2: Try Hover Information

Add a dependency to your file and hover over the package name:

=== "PEP 621 Format"

    ```toml title="pyproject.toml"
    [project]
    dependencies = [
        "requests",  # ← Hover over "requests"
    ]
    ```

=== "Poetry V1 Format"

    ```toml title="pyproject.toml"
    [tool.poetry.dependencies]
    requests = "^2.28.0"  # ← Hover over "requests"
    ```

=== "Poetry V2 Format"

    ```toml title="pyproject.toml"
    dependencies = [
      "mkdocs (>=1.6.1)",
      "requests (^2.28.0)",  # ← Hover over "requests"
    ]
    ```

!!! warning
    Poetry v2 format doesn't respect pep621, the version in the parentheses needs more "trigger" to hook up Tombo's suggestion.

=== "Requirements Format"

    ```txt title="requirements.txt"
    requests>=2.28.0  # ← Hover over "requests"
    ```

**What you'll see:**

- 📦 Package description
- 🏷️ Latest version (e.g., 2.31.0)
- 🐍 Python compatibility (e.g., >=3.7)
- 📅 Recent versions with release dates
- 🔗 Direct links to PyPI and documentation

### Step 3: Try Version Completion

Now try Tombo's intelligent version completion:

=== "PEP 621 Format"

    ```toml title="pyproject.toml"
    [project]
    dependencies = [
        "numpy>=",  # ← Place cursor after ">=" and trigger completion
    ]
    ```

=== "Poetry Format"

    ```toml title="pyproject.toml"
    [tool.poetry.dependencies]
    numpy = "^"  # ← Place cursor after "^" and trigger completion
    ```

=== "Requirements Format"

    ```txt title="requirements.txt"
    numpy>=  # ← Place cursor after ">=" and trigger completion
    ```

**To trigger completion:**

- **Automatic**: Tombo shows suggestions as you type
- **Manual**: Press `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (macOS)

**What you'll see:**

- 📋 List of available versions
- ✅ Compatible versions highlighted
- ⚠️ Pre-release versions marked
- 🚫 Yanked versions shown last

### Step 4: Experience Smart Caching

Try hovering over the same package again - notice how it's **instant** the second time!

This is Tombo's smart caching in action:
- **First lookup**: Fetches from PyPI (requires internet)
- **Subsequent lookups**: Lightning-fast from cache (works offline!)

## Core Workflows

### Adding New Dependencies

1. **Open your dependency file**
2. **Start typing a package name**
3. **Use hover to explore** package information
4. **Add version constraints** with intelligent completion
5. **Save the file** - you're done!

Example workflow:
```toml title="pyproject.toml"
[project]
dependencies = [
    "fastapi",           # Step 1: Add package name
    "fastapi>=",         # Step 2: Add constraint operator
    "fastapi>=0.95.0",   # Step 3: Complete with suggested version
]
```

### Updating Existing Dependencies

1. **Hover over existing packages** to see newer versions
2. **Click the version constraint** to highlight it
3. **Use completion** to see available updates
4. **Select the desired version**

### Exploring Package Information

1. **Hover over any package** to see metadata
2. **Click PyPI links** to visit the official package page
3. **Check Python compatibility** before adding dependencies
4. **Review recent versions** to understand release patterns

## Real-World Example

Let's create a complete Python project setup:

```toml title="pyproject.toml"
[project]
name = "my-awesome-app"
version = "0.1.0"
description = "My awesome Python application"
dependencies = [
    "fastapi>=0.95.0",      # Hover: See FastAPI info
    "uvicorn>=0.20.0",      # Hover: Check server compatibility
    "pydantic>=2.0.0",      # Completion: Get v2 versions
    "sqlalchemy>=2.0.0",    # Hover: See ORM latest features
    "pytest>=7.0.0",        # Testing framework
]

[project.optional-dependencies]
dev = [
    "black>=23.0.0",       # Code formatter
    "ruff>=0.0.250",       # Fast linter
    "mypy>=1.0.0",         # Type checker
]
```

**Try this yourself:**
1. Create this `pyproject.toml` file
2. Hover over each package to see rich information
3. Try changing version constraints and using completion
4. Notice how fast subsequent hovers are!

## Pro Tips

### Keyboard Shortcuts

- **Hover**: Simply hover with your mouse (no shortcuts needed)
- **Completion**: `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (macOS)
- **Go to Definition**: `F12` on package names (opens PyPI page)
- **Quick Info**: `Ctrl+K Ctrl+I` for hover info via keyboard

### File Format Recognition

Tombo automatically works with these file patterns:

- `pyproject.toml` - PEP 621 and Poetry formats
- `requirements*.txt` - All requirements file variants

### Caching Behavior

- **First session**: Packages fetched from PyPI (needs internet)
- **Same session**: Instant responses from memory cache
- **New sessions**: Fast responses from disk cache
- **Cache duration**: 24 hours by default (configurable)

### Network Requirements

- **Online**: Full functionality with latest PyPI data
- **Offline**: Hover works for cached packages
- **Limited connection**: Tombo gracefully degrades

## Next Steps

Now that you've experienced Tombo's core features:

1. **[Learn about configuration](configuration.md)** - Customize Tombo for your workflow
2. **[Explore advanced features](../features/overview.md)** - Discover all capabilities
3. **[See format-specific examples](../examples/pep621.md)** - Master different project types

## Common Questions

??? question "Why doesn't completion trigger automatically?"

    Tombo completion triggers on specific characters (`>=`, `==`, `~=`, etc.). If it's not working:

    1. Make sure you're in a supported file type
    2. Try typing the constraint operator (`>=`)
    3. Use `Ctrl+Space` to manually trigger completion

??? question "Package hover shows 'Loading...' forever"

    This usually indicates network connectivity issues:

    1. Check your internet connection
    2. Verify PyPI is accessible from your network
    3. Check VS Code's output panel for Tombo logs

??? question "Can I use Tombo offline?"

    Yes! After the first lookup online:

    - Hover information works offline from cache
    - Version completion uses cached data
    - Cache persists between VS Code sessions

Ready to dive deeper? Check out the [feature overview](../features/overview.md) to learn about all of Tombo's capabilities!
