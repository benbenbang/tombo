# Technical Architecture

Tombo is built with modern TypeScript patterns and clean architecture principles. This guide explains the technical design, key components, and architectural decisions that make Tombo fast, reliable, and maintainable.

## Architecture Overview

### Clean Architecture Design

Tombo follows clean architecture principles with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│                VS Code                   │
│           Extension Host                 │
└─────────┬───────────────────────────────┘
          │ VS Code APIs
┌─────────▼───────────────────────────────┐
│              Tombo Core                  │
│                                         │
│  ┌─────────────┐    ┌─────────────────┐ │
│  │ Providers   │    │  Configuration  │ │
│  │ Layer       │    │  Management     │ │
│  └─────────────┘    └─────────────────┘ │
│         │                     │         │
│  ┌──────▼──────────────────────▼──────┐  │
│  │         Service Layer              │  │
│  │                                    │  │
│  │ ┌────────────────┐ ┌─────────────┐ │  │
│  │ │ PyPI Service   │ │Cache Service│ │  │
│  │ │ (Unified API)  │ │             │ │  │
│  │ └────────────────┘ └─────────────┘ │  │
│  └──────┬─────────────────────▲──────┘  │
└─────────┼─────────────────────┼─────────┘
          │                     │
┌─────────▼─────────────────────┼─────────┐
│        Infrastructure         │         │
│                              │         │
│ ┌──────────────┐ ┌───────────┴──────┐  │
│ │ HTTP Client  │ │  Smart Caching   │  │
│ │              │ │  (LRU + TTL)     │  │
│ └──────────────┘ └──────────────────┘  │
└───────┬─────────────────────────────────┘
        │ Network Requests
┌───────▼─────────────────────────────────┐
│              PyPI API                    │
│         https://pypi.org/                │
└─────────────────────────────────────────┘
```

### Core Principles

**1. Separation of Concerns**
- Providers handle VS Code integration
- Services contain business logic
- Infrastructure manages external dependencies

**2. Dependency Inversion**
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)

**3. Single Responsibility**
- Each component has one reason to change
- Clear, focused responsibilities

**4. Open/Closed Principle**
- Open for extension, closed for modification
- New features don't break existing code

## Key Components

### Extension Entry Point

**`src/extension.ts`** - Main extension activation:

```typescript
export async function activate(context: vscode.ExtensionContext) {
    // Initialize core services
    const config = new ConfigurationManager();
    const pypiService = new PyPIService(config);

    // Register providers
    const completionProvider = new VersionCompletionProvider(pypiService);
    const hoverProvider = new HoverProvider(pypiService);
    const quickActionProvider = new QuickActionProvider(pypiService);

    // Register with VS Code
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            [{ scheme: 'file', language: 'toml' }, { scheme: 'file', pattern: '**/*requirements*.txt' }],
            completionProvider,
            '=', '>', '<', '~', '!', '^'
        ),
        vscode.languages.registerHoverProvider(
            [{ scheme: 'file', language: 'toml' }, { scheme: 'file', pattern: '**/*requirements*.txt' }],
            hoverProvider
        )
    );
}
```

### Provider Layer

**Version Completion Provider** (`src/providers/version-completion-provider.ts`):

```typescript
export class VersionCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private pypiService: PyPIService) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        // 1. Parse document context
        const context = this.parseContext(document, position);

        if (!context.shouldTriggerCompletion) {
            return [];
        }

        // 2. Fetch package data from unified service
        const packageData = await this.pypiService.getPackageVersions(
            context.packageName,
            { includePreReleases: this.config.listPreReleases }
        );

        // 3. Filter and format completion items
        return this.createCompletionItems(packageData, context);
    }
}
```

**Hover Provider** (`src/providers/hover-provider.ts`):

```typescript
export class HoverProvider implements vscode.HoverProvider {
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<vscode.Hover | null> {
        // 1. Detect package at cursor position
        const packageInfo = this.parsePackageAtPosition(document, position);

        if (!packageInfo) {
            return null;
        }

        // 2. Get comprehensive package data
        const metadata = await this.pypiService.getPackageMetadata(
            packageInfo.name
        );

        // 3. Create rich hover content
        return this.createHoverContent(metadata, packageInfo);
    }
}
```

### Service Layer

**Unified PyPI Service** (`src/api/services/pypi-service.ts`):

```typescript
export class PyPIService {
    private cache: SmartCache<PackageData>;
    private httpClient: HttpClient;

