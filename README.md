# Tombo - Python Package Manager for VS Code

Tombo is a VS Code extension that helps you manage Python package dependencies in your projects. It provides real-time version suggestions from PyPI when editing `pyproject.toml` or `requirements.txt` files.

## Features

- Auto-completion for Python package versions from PyPI
- Support for both `pyproject.toml` and `requirements.txt` files
- Visual indicators for compatible/incompatible versions
- Quick-fill feature - type `?` to auto-fill with the latest version
- Shows package information and descriptions in completion items

## Usage

1. Open a `pyproject.toml` or `requirements.txt` file
2. Type a package name followed by a version specifier (e.g., `=` or `>=`)
3. The extension will fetch and suggest available versions from PyPI
4. Select from the list of versions to insert it into your file

## Settings

- `tombo.listPreReleases`: Show pre-release versions in the completion list (default: `false`)
- `tombo.pypiIndexUrl`: URL of the PyPI index server to use (default: `https://pypi.org/pypi/`)
- `tombo.compatibleDecorator`: Decorator text for compatible versions (default: `✓`)
- `tombo.incompatibleDecorator`: Decorator text for incompatible versions (default: `⚠`)
- `tombo.errorDecorator`: Decorator text for errors (default: `⚠️`)

## Quick Actions

- Type `?` in a version field to auto-fill with the latest version
- Right-click on a package line to see quick update options

## Requirements

- VS Code 1.75.0 or higher
- Python Extension for VS Code

## Inspiration

This extension is inspired by the [crates](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates) extension for Rust packages.
