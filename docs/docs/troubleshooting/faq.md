# Frequently Asked Questions

Get quick answers to common questions about Tombo. Find solutions to typical issues and learn about advanced usage patterns.

## Installation & Setup

### Q: How do I install Tombo?

**A:** Install directly from the VS Code Marketplace:

1. **VS Code Extensions Panel** → Search "Tombo"
2. **Command line**: `code --install-extension benbenbang.tombo`
3. **Marketplace**: Visit [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=benbenbang.tombo)

No additional setup required - Tombo works immediately with any Python project.

### Q: Does Tombo require Python to be installed?

**A:** Yes, but only for environment detection. Tombo needs the Python extension to understand your project's Python version requirements, but the core functionality (PyPI integration, caching, completion) works independently.

### Q: Can I use Tombo offline?

**A:** Partially! Tombo caches package information locally:

- ✅ **Cached packages** - Full functionality offline
- ✅ **Previously explored versions** - Available without internet
- ❌ **New packages** - Requires internet for first lookup
- ❌ **Latest versions** - May show stale data offline

**Tip**: Warm your cache by hovering over dependencies before going offline.

## File Format Support

### Q: Which file formats does Tombo support?

**A:** Tombo supports all major Python dependency formats:

**Fully Supported:**
- `pyproject.toml` (PEP 621 dependencies)
- `pyproject.toml` (Poetry v1 format)
- `requirements.txt` and variants (`requirements-*.txt`)
- Any `.txt` file with pip requirement syntax

**Partially Supported:**
- Poetry v2 parentheses syntax (works but needs operator triggers)

### Q: Why doesn't completion work in my `project-pyproject.toml` file?

**A:** **File naming requirement** - Tombo requires exact filename `pyproject.toml` (not variants like `*-pyproject.toml`). This ensures reliable format detection and prevents conflicts with other TOML files.

**Solution**: Rename to exactly `pyproject.toml` or use a standard `requirements.txt`.

### Q: Does Tombo work with Poetry?

**A:** **Excellent Poetry support!** Tombo works perfectly with Poetry v1 format:

```toml title="Perfect Poetry Support"
[tool.poetry.dependencies]
python = "^3.9"
requests = "^2.|"           # ← Completion works here
click = "~8.1"              # ← And here
fastapi = ">=0.|"           # ← And here
```

**Note**: Poetry v2 parentheses syntax `"(>=2.0,<3.0)"` works but completion triggers on operators (`>=`, `<`) rather than parentheses.

## Completion Behavior

### Q: Why isn't version completion triggering?

**A:** **Common causes and solutions:**

**1. Cursor Position**
```toml
# ✅ Correct - cursor immediately after operator
dependencies = ["requests>=|"]

# ❌ Wrong - cursor with space
dependencies = ["requests>= |"]
```

**2. File Recognition**
- Must be exactly `pyproject.toml` or `*requirements*.txt`
- Check VS Code status bar shows correct file type

**3. Network Access**
- First completion for each package requires internet
- Check VS Code Output Panel → "Tombo" for connection errors

**4. Package Name**
- Verify correct spelling and case sensitivity
- Try with common packages like `requests` or `numpy`

### Q: Can I force completion to appear?

**A:** **Yes, several methods:**

1. **Keyboard shortcut**: `Ctrl+Space` (Windows/Linux) or `Cmd+Space` (macOS)
2. **Re-trigger**: Delete and retype the operator (`>=`)
3. **Alternative operators**: Try `==` or `~=` if `>=` doesn't work
4. **Manual refresh**: Command Palette → "Tombo: Refresh Package Versions"

### Q: Why do I see "Loading..." for a long time?

**A:** **First-time package fetch takes 200-500ms**. Long delays usually indicate:

1. **Slow network** - Check internet connection speed
2. **Package doesn't exist** - Verify spelling on PyPI
3. **Corporate firewall** - May block PyPI access
4. **Large package** - Some packages have extensive version history

**Solution**: Enable debug logging to see detailed timing information.

## Caching Questions

### Q: How does Tombo's caching work?

**A:** **Three-tier caching system:**

