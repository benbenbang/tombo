# Contributing to Tombo

Thank you for your interest in contributing to Tombo! This guide will help you understand our modern architecture and contribute effectively to this production-ready Python dependency manager for VS Code.

## **Quick Start for Contributors**

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/tombo.git
cd tombo

# 2. Set up development environment
npm install              # Install TypeScript dependencies
nox -s setup            # Set up Python environment (when available)

# 3. Start development
npm run watch           # Watch mode for TypeScript compilation
# Press F5 in VS Code to test in Extension Development Host

# 4. Validate your changes
npm run compile && npm run lint
```

## **Architecture Overview**

Tombo uses a **modern, production-grade TypeScript architecture** that prioritizes maintainability, performance, and reliability:

```
src/
├── api/                    # PyPI integration layer
│   ├── services/          # Business logic services
│   ├── clients/           # HTTP client abstractions
│   ├── cache/             # Smart caching layer
│   └── types/             # TypeScript definitions
├── core/
│   ├── config/            # Configuration management
│   └── errors/            # Structured error handling
├── extension/             # Extension lifecycle management
└── providers/             # VS Code integration providers
```

### **Key Architectural Principles**

1. **Single Responsibility**: Each module has one clear purpose
2. **Dependency Injection**: Services are injected, not hardcoded
3. **Error First**: Structured error handling throughout
4. **Performance Focused**: Smart caching and resource management
5. **Type Safe**: Comprehensive TypeScript coverage

## **Current Focus Areas**

### **🔥 High Priority**
1. **Provider Implementation**: Complete the VS Code provider integration
2. **TOML Parser Enhancement**: Modern PEP 621/518/660 support
3. **Testing Suite**: Comprehensive unit and integration tests
4. **Performance Optimization**: Advanced caching strategies

### **🎯 Medium Priority**
5. **Documentation**: API docs and developer guides
6. **Error Handling**: Enhanced user feedback and diagnostics
7. **Configuration**: Advanced settings and customization
8. **CI/CD**: Automated testing and deployment

### **💡 Future Enhancements**
9. **Hover Providers**: Rich package information on hover
10. **Code Actions**: Quick fixes and dependency updates
11. **Workspace Analysis**: Project-wide dependency insights
12. **Plugin System**: Extensible architecture for custom providers

## 🛠 **Development Workflow**

### **Branch Strategy**
- **`main`**: Production-ready code
- **`feat/feature-name`**: New features
- **`fix/bug-description`**: Bug fixes
- **`docs/topic`**: Documentation updates
- **`refactor/area`**: Code improvements

### **Development Process**

1. **Create feature branch**:
   ```bash
   git checkout -b feat/hover-provider
   ```

2. **Develop with watch mode**:
   ```bash
   npm run watch  # Auto-compile on changes
   # Press F5 to test in Extension Development Host
   ```

3. **Follow code standards**:
   ```typescript
   // ✅ Good: Type-safe, documented
   /**
    * Fetches package metadata with caching
    */
   async getPackageMetadata(packageName: string): Promise<PackageMetadata> {
     // Implementation
   }

   // ❌ Avoid: Untyped, undocumented
   async getPackage(name) {
     // Implementation
   }
   ```

4. **Test thoroughly**:
   ```bash
   npm run compile     # Ensure clean compilation
   npm run lint        # Check code quality
   # Manual testing in Extension Development Host
   ```

5. **Create clean commits**:
   ```bash
   git add .
   git commit -m "feat(providers): implement hover provider for package info

   - Add HoverProvider class with PyPI integration
   - Include package description, version info, and links
   - Support both pyproject.toml and requirements.txt
   - Add comprehensive error handling and caching

   Resolves #123"
   ```

### **Code Quality Standards**

#### **TypeScript Guidelines**
- **Strict mode enabled**: No `any` types without justification
- **Comprehensive JSDoc**: All public methods documented
- **Error handling**: All async operations wrapped in try-catch
- **Resource cleanup**: Proper disposal of subscriptions/resources

#### **Example: Good Service Implementation**
```typescript
/**
 * Service for fetching and caching PyPI package information
 */
