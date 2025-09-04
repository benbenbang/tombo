# Installation

Get Tombo up and running in VS Code in just a few minutes.

## VS Code Marketplace (Recommended)

The easiest way to install Tombo is directly from the VS Code Marketplace:

=== "Via VS Code UI"

    1. **Open VS Code**
    2. **Press `Ctrl+Shift+X`** (Windows/Linux) or **`Cmd+Shift+X`** (macOS) to open Extensions
    3. **Search for "Tombo"**
    4. **Click Install** on the official Tombo extension
    5. **Reload VS Code** when prompted

=== "Via Command Palette"

    1. **Press `Ctrl+Shift+P`** (Windows/Linux) or **`Cmd+Shift+P`** (macOS)
    2. **Type** `Extensions: Install Extensions`
    3. **Search for "Tombo"**
    4. **Click Install** on the official extension

=== "Via Command Line"

    ```bash
    # Install directly via VS Code CLI
    code --install-extension tombo.tombo
    ```

## VSIX Installation (Advanced)

For nightly (pre-release) versions or offline installation:

!!! warning "Advanced Users Only"
    Only install VSIX files from trusted sources. The official marketplace installation is recommended for most users.

1. **Download the VSIX file** from the [GitHub releases page](https://github.com/benbenbang/tombo/releases)
2. **Open VS Code**
3. **Press `Ctrl+Shift+P`** (Windows/Linux) or **`Cmd+Shift+P`** (macOS)
4. **Type** `Extensions: Install from VSIX...`
5. **Select the downloaded VSIX file**
6. **Restart VS Code**

## System Requirements

### Minimum Requirements

- **VS Code**: Version 1.74.0 or higher
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Network**: Internet connection for first package lookup (then works offline)

### Recommended Environment

- **VS Code**: Latest stable version
- **Python**: 3.10+ installed (for Python project development, note that <3.10 is fine to use, however it's already the end of the lifecycle.)
- **Git**: For version control integration
- **Node.js**: 16+ (if contributing to development)

## Verification

After installation, verify that Tombo is working correctly:

1. **Open a Python project** with `pyproject.toml` or `requirements.txt`
2. **Look for the Tombo icon** in the VS Code status bar (bottom right)
3. **Hover over a package name** in your dependency file
4. **You should see rich metadata** with version information

!!! success "Installation Complete!"
    If you see hover information when hovering over package names, Tombo is successfully installed and ready to use!

## First Steps

Now that Tombo is installed:

1. **[Configure your preferences](configuration.md)** - Set up PyPI index, logging, and decorations
2. **[Try the quick start guide](quick-start.md)** - Learn the basic features
3. **[Explore examples](../examples/pep621.md)** - See Tombo in action with different project types

## Troubleshooting Installation

### Extension Not Appearing

If Tombo doesn't appear in your extensions list:

1. **Restart VS Code completely**
2. **Check the VS Code output panel** for any error messages
3. **Verify your VS Code version** meets the minimum requirements
4. **Try refreshing the extensions marketplace**

### Hover Information Not Working

If package hover doesn't work:

1. **Check that you're in a supported file type** (`pyproject.toml`, `requirements.txt`)
2. **Verify internet connectivity** for first-time package lookups
3. **Check the VS Code output panel** for Tombo logs
4. **Try restarting VS Code**

### Performance Issues

If Tombo feels slow:

1. **Check your network connection** - first lookups require internet
2. **Wait for initial caching** - subsequent requests will be instant
3. **Clear the cache** via VS Code command palette: `Tombo: Clear Cache`

Need more help? Check our [detailed troubleshooting guide](../troubleshooting/common-issues.md) or [file an issue](https://github.com/benbenbang/tombo/issues).

## Next Steps

- [Quick Start Guide →](quick-start.md)
- [Configuration Options →](configuration.md)
- [Feature Overview →](../features/overview.md)