1. **Memory Cache (L1)** - ~5-10ms, during VS Code session
2. **Disk Cache (L2)** - ~10-20ms, persistent between sessions
3. **Network (L3)** - ~200-500ms, fresh PyPI data

**Benefits:**
- 90% reduction in API calls
- Works partially offline
- Intelligent background refresh

### Q: How do I clear Tombo's cache?

**A:** **Multiple methods:**

1. **Command Palette** → "Tombo: Clear Cache"
2. **Settings** → Temporarily disable: `"tombo.cacheEnabled": false`
3. **Restart VS Code** → Clears memory cache (disk cache persists)

**When to clear cache:**
- Seeing stale version information
- Completion behaving erratically
- After network/proxy changes
- Package information seems corrupted

### Q: Why is my cache not working?

**A:** **Cache troubleshooting:**

**Check settings:**
```json title="Verify Cache Settings"
{
    "tombo.cacheTimeoutMinutes": 10,    // Not too short
    "tombo.maxCacheSize": 1000,         // Not too small
    "tombo.enableDebugLogging": true    // See cache behavior
}
```

**Debug with logging:**
1. Enable debug logging in settings
2. Open Output Panel → "Tombo"
3. Trigger completion and watch for "Cache HIT/MISS" messages
4. Look for cache storage confirmations

## Performance Issues

### Q: Tombo is slow, how can I speed it up?

**A:** **Performance optimization checklist:**

**1. Optimize cache settings:**
```json title="Performance Settings"
{
    "tombo.cacheTimeoutMinutes": 60,    // Longer cache
    "tombo.maxCacheSize": 2000,         // More packages cached
    "tombo.requestTimeout": 15000       // Tolerance for slow networks
}
```

**2. Network optimization:**
- Use wired internet when possible
- Check corporate proxy settings
- Consider increasing timeout values

**3. Pre-warm cache:**
- Hover over dependencies at start of session
- Trigger completion for frequently used packages

### Q: Tombo uses too much memory, what should I do?

**A:** **Memory optimization:**

```json title="Low Memory Settings"
{
    "tombo.maxCacheSize": 500,          // Smaller cache
    "tombo.cacheTimeoutMinutes": 15,    // Shorter retention
    "tombo.enableDebugLogging": false   // Reduce logging overhead
}
```

**Additional steps:**
1. **Restart VS Code** - Clear accumulated cache
2. **Close unused files** - Reduce overall memory usage
3. **Check system resources** - Ensure sufficient RAM available

## Error Messages

### Q: I see "Package not found" but the package exists on PyPI

**A:** **Common causes:**

1. **Typo in package name** - Check spelling carefully
2. **Case sensitivity** - PyPI packages are case-sensitive
3. **Network/proxy issues** - Check corporate firewall settings
4. **Package very new** - Cache might not reflect recent publications

**Solutions:**
1. **Verify on PyPI** - Visit pypi.org directly to confirm package exists
2. **Clear cache** - Force fresh lookup from PyPI
3. **Check network** - Test with known packages like `requests`
4. **Enable debug logging** - See detailed error information

### Q: What does "Request timeout" mean?

**A:** **Network request took too long** (default: 10 seconds)

**Solutions:**
```json title="Timeout Settings"
{
    "tombo.requestTimeout": 20000,      // Increase to 20 seconds
    "tombo.retryAttempts": 1            // Reduce retries to fail faster
}
```

**When to adjust:**
- Slow or unreliable internet connection
- Corporate network with proxy delays
- Working from locations with high network latency

## Integration Questions

### Q: Does Tombo conflict with other extensions?

**A:** **Generally no, but some known interactions:**

**TOML Extensions:**
- Extensions like "Even Better TOML" may interfere with completion
- **Solution**: Temporarily disable other TOML extensions to test
- **Alternative**: Use different trigger characters if conflicts occur

**Python Extensions:**
- Works excellently with official Python extension
- Shares Python environment detection
- No known conflicts with IntelliSense

### Q: Can I use Tombo with Docker?

**A:** **Yes!** Tombo works great with containerized development:

