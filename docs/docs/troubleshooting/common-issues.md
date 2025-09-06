# Common Issues

Quick solutions to the most frequently encountered problems with Tombo. Most issues can be resolved with simple configuration changes or understanding how Tombo works.

## Installation Issues

### Extension Not Found in Marketplace

**Problem**: Can't find Tombo in VS Code Extensions marketplace.

**Solutions**:

1. **Check extension name**: Search for "Tombo" (exact spelling)
2. **Verify VS Code version**: Requires VS Code 1.74.0 or later
3. **Refresh marketplace**: `Ctrl+Shift+P` → "Extensions: Reload"
4. **Direct install**: Use `code --install-extension tombo.tombo`

### Extension Installed But Not Working

**Problem**: Tombo appears in extensions list but no functionality.

**Solutions**:

1. **Restart VS Code completely**: Close all windows and reopen
2. **Check file types**: Open a supported file (`pyproject.toml`, `requirements.txt`)
3. **Verify activation**: Look for Tombo in the status bar
4. **Check output panel**: `View` → `Output` → Select "Tombo" from dropdown

```json title="Check these settings"
{
    "tombo.enabled": true,              // Should be true
    "tombo.autoActivate": true,         // Should be true
    "files.associations": {             // Should include supported types
        "*.toml": "toml",
        "requirements*.txt": "pip-requirements"
    }
}
```

## Hover Information Issues

### Hover Not Working at All

**Problem**: No hover information appears over package names.

**Diagnostic steps**:

1. **Check file type**: Hover only works in supported files
2. **Test internet connection**: First hover requires network access
3. **Check VS Code settings**: Ensure hover is enabled
4. **Try manual hover**: Use `Ctrl+K Ctrl+I` (Windows/Linux) or `Cmd+K Cmd+I` (macOS)

**Solutions**:

```json title="VS Code Settings"
{
    "editor.hover.enabled": true,       // Enable hover globally
    "editor.hover.delay": 300,          // Hover delay in milliseconds
    "tombo.hover.enabled": true,        // Enable Tombo hover specifically
}
```

### Hover Shows "Loading..." Forever

**Problem**: Hover popup appears but shows loading spinner indefinitely.

**Root causes**:
- Network connectivity issues
- PyPI server unreachable
- Proxy configuration problems
- Firewall blocking requests

**Solutions**:

1. **Check internet connection**: Verify you can reach https://pypi.org
2. **Configure proxy settings**:

```json title="VS Code Proxy Settings"
{
    "http.proxy": "http://proxy.company.com:8080",
    "http.proxyAuthorization": "Basic username:password",
    "http.proxyStrictSSL": false
}
```

3. **Test with different packages**: Try hovering over common packages like `requests`
4. **Check Tombo logs**: Open VS Code Output panel → Select "Tombo"

### Hover Shows Incorrect Information

**Problem**: Package hover shows outdated or wrong information.

**Solutions**:

1. **Clear cache**: `Ctrl+Shift+P` → "Tombo: Clear Cache"
2. **Check cache settings**:

```json title="Cache Configuration"
{
    "tombo.cache.enabled": true,
    "tombo.cache.ttl": 86400,           // 24 hours in seconds
    "tombo.cache.maxSize": 1000         // Number of packages to cache
}
```

3. **Verify PyPI index URL**:

```json title="PyPI Configuration"
{
    "tombo.pypiIndexUrl": "https://pypi.org/simple/"  // Official PyPI
}
```

## Version Completion Issues

### Completion Not Triggering

**Problem**: Version completion dropdown doesn't appear when typing.

**Common causes**:
- Not typing in the right location
- Unsupported file format
- Missing constraint operators
- Network issues on first use

**Solutions**:

1. **Check trigger characters**: Completion triggers after `>=`, `==`, `~=`, etc.

```toml title="Correct trigger positions"
[project]
dependencies = [
    "requests>=",           # ← Cursor here should trigger completion
    "numpy==",              # ← Or here
    "pandas~=",             # ← Or here
]
```