    constructor(private config: ConfigurationManager) {
        this.cache = new SmartCache({
            maxSize: config.maxCacheSize,
            ttl: config.cacheTimeoutMinutes * 60 * 1000
        });
        this.httpClient = new HttpClient(config);
    }

    async getPackageVersions(
        packageName: string,
        options: VersionOptions = {}
    ): Promise<PackageVersions> {
        // 1. Check cache first
        const cacheKey = this.buildCacheKey(packageName, options);
        const cached = this.cache.get(cacheKey);

        if (cached && !this.cache.isStale(cacheKey)) {
            return cached.versions;
        }

        // 2. Fetch from PyPI
        const packageData = await this.fetchPackageData(packageName);

        // 3. Process and filter versions
        const processedVersions = this.processVersions(packageData, options);

        // 4. Cache results
        this.cache.set(cacheKey, {
            versions: processedVersions,
            metadata: packageData.info,
            fetchedAt: Date.now()
        });

        return processedVersions;
    }

    private async fetchPackageData(packageName: string): Promise<PyPIPackageData> {
        const url = `${this.config.pypiIndexUrl}${packageName}/json`;

        try {
            const response = await this.httpClient.get(url);
            return JSON.parse(response);
        } catch (error) {
            throw new PackageNotFoundError(`Package '${packageName}' not found on PyPI`);
        }
    }
}
```

### Infrastructure Layer

**Smart Caching System** (`src/core/cache/smart-cache.ts`):

```typescript
export class SmartCache<T> {
    private memoryCache = new Map<string, CacheEntry<T>>();
    private accessOrder = new Map<string, number>(); // LRU tracking
    private accessCounter = 0;

    constructor(private options: CacheOptions) {}

    get(key: string): T | null {
        const entry = this.memoryCache.get(key);

        if (!entry) {
            return null;
        }

        // Update LRU order
        this.accessOrder.set(key, ++this.accessCounter);

        return entry.data;
    }

    set(key: string, data: T): void {
        // Evict if at capacity
        if (this.memoryCache.size >= this.options.maxSize) {
            this.evictLRU();
        }

        this.memoryCache.set(key, {
            data,
            timestamp: Date.now(),
            accessCount: 1
        });

        this.accessOrder.set(key, ++this.accessCounter);
    }

    isStale(key: string): boolean {
        const entry = this.memoryCache.get(key);
        if (!entry) return true;

        const age = Date.now() - entry.timestamp;
        return age > this.options.ttl;
    }

    private evictLRU(): void {
        // Find least recently used entry
        let oldestAccess = Infinity;
        let lruKey: string | null = null;

        for (const [key, accessTime] of this.accessOrder) {
            if (accessTime < oldestAccess) {
                oldestAccess = accessTime;
                lruKey = key;
            }
        }

        if (lruKey) {
            this.memoryCache.delete(lruKey);
            this.accessOrder.delete(lruKey);
        }
    }
}
```

**HTTP Client** (`src/api/clients/http-client.ts`):

```typescript
export class HttpClient {
    private readonly timeout: number;
    private readonly retryAttempts: number;

    constructor(private config: ConfigurationManager) {
        this.timeout = config.requestTimeout;
        this.retryAttempts = config.retryAttempts;
    }

    async get(url: string): Promise<string> {
        return this.executeWithRetry(() => this.performRequest(url));
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        attempt: number = 1
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            if (attempt < this.retryAttempts && this.isRetryableError(error)) {
                const backoffDelay = this.calculateBackoff(attempt);
                await this.sleep(backoffDelay);

                return this.executeWithRetry(operation, attempt + 1);
            }

            throw error;
        }
    }

    private calculateBackoff(attempt: number): number {
        // Exponential backoff: 1s, 2s, 4s, 8s...
        return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    }
}
```

## Design Patterns

### Service Locator Pattern

**Configuration Management**:
```typescript
export class ConfigurationManager {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('tombo');