**Inside containers:**
- Install Tombo in your development container
- Cache persists in container volumes
- Works with remote development extensions

**Host development:**
- Develop on host, deploy to containers
- Use Tombo to research versions before container builds
- Cache benefits development speed

### Q: Does Tombo work with CI/CD?

**A:** **Tombo is a development tool** - it doesn't run in CI/CD pipelines. However:

**Development benefits:**
- Research appropriate versions before committing
- Verify compatibility requirements before deployment
- Use hover info to understand dependency implications

**CI/CD compatibility:**
- Tombo-selected versions work perfectly in automated environments
- No special CI configuration needed
- Standard pip/Poetry installation commands work unchanged

## Privacy & Security

### Q: What data does Tombo collect?

**A:** **Tombo is privacy-focused:**

**Data sent to PyPI:**
- Package names you look up (standard PyPI API usage)
- No personal information, file contents, or project details

**Data stored locally:**
- Package metadata cache (versions, descriptions)
- Your VS Code settings for Tombo
- No user tracking or analytics

**Data NOT collected:**
- Your code or file contents
- Personal information
- Usage analytics
- Project structure or dependencies

### Q: Is Tombo safe for corporate/confidential projects?

**A:** **Yes, Tombo is corporate-friendly:**

**Security features:**
- Only queries public PyPI data
- Never sends your code or file contents
- Works offline after initial cache
- No telemetry or user tracking

**Corporate considerations:**
- Check firewall allows PyPI access
- Consider using corporate PyPI mirror
- Cache works well in restricted environments
- No external dependencies beyond PyPI API

## Advanced Usage

### Q: Can I customize Tombo's behavior?

**A:** **Extensive customization available:**

**Visual customization:**
```json title="UI Customization"
{
    "tombo.compatibleDecorator": "✅",      // Custom compatible symbol
    "tombo.incompatibleDecorator": "❌",    // Custom warning symbol
    "tombo.showNotifications": "onError",   // When to show notifications
}
```

**Functional customization:**
```json title="Behavior Customization"
{
    "tombo.listPreReleases": true,          // Include alpha/beta versions
    "tombo.pypiIndexUrl": "https://...",    // Custom PyPI server
    "tombo.requestTimeout": 15000,          // Custom timeout
}
```

### Q: Can I contribute to Tombo?

**A:** **Absolutely!** Tombo welcomes contributions:

**Ways to contribute:**
- **Report bugs** - GitHub issues with detailed reproduction steps
- **Suggest features** - Ideas for improvements or new functionality
- **Documentation** - Help improve guides and examples
- **Code contributions** - Pull requests for features or fixes

**Getting started:**
1. Visit [GitHub repository](https://github.com/benbenbang/tombo)
2. Read contributing guidelines
3. Check existing issues for good first contributions
4. Join discussions about future features

---

## Still Need Help?

### Getting Support

**1. Check Documentation:**
- [Installation Guide](../getting-started/installation.md)
- [Configuration Reference](../getting-started/configuration.md)
- [Common Issues](common-issues.md)

**2. Debug Information:**
- Enable debug logging: `"tombo.enableDebugLogging": true`
- Check Output Panel → "Tombo"
- Note exact error messages and reproduction steps

**3. Community Support:**
- [GitHub Issues](https://github.com/benbenbang/tombo/issues)
- Search existing issues for similar problems
- Provide detailed reproduction information when reporting new issues

**4. Quick Verification:**
- Try with a simple `requirements.txt` and common package like `requests>=`
- Test in a new VS Code window with minimal extensions
- Verify network connectivity to pypi.org

### Useful Diagnostic Commands

```bash
# Test PyPI connectivity
curl -s https://pypi.org/pypi/requests/json | head

# Check VS Code extension status
code --list-extensions | grep tombo

# Verify file associations
# File → Preferences → Settings → search "file associations"
```

---

**Still experiencing issues?** Please [report them on GitHub](https://github.com/benbenbang/tombo/issues) with:
- VS Code version
- Tombo version
- File format you're using
- Exact error message
- Steps to reproduce
- Debug log output (if possible)