2. **Manual completion trigger**: Use `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (macOS)

3. **Check supported file formats**:
   - ✅ `pyproject.toml` with `[project]` section
   - ✅ `requirements.txt` and variants
   - ✅ Poetry `[tool.poetry.dependencies]` section

### Completion Shows No Results

**Problem**: Completion dropdown appears but is empty.

**Solutions**:

1. **Verify package exists**: Check package name spelling
2. **Test with known packages**: Try `requests`, `numpy`, `pandas`
3. **Check pre-release settings**:

```json title="Pre-release Configuration"
{
    "tombo.listPreReleases": false      // Set to true to see alpha/beta versions
}
```

4. **Check network connectivity**: First completion requires internet access

### Completion Shows Unexpected Versions

**Problem**: Version completion shows versions that seem wrong or outdated.

**Solutions**:

1. **Clear package cache**: `Ctrl+Shift+P` → "Tombo: Clear Cache"
2. **Check Python compatibility**: Tombo filters versions based on `requires-python`

```toml title="Python Version Compatibility"
[project]
requires-python = ">=3.8"              # Affects which versions are shown
dependencies = [
    "numpy>=",                          # Only shows Python 3.8+ compatible versions
]
```

3. **Verify PyPI index**: Make sure you're using the correct PyPI server

### Version Selection Workflow

**Note**: Tombo is designed for **version research and selection**, not automatic insertion. The recommended workflow is:

1. **Research**: Use Tombo to see available versions and compatibility
2. **Select**: Choose the appropriate version constraint
3. **Install**: Use `uv add package>=x.y.z` or `poetry add "package>=x.y.z"`

```toml title="Recommended workflow"
# 1. Start typing to see options
dependencies = [
    "requests>=",                       # ← See available versions via completion
]

# 2. Research versions via hover and completion dropdown
# 3. Choose appropriate version (e.g., 2.31.0)
# 4. Run: uv add "requests>=2.31.0"
```

This approach gives you full control over version selection while leveraging Tombo's intelligence for research.

## Known Issues and Limitations

### Format Support Levels

**🟢 Fully Supported (Excellent Experience)**:

- **PEP 621** (`[project]` section): Complete completion and hover support
- **Poetry v1** (`[tool.poetry.dependencies]`): All features work perfectly
- **Requirements.txt**: Full compatibility with all operators

**🟡 Limited Support**:

- **Poetry v2 Parentheses Format**: `"package (>=1.0,<2.0)"`

  - ✅ Hover information works
  - ⚠️ Completion may not trigger reliably
  - **Workaround**: Use standard Poetry v1 format when possible

**Examples**:
```toml title="Support levels comparison"
[tool.poetry.dependencies]
requests = "^2.31.0"                   # 🟢 Excellent support
pandas = "pandas (>=2.0,<3.0)"         # 🟡 Limited - hover works, completion unreliable
```

### Version Completion Positioning

**Issue**: Quick fix actions may insert text at unexpected positions.

**What Works Perfectly**:

- ✅ **Completion Dropdown**: Selecting versions from the dropdown works correctly
- ✅ **Hover Information**: Package info and version details work flawlessly
- ✅ **Manual Typing**: Standard typing and editing works as expected

**What Has Issues**:

- ⚠️ **Quick Fix Actions**: Right-click context menu actions may position text incorrectly

**Symptoms of Quick Fix Issues**:

- Text appears before operators: `"package2.31.0>="`
- Extra operators added: `"package~=2.31.0=="`

**Recommended Usage**:

1. **Use completion dropdown** - Select versions from the completion menu (works perfectly)
2. **Use hover for research** - Get version info and compatibility details
3. **Type manually when needed** - For precise control over formatting
4. **Avoid quick fix actions** - Until positioning is improved in a future update

**Status**: Quick fix positioning will be improved in a future update. Core completion and hover functionality work excellently.

## File Format Issues

### PEP 621 Not Working

**Problem**: Tombo doesn't work in `pyproject.toml` files.

**Solutions**:

1. **Check section name**: Dependencies must be in `[project]` section

```toml title="Correct PEP 621 format"
[project]                               # ← Must be exactly this section
name = "my-project"
dependencies = [
    "requests>=2.31.0",                 # ← Tombo works here
]
```

2. **Verify file name**: Must be exactly `pyproject.toml`
3. **Check TOML syntax**: Invalid TOML breaks parsing

```toml title="Common syntax errors"
[project]
dependencies = [
    "requests>=2.31.0",                 # ✅ Good: proper quotes
    requests>=2.31.0,                   # ❌ Bad: missing quotes
    "requests>=2.31.0"                  # ❌ Bad: missing comma
]
```

### Poetry Format Issues

**Problem**: Inconsistent behavior with Poetry formats.

**Solutions by Format**:

1. **Poetry v1 (Recommended)**:

```toml title="Poetry v1 - Excellent support"
[tool.poetry.dependencies]             # ← Exact section name required
python = "^3.8"
requests = "^2.31.0"                   # ✅ Full completion + hover support
numpy = "~1.24.0"                      # ✅ All operators work perfectly
```

2. **Poetry v2 (Limited Support)**:

```toml title="Poetry v2 - Use with caution"
[tool.poetry.dependencies]
requests = "^2.31.0"                   # ✅ Standard syntax works perfectly
pandas = "pandas (>=2.0,<3.0)"         # ⚠️ Parentheses format has limitations:
                                       #     - Hover works ✅
                                       #     - Completion unreliable ⚠️
                                       #     - Manual typing recommended
