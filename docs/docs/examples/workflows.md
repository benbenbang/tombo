# Real-world Workflows

Learn how to leverage Tombo effectively in common Python development scenarios. These workflows demonstrate practical usage patterns that speed up your daily development tasks.

## New Project Setup

### Starting a Web Application

**Scenario**: Creating a new Django REST API project

**Step 1: Initialize Project Structure**
```bash
mkdir my-api-project
cd my-api-project
python -m venv venv
source venv/bin/activate
```

**Step 2: Create pyproject.toml with Tombo**
```toml title="pyproject.toml"
[project]
name = "my-api"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "django",              # ← Hover to see latest version
    "djangorestframework", # ← Use completion for >=
    "psycopg2-binary",     # ← Add version constraint
]

[project.optional-dependencies]
dev = [
    "pytest",             # ← Type >= for version completion
    "black",              # ← Get latest stable version
    "isort",              # ← Smart version suggestions
]
```

**Step 3: Tombo-Assisted Completion**
1. **Type package name** → Hover shows package info
2. **Add constraint operator** (`>=`) → Version completion appears
3. **Select appropriate version** → Tombo suggests compatible versions
4. **Verify compatibility** → Hover shows Python version requirements

### Data Science Project

**Scenario**: Setting up machine learning experiment environment

**Environment Configuration:**
```toml title="pyproject.toml"
[project]
name = "ml-experiment"
requires-python = ">=3.10"
dependencies = [
    "numpy>=",            # ← Type here for latest versions
    "pandas~=",           # ← Compatible release completion
    "scikit-learn>=",     # ← Smart version filtering
    "matplotlib>=3.7.0", # ← Specific minimum for features
    "jupyter>=",          # ← Interactive development
]

[project.optional-dependencies]
gpu = [
    "torch>=",           # ← Latest PyTorch with CUDA
    "torchvision>=",     # ← Computer vision utilities
]

deep-learning = [
    "tensorflow>=",      # ← Alternative framework
    "tensorboard>=",     # ← Visualization tool
]
```

**Workflow Benefits:**
- **Quick setup** - Tombo speeds up dependency research
- **Compatibility checking** - Hover shows Python requirements
- **Version exploration** - Easy to compare different versions
- **Documentation links** - Direct access to package docs

## Dependency Updates

### Systematic Update Process

**Scenario**: Monthly dependency maintenance for production API

**Step 1: Audit Current Dependencies**
```toml title="Current pyproject.toml"
[project]
dependencies = [
    "fastapi>=0.95.0",     # ← Hover to check for updates
    "uvicorn>=0.20.0",     # ← See latest stable version
    "pydantic>=1.10.0",    # ← Major version 2.0 available?
    "sqlalchemy>=1.4.0",   # ← Check 2.0 compatibility
]
```

**Step 2: Version Research with Tombo**
1. **Hover over packages** → See current vs latest versions
2. **Check breaking changes** → Click documentation links
3. **Review compatibility** → Verify Python version requirements
4. **Plan update strategy** → Prioritize safe vs major updates

**Step 3: Safe Updates First**
```toml title="Updated pyproject.toml"
[project]
dependencies = [
    "fastapi>=0.104.0",    # ← Minor update (safe)
    "uvicorn>=0.24.0",     # ← Patch update (safe)
    "pydantic>=1.10.0",    # ← Keep v1 (breaking change in v2)
    "sqlalchemy>=1.4.0",   # ← Plan separate v2 migration
]
```

### Handling Breaking Changes

**Scenario**: Upgrading Pydantic v1 to v2

**Before Migration:**
```toml title="pyproject.toml - Before"
dependencies = [
    "pydantic>=1.10.0",    # ← Hover shows v2.4.0 available
    "fastapi>=0.104.0",    # ← Check Pydantic v2 compatibility
]
```

**Research Process:**
1. **Hover on pydantic** → See v2 is major update
2. **Click documentation link** → Read migration guide
3. **Hover on fastapi** → Verify v2 compatibility
4. **Check dependencies** → Review impact on other packages

**After Migration:**
```toml title="pyproject.toml - After"
dependencies = [
    "pydantic>=2.4.0",     # ← Updated with breaking changes
    "fastapi>=0.104.0",    # ← Confirmed compatible
]
```

## Team Collaboration

### Standardizing Dependencies

**Scenario**: Large team needs consistent dependency versions

**Team Lead Setup:**
```toml title="pyproject.toml - Team Standard"
[project]
name = "team-project"
requires-python = ">=3.11"    # ← Team Python version
dependencies = [
    # Core framework - locked for stability
    "django~=4.2.0",           # ← Patch updates only

    # Production dependencies - careful ranges
    "psycopg2-binary>=2.9.0,<3.0.0",  # ← Major version boundary
    "redis>=4.5.0,<5.0.0",     # ← Compatible versions

    # Utilities - allow minor updates
    "requests>=2.28.0",        # ← Safe to update
    "python-dotenv>=1.0.0",    # ← Stable API
]

[project.optional-dependencies]
dev = [
    # Development tools - more flexible
    "pytest>=7.0.0",           # ← Allow minor updates
    "black>=23.0.0",           # ← Formatting improvements OK
    "mypy>=1.0.0",             # ← Type checking updates
]
```

