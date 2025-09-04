# Smart Caching

Experience lightning-fast package information with Tombo's intelligent caching system. Reduce API calls by 90% while maintaining fresh, accurate data from PyPI.

## How Smart Caching Works

Tombo implements a **multi-tier caching strategy** that balances performance with data freshness:

1. **First lookup** - Fetches fresh data from PyPI (~200-500ms)
2. **Memory cache** - Instant access during VS Code session (~5-10ms)
3. **Disk cache** - Persistent storage between sessions (~10-20ms)
4. **Background refresh** - Updates stale data quietly

## Cache Architecture

### Multi-Level System

**Memory Cache (L1):**
- **Storage**: RAM during VS Code session
- **Speed**: ~5-10ms response time
- **Capacity**: 1000 packages by default
- **Persistence**: Cleared when VS Code closes

**Disk Cache (L2):**
- **Storage**: Local file system
- **Speed**: ~10-20ms response time
- **Capacity**: Unlimited (configurable cleanup)
- **Persistence**: Survives VS Code restarts

**Network Fallback (L3):**
- **Storage**: PyPI servers
- **Speed**: ~200-500ms response time
- **Capacity**: All PyPI packages
- **Persistence**: Always up-to-date

### Cache Strategy

**LRU + TTL Design:**
- **LRU (Least Recently Used)** - Evicts old packages when cache is full
- **TTL (Time To Live)** - Refreshes stale data automatically
- **Smart prefetching** - Preloads related packages
- **Incremental updates** - Only downloads changed data

## Performance Benefits

### Speed Comparison

| Scenario | Without Cache | With Cache | Improvement |
|----------|---------------|------------|-------------|
| First hover | 300ms | 300ms | Baseline |
| Second hover | 300ms | 5ms | **98% faster** |
| Third hover | 300ms | 5ms | **98% faster** |
| Offline usage | ❌ Fails | ✅ 5ms | **Infinite** |

### Real-World Impact

**Development Workflow:**
- **Package research** - Instant hover responses
- **Version exploration** - Fast completion suggestions
- **Dependency updates** - Quick compatibility checks
- **Offline development** - Works without internet

**Team Benefits:**
- **Reduced bandwidth** - Shared cache benefits
- **Faster builds** - Less waiting for package info
- **Consistent data** - Same versions across team
- **Network resilience** - Works during outages

## Cache Configuration

### Basic Settings

```json title="VS Code Settings"
{
    "tombo.cache.enabled": true,        // Enable/disable caching
    "tombo.cache.ttl": 86400,           // 24 hours in seconds
    "tombo.cache.maxSize": 1000,        // Max packages in memory
    "tombo.cache.diskSizeLimit": "100MB" // Max disk cache size
}
```

### Advanced Configuration

**Performance Tuning:**
```json title="High Performance Setup"
{
    "tombo.cache.ttl": 604800,          // 7 days (longer cache)
    "tombo.cache.maxSize": 2000,        // Larger memory cache
    "tombo.cache.prefetchDepth": 2,     // Preload dependency chains
    "tombo.cache.backgroundRefresh": true // Update cache quietly
}
```

**Development Setup:**
```json title="Development Environment"
{
    "tombo.cache.ttl": 3600,            // 1 hour (fresher data)
    "tombo.cache.maxSize": 500,         // Smaller memory footprint
    "tombo.cache.validateOnStartup": true, // Check cache integrity
    "tombo.cache.debugLogging": true    // Detailed cache logging
}
```

**Corporate/Offline Setup:**
```json title="Enterprise Environment"
{
    "tombo.cache.ttl": 2592000,         // 30 days (very long cache)
    "tombo.cache.persistOffline": true, // Keep working offline
    "tombo.cache.maxSize": 5000,        // Large corporate projects
    "tombo.cache.compression": true     // Compress disk storage
}
```

## Cache Behavior

### Automatic Management

**Cache Population:**
1. **On-demand loading** - Packages cached when first accessed
2. **Bulk prefetching** - Related packages loaded together
3. **Dependency chains** - Transitive dependencies preloaded
4. **Popular packages** - Common packages cached proactively

**Cache Invalidation:**
1. **TTL expiration** - Automatic refresh after time limit
2. **Manual refresh** - Command palette: "Tombo: Clear Cache"
3. **Version detection** - New versions trigger cache updates
4. **Error recovery** - Corrupted cache automatically rebuilt

### Cache States

**Fresh Cache:**
```
📦 requests (cached 2 minutes ago)
Latest: 2.31.0 ✅ Fresh data
Response: ~5ms from memory
```

**Stale Cache:**
```
📦 numpy (cached 25 hours ago)
Latest: 1.24.3 🔄 Refreshing in background
Response: ~5ms from cache + background update
```

**Cold Cache:**
```
📦 fastapi (not cached)
Latest: 0.100.0 🌐 Fetching from PyPI
Response: ~300ms + caching for next time
```

