# API Reference

Complete reference for Tombo's internal APIs, interfaces, and extension points. This documentation is essential for contributors and developers who want to understand or extend Tombo's functionality.

## Core Services

### PyPIService

**Location**: `src/api/services/pypi-service.ts`

The unified service for all PyPI interactions, providing caching, error handling, and data transformation.

#### Interface

```typescript
interface PyPIService {
    getPackageVersions(packageName: string, options?: VersionOptions): Promise<PackageVersions>;
    getPackageMetadata(packageName: string): Promise<PackageMetadata>;
    searchPackages(query: string, options?: SearchOptions): Promise<SearchResult[]>;
    clearCache(): void;
    getCacheStatistics(): CacheStatistics;
}
```

#### Methods

**getPackageVersions(packageName, options?)**

Retrieves available versions for a package with intelligent filtering.

```typescript
async getPackageVersions(
    packageName: string,
    options: VersionOptions = {}
): Promise<PackageVersions>

// Options interface
interface VersionOptions {
    includePreReleases?: boolean;
    pythonVersion?: string;
    maxResults?: number;
}

// Return type
interface PackageVersions {
    packageName: string;
    versions: VersionInfo[];
    latest: string;
    latestPreRelease?: string;
}

interface VersionInfo {
    version: string;
    releaseDate: Date;
    isPreRelease: boolean;
    isYanked: boolean;
    pythonRequires?: string;
}
```

**Usage Example:**
```typescript
const pypiService = new PyPIService(config);

// Get stable versions only
const stableVersions = await pypiService.getPackageVersions('requests');

// Include pre-releases
const allVersions = await pypiService.getPackageVersions('numpy', {
    includePreReleases: true,
    maxResults: 50
});
```

**getPackageMetadata(packageName)**

Retrieves comprehensive metadata for a package.

```typescript
async getPackageMetadata(packageName: string): Promise<PackageMetadata>

// Return type
interface PackageMetadata {
    name: string;
    version: string;
    summary: string;
    description?: string;
    author?: string;
    maintainer?: string;
    license?: string;
    homePage?: string;
    documentationUrl?: string;
    repositoryUrl?: string;
    keywords: string[];
    classifiers: string[];
    requires?: string[];
    requiresDistribution?: string[];
    requiresPython?: string;
    projectUrls: Record<string, string>;
}
```

**Usage Example:**
```typescript
const metadata = await pypiService.getPackageMetadata('fastapi');
console.log(`${metadata.name}: ${metadata.summary}`);
console.log(`Documentation: ${metadata.documentationUrl}`);
```

### ConfigurationManager

**Location**: `src/core/configuration/configuration-manager.ts`

Manages VS Code settings with hot reloading and validation.

#### Interface

```typescript
interface ConfigurationManager {
    // PyPI settings
    readonly pypiIndexUrl: string;
    readonly listPreReleases: boolean;
    readonly requestTimeout: number;

    // Cache settings
    readonly cacheTimeoutMinutes: number;
    readonly maxCacheSize: number;
    readonly retryAttempts: number;

    // UI settings
    readonly compatibleDecorator: string;
    readonly incompatibleDecorator: string;
    readonly showNotifications: NotificationLevel;
    readonly enableDebugLogging: boolean;

    // Events
    onConfigurationChanged: Event<ConfigurationChangeEvent>;
}
```

#### Settings Reference

**PyPI Configuration:**
```json
{
    "tombo.pypiIndexUrl": "https://pypi.org/pypi/",
    "tombo.listPreReleases": false,
    "tombo.requestTimeout": 10000
}
```

**Cache Configuration:**
```json
{
    "tombo.cacheTimeoutMinutes": 10,
    "tombo.maxCacheSize": 1000,
    "tombo.retryAttempts": 3
}
```

**UI Configuration:**
```json
{
    "tombo.compatibleDecorator": " ✓",
    "tombo.incompatibleDecorator": " ⚠",
    "tombo.showNotifications": "onError",
    "tombo.enableDebugLogging": false
}
```

