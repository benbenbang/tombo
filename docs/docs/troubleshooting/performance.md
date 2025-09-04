# Performance Optimization

Maximize Tombo's speed and efficiency with these performance optimization techniques. Learn how to configure caching, optimize network usage, and troubleshoot performance issues.

## Performance Overview

### Tombo Performance Characteristics

**Typical Response Times:**
- **First package lookup**: 200-500ms (network fetch + cache)
- **Cached packages**: 5-10ms (memory cache)
- **Disk-cached packages**: 10-20ms (persistent cache)
- **Background refresh**: 0ms impact (silent update)

**Cache Hit Rates:**
- **Memory cache**: 85-95% for active development
- **Disk cache**: 95-99% for repeated sessions
- **Combined efficiency**: 90% reduction in API calls

## Smart Caching Configuration

### Memory Cache Optimization

**Default Settings:**
```json title="VS Code Settings - Default"
{
    "tombo.cacheTimeoutMinutes": 10,    // 10-minute TTL
    "tombo.maxCacheSize": 1000,         // 1000 packages in memory
    "tombo.requestTimeout": 10000       // 10-second timeout
}
```

**High Performance Setup:**
```json title="VS Code Settings - Performance Optimized"
{
    "tombo.cacheTimeoutMinutes": 60,    // Longer cache for stability
    "tombo.maxCacheSize": 2000,         // More packages for large projects
    "tombo.requestTimeout": 15000,      // Tolerance for slower networks
    "tombo.retryAttempts": 2,           // Fewer retries for speed
    "tombo.showNotifications": "never"  // Reduce UI overhead
}
```

**Memory-Constrained Setup:**
```json title="VS Code Settings - Low Memory"
{
    "tombo.cacheTimeoutMinutes": 30,    // Reasonable cache duration
    "tombo.maxCacheSize": 500,          // Smaller memory footprint
    "tombo.requestTimeout": 8000,       // Faster timeouts
    "tombo.enableDebugLogging": false   // Minimal logging overhead
}
```

### Cache Strategy by Project Size

**Small Projects (< 50 dependencies):**
```json title="Small Project Settings"
{
    "tombo.cacheTimeoutMinutes": 10,    // Fresh data
    "tombo.maxCacheSize": 500,          // Adequate size
    "tombo.requestTimeout": 8000        // Quick responses
}
```

**Medium Projects (50-200 dependencies):**
```json title="Medium Project Settings"
{
    "tombo.cacheTimeoutMinutes": 30,    // Balanced freshness
    "tombo.maxCacheSize": 1000,         // Standard size
    "tombo.requestTimeout": 10000       // Default timeout
}
```

**Large Projects/Monorepos (200+ dependencies):**
```json title="Large Project Settings"
{
    "tombo.cacheTimeoutMinutes": 60,    // Longer cache for stability
    "tombo.maxCacheSize": 3000,         // Large cache pool
    "tombo.requestTimeout": 15000,      // Patience for large requests
    "tombo.retryAttempts": 3            // Reliability for critical workflows
}
```

## Network Optimization

### Connection Management

**Efficient Network Usage:**
- **Connection pooling** - Reuses HTTP connections
- **Request batching** - Multiple packages per API call when possible
- **Compression** - Gzip/deflate for data transfer
- **Rate limiting** - Respectful PyPI API usage

**Network-Conscious Settings:**
```json title="Slow Network Optimization"
{
    "tombo.requestTimeout": 30000,      // 30-second timeout
    "tombo.retryAttempts": 1,           // Avoid retry delays
    "tombo.cacheTimeoutMinutes": 120,   // Long cache to reduce requests
    "tombo.maxCacheSize": 2000          // Large cache for offline capability
}
```

### Offline Performance

**Offline-Ready Configuration:**
```json title="Offline-Optimized Settings"
{
    "tombo.cacheTimeoutMinutes": 1440,  // 24-hour cache
    "tombo.maxCacheSize": 5000,         // Large cache for self-sufficiency
    "tombo.requestTimeout": 5000,       // Quick failure for offline detection
    "tombo.retryAttempts": 1            // Don't retry when offline
}
```

**Cache Warming Strategy:**
1. **Pre-session warm-up** - Hover over key dependencies
2. **Batch completion** - Trigger version completion for multiple packages
3. **Documentation prefetch** - Visit package links while online
4. **Dependency chains** - Cache related packages together

## Performance Monitoring

### Cache Statistics

**Accessing Performance Data:**
1. **Command Palette** → "Tombo: Cache Statistics"
2. **Output Panel** → Select "Tombo" (with debug logging enabled)
3. **Hover behavior** → Notice response time differences