**Individual Developer Workflow:**
1. **Clone repository** → Get team's dependency specifications
2. **Use Tombo for new additions** → Research before adding dependencies
3. **Hover before updating** → Check if changes affect team compatibility
4. **Discuss major changes** → Use hover info to inform team discussions

### Code Review Integration

**Scenario**: Reviewing dependency changes in pull requests

**PR Review Checklist with Tombo:**

1. **Version Appropriateness**
   - Hover over new dependencies → Check if latest version is needed
   - Verify constraint type → `>=` vs `~=` vs `==` appropriateness
   - Review Python compatibility → Ensure team Python version support

2. **Security Considerations**
   - Click PyPI links → Check package maintenance status
   - Review release dates → Avoid abandoned packages
   - Check for yanked versions → Ensure stable version selection

3. **Impact Assessment**
   - Hover for dependency information → Understand package purpose
   - Check documentation links → Verify package quality
   - Review constraint ranges → Avoid future conflicts

## Production Deployment

### Environment-Specific Configurations

**Scenario**: Managing dependencies across development, staging, and production

**Base Configuration:**
```toml title="pyproject.toml"
[project]
name = "production-app"
dependencies = [
    # Production-ready versions with careful constraints
    "django~=4.2.0",           # ← LTS version, patch updates only
    "gunicorn>=21.0.0,<22.0.0", # ← Production server
    "psycopg2-binary~=2.9.0",  # ← Database stability
    "redis~=4.5.0",            # ← Cache/session store
]

[project.optional-dependencies]
monitoring = [
    "sentry-sdk>=1.32.0",      # ← Error tracking
    "prometheus-client>=0.17.0", # ← Metrics collection
]

development = [
    "django-debug-toolbar>=4.2.0", # ← Dev debugging
    "pytest>=7.4.0",           # ← Testing framework
    "factory-boy>=3.3.0",      # ← Test fixtures
]
```

**Deployment Workflow:**
1. **Development**: Install with `pip install -e .[development]`
2. **Production**: Install only core dependencies `pip install .`
3. **Monitoring**: Add production monitoring `pip install .[monitoring]`

### Docker Integration

**Scenario**: Containerized application with optimized builds

**Multi-stage Dockerfile:**
```dockerfile title="Dockerfile"
# Build stage - includes development tools
FROM python:3.11-slim as builder
COPY pyproject.toml .
# Tombo helps ensure these versions work together
RUN pip install build setuptools wheel

# Production stage - only runtime dependencies
FROM python:3.11-slim as production
COPY --from=builder /app/dist/*.whl .
RUN pip install *.whl

# Development stage - includes dev tools
FROM production as development
RUN pip install -e .[development]
```

**Benefits of Tombo Integration:**
- **Version research** → Hover to find stable versions for containers
- **Compatibility verification** → Ensure Python base image compatibility
- **Documentation access** → Quick links to installation guides
- **Update planning** → Easy to assess update impact before rebuild

## Legacy Project Migration

### Modernizing Old Requirements

**Scenario**: Converting legacy requirements.txt to modern pyproject.toml

**Old requirements.txt:**
```txt title="requirements.txt - Legacy"
Django==3.2.19
psycopg2-binary==2.8.6
requests==2.25.1
pytest==6.2.4
black==21.12b0
```

**Migration Process with Tombo:**

1. **Create pyproject.toml structure**
2. **Research current versions** - Hover over each package
3. **Check breaking changes** - Click documentation links
4. **Plan update strategy** - Group by risk level

**Modern pyproject.toml:**
```toml title="pyproject.toml - Modernized"
[project]
name = "legacy-app"
requires-python = ">=3.8"     # ← Determined from old Python usage
dependencies = [
    # Updated with research via Tombo hover
    "django>=4.2.0,<5.0.0",   # ← LTS upgrade path
    "psycopg2-binary>=2.9.0", # ← Security updates
    "requests>=2.28.0",       # ← Safe minor updates
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",          # ← Major version upgrade
    "black>=23.0.0",          # ← Latest stable formatter
]
```

**Migration Benefits:**
- **Informed updates** → Tombo hover shows what's changed
- **Gradual migration** → Update packages incrementally
- **Compatibility checking** → Verify Python version requirements
- **Documentation access** → Read migration guides directly

### Package Replacement

**Scenario**: Replacing deprecated packages with modern alternatives

**Research Process:**
1. **Identify deprecated package** → Hover shows maintenance status
2. **Find replacement** → Documentation links suggest alternatives
3. **Compare features** → Research new package capabilities
4. **Test compatibility** → Verify API compatibility