**Usage Example:**
```typescript
const config = new ConfigurationManager();

// Access settings
const timeout = config.requestTimeout;
const cacheSize = config.maxCacheSize;

// Listen for changes
config.onConfigurationChanged.event((event) => {
    if (event.affectsConfiguration('tombo.cacheTimeoutMinutes')) {
        // Reconfigure cache with new timeout
        cache.updateTTL(config.cacheTimeoutMinutes * 60 * 1000);
    }
});
```

### SmartCache

**Location**: `src/core/cache/smart-cache.ts`

LRU + TTL caching implementation with automatic cleanup and statistics.

#### Interface

```typescript
interface SmartCache<T> {
    get(key: string): T | null;
    set(key: string, data: T, ttl?: number): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size: number;
    isStale(key: string): boolean;
    getStatistics(): CacheStatistics;
}
```

#### Types

```typescript
interface CacheOptions {
    maxSize: number;
    ttl: number; // milliseconds
    cleanupInterval?: number; // milliseconds
}

interface CacheStatistics {
    size: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    evictionCount: number;
    oldestEntry?: Date;
    newestEntry?: Date;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    accessCount: number;
    lastAccess: number;
}
```

**Usage Example:**
```typescript
const cache = new SmartCache<PackageData>({
    maxSize: 1000,
    ttl: 10 * 60 * 1000, // 10 minutes
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
});

// Basic operations
cache.set('requests', packageData);
const data = cache.get('requests');

// Check staleness
if (cache.isStale('requests')) {
    // Refresh data
}

// Statistics
const stats = cache.getStatistics();
console.log(`Hit rate: ${stats.hitRate.toFixed(2)}%`);
```

## Provider APIs

### VersionCompletionProvider

**Location**: `src/providers/version-completion-provider.ts`

Implements VS Code's `CompletionItemProvider` for intelligent version suggestions.

#### Interface

```typescript
class VersionCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]>;
}
```

#### Completion Item Structure

```typescript
interface TomboCompletionItem extends vscode.CompletionItem {
    label: string;              // Version number (e.g., "2.28.0")
    kind: vscode.CompletionItemKind.Value;
    detail: string;             // Package info (e.g., "requests • Released: 2023-01-12")
    documentation?: vscode.MarkdownString;  // Rich documentation
    insertText: string;         // Text to insert
    filterText: string;         // Text for filtering
    sortText: string;           // Custom sorting (latest first)
    command?: vscode.Command;   // Post-completion command
}
```

**Trigger Characters:**
- `=` (equality operators)
- `>` and `<` (comparison operators)
- `~` (compatible release)
- `!` (not equal)
- `^` (Poetry caret)

**Context Detection:**
```typescript
interface CompletionContext {
    packageName: string;
    constraintType: ConstraintType;
    existingVersion?: string;
    documentType: 'pep621' | 'poetry' | 'requirements';
    shouldTriggerCompletion: boolean;
}

enum ConstraintType {
    GreaterEqual = '>=',
    Equal = '==',
    CompatibleRelease = '~=',
    NotEqual = '!=',
    Greater = '>',
    Less = '<',
    Caret = '^',     // Poetry
    Tilde = '~'      // Poetry
}
```

### HoverProvider

**Location**: `src/providers/hover-provider.ts`

Implements VS Code's `HoverProvider` for rich package information.

#### Interface

```typescript
class HoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null>;
}
```

#### Hover Content Structure

```typescript
interface HoverContent {
    packageName: string;
    currentVersion?: string;
    latestVersion: string;
    summary: string;
    compatibility: CompatibilityInfo;
    links: PackageLinks;
    versionHistory: VersionInfo[];
}

interface CompatibilityInfo {
    pythonRequires?: string;
    isCompatible: boolean;
    compatibilityMessage?: string;
}

interface PackageLinks {
    pypi: string;
    documentation?: string;
    repository?: string;
    changelog?: string;
}
```

