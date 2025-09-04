# Version Completion

Experience intelligent version suggestions that adapt to your project's needs. Tombo's version completion system understands Python packaging constraints and provides contextually relevant suggestions.

## How It Works

Tombo's version completion triggers when you type constraint operators, providing smart suggestions based on:

- **Package availability** on PyPI
- **Python version compatibility** with your project
- **Constraint type** you're using
- **Release stability** (stable, pre-release, yanked)

## Trigger Characters

Version completion activates automatically when you type these operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `>=` | Greater than or equal | `numpy>=` |
| `==` | Exactly equal | `django==` |
| `~=` | Compatible release | `requests~=` |
| `!=` | Not equal (exclusion) | `urllib3!=` |
| `>` | Greater than | `python>` |
| `<` | Less than | `setuptools<` |
| `^` | Caret (Poetry) | `click^` |
| `~` | Tilde (Poetry) | `fastapi~` |

## Format Support

### PEP 621 Dependencies

```toml title="pyproject.toml"
[project]
dependencies = [
    "requests>=",           # ← Type here for version completion
    "numpy==",              # ← Exact version suggestions
    "django~=4.0",          # ← Compatible release options
]

[project.optional-dependencies]
dev = [
    "pytest>=7.",           # ← Shows 7.x versions
    "black>=23.0.0",        # ← Recent formatting versions
]
```

### Poetry Dependencies

```toml title="pyproject.toml"
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2."            # ← Caret constraint completion
click = "~8.1"              # ← Tilde constraint completion
httpx = ">=0.24.0,<1.0"     # ← Complex constraints supported

[tool.poetry.group.dev.dependencies]
pytest = "^7.0"             # ← Development dependencies
```

### Requirements Files

```txt title="requirements.txt"
requests>=2.               # ← Traditional pip constraints
numpy==1.24.               # ← Specific version families
django~=4.2.0              # ← Compatible release operator
pytest>=7.0,<8.0           # ← Range constraints
```

## Completion Features

### Smart Filtering

**Version Relevance:**

- **Latest versions first** - Most recent stable releases prioritized
- **Stability indicators** - Stable, pre-release, and yanked versions marked
- **Compatibility filtering** - Only shows Python-compatible versions
- **Constraint-aware** - Understands semantic versioning rules

**Visual Indicators:**

- ✅ **Stable versions** - Recommended choices
- 🚧 **Pre-release versions** - Alpha, beta, release candidates
- ❌ **Yanked versions** - Deprecated or problematic releases
- 📅 **Release dates** - Recency information

### Contextual Intelligence

**Project Awareness:**

```toml title="pyproject.toml"
[project]
requires-python = ">=3.8"   # ← Affects version filtering

dependencies = [
    "numpy>=",               # ← Only shows Python 3.8+ compatible versions
]
```

**Constraint Understanding:**

- **Caret (`^`)** - Shows major-version compatible releases
- **Tilde (`~`)** - Shows patch-version compatible releases
- **Range constraints** - Respects complex version expressions
- **Exclusions** - Avoids showing explicitly excluded versions

## Performance Features

### Smart Caching

**Multi-level Caching:**

1. **Memory Cache** - Instant access during VS Code session
2. **Disk Cache** - Persistent between sessions (24h TTL)
3. **Incremental Updates** - Only fetches new versions when needed

**Cache Behavior:**

- **First completion** - ~200-500ms (fetches from PyPI)
- **Subsequent completions** - ~5-10ms (instant from cache)
- **Offline capability** - Works without internet after initial fetch
- **Smart invalidation** - Refreshes stale data automatically

### Network Optimization

**Efficient API Usage:**

- **Batch requests** - Multiple packages in single API call when possible
- **Incremental fetching** - Only downloads new version data
- **Rate limiting** - Respectful PyPI API usage
- **Retry logic** - Robust error handling with exponential backoff

## Advanced Usage

### Manual Trigger

Force completion when automatic triggering doesn't work:

**Keyboard Shortcuts:**
- **Windows/Linux**: `Ctrl+Space`
- **macOS**: `Cmd+Space`

### Multi-Constraint Completion

Handle complex version expressions:

```toml
dependencies = [
    "django>=4.0,<5.0",     # ← Completion works after first >=
    "requests>=2.28,!=2.29.0", # ← Supports exclusion patterns
]
```

### Pre-release Control

Configure pre-release visibility in VS Code settings:

```json title="settings.json"
{
    "tombo.listPreReleases": false  // Hide alpha/beta versions
}
```

## Troubleshooting

### Completion Not Triggering

**Common Issues:**

1. **Wrong file type** - Ensure you're in supported files
2. **Cursor position** - Must be immediately after constraint operator
3. **Network issues** - First completion requires internet access
4. **Invalid syntax** - Fix TOML/requirements syntax errors

**Solutions:**

```toml title="Correct positioning"
dependencies = [
    "requests>=|",          # ← Cursor here triggers completion
    "numpy==1.24.|",        # ← Or here for specific series
]
```

### Slow Completion

**Performance Optimization:**

1. **Check network speed** - Initial fetches depend on connection
2. **Clear cache if corrupted** - Use Command Palette: "Tombo: Clear Cache"
3. **Reduce completion scope** - Use more specific version prefixes

### Missing Versions

**Troubleshooting Steps:**

1. **Verify package name** - Check spelling and case
2. **Check Python compatibility** - Some versions may be filtered
3. **Enable pre-releases** - May be hidden by settings
4. **Refresh cache** - Package may have new versions

## Best Practices

### Efficient Workflow

**Recommended Approach:**

1. **Start broad** - Type `package>=` for latest versions
2. **Refine constraints** - Add specific version ranges as needed
3. **Use hover** - Check package info before final selection
4. **Test compatibility** - Verify versions work in your environment

### Version Strategy

**Constraint Selection:**

- **`>=x.y.z`** - Allow future updates, good for libraries
- **`~=x.y.z`** - Compatible releases, balanced approach
- **`==x.y.z`** - Exact versions, maximum reproducibility
- **`^x.y.z`** - Major version compatibility (Poetry)

### Team Collaboration

**Consistent Dependencies:**

```toml title="Team-friendly constraints"
[project]
dependencies = [
    # Production dependencies - conservative constraints
    "django~=4.2.0",        # Patch updates only
    "psycopg2>=2.9.0,<3.0", # Major version range

    # Development flexibility
    "requests>=2.28.0",     # Allow minor updates
]
```

## Integration Tips

### With Other Tools

**Poetry Integration:**
- Works alongside `poetry install` and `poetry update`
- Respects Poetry's version resolution
- Supports Poetry-specific constraint syntax

**Pip Integration:**
- Compatible with `pip install -r requirements.txt`
- Supports all pip constraint formats
- Works with virtual environments

### CI/CD Compatibility

**Reproducible Builds:**
- Use lock files (`poetry.lock`, `requirements.lock`) for exact versions
- Keep source files (`pyproject.toml`, `requirements.txt`) with ranges
- Let Tombo help maintain source file constraints

---

## Next Steps

Ready to explore more Tombo features?

- **[Hover Information →](hover-information.md)** - Rich package metadata
- **[Smart Caching →](smart-caching.md)** - Performance optimization
- **[Configuration →](../getting-started/configuration.md)** - Customize completion behavior