**Performance Metrics to Watch:**
```
📊 Tombo Performance Metrics

Cache Efficiency:
• Memory Hit Rate: 94.2% (excellent)
• Disk Hit Rate: 98.7% (outstanding)
• Network Requests Saved: 1,847 (94.2% reduction)

Response Times:
• Average Memory Cache: 6ms
• Average Disk Cache: 12ms
• Average Network Fetch: 287ms

Cache Usage:
• Memory: 847/1000 packages (84.7%)
• Disk Size: 45.2MB
• Bandwidth Saved: ~12.4MB this session
```

### Debug Logging

**Enable Detailed Performance Logging:**
```json title="Debug Settings"
{
    "tombo.enableDebugLogging": true
}
```

**Performance Log Examples:**
```
[Tombo] Cache HIT: numpy (6ms from memory)
[Tombo] Cache MISS: scipy (fetching from PyPI...)
[Tombo] Network fetch: scipy completed in 234ms
[Tombo] Cache STORE: scipy (now available for instant access)
[Tombo] Background refresh: requests (updating stale cache)
```

## Common Performance Issues

### Slow Completion Response

**Symptoms:**
- Completion dropdown takes > 2 seconds to appear
- First-time package lookup very slow
- Frequent timeouts

**Diagnostics:**
1. **Check network speed** - Test with fast.com or similar
2. **Enable debug logging** - Monitor cache hit/miss patterns
3. **Test with different packages** - Isolate package-specific issues
4. **Monitor system resources** - CPU/memory usage during completion

**Solutions:**

**Network Issues:**
```json title="Slow Network Fixes"
{
    "tombo.requestTimeout": 20000,      // Longer timeout
    "tombo.retryAttempts": 1,           // Reduce retry delays
    "tombo.cacheTimeoutMinutes": 120    // Longer cache duration
}
```

**Cache Issues:**
```bash
# Clear potentially corrupted cache
# Command Palette → "Tombo: Clear Cache"
```

**System Resource Issues:**
```json title="Resource-Conscious Settings"
{
    "tombo.maxCacheSize": 500,          // Reduce memory usage
    "tombo.enableDebugLogging": false,  // Reduce logging overhead
    "tombo.showNotifications": "never"  // Minimize UI updates
}
```

### High Memory Usage

**Symptoms:**
- VS Code becomes sluggish during completion
- System memory usage increases significantly
- Cache grows without bounds

**Memory Optimization:**

**Immediate Fixes:**
```json title="Memory Optimization"
{
    "tombo.maxCacheSize": 500,          // Reduce cache size
    "tombo.cacheTimeoutMinutes": 15,    // Shorter retention
}
```

**Advanced Memory Management:**
```json title="Advanced Memory Settings"
{
    "tombo.maxCacheSize": 300,          // Very conservative size
    "tombo.cacheTimeoutMinutes": 5,     // Aggressive cleanup
    "tombo.requestTimeout": 8000,       // Quick operations only
}
```

**Monitoring Memory Usage:**
1. **VS Code Task Manager** - Help → Open Process Explorer
2. **System Monitor** - Watch Python/Node.js processes
3. **Tombo Statistics** - Check cache utilization

### Frequent Cache Misses

**Symptoms:**
- Debug log shows many "Cache MISS" entries
- Slow response times despite caching enabled
- High network usage

**Root Causes & Solutions:**

**Cache Size Too Small:**
```json title="Increase Cache Size"
{
    "tombo.maxCacheSize": 2000,         // Double default size
    "tombo.cacheTimeoutMinutes": 30     // Reasonable retention
}
```

**Aggressive TTL:**
```json title="Extend Cache Duration"
{
    "tombo.cacheTimeoutMinutes": 60,    // Longer retention
    "tombo.maxCacheSize": 1500          // Accommodate longer retention
}
```

**Development Pattern Issues:**
- **Problem**: Constantly switching between many different packages
- **Solution**: Focus on core dependencies first, then explore alternatives

## Environment-Specific Optimization

### Corporate/Enterprise Networks

**Network Constraints:**
```json title="Corporate Network Settings"
{
    "tombo.pypiIndexUrl": "https://your-corporate-pypi.com/simple/",
    "tombo.requestTimeout": 45000,      // Corporate proxy delays
    "tombo.retryAttempts": 3,           // Network reliability issues
    "tombo.cacheTimeoutMinutes": 240,   // Reduce external requests
    "tombo.maxCacheSize": 3000          // Large cache for limited connectivity
}
```