**Hover Markdown Generation:**
```typescript
private createHoverMarkdown(content: HoverContent): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    // Package header
    markdown.appendMarkdown(`## 📦 ${content.packageName}\n`);
    markdown.appendMarkdown(`${content.summary}\n\n`);

    // Version information
    if (content.currentVersion) {
        markdown.appendMarkdown(`**Current:** ${content.currentVersion} → **Latest:** ${content.latestVersion}\n`);
    }

    // Compatibility
    const compatIcon = content.compatibility.isCompatible ? '✅' : '❌';
    markdown.appendMarkdown(`${compatIcon} **Python:** ${content.compatibility.pythonRequires}\n\n`);

    // Links
    markdown.appendMarkdown(`🔗 [PyPI](${content.links.pypi})`);
    if (content.links.documentation) {
        markdown.appendMarkdown(` | [Documentation](${content.links.documentation})`);
    }

    return markdown;
}
```

### QuickActionProvider

**Location**: `src/providers/quick-action-provider.ts`

Provides code actions and quick fixes for dependency management.

#### Interface

```typescript
class QuickActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]>;
}
```

#### Available Actions

```typescript
enum QuickActionType {
    UpdateToLatest = 'tombo.updateToLatest',
    PinExactVersion = 'tombo.pinExactVersion',
    ChangeConstraintType = 'tombo.changeConstraintType',
    AddVersionConstraint = 'tombo.addVersionConstraint',
    RemoveVersionConstraint = 'tombo.removeVersionConstraint'
}

interface QuickActionContext {
    packageName: string;
    currentConstraint?: string;
    documentType: DocumentType;
    availableActions: QuickActionType[];
}
```

**Action Examples:**
```typescript
// Update to latest version
const updateAction = new vscode.CodeAction(
    'Update to latest version',
    vscode.CodeActionKind.QuickFix
);
updateAction.command = {
    command: 'tombo.updateToLatest',
    title: 'Update to latest',
    arguments: [document.uri, range, packageName]
};

// Pin exact version
const pinAction = new vscode.CodeAction(
    'Pin to exact version',
    vscode.CodeActionKind.Refactor
);
```

## Parser APIs

### DocumentParser

**Location**: `src/parsers/document-parser.ts`

Abstract base class for document format parsers.

#### Interface

```typescript
abstract class DocumentParser {
    abstract canParse(document: vscode.TextDocument): boolean;
    abstract parsePackageAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): PackageInfo | null;
    abstract getAllPackages(document: vscode.TextDocument): PackageInfo[];
}

interface PackageInfo {
    name: string;
    constraint?: string;
    line: number;
    startCharacter: number;
    endCharacter: number;
    extras?: string[];
}
```

### TOMLParser

**Location**: `src/parsers/toml-parser.ts`

Handles PEP 621 and Poetry format parsing.

#### Features

**PEP 621 Support:**
```toml
[project]
dependencies = [
    "requests>=2.28.0",        # ← Parsed correctly
    "numpy~=1.24.0",           # ← Compatible release
    "django>=4.0,<5.0"         # ← Range constraints
]

[project.optional-dependencies]
dev = ["pytest>=7.0"]         # ← Optional dependency groups
```

**Poetry v1 Support:**
```toml
[tool.poetry.dependencies]
python = "^3.9"               # ← Python version constraint
requests = "^2.28.0"          # ← Caret constraint
click = "~8.1.0"              # ← Tilde constraint
```

**Poetry v2 Support:**
```toml
[tool.poetry.dependencies]
pandas = "(>=2.0,<3.0)"       # ← Parentheses format
scipy = "(>=1.10,!=1.11.0)"   # ← Exclusion support
```

#### Parser Methods

```typescript
class TOMLParser extends DocumentParser {
    canParse(document: vscode.TextDocument): boolean {
        return document.fileName.endsWith('pyproject.toml');
    }

    parsePackageAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): PackageInfo | null {
        const line = document.lineAt(position);

        // Detect context
        if (this.isPEP621Context(document, position)) {
            return this.parsePEP621Package(line.text, position.character);
        }

        if (this.isPoetryContext(document, position)) {
            return this.parsePoetryPackage(line.text, position.character);
        }

        return null;
    }
}
```

### RequirementsParser

**Location**: `src/parsers/requirements-parser.ts`

Handles requirements.txt and pip requirements format.

#### Supported Formats

```txt
# Basic requirements
requests
numpy>=1.24.0