**Example - Replacing pkg_resources:**
```toml title="pyproject.toml - Package Replacement"
[project]
dependencies = [
    # Old: pkg_resources (deprecated)
    # "setuptools",           # ← Contains deprecated pkg_resources

    # New: importlib.metadata (modern alternative)
    "importlib-metadata>=6.0.0; python_version < '3.10'", # ← Backport
    # importlib.metadata built into Python 3.10+
]
```

## Performance Optimization

### Caching Strategy

**Scenario**: Optimizing Tombo for large monorepo projects

**Settings Configuration:**
```json title="VS Code Settings"
{
    "tombo.cacheTimeoutMinutes": 60,    // Longer cache for stability
    "tombo.maxCacheSize": 2000,         // More packages for monorepo
    "tombo.enableDebugLogging": false,  // Clean logs in production
    "tombo.requestTimeout": 15000       // Slower network tolerance
}
```

**Workflow Optimization:**
1. **Pre-warm cache** → Hover over key packages during setup
2. **Batch additions** → Add multiple dependencies together
3. **Use version prefixes** → `numpy>=1.25` instead of `numpy>=`
4. **Monitor performance** → Check Output Panel if slow

### Offline Development

**Scenario**: Working without reliable internet connection

**Preparation Steps:**
1. **Cache warm-up** → Hover over all project dependencies
2. **Version exploration** → Trigger completion for key packages
3. **Documentation access** → Browse key package pages while online
4. **Settings adjustment** → Increase cache timeout for offline periods

**Offline-Friendly Settings:**
```json title="VS Code Settings - Offline"
{
    "tombo.cacheTimeoutMinutes": 1440,  // 24-hour cache
    "tombo.maxCacheSize": 5000,         // Large cache for self-sufficiency
    "tombo.requestTimeout": 30000,      // Longer timeout for poor connections
}
```

---

## Integration Examples

### CI/CD Pipeline

**Scenario**: Automated dependency management in GitHub Actions

```yaml title=".github/workflows/dependencies.yml"
name: Dependency Management
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly Monday morning

jobs:
  update-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -e .[dev]

      - name: Run tests
        run: pytest

      # Manual dependency research with Tombo after automated checks
      - name: Create dependency report
        run: |
          echo "Review dependencies with Tombo in VS Code"
          echo "- Hover over each package for update information"
          echo "- Check documentation links for breaking changes"
          echo "- Use version completion for upgrade planning"
```

### Pre-commit Integration

**Scenario**: Ensuring dependency consistency in team commits

```yaml title=".pre-commit-config.yaml"
repos:
  - repo: local
    hooks:
      - id: check-dependencies
        name: Check dependency versions
        entry: python scripts/check_deps.py
        language: system
        files: pyproject.toml
```

```python title="scripts/check_deps.py"
#!/usr/bin/env python3
"""
Pre-commit hook to validate dependencies.
Use Tombo in VS Code for manual verification of flagged packages.
"""
import tomllib
import sys

def check_dependencies():
    with open("pyproject.toml", "rb") as f:
        data = tomllib.load(f)

    deps = data.get("project", {}).get("dependencies", [])

    # Flag packages that might need attention
    attention_needed = []
    for dep in deps:
        if ">=" not in dep and "~=" not in dep and "==" not in dep:
            attention_needed.append(dep)

    if attention_needed:
        print("⚠️  Dependencies without version constraints:")
        for dep in attention_needed:
            print(f"   - {dep}")
        print("\n💡 Use Tombo in VS Code to add appropriate version constraints")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(check_dependencies())
```

## Best Practices Summary

### Daily Development

1. **Start with hover** → Understand packages before using
2. **Use completion actively** → Let Tombo suggest appropriate versions
3. **Check compatibility** → Verify Python version requirements
4. **Read documentation** → Click links for detailed package info
5. **Update gradually** → Use hover to assess update safety

### Team Workflows

1. **Standardize constraints** → Agree on constraint types (`~=` vs `>=`)
2. **Document decisions** → Use comments to explain version choices
3. **Review dependencies** → Use Tombo during code review process
4. **Share knowledge** → Discuss package alternatives found via research
5. **Monitor security** → Check for yanked versions and security updates

### Production Deployments

1. **Pin critical dependencies** → Use `==` for stability where needed
2. **Test thoroughly** → Verify updates in staging environments
3. **Plan rollback strategy** → Keep working versions documented
4. **Monitor performance** → Check for regressions after updates
5. **Automate safely** → Combine automated tools with manual verification

---

Ready to put these workflows into practice?

- **[Version Completion →](../features/version-completion.md)** - Master the completion system
- **[Hover Information →](../features/hover-information.md)** - Deep dive into package research
- **[Smart Caching →](../features/smart-caching.md)** - Optimize for your workflow