## Offline Capabilities

### What Works Offline

**✅ Fully Functional:**
- **Hover information** - For previously cached packages
- **Version completion** - Using cached version lists
- **Compatibility checks** - Based on cached metadata
- **Package descriptions** - From local cache

**⚠️ Limited Functionality:**
- **New packages** - Only if previously cached
- **Latest versions** - May show stale data
- **Fresh metadata** - Uses last cached information

**❌ Requires Internet:**
- **First package lookup** - Initial cache population
- **Cache refresh** - Updating stale information
- **New package discovery** - Packages never seen before

### Offline Preparation

**Before Going Offline:**
1. **Warm the cache** - Hover over important packages
2. **Trigger completion** - Access version lists for key dependencies
3. **Check cache status** - Verify packages are cached
4. **Update TTL** - Extend cache lifetime if needed

```bash title="Cache Warming Script"
# Open your project files and hover over each dependency
# This ensures all packages are cached before offline work
```

## Cache Management

### Manual Cache Control

**Command Palette Actions:**
- **"Tombo: Clear Cache"** - Remove all cached data
- **"Tombo: Refresh Cache"** - Update all cached packages
- **"Tombo: Cache Statistics"** - View cache usage and performance
- **"Tombo: Validate Cache"** - Check cache integrity

### Cache Monitoring

**Statistics Display:**
```
📊 Tombo Cache Statistics

Memory Cache:
• Size: 847 packages (84.7% of limit)
• Hit Rate: 94.2% (excellent)
• Average Response: 6ms

Disk Cache:
• Size: 45.2 MB (45.2% of limit)
• Files: 2,156 cache entries
• Oldest Entry: 6 days ago

Network Usage:
• API Calls Saved: 1,847 (94.2% reduction)
• Bandwidth Saved: ~12.4 MB
• Time Saved: ~9.2 minutes
```

### Cache Troubleshooting

**Common Issues:**

1. **Stale Data** - Package shows old version information
2. **Cache Corruption** - Errors loading cached data
3. **High Memory Usage** - Cache using too much RAM
4. **Disk Space** - Cache taking too much storage

**Solutions:**

```json title="Cache Reset Configuration"
{
    "tombo.cache.enabled": false,       // Temporarily disable
    "tombo.cache.clearOnStartup": true, // Fresh start
    "tombo.cache.validateOnLoad": true  // Check integrity
}
```

## Performance Optimization

### Memory Efficiency

**Smart Eviction:**
- **LRU algorithm** - Removes least used packages first
- **Size-based limits** - Prevents unlimited growth
- **Compression** - Reduces memory footprint
- **Lazy loading** - Only loads when needed

**Memory Usage Patterns:**
```
Package Size Estimation:
• Basic metadata: ~2KB per package
• Version history: ~5KB per package
• Full cache entry: ~10KB per package
• 1000 packages: ~10MB memory usage
```

### Disk Management

**Automatic Cleanup:**
- **Size limits** - Removes old entries when limit reached
- **Age-based removal** - Deletes entries older than threshold
- **Compression** - Reduces disk space usage
- **Integrity checks** - Validates cache consistency

### Network Optimization

**Efficient Updates:**
- **Delta updates** - Only download changed information
- **Batch requests** - Multiple packages in single API call
- **Connection reuse** - HTTP connection pooling
- **Compression** - Gzip/deflate for data transfer

## Best Practices

### Cache Strategy

**For Individual Developers:**
```json
{
    "tombo.cache.ttl": 86400,           // 24 hours (daily refresh)
    "tombo.cache.maxSize": 1000,        // Standard size
    "tombo.cache.backgroundRefresh": true // Seamless updates
}
```

**For Development Teams:**
```json
{
    "tombo.cache.ttl": 43200,           // 12 hours (more frequent updates)
    "tombo.cache.maxSize": 2000,        // Larger projects
    "tombo.cache.sharedCache": true     // Team cache sharing (if available)
}
```

**For Offline Work:**
```json
{
    "tombo.cache.ttl": 2592000,         // 30 days (long offline periods)
    "tombo.cache.maxSize": 5000,        // Large cache for self-sufficiency
    "tombo.cache.persistOffline": true  // Maintain offline capability
}
```

### Cache Warming

**Project Setup:**
1. **Open dependency files** - pyproject.toml, requirements.txt
2. **Hover over packages** - Cache package metadata
3. **Trigger completions** - Cache version information
4. **Check related packages** - Cache dependency chains

**Automation Ideas:**
- **Pre-commit hooks** - Warm cache during development
- **CI integration** - Cache popular packages for team
- **Project templates** - Include cache warming scripts

---

## Next Steps

Learn about related Tombo features:

- **[Version Completion →](version-completion.md)** - Fast version suggestions powered by cache
- **[Hover Information →](hover-information.md)** - Instant package details from cache
- **[Configuration →](../getting-started/configuration.md)** - Fine-tune cache behavior