# Complex constraints
django>=4.0,<5.0,!=4.1.0
fastapi[all]>=0.100.0

# Environment markers
dataclasses>=0.8; python_version < "3.7"
uvloop>=0.17.0; sys_platform != "win32"

# VCS requirements
git+https://github.com/user/repo.git
-e git+https://github.com/user/repo.git#egg=package

# File references
-r requirements-base.txt
-c constraints.txt
```

## Error Handling

### Error Types

**Location**: `src/core/errors/`

```typescript
// Base error class
abstract class TomboError extends Error {
    abstract readonly code: string;
    abstract readonly category: ErrorCategory;
    readonly timestamp: Date;

    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date();
    }
}

enum ErrorCategory {
    Network = 'network',
    Parsing = 'parsing',
    Cache = 'cache',
    Configuration = 'configuration',
    Internal = 'internal'
}
```

**Specific Error Types:**

```typescript
// Network errors
class PackageNotFoundError extends TomboError {
    readonly code = 'PACKAGE_NOT_FOUND';
    readonly category = ErrorCategory.Network;
}

class NetworkTimeoutError extends TomboError {
    readonly code = 'NETWORK_TIMEOUT';
    readonly category = ErrorCategory.Network;
}

// Parsing errors
class InvalidPackageSpecError extends TomboError {
    readonly code = 'INVALID_PACKAGE_SPEC';
    readonly category = ErrorCategory.Parsing;
}

// Cache errors
class CacheCorruptionError extends TomboError {
    readonly code = 'CACHE_CORRUPTION';
    readonly category = ErrorCategory.Cache;
}
```

### Error Recovery

```typescript
interface ErrorRecoveryStrategy {
    canRecover(error: TomboError): boolean;
    recover(error: TomboError, context: any): Promise<any>;
}

class NetworkErrorRecovery implements ErrorRecoveryStrategy {
    canRecover(error: TomboError): boolean {
        return error.category === ErrorCategory.Network;
    }

    async recover(error: TomboError, context: { packageName: string }): Promise<any> {
        // Try cache fallback
        if (error instanceof NetworkTimeoutError) {
            const cached = cache.get(context.packageName);
            if (cached) {
                return cached;
            }
        }

        // Try alternative index
        if (error instanceof PackageNotFoundError) {
            return this.tryAlternativeIndex(context.packageName);
        }

        throw error;
    }
}
```

## Extension Points

### Custom Parsers

To add support for new file formats:

```typescript
// 1. Extend DocumentParser
class CustomFormatParser extends DocumentParser {
    canParse(document: vscode.TextDocument): boolean {
        return document.fileName.endsWith('.custom');
    }

    parsePackageAtPosition(document: vscode.TextDocument, position: vscode.Position): PackageInfo | null {
        // Implementation specific to your format
        return null;
    }
}

// 2. Register in extension activation
export function activate(context: vscode.ExtensionContext) {
    const customParser = new CustomFormatParser();
    const completionProvider = new VersionCompletionProvider(pypiService, [customParser]);

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            { scheme: 'file', pattern: '**/*.custom' },
            completionProvider,
            '=', '>', '<'
        )
    );
}
```

### Custom Commands

```typescript
// Register custom commands
function registerCommands(context: vscode.ExtensionContext, pypiService: PyPIService) {
    const commands = [
        vscode.commands.registerCommand('tombo.clearCache', () => {
            pypiService.clearCache();
            vscode.window.showInformationMessage('Cache cleared successfully');
        }),

        vscode.commands.registerCommand('tombo.showCacheStats', async () => {
            const stats = pypiService.getCacheStatistics();
            const message = `Cache: ${stats.size} packages, ${stats.hitRate.toFixed(1)}% hit rate`;
            vscode.window.showInformationMessage(message);
        })
    ];

    context.subscriptions.push(...commands);
}
```

### Event Hooks

```typescript
interface TomboEvents {
    onPackageLookup: Event<PackageLookupEvent>;
    onCacheHit: Event<CacheEvent>;
    onCacheMiss: Event<CacheEvent>;
    onError: Event<ErrorEvent>;
}

