# Contributing

Welcome to the Tombo project! We're excited to have you contribute to making Python package management in VS Code even better.

## Quick Start

Ready to contribute? Here's how to get started:

1. **[Fork the repository](https://github.com/benbenbang/tombo/fork)** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment**
4. **Make your changes**
5. **Submit a pull request**

## Development Environment

### Prerequisites

- **Node.js 16+** - JavaScript runtime
- **Python 3.8+** - For Python LSP components
- **Git** - Version control
- **VS Code** - For testing the extension

### Setup Steps

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/tombo.git
cd tombo
```

2. **Install dependencies**:
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (optional, for LSP development)
pip install -r requirements.txt
```

3. **Build the extension**:
```bash
# Compile TypeScript
npm run compile

# Or watch for changes during development
npm run watch
```

4. **Test in VS Code**:
   - Open the project in VS Code
   - Press `F5` to launch Extension Development Host
   - Test Tombo features in the new VS Code window

## Project Structure

Understanding the codebase:

```
tombo/
├── src/                          # TypeScript source code
│   ├── extension.ts              # Main extension entry point
│   ├── api/                      # PyPI API integration
│   │   ├── clients/              # HTTP client and networking
│   │   ├── services/             # Core PyPI service
│   │   ├── cache/                # Smart caching system
│   │   └── types/                # API type definitions
│   ├── providers/                # VS Code language providers
│   │   ├── hover-provider.ts     # Rich hover information
│   │   ├── version-completion-provider.ts  # Version completion
│   │   └── quick-action.ts       # Right-click actions
│   ├── core/                     # Core utilities
│   │   ├── config/               # Configuration management
│   │   ├── errors/               # Error handling
│   │   └── logging/              # Logging system
│   └── toml/                     # TOML parsing
├── docs/                         # Documentation (this site)
├── tests/                        # Test projects and examples
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript configuration
└── webpack.config.js             # Build configuration
```

## Development Workflow

### Making Changes

1. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** in the appropriate files
3. **Test locally** using the Extension Development Host
4. **Run tests and linting**:
```bash
npm run lint          # Check code style
npm run compile       # Verify TypeScript compilation
npm run test          # Run extension tests
```

### Testing Your Changes

**Manual Testing**:
1. Press `F5` in VS Code to launch Extension Development Host
2. Open test files from `tests/` directory:
   - `tests/pep621/pyproject.toml` - PEP 621 format
   - `tests/poetry_v1/pyproject.toml` - Poetry v1 format
   - `tests/poetry_v2/pyproject.toml` - Poetry v2 format
3. Test hover and completion features
4. Check the Output panel for any errors

**Automated Testing**:
```bash
# Run TypeScript compilation
npm run compile

# Run linting
npm run lint

# Run extension tests (requires compilation first)
npm run pretest && npm run test
```

## Code Style and Standards

### TypeScript Guidelines

**Code Style**:

- Use **TypeScript strict mode**
- Follow **semantic naming** conventions
- Add **JSDoc comments** for public APIs
- Use **async/await** instead of Promises where possible

**Example**:
```typescript
/**
 * Fetches package metadata from PyPI with intelligent caching
 * @param packageName - The name of the package to fetch
 * @param includePreReleases - Whether to include pre-release versions
 * @returns Promise resolving to package metadata
 * @throws {PackageNotFoundError} When package doesn't exist on PyPI
 */
async getPackageMetadata(
    packageName: string,
    includePreReleases: boolean = false
): Promise<PackageMetadata> {
    // Implementation here
}
```

**Error Handling**:

- Use structured error types from `src/core/errors/`
- Always handle network failures gracefully
- Provide meaningful error messages to users

**Performance**:

- Prefer caching over repeated API calls
- Use lazy loading for expensive operations
- Minimize extension activation impact

### Linting Configuration

The project uses ESLint with TypeScript support:

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Key linting rules**:

- Semicolons required
- No unused variables
- Consistent indentation (2 spaces)
- Prefer const over let where possible

## Contributing Areas

### 🎯 High-Impact Contributions

**Feature Enhancements**:

- Improve version completion algorithms
- Add support for new package formats
- Enhance caching strategies
- Optimize performance

**User Experience**:

- Better error messages and recovery
- Improved visual indicators
- Enhanced hover information
- Accessibility improvements

**Documentation**:

- Code examples and tutorials
- Video demonstrations
- Troubleshooting guides
- API documentation

### 🧪 Technical Improvements

**Architecture**:

- Refactor providers for better maintainability
- Improve TypeScript type definitions
- Enhance error handling patterns
- Optimize bundle size

**Testing**:

- Unit tests for core functionality
- Integration tests for VS Code features
- Performance benchmarks
- Edge case testing

**Infrastructure**:

- CI/CD improvements
- Release automation
- Security scanning
- Documentation generation

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**:
```bash
npm run pretest && npm test
```

2. **Check code quality**:
```bash
npm run lint
npm run compile
```

3. **Test manually** in Extension Development Host
4. **Update documentation** if needed
5. **Write descriptive commit messages**

### PR Requirements

**Title Format**:
- `feat: add support for Pipfile format`
- `fix: resolve hover timeout issues`
- `docs: update installation guide`
- `perf: optimize caching performance`

**Description Should Include**:
- **What** - Clear description of changes
- **Why** - Motivation and context
- **How** - Technical approach taken
- **Testing** - How you verified the changes
- **Screenshots** - For UI changes

**PR Template**:
```markdown
## What Changed
Brief description of your changes.

## Why
Explain the motivation for these changes.

## How
Technical details of your implementation.

## Testing
- [ ] Manual testing in Extension Development Host
- [ ] All existing tests pass
- [ ] Added new tests for new functionality

## Screenshots (if applicable)
Include before/after screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** run on all PRs
2. **Code review** by maintainers
3. **Testing** in various environments
4. **Merge** after approval

**Review criteria**:
- Code quality and maintainability
- Performance impact
- User experience
- Security considerations
- Compatibility with existing features

## Issue Reporting

### Bug Reports

**Good bug reports include**:
- Tombo version and VS Code version
- Operating system and version
- Clear steps to reproduce
- Expected vs actual behavior
- Screenshots or videos if helpful
- Debug logs if relevant

**Bug Report Template**:
```markdown
**Environment**
- Tombo version: 1.0.0
- VS Code version: 1.84.0
- OS: Windows 11

**Steps to Reproduce**
1. Open pyproject.toml file
2. Hover over package name
3. No hover information appears

**Expected Behavior**
Rich package metadata should appear in hover tooltip.

**Actual Behavior**
No hover response, nothing happens.

**Additional Context**
- Network connectivity is good
- Other VS Code extensions work fine
- Debug logs attached
```

### Feature Requests

**Feature request template**:
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Screenshots, mockups, or examples.
```

## Development Guidelines

### Performance Considerations

**Caching Strategy**:
- Cache expensive PyPI lookups
- Use appropriate TTL values
- Implement cache invalidation
- Monitor memory usage

**Network Requests**:
- Implement retry logic with backoff
- Handle network failures gracefully
- Respect rate limits
- Use efficient HTTP clients

**VS Code Integration**:
- Minimize extension activation time
- Use lazy loading for providers
- Dispose resources properly
- Follow VS Code best practices

### Security Guidelines

**Network Security**:
- Validate all external inputs
- Use HTTPS for PyPI requests
- Handle SSL/certificate issues
- Sanitize user-provided URLs

**Data Handling**:
- Don't store sensitive information
- Respect user privacy
- Follow minimal data collection principles
- Clear sensitive data from logs

## Community Guidelines

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct:

- **Be respectful** - Treat everyone with respect
- **Be inclusive** - Welcome diverse perspectives
- **Be constructive** - Provide helpful feedback
- **Be patient** - Remember we're all learning

### Communication

**Preferred channels**:
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community discussion
- **Pull Requests** - Code contributions and reviews

**Communication tips**:
- Be clear and concise
- Provide context and examples
- Be open to feedback
- Help others when you can

## Recognition

### Contributors

All contributors are recognized in:
- **README.md** - Contributors section
- **Release notes** - Feature credits
- **Documentation** - Author attribution
- **GitHub** - Contributor graphs

### Ways to Contribute

You don't need to write code to contribute:

- **📝 Documentation** - Improve guides and examples
- **🐛 Bug reports** - Help identify issues
- **💡 Feature ideas** - Suggest improvements
- **🧪 Testing** - Test new features and releases
- **❓ Support** - Help other users in discussions
- **🎨 Design** - UI/UX improvements
- **📹 Content** - Videos, tutorials, blog posts

## Getting Help

### Development Questions

**Stuck on something?**
1. Check the [troubleshooting guide](../troubleshooting/common-issues.md)
2. Search existing [GitHub issues](https://github.com/benbenbang/tombo/issues)
3. Ask in [GitHub Discussions](https://github.com/benbenbang/tombo/discussions)
4. Reach out to maintainers

### Resources

**Useful links**:
- [VS Code Extension API](https://code.visualstudio.com/api) - Official VS Code docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript reference
- [PyPI API](https://warehouse.pypa.io/api-reference/) - PyPI API documentation
- [PEP 621](https://peps.python.org/pep-0621/) - Python packaging standards

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **Major** (1.0.0) - Breaking changes
- **Minor** (1.1.0) - New features, backward compatible
- **Patch** (1.1.1) - Bug fixes, backward compatible

### Release Schedule

- **Patch releases** - As needed for critical bugs
- **Minor releases** - Monthly feature releases
- **Major releases** - When breaking changes are needed

---

## Thank You! 🎉

Every contribution makes Tombo better for the Python development community. Whether you're fixing a typo in documentation or implementing a major feature, your help is valued and appreciated.

**Ready to contribute?** [Fork the repository](https://github.com/benbenbang/tombo/fork) and dive in!

---

!!! question "Questions?"
    Don't hesitate to ask! We're here to help you succeed. Check our [GitHub Discussions](https://github.com/benbenbang/tombo/discussions) or reach out to the maintainers.