```

**Recommendation**: Use Poetry v1 syntax for the best Tombo experience. Poetry v2 parentheses format is supported but may require more manual typing.

### Requirements.txt Issues

**Problem**: Tombo not working in requirements files.

**Solutions**:

1. **Check file patterns**: Tombo supports these patterns:
   - `requirements.txt`
   - `requirements-*.txt` (e.g., `requirements-dev.txt`)
   - `*.requirements`
   - `requirements*.in`

2. **Verify line format**:

```txt title="Supported requirements.txt syntax"
requests>=2.31.0                        # ✅ Basic constraint
numpy==1.24.3                           # ✅ Exact version
pandas~=2.0.0                           # ✅ Compatible release
# Comments are ignored                  # ✅ Comments OK
-e .                                    # ⚠️ Editable installs not supported
-r other-requirements.txt               # ⚠️ File references not supported
```

## Network and Connectivity Issues

### Proxy Configuration Problems

**Problem**: Tombo can't reach PyPI due to corporate proxy.

**Solutions**:

1. **Configure VS Code proxy settings**:

```json title="Corporate proxy setup"
{
    "http.proxy": "http://proxy.company.com:8080",
    "http.proxyStrictSSL": true,
    "http.proxyAuthorization": "Basic dXNlcjpwYXNz",  // base64 encoded user:pass
    "http.noProxy": "localhost,127.0.0.1,.local"
}
```

2. **Test proxy configuration**: Try accessing https://pypi.org in VS Code's integrated terminal

3. **Use system proxy**: VS Code can inherit system proxy settings

### Custom PyPI Index Issues

**Problem**: Using internal/corporate PyPI server.

**Solutions**:

1. **Configure custom index URL**:

```json title="Internal PyPI configuration"
{
    "tombo.pypiIndexUrl": "https://internal-pypi.company.com/simple/",
    "tombo.cache.ttl": 3600             // Shorter cache for internal updates
}
```

2. **Verify index accessibility**: Test URL in browser or curl
3. **Check authentication**: Some internal indexes require authentication

### SSL/Certificate Issues

**Problem**: SSL certificate errors when accessing PyPI.

**Solutions**:

1. **Disable strict SSL** (temporary solution):

```json title="SSL configuration"
{
    "http.proxyStrictSSL": false,       // Only for testing
    "https.rejectUnauthorized": false   // Only for testing
}
```

2. **Install certificates**: Add corporate certificates to system store
3. **Contact IT**: Get proper certificate configuration

## Performance Issues

### Slow Hover Response

**Problem**: Hover information takes several seconds to appear.

**Solutions**:

1. **Check network speed**: First hover requires network request
2. **Increase cache size**:

```json title="Performance optimization"
{
    "tombo.cache.maxSize": 2000,        // Increase cache size
    "tombo.cache.ttl": 604800,          // Longer cache (1 week)
    "tombo.debounceMs": 300             // Reduce hover sensitivity
}
```

3. **Use local PyPI mirror**: Faster than official PyPI

### High Memory Usage

**Problem**: VS Code uses excessive memory with Tombo enabled.

**Solutions**:

1. **Reduce cache size**:

```json title="Memory optimization"
{
    "tombo.cache.maxSize": 500,         // Smaller cache
    "tombo.cache.enabled": true,        // Keep caching for performance
    "tombo.logging.enabled": false      // Disable logging
}
```

2. **Restart VS Code**: Clears memory caches
3. **Check for memory leaks**: File issue if problem persists

## Debugging and Diagnostics

### Enable Debug Logging

When reporting issues, enable detailed logging:

```json title="Debug configuration"
{
    "tombo.logging.enabled": true,
    "tombo.logging.level": "debug",
    "tombo.logging.outputPanel": true
}
```

**View logs**: `View` → `Output` → Select "Tombo"

### Diagnostic Commands

Use VS Code Command Palette (`Ctrl+Shift+P`):

- **"Tombo: Clear Cache"** - Reset all cached data
- **"Tombo: Show Diagnostics"** - Display configuration and status
- **"Tombo: Reload Extension"** - Restart Tombo without reloading VS Code
- **"Developer: Reload Window"** - Full VS Code reload

### Collect Diagnostic Information

When filing bug reports, include:

1. **VS Code version**: `Help` → `About`
2. **Tombo version**: Check Extensions panel
3. **Operating system**: Windows/macOS/Linux and version
4. **Configuration**: Your `settings.json` Tombo settings
5. **Log output**: From Output panel with debug enabled
6. **Sample files**: Minimal reproduction case

## Getting Help

### Self-Service Resources

1. **[FAQ](faq.md)** - Frequently asked questions
2. **[Performance Guide](performance.md)** - Optimization tips
3. **[Configuration Guide](../getting-started/configuration.md)** - Settings reference

### Community Support

1. **GitHub Issues**: [Report bugs](https://github.com/benbenbang/tombo/issues)
2. **Discussions**: [Ask questions](https://github.com/benbenbang/tombo/discussions)
3. **VS Code Community**: [VS Code marketplace reviews](https://marketplace.visualstudio.com/items?itemName=tombo.tombo)

### Bug Reports

When filing issues, please include:

- ✅ **Tombo version** and VS Code version
- ✅ **Minimal reproduction case** (sample files)
- ✅ **Expected vs actual behavior**
- ✅ **Debug logs** if relevant
- ✅ **Operating system** and environment details

**Good bug report example**:
```
Title: Hover not working for Poetry dependencies

Environment:
- VS Code: 1.84.0
- Tombo: 1.0.0
- OS: Windows 11

Steps to reproduce:
1. Create pyproject.toml with Poetry dependencies
2. Hover over package name
3. No hover information appears

Expected: Rich package information
Actual: No response

Logs: [attach debug output]
Sample file: [attach pyproject.toml]
```

---

!!! tip "Quick Fix Checklist"
    Most Tombo issues can be resolved by:

    1. ✅ Restarting VS Code completely
    2. ✅ Clearing Tombo cache
    3. ✅ Checking internet connectivity
    4. ✅ Verifying file format and syntax
    5. ✅ Ensuring you're in supported file types

    Try these first before diving into detailed troubleshooting!
