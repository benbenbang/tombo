# Hover Information

Get comprehensive package details instantly without leaving your editor. Tombo's hover system provides rich metadata, version history, and direct links to help you make informed dependency decisions.

## Rich Package Metadata

### What You'll See

Hover over any package name to see:

**📦 Package Information:**
- Package name and description
- Current version you're using
- Latest available version
- Package maintainer and author information

**🐍 Python Compatibility:**
- Required Python versions
- Compatibility with your project's Python requirements
- Platform-specific information (Windows, macOS, Linux)

**📅 Version History:**
- Recent version releases with dates
- Version stability indicators
- Changelog and release notes links

**🔗 Quick Links:**
- Direct link to PyPI package page
- Documentation website
- Source code repository
- Issue tracker

## Format Support

### PEP 621 Projects

```toml title="pyproject.toml"
[project]
requires-python = ">=3.8"
dependencies = [
    "requests",             # ← Hover here for rich info
    "numpy>=1.24.0",        # ← Package + version constraint info
    "django~=4.2.0",        # ← See compatible versions
]
```

**Hover Response:**
```
📦 requests
HTTP library for Python

🏷️ Current: Not specified → Latest: 2.31.0
🐍 Python: >=3.7 (✅ Compatible with >=3.8)
📅 Released: Jul 12, 2023

Recent versions: 2.31.0, 2.30.0, 2.29.0
🔗 PyPI | Documentation | GitHub
```

### Poetry Projects

```toml title="pyproject.toml"
[tool.poetry.dependencies]
python = "^3.9"
fastapi = "^0.100.0"        # ← Hover for FastAPI info
uvicorn = {extras = ["standard"], version = "^0.20.0"}

[tool.poetry.group.dev.dependencies]
pytest = "^7.0"             # ← Development dependency info
```

### Requirements Files

```txt title="requirements.txt"
django>=4.2.0               # ← Web framework info
psycopg2-binary>=2.9.0      # ← Database adapter details
celery[redis]>=5.2.0        # ← Task queue with extras
```

## Advanced Information

### Version Analysis

**Constraint Evaluation:**
- Shows which versions match your constraints
- Highlights potential compatibility issues
- Suggests optimal version ranges
- Warns about deprecated or yanked versions

**Example Analysis:**
```toml
dependencies = ["numpy>=1.20.0,<2.0.0"]
```

**Hover Shows:**
```
📦 numpy
Numerical computing library

🏷️ Constraint: >=1.20.0,<2.0.0
✅ Latest matching: 1.24.3 (Jun 26, 2023)
🚧 Latest overall: 2.0.0rc1 (excluded by constraint)

Matching versions: 1.24.3, 1.24.2, 1.24.1, 1.23.5
⚠️ Note: v2.0.0 available but excluded by <2.0.0
```

### Dependency Extras

**Extra Information Display:**
```toml
dependencies = [
    "fastapi[all]",         # ← Shows available extras
    "sqlalchemy[postgresql,asyncio]"  # ← Multiple extras info
]
```

**Hover Response:**
```
📦 fastapi[all]
Modern web framework for Python

🏷️ Current: [all] extras selected
📦 Extras included: all (uvicorn, jinja2, python-multipart, ...)

Available extras:
• all - Complete FastAPI experience
• standard - Basic FastAPI with common deps
• dev - Development dependencies
```

## Smart Context Awareness

### Python Version Compatibility

**Project Context:**
```toml title="pyproject.toml"
[project]
requires-python = ">=3.8"   # ← Affects compatibility display
```

**Hover Adaptation:**
- ✅ **Compatible** - Green indicators for usable versions
- ❌ **Incompatible** - Red warnings for unsupported versions
- 🚧 **Partial** - Yellow cautions for edge cases

### Environment Integration

**Virtual Environment Detection:**
- Shows versions installed in current environment
- Compares with PyPI latest versions
- Indicates if updates are available
- Warns about version mismatches

## Performance Features

### Smart Caching

**Multi-tier Caching:**
1. **Instant Response** - Cached packages load in ~5-10ms
2. **Background Updates** - Refreshes stale data quietly
3. **Offline Capability** - Works without internet after initial fetch

**Cache Behavior:**
- **First hover** - Fetches fresh data from PyPI (~200-500ms)
- **Subsequent hovers** - Instant from memory/disk cache
- **Auto-refresh** - Updates stale data (configurable TTL)

### Network Optimization

