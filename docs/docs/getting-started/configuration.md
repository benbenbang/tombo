# Configuration

Customize Tombo to fit your development workflow. All settings are accessible through VS Code's settings UI or directly in your `settings.json`.

## Accessing Settings

### Via Settings UI (Recommended)

1. **Open VS Code Settings**: `Ctrl+,` (Windows/Linux) or `Cmd+,` (macOS)
2. **Search for "Tombo"** in the settings search bar
3. **Modify settings** using the UI controls

### Via JSON Configuration

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. **Type**: `Preferences: Open User Settings (JSON)`
3. **Add Tombo settings** to your `settings.json`

## Core Settings

### PyPI Index Configuration

Configure which PyPI server Tombo uses for package information:

```json title="settings.json"
{
    "tombo.pypiIndexUrl": "https://pypi.org/simple/",
    "tombo.listPreReleases": false
}
```

**`tombo.pypiIndexUrl`**
:   **Default**: `https://pypi.org/simple/`
:   **Description**: PyPI index server URL for package lookups
:   **Options**: Any PyPI-compatible index (PyPI, corporate mirrors, etc.)

**`tombo.listPreReleases`**
:   **Default**: `false`
:   **Description**: Include pre-release versions (alpha, beta, rc) in completion
:   **Options**: `true` to show pre-releases, `false` to hide them

!!! tip "Custom PyPI Indexes"
    For corporate environments, you can point Tombo to your internal PyPI mirror:
    ```json
    "tombo.pypiIndexUrl": "https://internal-pypi.company.com/simple/"
    ```

### Caching Settings

Control how Tombo caches package information:

```json title="settings.json"
{
    "tombo.cache.enabled": true,
    "tombo.cache.ttl": 86400,
    "tombo.cache.maxSize": 1000
}
```

**`tombo.cache.enabled`**
:   **Default**: `true`
:   **Description**: Enable smart caching for better performance
:   **Options**: `true` for caching, `false` to always fetch fresh data

**`tombo.cache.ttl`**
:   **Default**: `86400` (24 hours)
:   **Description**: Cache time-to-live in seconds
:   **Options**: Any positive integer (3600 = 1 hour, 86400 = 24 hours)

**`tombo.cache.maxSize`**
:   **Default**: `1000`
:   **Description**: Maximum number of packages to cache
:   **Options**: Any positive integer

### Visual Decorations

Customize how Tombo displays compatibility information:

```json title="settings.json"
{
    "tombo.compatibleDecorator": "✅",
    "tombo.incompatibleDecorator": "❌",
    "tombo.decorations.enabled": true
}
```

**`tombo.compatibleDecorator`**
:   **Default**: `✅`
:   **Description**: Icon shown next to compatible package versions
:   **Options**: Any emoji or text string

**`tombo.incompatibleDecorator`**
:   **Default**: `❌`
:   **Description**: Icon shown next to incompatible package versions
:   **Options**: Any emoji or text string

**`tombo.decorations.enabled`**
:   **Default**: `true`
:   **Description**: Show visual decorators in the editor
:   **Options**: `true` to show decorators, `false` to hide them

### Logging and Debug

Configure Tombo's logging behavior:

```json title="settings.json"
{
    "tombo.logging.enabled": false,
    "tombo.logging.level": "info"
}
```

**`tombo.logging.enabled`**
:   **Default**: `false`
:   **Description**: Enable debug logging to VS Code output panel
:   **Options**: `true` for debugging, `false` for production (recommended)

**`tombo.logging.level`**
:   **Default**: `"info"`
:   **Description**: Logging verbosity level
:   **Options**: `"error"`, `"warn"`, `"info"`, `"debug"`

!!! warning "Logging Performance Impact"
    Enabling detailed logging can impact performance. Only enable for troubleshooting.

## Configuration Profiles

### Development Profile

For active development with frequent package exploration:

```json title="settings.json"
{
    "tombo.pypiIndexUrl": "https://pypi.org/simple/",
    "tombo.listPreReleases": true,
    "tombo.cache.ttl": 3600,
    "tombo.logging.enabled": true,
    "tombo.logging.level": "info"
}
```