export class PyPIService implements Disposable {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cache: PackageCache
  ) {}

  /**
   * Get package metadata with intelligent caching
   * @param packageName - The package name to fetch
   * @param includePreReleases - Whether to include pre-release versions
   * @returns Promise resolving to package metadata
   * @throws {PackageNotFoundError} When package doesn't exist
   * @throws {NetworkError} When network request fails
   */
  async getPackageMetadata(
    packageName: string,
    includePreReleases: boolean = false
  ): Promise<PackageMetadata> {
    // Implementation with proper error handling
  }

  dispose(): void {
    this.cache.dispose();
  }
}
```

#### **Error Handling Pattern**
```typescript
// ✅ Structured error handling
try {
  const metadata = await this.pypiService.getPackageMetadata(packageName);
  return this.createCompletionItems(metadata);
} catch (error) {
  if (error instanceof PackageNotFoundError) {
    // Handle gracefully - package doesn't exist
    return [];
  }

  if (error instanceof PyPIError) {
    this.logError('PyPI service error', error.toJSON());
    return [];
  }

  // Unexpected error - log and rethrow
  this.logError('Unexpected completion error', error);
  throw error;
}
```

## 🧪 **Testing Guidelines**

### **Unit Testing**
```typescript
// Example test structure
import { PyPIService } from '../src/api/services/pypi-service';
import { MockHttpClient } from './mocks/http-client';

describe('PyPIService', () => {
  let service: PyPIService;
  let mockHttpClient: MockHttpClient;

  beforeEach(() => {
    mockHttpClient = new MockHttpClient();
    service = new PyPIService(mockHttpClient, new MockCache());
  });

  afterEach(() => {
    service.dispose();
  });

  it('should fetch package metadata correctly', async () => {
    // Arrange
    mockHttpClient.setResponse('requests', mockRequestsResponse);

    // Act
    const metadata = await service.getPackageMetadata('requests');

    // Assert
    expect(metadata.name).toBe('requests');
    expect(metadata.versions).toContain('2.32.5');
  });

  it('should handle package not found errors', async () => {
    // Arrange
    mockHttpClient.setError('nonexistent', new PackageNotFoundError('nonexistent'));

    // Act & Assert
    await expect(service.getPackageMetadata('nonexistent'))
      .rejects
      .toThrow(PackageNotFoundError);
  });
});
```

### **Integration Testing**
Test VS Code integration in the Extension Development Host:

1. **Create test workspace** with various file types
2. **Test completion providers** in different contexts
3. **Verify error handling** with invalid inputs
4. **Check performance** with large dependency lists

### **Manual Testing Checklist**
- [ ] Completion works in `pyproject.toml`
- [ ] Completion works in `requirements.txt` variants
- [ ] Error handling displays appropriate messages
- [ ] Caching reduces API calls (check developer console)
- [ ] Configuration changes are applied immediately
- [ ] Resource cleanup on extension deactivation

## 📝 **Code Review Process**

### **Pull Request Requirements**
1. **Clear description**: What, why, and how
2. **Tests included**: Unit tests for new functionality
3. **Documentation updated**: JSDoc for new public APIs
4. **Clean commits**: Logical, well-described commits
5. **No breaking changes**: Unless explicitly discussed

### **Review Checklist for Reviewers**
- [ ] **Architecture**: Follows established patterns
- [ ] **Type Safety**: No `any` types without justification
- [ ] **Error Handling**: Comprehensive error coverage
- [ ] **Performance**: No obvious performance regressions
- [ ] **Documentation**: Public APIs are documented
- [ ] **Testing**: Adequate test coverage
- [ ] **Resource Management**: Proper disposal patterns

## 🏛 **Architecture Deep Dive**

### **PyPI Service Layer**
**File**: `src/api/services/pypi-service.ts`
- **Purpose**: Single source of truth for PyPI API interactions
- **Key features**: Caching, retry logic, structured errors
- **Extension points**: Easy to add new metadata processing

### **HTTP Client**
**File**: `src/api/clients/http-client.ts`
- **Purpose**: Robust HTTP abstraction with retry and error conversion
- **Key features**: URL joining fixes, exponential backoff, rate limiting
- **Extension points**: Easy to add authentication, custom headers

### **Caching System**
**File**: `src/api/cache/package-cache.ts`
- **Purpose**: LRU cache with TTL and automatic cleanup
- **Key features**: Memory efficient, statistics tracking, thread-safe
- **Extension points**: Easy to add persistence, compression

### **Error Handling**
**File**: `src/core/errors/pypi-errors.ts`
- **Purpose**: Structured error hierarchy with context
- **Key features**: JSON serialization, error conversion, retry hints
- **Extension points**: Easy to add new error types and context

## 🔧 **Common Development Patterns**

### **Adding a New Provider**
```typescript
// 1. Create provider class
export class NewProvider implements SomeVSCodeProvider {
  constructor(private readonly pypiService: PyPIService) {}