**Efficient Data Fetching:**
- **Batch requests** - Multiple packages loaded together
- **Incremental updates** - Only new data downloaded
- **Compressed responses** - Faster data transfer
- **Connection pooling** - Reuses network connections

## Customization

### Display Preferences

Configure what information appears in hover tooltips:

```json title="VS Code Settings"
{
    "tombo.hover.showVersionHistory": true,
    "tombo.hover.showCompatibility": true,
    "tombo.hover.showLinks": true,
    "tombo.hover.maxRecentVersions": 5
}
```

### Information Density

**Compact Mode:**
```json
{
    "tombo.hover.compact": true  // Shorter, essential info only
}
```

**Detailed Mode:**
```json
{
    "tombo.hover.detailed": true  // Full metadata display
}
```

## Keyboard Navigation

### Hover Triggers

**Mouse Hover:**
- Simply hover over package names
- Works in all supported file types
- Automatic activation and dismissal

**Keyboard Hover:**
- **Windows/Linux:** `Ctrl+K Ctrl+I`
- **macOS:** `Cmd+K Cmd+I`
- Position cursor on package name, then use shortcut

### Link Navigation

**In Hover Tooltip:**
- **Click links** - Opens in default browser
- **Ctrl+Click** - Opens in new browser tab
- **Copy link** - Right-click context menu

## Real-World Examples

### Web Development

```toml title="FastAPI Project"
[project]
dependencies = [
    "fastapi",              # ← See web framework details
    "uvicorn[standard]",    # ← ASGI server with extras
    "pydantic>=2.0.0",      # ← Data validation v2 info
    "sqlalchemy>=2.0.0",    # ← Modern ORM features
]
```

**Hover Benefits:**
- Check FastAPI latest features and breaking changes
- Understand Uvicorn extras and performance implications
- Verify Pydantic v2 compatibility and migration requirements
- See SQLAlchemy 2.0 improvements and async support

### Data Science

```toml title="ML Project"
[project]
dependencies = [
    "numpy",                # ← Core numerical computing
    "pandas>=2.0.0",        # ← DataFrame library updates
    "scikit-learn",         # ← ML algorithms and tools
    "matplotlib>=3.7.0",    # ← Plotting and visualization
]
```

**Information Value:**
- NumPy version compatibility with other scientific packages
- Pandas 2.0 performance improvements and breaking changes
- Scikit-learn algorithm updates and new features
- Matplotlib rendering backends and figure formats

## Troubleshooting

### Hover Not Appearing

**Common Issues:**

1. **File type** - Ensure you're in supported files
2. **Package name** - Check spelling and case sensitivity
3. **Network** - First hover requires internet connection
4. **VS Code settings** - Verify hover is enabled globally

**Quick Fixes:**

```json title="VS Code Settings"
{
    "editor.hover.enabled": true,
    "editor.hover.delay": 300,
    "tombo.hover.enabled": true
}
```

### Incomplete Information

**Potential Causes:**

- **New packages** - Recently published packages may have limited metadata
- **Private packages** - Internal packages won't have PyPI information
- **Network issues** - Timeout or connectivity problems
- **Cache corruption** - Clear cache via Command Palette

### Performance Issues

**Optimization Steps:**

1. **Check network speed** - Slow connections affect first hover
2. **Clear cache** - Command Palette: "Tombo: Clear Cache"
3. **Reduce hover delay** - Faster response in editor settings
4. **Check system resources** - High CPU/memory usage affects performance

## Integration Tips

### With Other Extensions

**Python Extension:**
- Works alongside official Python extension
- Complements IntelliSense and code navigation
- Shares Python environment detection

**GitLens:**
- Package information complements code history
- See when dependencies were added/changed
- Track package version evolution

### Development Workflow

**Dependency Research:**
1. **Hover first** - Get quick overview
2. **Click PyPI link** - Detailed documentation
3. **Check GitHub** - Source code and issues
4. **Read changelogs** - Breaking changes and new features

**Version Selection:**
1. **Hover current** - See what you have
2. **Compare latest** - Check for updates
3. **Review compatibility** - Python version requirements
4. **Update gradually** - Test changes incrementally

---

## Next Steps

Explore related Tombo features:

- **[Version Completion →](version-completion.md)** - Intelligent version suggestions
- **[Smart Caching →](smart-caching.md)** - Performance optimization
- **[Configuration →](../getting-started/configuration.md)** - Customize hover behavior
