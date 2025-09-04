# Requirements.txt Files

Traditional `requirements.txt` files remain a cornerstone of Python dependency management. Tombo provides comprehensive support for all requirements file formats with intelligent completion and validation.

## Standard Requirements Format

### Basic Syntax

```txt title="requirements.txt"
# Basic package requirements
requests
numpy
pandas

# Version constraints
django>=4.2.0              # ← Completion after >=
flask==2.3.3               # ← Exact version completion
fastapi~=0.104.0           # ← Compatible release completion
```

**Completion Triggers:**

- **After operators**: `numpy>=|` shows available versions
- **In version strings**: `django==4.2.|` shows patch versions
- **Range constraints**: `flask>=2.0,<3.|` completes upper bound

### Version Specifiers

```txt title="version-constraints.txt"
# Comparison operators
requests>=2.28.0           # Greater than or equal
urllib3<2.0                # Less than
certifi!=2023.5.7          # Not equal (exclusion)
charset-normalizer>3.0     # Greater than

# Compatible release
setuptools~=68.0.0         # Equivalent to >=68.0.0, ==68.*

# Exact versions
pip==23.2.1                # Pin to specific version
wheel==0.41.2              # Exact match only
```

### Complex Constraints

```txt title="complex-requirements.txt"
# Multiple constraints
Django>=4.2.0,<5.0.0       # Version range
requests>=2.28.0,!=2.29.0  # Exclude specific version
numpy>=1.24.0,<2.0.0       # Major version boundary

# Pre-release handling
tensorflow>=2.13.0         # Stable only
torch>=2.0.0a0             # Include pre-releases
```

## File Variants

### Development Requirements

```txt title="requirements-dev.txt"
# Include base requirements
-r requirements.txt

# Development tools
pytest>=7.4.0              # ← Testing framework
black>=23.7.0               # ← Code formatter
isort>=5.12.4               # ← Import sorter
mypy>=1.5.1                 # ← Type checker
pre-commit>=3.3.3           # ← Git hooks

# Documentation
sphinx>=7.1.2
furo>=2023.8.19
```

**Usage:**
```bash
pip install -r requirements-dev.txt
```

### Production vs Development

```txt title="requirements-prod.txt"
# Production dependencies only (no dev tools)
django==4.2.7              # Pinned for stability
psycopg2-binary==2.9.7     # Database adapter
gunicorn==21.2.0            # WSGI server
redis==5.0.1                # Caching
celery==5.3.4               # Task queue
```

```txt title="requirements-test.txt"
# Test dependencies
-r requirements.txt

# Testing frameworks
pytest==7.4.3
pytest-django==4.5.2
pytest-cov==4.1.0
factory-boy==3.3.0
responses==0.23.3
```

## Advanced Features

### Environment Markers

```txt title="platform-requirements.txt"
# Platform-specific dependencies
pywin32>=306; sys_platform == "win32"      # Windows only
macholib>=1.16; sys_platform == "darwin"   # macOS only

# Python version specific
dataclasses>=0.8; python_version < "3.7"   # Backport for old Python
typing-extensions>=4.0; python_version < "3.8"

# Combined conditions
uvloop>=0.17.0; sys_platform != "win32" and python_version >= "3.7"
```

### Extras Installation

```txt title="extras-requirements.txt"
# Package with extras
fastapi[all]>=0.104.0       # All optional dependencies
sqlalchemy[postgresql]>=2.0.0  # PostgreSQL support only
requests[security]>=2.28.0  # Security-related extras

# Multiple extras
django[argon2,bcrypt]>=4.2.0    # Multiple password hashers
```

### Hash Verification

```txt title="requirements-locked.txt"
# Locked requirements with hashes for security
django==4.2.7 \
    --hash=sha256:8e0f1c2c2f7c8b7a1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z \
    --hash=sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5

requests==2.31.0 \
    --hash=sha256:58cd2187c01e70e6e26505bca751777aa9f2ee0b7f4300988b709f44e013003f \
    --hash=sha256:942c5a758f98d790eaed1a29cb6eefc7ffb0d1cf7af05c3d2791656dbd6ad1e1
```

**Generate hashes:**
```bash
pip-compile --generate-hashes requirements.in
```

## Real-World Examples

### Web Application

```txt title="web-app-requirements.txt"
# Web framework
Django>=4.2.0,<5.0.0        # ← LTS version range
djangorestframework>=3.14.0  # ← API framework

# Database
psycopg2-binary>=2.9.0      # ← PostgreSQL adapter
redis>=4.5.0                # ← Caching and sessions

# Production server
gunicorn>=21.0.0            # ← WSGI server
whitenoise>=6.5.0           # ← Static file serving

# Monitoring
sentry-sdk>=1.32.0          # ← Error tracking
django-debug-toolbar>=4.2.0 # ← Development debugging

# Environment
python-dotenv>=1.0.0        # ← Environment variables
```

### Data Science Stack

```txt title="data-science-requirements.txt"
# Core data libraries
numpy>=1.25.0               # ← Numerical computing
pandas>=2.1.0               # ← Data manipulation
scipy>=1.11.0               # ← Scientific computing

# Machine learning
scikit-learn>=1.3.0         # ← ML algorithms
xgboost>=1.7.0              # ← Gradient boosting
lightgbm>=4.1.0             # ← Fast ML framework

# Visualization
matplotlib>=3.7.0           # ← Basic plotting
seaborn>=0.12.0             # ← Statistical plots
plotly>=5.17.0              # ← Interactive plots

# Jupyter ecosystem
jupyter>=1.0.0              # ← Notebook interface
ipywidgets>=8.1.0           # ← Interactive widgets
```