  async provideItems(/* params */): Promise<SomeItem[]> {
    try {
      const metadata = await this.pypiService.getPackageMetadata(packageName);
      return this.createItems(metadata);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  private handleError(error: any): void {
    // Use structured error handling patterns
  }
}

// 2. Register in extension manager
this.disposables.push(
  languages.register[ProviderType](
    [tomlSelector, requirementsSelector],
    new NewProvider(this.pypiService!),
    ...triggerCharacters
  )
);
```

### **Adding Configuration Options**
```typescript
// 1. Add to package.json
"tombo.newSetting": {
  "type": "boolean",
  "default": true,
  "description": "Enable new feature"
}

// 2. Update ExtensionConfig
interface TomboConfig {
  newSetting: boolean;
}

// 3. Use in services
const config = this.extensionConfig.getConfig();
if (config.newSetting) {
  // Feature implementation
}
```

## **Performance Guidelines**

### **Caching Strategy**
- **Cache aggressively**: Package metadata changes infrequently
- **Use appropriate TTL**: Balance freshness vs. performance
- **Monitor hit rates**: Aim for >90% cache hit rate
- **Clean up resources**: Dispose of caches properly

### **Network Optimization**
- **Batch requests**: Group related API calls
- **Use conditional requests**: Leverage HTTP caching headers
- **Implement timeouts**: Fail fast on slow networks
- **Retry intelligently**: Exponential backoff with jitter

### **Memory Management**
- **Dispose resources**: Implement `Disposable` interface
- **Avoid memory leaks**: Clear event listeners and timers
- **Use weak references**: For optional caches and callbacks
- **Monitor usage**: Track cache sizes and cleanup intervals

## 🐛 **Debugging and Troubleshooting**

### **Debugging Tools**
```typescript
// Use structured logging
console.log('[Tombo]', 'Service initialized', { config });
console.warn('[Tombo]', 'Cache miss for package', { packageName });
console.error('[Tombo]', 'Service error', error.toJSON());

// Enable verbose logging
"tombo.showNotifications": "always"
```

### **Common Issues and Solutions**

**Issue**: Extension not loading
```bash
# Check developer console for errors
Help > Toggle Developer Tools > Console
# Look for "[Tombo]" prefixed messages
```

**Issue**: Completions not appearing
```typescript
// Add debugging to provider
console.log('[Tombo]', 'Completion requested', {
  document: document.fileName,
  position
});
```

**Issue**: Performance problems
```typescript
// Monitor cache statistics
const stats = this.cache.getStats();
console.log('[Tombo]', 'Cache stats', stats);
```

## 🎯 **Contribution Examples**

### **Good First Issues**
1. **Add package description to completion items**
2. **Implement basic hover provider**
3. **Add configuration validation**
4. **Improve error messages**
5. **Add more pre-release version patterns**

### **Advanced Contributions**
1. **Implement workspace-wide dependency analysis**
2. **Add support for private PyPI repositories**
3. **Create comprehensive test suite**
4. **Add telemetry and analytics**
5. **Implement plugin system**

## 📄 **License and Guidelines**

By contributing to Tombo, you agree that your contributions will be licensed under the MIT License.

### **Community Guidelines**
- **Be respectful**: Constructive feedback and discussions
- **Be patient**: Maintainers and reviewers are volunteers
- **Be thorough**: Test your changes before submitting
- **Be collaborative**: Help other contributors when possible

## 🙏 **Recognition**

Contributors will be acknowledged in:
- **Release notes** for significant contributions
- **README.md** contributors section
- **GitHub contributors graph**
- **Special thanks** for architectural improvements

---

**Thank you for contributing to Tombo! Together, we're building the future of Python dependency management in VS Code. 🐍✨**
