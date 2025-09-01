# Installation Guide

## From VS Code Marketplace (Recommended)

### **Quick Install**
1. Open VS Code Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "Tombo - Python Package Manager"
3. Click "Install"

### **Command Line Install**
```bash
code --install-extension benbenbang.tombo
```

## Local Development Installation

### **Prerequisites**

| Tool | Version | Purpose |
|------|---------|---------|
| **VS Code** | 1.75.0+ | Extension host |
| **Node.js** | 14.x+ | TypeScript compilation |
| **Python** | 3.10+ | LSP server (future) |
| **nox** | Latest | Python task runner |
| **Python Extension** | Latest | VS Code Python support |

### **Quick Development Setup**

```bash
# 1. Clone and enter directory
git clone https://github.com/benbenbang/tombo.git
cd tombo

# 2. Install dependencies
npm install              # TypeScript dependencies
nox -s setup            # Python environment setup

# 3. Build and test
npm run compile          # Compile TypeScript
npm run watch           # Watch mode for development
```

### **Running the Extension Locally**

**Method 1: Extension Development Host (Recommended)**
1. Open the project in VS Code
2. Press `F5` or `Run > Start Debugging`
3. A new "Extension Development Host" window opens
4. Open a Python project with `pyproject.toml` or `requirements.txt`
5. Start typing dependencies to test completion

**Method 2: Install from VSIX**
```bash
# Build VSIX package
npm run vsce-package

# Install the generated package
code --install-extension tombo.vsix
```

## **Modern Development Workflow**

### **Watch Mode Development**
```bash
# Terminal 1: TypeScript compilation
npm run watch

# Terminal 2 (optional): Python development
nox -s setup
```

### **Testing and Validation**
```bash
# Compile and validate
npm run compile         # ✅ Clean compilation
npm run lint           # ✅ TypeScript linting
nox -s lint            # ✅ Python + TS linting (when available)

# Test the extension
# Press F5 in VS Code to launch Extension Development Host
```

### **Production Build**
```bash
npm run package        # Optimized production build
npm run vsce-package   # Create VSIX for distribution
```

## **Configuration & Settings**

### **Extension Settings**
The new architecture includes enhanced configuration options:

```json
{
  "tombo.pypiIndexUrl": "https://pypi.org/pypi/",
  "tombo.requestTimeout": 10000,
  "tombo.cacheTimeoutMinutes": 10,
  "tombo.maxCacheSize": 1000,
  "tombo.retryAttempts": 3,
  "tombo.listPreReleases": false,
  "tombo.showNotifications": "onError"
}
```

### **Advanced Configuration**
```json
{
  // Performance tuning
  "tombo.cacheTimeoutMinutes": 60,    // Longer cache for stable projects
  "tombo.maxCacheSize": 5000,         // More cache for large projects

  // Network resilience
  "tombo.requestTimeout": 15000,      // Longer timeout for slow connections
  "tombo.retryAttempts": 5,           // More retries for unreliable networks

  // Development mode
  "tombo.showNotifications": "always"  // Debug mode
}
```

## **Troubleshooting**

### **🐛 Common Issues**

#### **Extension Not Loading**
```bash
# Check VS Code Developer Console
Help > Toggle Developer Tools > Console

# Look for "[Tombo]" prefixed messages
# Common indicators:
#   ✅ "[Tombo] Extension activated with modern architecture"
#   ❌ "[Tombo] Failed to activate extension"
```

**Solutions:**
- Ensure Python extension is installed and enabled
- Verify Node.js version: `node --version` (should be 14.x+)
- Check for conflicting extensions (disable other Python dependency managers)

#### **No Completions Appearing**
**Check file patterns:**
- ✅ `pyproject.toml` (exact name)
- ✅ `requirements.txt`, `requirements-dev.txt`, etc.
- ❌ `pyproject.toml.backup` (won't work)

**Check connectivity:**
```bash
# Test PyPI connectivity
curl -s "https://pypi.org/pypi/requests/json" | head -20

# If this fails, check your network/proxy settings
```

**Enable debugging:**
```json
{
  "tombo.showNotifications": "always"
}
```

#### **Performance Issues**
**Check cache statistics:**
- Open VS Code Developer Console
- Look for cache hit rates in logs
- Low hit rates indicate cache settings need tuning

**Optimize settings:**
```json
{
  "tombo.cacheTimeoutMinutes": 60,  // Increase cache duration
  "tombo.maxCacheSize": 2000,       // Increase cache size
  "tombo.requestTimeout": 5000      // Reduce timeout for faster failures
}
```

#### **Build/Compilation Errors**
```bash
# Clean build
rm -rf node_modules dist out
npm install
npm run compile

# Check for TypeScript errors
npm run lint

# Verify all dependencies
npm ls
```

### **🔧 Development Issues**

#### **Python Environment Issues**
```bash
# Recreate Python environment
rm -rf .nox
nox -s setup

# Verify Python tools
python --version
pip --version
nox --version
```

#### **Extension Development Host Issues**
1. **Multiple instances**: Close all Extension Development Host windows before pressing F5
2. **Cache issues**: Restart VS Code main window
3. **Port conflicts**: Check for other running VS Code instances

#### **VSIX Installation Issues**
```bash
# Uninstall old version
code --uninstall-extension benbenbang.tombo

# Verify removal
code --list-extensions | grep tombo

# Install new version
code --install-extension tombo.vsix
```

## **Performance Monitoring**

### **Cache Performance**
Monitor cache effectiveness in VS Code Developer Console:

```javascript
// Look for logs like:
[Tombo] Cache stats: {
  totalKeys: 150,
  maxKeys: 1000,
  expired: 5,
  averageAge: 300,
  totalAccessCount: 850
}
```

**Optimization tips:**
- **High hit rate (>90%)**: Cache is working well
- **Many expired entries**: Consider increasing `cacheTimeoutMinutes`
- **Cache full**: Increase `maxCacheSize`

### **Network Performance**
```javascript
// Network timing logs:
[Tombo] Fetched django metadata in 245ms (cached: false)
[Tombo] Fetched requests metadata in 12ms (cached: true)
```

## **Uninstalling**

### **From VS Code**
1. Extensions panel > Tombo > Uninstall

### **Command Line**
```bash
code --uninstall-extension benbenbang.tombo
```

### **Clean Development Environment**
```bash
# Remove all build artifacts
rm -rf node_modules dist out .nox
npm cache clean --force

# Remove VS Code extension data (optional)
# Location varies by OS - check VS Code documentation
```

---

## **Next Steps**

After installation:
1. **Test basic functionality**: Open a `pyproject.toml` file and try typing dependency names
2. **Configure settings**: Adjust cache and timeout settings for your network
3. **Check performance**: Monitor cache stats for optimization opportunities
4. **Report issues**: Use GitHub Issues for bugs or feature requests

**Happy coding with modern Python dependency management! 🐍✨**
