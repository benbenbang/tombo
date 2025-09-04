# Poetry Projects

Poetry is a modern dependency management and packaging tool for Python. Tombo provides excellent support for Poetry projects with intelligent version completion and hover information.

## Poetry v1 Format

Poetry v1 uses a clean, straightforward syntax that Tombo supports perfectly.

### Basic Dependencies

```toml title="pyproject.toml"
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.28.0"           # ← Caret constraints work perfectly
click = "~8.1.0"               # ← Tilde constraints supported
fastapi = ">=0.95.0,<1.0.0"    # ← Range constraints
django = "4.2.7"               # ← Exact versions
```

**Completion Behavior:**

- **Between quotes**: `"^2.|"` triggers version completion
- **After operators**: `">=|"` shows available versions
- **Version ranges**: `">=0.95.0,<|"` completes second constraint

### Development Dependencies

```toml title="pyproject.toml"
[tool.poetry.group.dev.dependencies]
pytest = "^7.0"                # ← Test framework
black = "^23.0"                # ← Code formatter
isort = "^5.12.0"              # ← Import sorter
mypy = "^1.5.0"                # ← Type checker

[tool.poetry.group.docs.dependencies]
mkdocs = "^1.5.0"              # ← Documentation
mkdocs-material = "^9.4.0"     # ← Material theme
```

**Group Benefits:**

- **Organized dependencies** - Separate concerns clearly
- **Selective installation** - `poetry install --without docs`
- **Tombo support** - Full completion in all dependency groups

### Optional Dependencies with Extras

```toml title="pyproject.toml"
[tool.poetry.dependencies]
sqlalchemy = "^2.0.0"          # ← Core ORM
psycopg2 = {version = "^2.9.0", optional = true}
asyncpg = {version = "^0.28.0", optional = true}

[tool.poetry.extras]
postgresql = ["psycopg2"]
async-postgresql = ["asyncpg"]
all-db = ["psycopg2", "asyncpg"]
```

**Extras Usage:**

```bash
# Install with specific database support
poetry install -E postgresql

# Install all optional dependencies
poetry install -E all-db
```

## Poetry v2 Format

Poetry v2 introduced parentheses syntax for more complex constraints.

### Parentheses Constraints

```toml title="pyproject.toml"
[tool.poetry.dependencies]
python = "^3.9"
numpy = "^1.24.0"
pandas = "(>=2.0,<3.0)"        # ← Parentheses format
scipy = "(>=1.10,!=1.11.0)"    # ← Exclusion in parentheses
```

**Note:** Tombo supports Poetry v2 but completion works best with operators (`>=`, `<`, `!=`) rather than parentheses.

### Complex Constraints

```toml title="pyproject.toml"
[tool.poetry.dependencies]
# Multi-constraint examples
tensorflow = [
    {version = "^2.13.0", python = "^3.9"},
    {version = "^2.12.0", python = "^3.8"}
]

# Platform-specific dependencies
pywin32 = {version = "^306", markers = "sys_platform == 'win32'"}
```

## Real-World Poetry Examples

### Web API Project

```toml title="FastAPI + Poetry Setup"
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"           # ← Modern web framework
uvicorn = {extras = ["standard"], version = "^0.24.0"}
pydantic = "^2.4.0"            # ← Data validation v2
sqlalchemy = "^2.0.0"          # ← Modern ORM
alembic = "^1.12.0"            # ← Database migrations
python-jose = "^3.3.0"        # ← JWT handling
passlib = "^1.7.4"            # ← Password hashing

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.0"
httpx = "^0.25.0"              # ← Async HTTP client for testing
```

### Data Science Project

```toml title="ML/Data Science Stack"
[tool.poetry.dependencies]
python = "^3.11"
numpy = "^1.25.0"              # ← Numerical computing
pandas = "^2.1.0"              # ← Data manipulation
scikit-learn = "^1.3.0"        # ← Machine learning
matplotlib = "^3.7.0"          # ← Plotting
seaborn = "^0.12.0"            # ← Statistical visualization
jupyter = "^1.0.0"             # ← Interactive notebooks

[tool.poetry.group.gpu.dependencies]
torch = "^2.1.0"               # ← Deep learning
torchvision = "^0.16.0"        # ← Computer vision
```