### API Development

```txt title="api-requirements.txt"
# Modern API framework
fastapi>=0.104.0            # ← Async web framework
uvicorn[standard]>=0.24.0   # ← ASGI server with extras

# Data validation
pydantic>=2.4.0             # ← Data models v2
email-validator>=2.0.0      # ← Email validation

# Authentication
python-jose[cryptography]>=3.3.0  # ← JWT tokens
passlib[bcrypt]>=1.7.4      # ← Password hashing

# Database ORM
sqlalchemy>=2.0.0           # ← Modern ORM
alembic>=1.12.0             # ← Database migrations

# HTTP client
httpx>=0.25.0               # ← Async HTTP client
```

### Testing Requirements

```txt title="requirements-test.txt"
# Base application requirements
-r requirements.txt

# Testing framework
pytest>=7.4.0              # ← Test runner
pytest-asyncio>=0.21.0     # ← Async testing
pytest-cov>=4.1.0          # ← Coverage reporting
pytest-mock>=3.11.1        # ← Mocking utilities

# Test data
factory-boy>=3.3.0          # ← Test fixtures
faker>=19.6.0               # ← Fake data generation
responses>=0.23.0           # ← HTTP mocking

# Performance testing
pytest-benchmark>=4.0.0    # ← Performance tests
memory-profiler>=0.61.0     # ← Memory usage tracking
```

## Tombo Integration

### Intelligent Completion

**Completion Behavior:**

1. **Type constraint** operators (`>=`, `==`, `~=`, `!=`, `>`, `<`)
2. **Get instant suggestions** from PyPI via smart caching
3. **Select appropriate version** from filtered list
4. **See compatibility indicators** based on Python version

### Format Support

**File Recognition:**

- `requirements.txt` - Standard requirements
- `requirements-*.txt` - Any requirements variant
- `dev-requirements.txt` - Development dependencies
- `test-requirements.txt` - Testing dependencies
- `requirements/*.txt` - Requirements in subdirectories

### Hover Information

**Rich Package Details:**

- **Latest version** information and release date
- **Python compatibility** with your project requirements
- **Package description** and maintainer info
- **Direct links** to PyPI, documentation, and source code

### Quick Actions

**Right-click Features:**

- **Update to latest** - Maintains constraint style
- **Change constraint type** - Convert between operators
- **Pin exact version** - Convert ranges to exact versions
- **Add version hash** - Security verification

## Best Practices

### Requirements Organization

**Structured Approach:**

```
project/
├── requirements/
│   ├── base.txt           # Core dependencies
│   ├── development.txt    # Dev tools
│   ├── production.txt     # Production-only
│   └── testing.txt        # Test dependencies
└── requirements.txt       # Main requirements file
```

**Base requirements pattern:**
```txt title="requirements/base.txt"
# Core application dependencies
Django>=4.2.0,<5.0.0
psycopg2-binary>=2.9.0
redis>=4.5.0
```

```txt title="requirements/development.txt"
-r base.txt

# Development tools
pytest>=7.4.0
black>=23.7.0
isort>=5.12.4
```

### Version Strategy

**Constraint Guidelines:**

```txt title="version-strategy.txt"
# Libraries - allow updates
requests>=2.28.0           # Minor updates OK

# Framework - careful updates
django>=4.2.0,<5.0.0       # Major version boundary

# Critical dependencies - pin exactly
psycopg2-binary==2.9.7     # Database driver stability

# Development tools - flexible
pytest>=7.0.0              # Testing framework updates
```

### Lock File Workflow

**Using pip-tools:**

```txt title="requirements.in"
# High-level dependencies
django>=4.2.0
requests
pandas
```

```bash
# Generate locked requirements
pip-compile requirements.in

# Creates requirements.txt with exact versions
pip-sync requirements.txt
```

## Integration with Other Tools

### Docker Integration

```dockerfile title="Dockerfile"
# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY . .
```

### CI/CD Integration

```yaml title=".github/workflows/test.yml"
- name: Install dependencies
  run: |
    pip install -r requirements-test.txt

- name: Run tests
  run: pytest
```

### Virtual Environment

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# Install requirements
pip install -r requirements.txt

# Freeze installed packages
pip freeze > requirements-frozen.txt
```

## Troubleshooting

### Common Issues

**Completion not triggering:**

- **File recognition** - Ensure file ends with `.txt`
- **Cursor position** - Must be after constraint operators
- **Package name** - Check spelling and case sensitivity
- **Network access** - First completion needs internet

**Version conflicts:**

- **Check constraints** - Look for conflicting version ranges
- **Use pip check** - Validate installed packages
- **Review dependencies** - Understand dependency trees
- **Consider alternatives** - Different packages with similar functionality

### Performance Optimization

**Faster Installation:**

```txt title="optimized-requirements.txt"
# Use binary packages when available
psycopg2-binary>=2.9.0     # Faster than psycopg2
pillow>=10.0.0              # Pre-compiled imaging library

# Pin major versions to avoid resolver work
numpy>=1.25.0,<2.0.0       # Clear version boundary
pandas>=2.1.0,<3.0.0       # Avoid future conflicts
```

---

## Next Steps

Explore more requirements.txt capabilities:

- **[Version Completion →](../features/version-completion.md)** - Intelligent version suggestions
- **[Hover Information →](../features/hover-information.md)** - Package metadata
- **[Real-world Workflows →](workflows.md)** - Complete development examples