**Proxy Configuration:**
- Configure VS Code proxy settings
- Ensure PyPI access through corporate firewall
- Consider internal PyPI mirrors for better performance

### Remote Development

**SSH/Remote Performance:**
```json title="Remote Development Settings"
{
    "tombo.cacheTimeoutMinutes": 60,    // Reduce remote requests
    "tombo.maxCacheSize": 2000,         // Larger cache for remote efficiency
    "tombo.requestTimeout": 25000,      // Network latency tolerance
    "tombo.enableDebugLogging": false,  // Reduce remote logging overhead
}
```

### CI/CD Environments

**Automated Environment Settings:**
```json title="CI/CD Settings"
{
    "tombo.cacheTimeoutMinutes": 1440,  // 24-hour cache for build consistency
    "tombo.maxCacheSize": 5000,         // Large cache for comprehensive projects
    "tombo.requestTimeout": 10000,      // Quick failures in automated environments
    "tombo.retryAttempts": 1,           // No retries in CI
    "tombo.showNotifications": "never", // Silent operation
    "tombo.enableDebugLogging": false   // Minimal logging overhead
}
```

## Advanced Performance Techniques

### Cache Warming Strategies

**Project Initialization:**
```bash
# Pre-warm cache with project dependencies
# 1. Open pyproject.toml or requirements.txt
# 2. Hover over each dependency to cache metadata
# 3. Trigger completion (Ctrl+Space) on key packages
# 4. Access documentation links for important packages
```

**Automated Cache Warming:**
```python title="scripts/warm_cache.py"
"""
Script to pre-warm Tombo cache by programmatically accessing packages.
Run before offline development sessions.
"""
import subprocess
import tomllib

def warm_cache():
    # Load project dependencies
    with open("pyproject.toml", "rb") as f:
        data = tomllib.load(f)

    dependencies = data.get("project", {}).get("dependencies", [])

    print("📦 Warming Tombo cache...")
    print("💡 Open VS Code and hover over these packages:")

    for dep in dependencies:
        package_name = dep.split(">=")[0].split("==")[0].split("~=")[0].strip()
        print(f"   - {package_name}")

    print("\n✅ Cache warming complete!")

if __name__ == "__main__":
    warm_cache()
```

### Selective Package Management

**High-Priority Packages:**
Focus optimization on frequently used packages:
- **Web frameworks**: Django, FastAPI, Flask
- **Data science**: NumPy, Pandas, Scikit-learn
- **Testing**: Pytest, Coverage, Factory-boy
- **Development**: Black, isort, mypy

**Optimization Strategy:**
1. **Cache these first** - Warm cache with high-priority packages
2. **Longer retention** - Increase TTL for critical dependencies
3. **Pre-fetch versions** - Trigger completion for version exploration
4. **Monitor usage** - Track which packages are accessed most

### Batch Operations

**Efficient Workflow Patterns:**

**Package Research Session:**
1. **Batch hover** - Research multiple packages in sequence
2. **Document findings** - Take notes on version compatibilities
3. **Plan updates** - Group related updates together
4. **Execute changes** - Make multiple updates in single session

**Version Exploration:**
1. **Open completion** - Trigger for multiple packages
2. **Compare options** - Research version differences simultaneously
3. **Make decisions** - Choose versions for multiple packages together
4. **Apply updates** - Batch dependency changes

---

## Performance Best Practices

### Daily Usage

1. **Start sessions by warming cache** - Hover over key dependencies
2. **Use completion actively** - Don't type version numbers manually
3. **Enable appropriate caching** - Match settings to your project size
4. **Monitor performance** - Check cache statistics periodically
5. **Clean up when needed** - Clear cache if behavior becomes erratic

### System Optimization

1. **Allocate sufficient memory** - Ensure VS Code has adequate RAM
2. **Use fast storage** - SSD improves disk cache performance
3. **Maintain network quality** - Stable internet for initial fetches
4. **Update regularly** - Keep Tombo extension current
5. **Configure thoughtfully** - Match settings to your workflow

### Team Performance

1. **Share cache strategies** - Document team-wide cache settings
2. **Coordinate updates** - Batch dependency research sessions
3. **Monitor team usage** - Track common performance issues
4. **Document findings** - Share package research results
5. **Optimize collectively** - Use consistent performance settings

---

Ready to optimize your Tombo performance?

- **[Smart Caching →](../features/smart-caching.md)** - Deep dive into caching strategies
- **[Configuration →](../getting-started/configuration.md)** - Complete settings reference
- **[FAQ →](faq.md)** - Common questions and solutions