interface PackageLookupEvent {
    packageName: string;
    source: 'cache' | 'network';
    duration: number;
}

// Usage
const tombo = getTomboInstance();
tombo.events.onPackageLookup.event((event) => {
    console.log(`Looked up ${event.packageName} from ${event.source} in ${event.duration}ms`);
});
```

## Testing APIs

### Test Utilities

**Location**: `src/test/test-utils.ts`

```typescript
// Mock VS Code document
export function createMockDocument(content: string, fileName: string = 'test.toml'): vscode.TextDocument {
    return {
        uri: vscode.Uri.file(fileName),
        fileName,
        languageId: 'toml',
        version: 1,
        isDirty: false,
        isClosed: false,
        getText: (range?: vscode.Range) => range ? content.slice(0, 100) : content,
        lineAt: (line: number) => ({
            lineNumber: line,
            text: content.split('\n')[line] || '',
            range: new vscode.Range(line, 0, line, 100),
            rangeIncludingLineBreak: new vscode.Range(line, 0, line + 1, 0),
            firstNonWhitespaceCharacterIndex: 0,
            isEmptyOrWhitespace: false
        }),
        // ... other TextDocument methods
    } as vscode.TextDocument;
}

// Mock PyPI service
export function createMockPyPIService(): jest.Mocked<PyPIService> {
    return {
        getPackageVersions: jest.fn(),
        getPackageMetadata: jest.fn(),
        clearCache: jest.fn(),
        getCacheStatistics: jest.fn()
    };
}

// Test data factories
export function createMockPackageVersions(packageName: string): PackageVersions {
    return {
        packageName,
        versions: [
            { version: '2.28.0', releaseDate: new Date('2023-01-01'), isPreRelease: false, isYanked: false },
            { version: '2.27.1', releaseDate: new Date('2022-12-01'), isPreRelease: false, isYanked: false }
        ],
        latest: '2.28.0'
    };
}
```

### Test Configuration

```typescript
// Test-specific configuration
export const TEST_CONFIG: ConfigurationManager = {
    pypiIndexUrl: 'https://test-pypi.org/',
    listPreReleases: false,
    requestTimeout: 5000,
    cacheTimeoutMinutes: 1,
    maxCacheSize: 100,
    retryAttempts: 1,
    enableDebugLogging: true
};
```

---

## Type Definitions

### Core Types

```typescript
// Package information
interface PackageData {
    name: string;
    versions: PackageVersions;
    metadata: PackageMetadata;
    fetchedAt: number;
}

// Version information
interface VersionInfo {
    version: string;
    releaseDate: Date;
    isPreRelease: boolean;
    isYanked: boolean;
    pythonRequires?: string;
    files?: FileInfo[];
}

interface FileInfo {
    filename: string;
    url: string;
    size: number;
    packageType: 'bdist_wheel' | 'sdist';
}

// Configuration types
interface TomboConfiguration {
    pypi: PyPIConfiguration;
    cache: CacheConfiguration;
    ui: UIConfiguration;
    behavior: BehaviorConfiguration;
}
```

### VS Code Integration Types

```typescript
// Document context
interface DocumentContext {
    type: DocumentType;
    language: string;
    sections: DocumentSection[];
}

enum DocumentType {
    PEP621 = 'pep621',
    Poetry = 'poetry',
    Requirements = 'requirements'
}

// Completion context
interface CompletionTriggerContext {
    triggerCharacter?: string;
    triggerKind: vscode.CompletionTriggerKind;
    packageName: string;
    constraintType?: ConstraintType;
}
```

---

This API reference provides complete documentation for integrating with and extending Tombo. For implementation examples and usage patterns, see the [Architecture Guide](architecture.md) and [Contributing Guidelines](contributing.md).