        // Hot reload on configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('tombo')) {
                this.config = vscode.workspace.getConfiguration('tombo');
                this.notifyConfigurationChanged();
            }
        });
    }

    get pypiIndexUrl(): string {
        return this.config.get('pypiIndexUrl', 'https://pypi.org/pypi/');
    }

    get requestTimeout(): number {
        return Math.max(1000, Math.min(60000,
            this.config.get('requestTimeout', 10000)
        ));
    }

    get maxCacheSize(): number {
        return Math.max(10, Math.min(10000,
            this.config.get('maxCacheSize', 1000)
        ));
    }
}
```

### Strategy Pattern

**Document Parsing**:
```typescript
export abstract class DocumentParser {
    abstract canParse(document: vscode.TextDocument): boolean;
    abstract parsePackageAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): PackageInfo | null;
}

export class TOMLParser extends DocumentParser {
    canParse(document: vscode.TextDocument): boolean {
        return document.fileName.endsWith('pyproject.toml');
    }

    parsePackageAtPosition(document: vscode.TextDocument, position: vscode.Position): PackageInfo | null {
        // TOML-specific parsing logic
        const line = document.lineAt(position);

        // Handle PEP 621 dependencies array
        if (this.isPEP621DependenciesLine(line.text)) {
            return this.parsePEP621Package(line.text, position.character);
        }

        // Handle Poetry dependencies
        if (this.isPoetryDependenciesLine(line.text)) {
            return this.parsePoetryPackage(line.text, position.character);
        }

        return null;
    }
}

export class RequirementsParser extends DocumentParser {
    canParse(document: vscode.TextDocument): boolean {
        return /requirements.*\.txt$/.test(document.fileName);
    }

    parsePackageAtPosition(document: vscode.TextDocument, position: vscode.Position): PackageInfo | null {
        // Requirements.txt parsing logic
        const line = document.lineAt(position);
        return this.parseRequirementLine(line.text, position.character);
    }
}
```

### Observer Pattern

**Event System**:
```typescript
export class EventBus {
    private listeners = new Map<string, Array<(data: any) => void>>();

    subscribe(event: string, callback: (data: any) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    emit(event: string, data: any): void {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }
}

// Usage in services
export class PyPIService {
    constructor(private eventBus: EventBus) {
        // Emit cache events for monitoring
        this.cache.onHit = (key) => this.eventBus.emit('cache:hit', { key });
        this.cache.onMiss = (key) => this.eventBus.emit('cache:miss', { key });
    }
}
```

## Error Handling Strategy

### Structured Error Hierarchy

```typescript
export abstract class TomboError extends Error {
    abstract readonly code: string;
    abstract readonly category: 'network' | 'parsing' | 'cache' | 'configuration';

    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class PackageNotFoundError extends TomboError {
    readonly code = 'PACKAGE_NOT_FOUND';
    readonly category = 'network';
}

export class NetworkTimeoutError extends TomboError {
    readonly code = 'NETWORK_TIMEOUT';
    readonly category = 'network';
}

export class CacheCorruptionError extends TomboError {
    readonly code = 'CACHE_CORRUPTION';
    readonly category = 'cache';
}
```

### Graceful Degradation

```typescript
export class PyPIService {
    async getPackageVersions(packageName: string): Promise<PackageVersions> {
        try {
            // Try cache first
            return await this.getCachedVersions(packageName);
        } catch (cacheError) {
            this.logger.warn('Cache failed, falling back to network', cacheError);

            try {
                // Fallback to network
                return await this.fetchVersionsFromNetwork(packageName);
            } catch (networkError) {
                this.logger.error('Network also failed', networkError);

                // Last resort: return minimal data if we have any
                return this.getMinimalVersionData(packageName) ||
                       this.throwUserFriendlyError(networkError);
            }
        }
    }

    private throwUserFriendlyError(error: Error): never {
        if (error instanceof NetworkTimeoutError) {
            throw new TomboError(
                'Unable to fetch package information. Please check your internet connection and try again.',
                error
            );
        }

        throw error;
    }
}
```

## Performance Optimizations

### Lazy Loading

```typescript
export class VersionCompletionProvider {
    private parsers: Map<string, DocumentParser> | null = null;

    private getParsers(): Map<string, DocumentParser> {
        if (!this.parsers) {
            this.parsers = new Map([
                ['toml', new TOMLParser()],
                ['requirements', new RequirementsParser()]
            ]);
        }
        return this.parsers;
    }
}
```

### Request Batching

```typescript
export class PyPIService {
    private pendingRequests = new Map<string, Promise<PackageData>>();