**Benefits:**
- See pre-release packages
- Shorter cache for fresh data
- Logging enabled for debugging

### Production Profile

For stable development environments:

```json title="settings.json"
{
    "tombo.pypiIndexUrl": "https://pypi.org/simple/",
    "tombo.listPreReleases": false,
    "tombo.cache.ttl": 86400,
    "tombo.logging.enabled": false
}
```

**Benefits:**
- Stable releases only
- Long cache for performance
- No logging overhead

### Corporate Profile

For enterprise environments with internal PyPI:

```json title="settings.json"
{
    "tombo.pypiIndexUrl": "https://internal-pypi.company.com/simple/",
    "tombo.listPreReleases": false,
    "tombo.cache.ttl": 43200,
    "tombo.compatibleDecorator": "✓",
    "tombo.incompatibleDecorator": "✗"
}
```

**Benefits:**
- Internal package repository
- Conservative visual indicators
- 12-hour cache for internal stability

## Advanced Configuration

### Network Settings

Tombo respects VS Code's network settings:

```json title="settings.json"
{
    "http.proxy": "http://proxy.company.com:8080",
    "http.proxyAuthorization": "Basic <encoded-credentials>",
    "http.proxyStrictSSL": true
}
```

### File Association

Extend Tombo support to custom file patterns:

```json title="settings.json"
{
    "files.associations": {
        "*.requirements": "pip-requirements",
        "*.deps": "pip-requirements"
    }
}
```

### Performance Tuning

For large projects or slower systems:

```json title="settings.json"
{
    "tombo.cache.maxSize": 2000,
    "tombo.cache.ttl": 604800,
    "tombo.debounceMs": 500
}
```

**Benefits:**
- Larger cache for big projects
- Week-long cache duration
- Slower debounce for less aggressive requests

## Workspace vs User Settings

### User Settings
Global settings that apply to all VS Code workspaces:

- Go to **File > Preferences > Settings** (or `Ctrl+,`)
- Configure in the **User** tab
- Settings saved to `~/.config/Code/User/settings.json`

### Workspace Settings
Project-specific settings that only apply to the current workspace:

- Go to **File > Preferences > Settings** (or `Ctrl+,`)
- Configure in the **Workspace** tab
- Settings saved to `.vscode/settings.json` in your project

!!! tip "Best Practice"
    Use **User settings** for personal preferences (decorators, logging) and **Workspace settings** for project-specific needs (internal PyPI, pre-releases).

## Environment Variables

Tombo also supports environment variable configuration:

```bash title="Environment Variables"
export TOMBO_PYPI_INDEX="https://internal-pypi.company.com/simple/"
export TOMBO_CACHE_TTL="43200"
export TOMBO_LOG_LEVEL="debug"
```

!!! note "Priority Order"
    Settings are applied in this order:
    1. Environment variables (highest priority)
    2. Workspace settings
    3. User settings
    4. Default values (lowest priority)

## Troubleshooting Configuration

### Settings Not Taking Effect

1. **Restart VS Code** after changing settings
2. **Check for typos** in setting names or values
3. **Verify JSON syntax** in manual settings.json edits
4. **Check the VS Code output panel** for Tombo errors

### Cache Issues

To reset Tombo's cache:

1. **Open Command Palette**: `Ctrl+Shift+P`
2. **Run**: `Tombo: Clear Cache`
3. **Or restart VS Code** to clear memory cache

### Network Configuration Issues

If Tombo can't reach PyPI:

1. **Check your internet connection**
2. **Verify proxy settings** in VS Code
3. **Test the PyPI URL** in a browser
4. **Check corporate firewall** settings

## Next Steps

With Tombo configured to your preferences:

- **[Explore all features](../features/overview.md)** - Learn what Tombo can do
- **[See usage examples](../examples/pep621.md)** - Apply Tombo to different project types
- **[Read troubleshooting](../troubleshooting/common-issues.md)** - Solve common problems

---

!!! question "Need Help?"
    Can't find the setting you need? [Check our FAQ](../troubleshooting/faq.md) or [file an issue](https://github.com/benbenbang/tombo/issues) for configuration support.