### Package Development

```toml title="Library Development Setup"
[tool.poetry.dependencies]
python = "^3.8"                # ← Broad compatibility

[tool.poetry.group.dev.dependencies]
pytest = "^7.0"
pytest-cov = "^4.1.0"         # ← Coverage reporting
black = "^23.0"                # ← Code formatting
isort = "^5.12.0"              # ← Import organization
mypy = "^1.5.0"                # ← Type checking
pre-commit = "^3.4.0"          # ← Git hooks

[tool.poetry.group.docs.dependencies]
sphinx = "^7.1.0"              # ← Documentation
furo = "^2023.8.19"            # ← Clean Sphinx theme

[tool.poetry.group.release.dependencies]
twine = "^4.0.2"               # ← PyPI publishing
build = "^1.0.0"               # ← Modern build tool
```

## Poetry Commands Integration

### Installation Commands

```bash
# Basic installation
poetry install

# Skip development dependencies
poetry install --only main

# Install specific groups
poetry install --with docs,test

# Install with extras
poetry install -E all-db

# Update dependencies
poetry update
```

### Development Workflow

```bash
# Add dependencies (Tombo helps choose versions)
poetry add requests>=2.28.0

# Add to development group
poetry add pytest --group dev

# Add with extras
poetry add fastapi[all]

# Add with constraints
poetry add "django>=4.2,<5.0"
```

## Tombo Integration Features

### Version Completion

**Poetry v1 Perfect Support:**

1. **Position cursor** between quotes: `"^2.|"`
2. **Type constraint** operators: `>=`, `~=`, `^`, `~`
3. **Get instant suggestions** from Tombo's cache
4. **Select version** from dropdown

### Hover Information

**Rich Poetry Context:**

- **Current constraint** analysis and version matching
- **Available versions** with Poetry compatibility
- **Dependency resolution** insights
- **Installation commands** for Poetry

### Quick Actions

**Right-click Enhancements:**

- **Update to latest** - Maintains Poetry constraint style
- **Change constraint type** - Convert between `^`, `~=`, `>=`
- **Add to different group** - Move between main/dev/docs
- **Lock file sync** - Compare with `poetry.lock`

## Best Practices

### Constraint Strategy

**Recommended Approach:**

```toml
[tool.poetry.dependencies]
# Production dependencies - conservative
django = "~4.2.0"              # Patch updates only
psycopg2 = "^2.9.0"            # Minor updates OK

# Development tools - more flexible
[tool.poetry.group.dev.dependencies]
pytest = "^7.0"                # Allow minor updates
black = "*"                    # Always latest (dev only)
```

### Dependency Organization

**Group Strategy:**

```toml
[tool.poetry.dependencies]
# Core application dependencies only

[tool.poetry.group.dev.dependencies]
# Testing, linting, formatting

[tool.poetry.group.docs.dependencies]
# Documentation building

[tool.poetry.group.release.dependencies]
# Publishing and deployment tools
```

### Version Management

**Lock File Workflow:**

1. **Use ranges** in `pyproject.toml` for flexibility
2. **Commit `poetry.lock`** for reproducible builds
3. **Update regularly** with `poetry update`
4. **Test after updates** to catch breaking changes

## Troubleshooting

### Common Issues

**Completion not working:**

- **Check file name** - Must be exactly `pyproject.toml`
- **Cursor position** - Between quotes or after operators
- **Poetry format** - v1 works perfectly, v2 needs operators
- **Network access** - First completion requires internet

**Hover information missing:**

- **Package exists** on PyPI (private packages won't work)
- **Correct spelling** and case sensitivity
- **Poetry section** - Ensure proper TOML structure
- **Cache refresh** - Clear Tombo cache if stale

### Performance Tips

**Faster Completion:**

- **Enable caching** - Default settings are optimized
- **Use specific versions** - `"^2.28"` instead of `"^2"`
- **Group related additions** - Add multiple packages together
- **Pre-warm cache** - Hover over packages before editing

---

## Next Steps

Learn more about Poetry integration:

- **[Version Completion →](../features/version-completion.md)** - Detailed completion behavior
- **[Hover Information →](../features/hover-information.md)** - Rich package metadata
- **[Real-world Workflows →](workflows.md)** - Complete development examples