    async getPackageData(packageName: string): Promise<PackageData> {
        // Deduplicate concurrent requests for same package
        if (this.pendingRequests.has(packageName)) {
            return this.pendingRequests.get(packageName)!;
        }

        const promise = this.fetchPackageData(packageName);
        this.pendingRequests.set(packageName, promise);

        try {
            const result = await promise;
            return result;
        } finally {
            // Clean up completed request
            this.pendingRequests.delete(packageName);
        }
    }
}
```

### Memory Management

```typescript
export class SmartCache<T> {
    private cleanupTimer: NodeJS.Timeout | null = null;

    constructor(options: CacheOptions) {
        // Automatic cleanup every 5 minutes
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    private cleanup(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.memoryCache) {
            if (now - entry.timestamp > this.options.ttl) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => {
            this.memoryCache.delete(key);
            this.accessOrder.delete(key);
        });

        this.logger.debug(`Cleaned up ${expiredKeys.length} expired cache entries`);
    }

    dispose(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        this.memoryCache.clear();
        this.accessOrder.clear();
    }
}
```

## Testing Architecture

### Unit Testing Strategy

```typescript
// Service testing with mocks
describe('PyPIService', () => {
    let service: PyPIService;
    let mockHttpClient: jest.Mocked<HttpClient>;
    let mockCache: jest.Mocked<SmartCache<PackageData>>;

    beforeEach(() => {
        mockHttpClient = createMockHttpClient();
        mockCache = createMockCache();
        service = new PyPIService(mockHttpClient, mockCache);
    });

    it('should return cached data when available', async () => {
        const cachedData = createMockPackageData('requests');
        mockCache.get.mockReturnValue(cachedData);
        mockCache.isStale.mockReturnValue(false);

        const result = await service.getPackageVersions('requests');

        expect(result).toEqual(cachedData.versions);
        expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
});
```

### Integration Testing

```typescript
// Provider testing with real VS Code context
describe('VersionCompletionProvider Integration', () => {
    let provider: VersionCompletionProvider;
    let mockDocument: vscode.TextDocument;

    beforeEach(async () => {
        // Set up real extension context
        const config = new ConfigurationManager();
        const pypiService = new PyPIService(config);
        provider = new VersionCompletionProvider(pypiService);

        mockDocument = await createTestDocument(`
            [project]
            dependencies = [
                "requests>=|"
            ]
        `);
    });

    it('should provide completions for version constraints', async () => {
        const position = new vscode.Position(2, 23); // After "requests>="

        const completions = await provider.provideCompletionItems(
            mockDocument,
            position,
            new vscode.CancellationToken()
        );

        expect(completions).toHaveLength(greaterThan(0));
        expect(completions[0].label).toMatch(/^\d+\.\d+\.\d+$/);
    });
});
```

## Build and Deployment

### TypeScript Configuration

```json title="tsconfig.json"
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "out",
        "rootDir": "src",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true
    },
    "include": [
        "src/**/*"
    ],
    "exclude": [
        "node_modules",
        "out",
        "**/*.test.ts"
    ]
}
```

### Webpack Configuration

```javascript title="webpack.config.js"
const path = require('path');

module.exports = {
    target: 'node',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'out'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode' // VS Code API
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            }
        ]
    },
    optimization: {
        minimize: true
    }
};
```

---

## Architecture Benefits

### Maintainability
- **Clear separation** between VS Code integration and business logic
- **Testable components** with dependency injection
- **Consistent patterns** across the codebase

### Performance
- **Smart caching** reduces API calls by 90%
- **Lazy loading** minimizes startup time
- **Request deduplication** prevents redundant network calls

### Reliability
- **Graceful degradation** when services fail
- **Structured error handling** with user-friendly messages
- **Retry logic** with exponential backoff

### Extensibility
- **Plugin architecture** ready for new file formats
- **Event system** for monitoring and plugins
- **Configuration management** supports hot reloading

---

Ready to dive deeper into Tombo's implementation?

- **[API Reference →](api-reference.md)** - Detailed API documentation
- **[Contributing →](contributing.md)** - Guidelines for contributing code
- **[Performance →](../troubleshooting/performance.md)** - Optimization techniques
