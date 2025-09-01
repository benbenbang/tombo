/**
 * Hover provider for rich package information display
 * Shows detailed metadata when hovering over package names
 */

import {
  HoverProvider,
  TextDocument,
  Position,
  CancellationToken,
  Hover,
  MarkdownString,
  Range
} from 'vscode';

import { PyPIService } from '../api/services/pypi-service';
import { PackageMetadata, PyPIPackageInfo } from '../api/types/pypi';
import { PyPIError, PackageNotFoundError } from '../core/errors/pypi-errors';
import { ExtensionConfig } from '../core/config/extension-config';
import { parseDependenciesWithMetadata } from '../toml/parser';

export class PackageHoverProvider implements HoverProvider {
  private readonly pypiService: PyPIService;
  private readonly config: ExtensionConfig;

  constructor(pypiService: PyPIService, config: ExtensionConfig) {
    this.pypiService = pypiService;
    this.config = config;
  }

  async provideHover(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): Promise<Hover | null> {
    try {
      // Extract package information from the current position
      const packageInfo = this.extractPackageInfo(document, position);
      if (!packageInfo) {
        return null;
      }

      // Check for cancellation
      if (token.isCancellationRequested) {
        return null;
      }

      // Get package metadata with pre-release preferences
      const config = this.config.getConfig();
      const metadata = await this.pypiService.getPackageMetadata(
        packageInfo.name,
        config.listPreReleases
      );

      // Check for cancellation after async operation
      if (token.isCancellationRequested) {
        return null;
      }

      // Fetch additional package details for richer information
      const packageResponse = await this.fetchPackageDetails(packageInfo.name);

      // Create hover content
      const hoverContent = this.createHoverContent(metadata, packageResponse);

      return new Hover(hoverContent, packageInfo.range);

    } catch (error) {
      return this.handleHoverError(error);
    }
  }

  /**
   * Extract package name and range from document position
   * FIXED: Better validation to prevent 'unknown' package errors
   */
  private extractPackageInfo(document: TextDocument, position: Position): { name: string; range: Range } | null {
    const line = document.lineAt(position);
    const lineText = line.text;
    const wordRange = document.getWordRangeAtPosition(position, /[\w\-_.]+/);

    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    // Validate word is a reasonable package name (prevent 'unknown' errors)
    if (!this.isValidPackageName(word)) {
      return null;
    }

    // Only process supported file types
    if (document.fileName.endsWith('pyproject.toml')) {
      return this.extractFromTOML(lineText, position, wordRange, word);
    } else if (document.fileName.includes('requirements') && document.fileName.endsWith('.txt')) {
      return this.extractFromRequirements(lineText, position, wordRange, word);
    }

    return null;
  }

  /**
   * Extract package info from TOML format
   * FIXED: Better pattern matching and validation
   */
  private extractFromTOML(lineText: string, position: Position, wordRange: Range, word: string): { name: string; range: Range } | null {
    // First check for PEP 621 array format: "package>=1.0.0", "package[extra]~=1.0", etc.
    const pep621Result = this.extractFromPep621Array(lineText, position, wordRange, word);
    if (pep621Result) {
      return pep621Result;
    }

    // Traditional TOML patterns: package = "^1.0.0" or package = { version = "^1.0.0" }
    const tomlPatterns = [
      /^(\w+[-\w.]*)\s*=\s*["']([^"']*)/,  // package = "version"
      /^(\w+[-\w.]*)\s*=\s*\{\s*version\s*=\s*["']([^"']*)/,  // package = { version = "version" }
      /^(\w+[-\w.]*)\s*=\s*["']([^"']*)?["']?\s*$/,  // package = "?" or package = ""
    ];

    for (const pattern of tomlPatterns) {
      const match = lineText.match(pattern);
      if (match && match[1] === word && this.isValidPackageName(match[1])) {
        return {
          name: match[1],
          range: wordRange
        };
      }
    }

    // Check if we're in a dependencies section with a valid package name
    if (this.isInDependenciesSection(lineText) && this.isValidPackageName(word)) {
      return {
        name: word,
        range: wordRange
      };
    }

    return null;
  }

  /**
   * Extract package info from PEP 621 array format
   * FIXED: Better validation to prevent 'unknown' package detection
   */
  private extractFromPep621Array(lineText: string, _position: Position, wordRange: Range, word: string): { name: string; range: Range } | null {
    // Enhanced PEP 621 patterns with better validation
    const pep621Patterns = [
      // Pattern for: "package>=1.0.0", "package~=1.0", etc.
      /"([a-zA-Z0-9][a-zA-Z0-9_.-]*(?:\[[^\]]*\])?)([><=!~]+)([^"]*)"/,
      // Pattern for: "package[extra]", "package" (no version)
      /"([a-zA-Z0-9][a-zA-Z0-9_.-]*(?:\[[^\]]*\])?)"/,
    ];

    for (const pattern of pep621Patterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageWithExtras = match[1];
        const packageName = packageWithExtras.replace(/\[[^\]]*\]/, ''); // Remove extras

        // Validate package name and check if we're hovering over it
        if (this.isValidPackageName(packageName) &&
            (packageName === word || packageWithExtras === word)) {
          return {
            name: packageName,
            range: wordRange
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract package info from requirements.txt format
   * FIXED: Better validation to prevent invalid package names
   */
  private extractFromRequirements(lineText: string, _position: Position, wordRange: Range, word: string): { name: string; range: Range } | null {
    // Match patterns like: package==1.0.0, package>=1.0.0, etc.
    const reqPattern = /^([a-zA-Z0-9][a-zA-Z0-9_.-]*)\s*([><=!~]+)/;
    const match = lineText.match(reqPattern);

    if (match && match[1] === word && this.isValidPackageName(match[1])) {
      return {
        name: match[1],
        range: wordRange
      };
    }

    // Handle simple package name lines with validation
    if (this.isValidPackageName(word) && lineText.trim() === word) {
      return {
        name: word,
        range: wordRange
      };
    }

    return null;
  }

  /**
   * Check if current line is in a TOML dependencies section
   * This needs to be enhanced to look at document context, not just current line
   */
  private isInDependenciesSection(lineText: string): boolean {
    // For now, this is a simple check - a more robust implementation would
    // analyze the document structure to determine the current TOML section
    const dependencySectionPatterns = [
      /dependencies\s*=/,
      /\[.*dependencies.*\]/i,
      /dev-dependencies\s*=/,
      /optional-dependencies\s*=/,
      // Pattern for lines that look like package assignments in poetry format
      /^[\w\-_.]+\s*=\s*["']/,
      // Pattern for PEP 621 array entries
      /^\s*"[a-zA-Z0-9_-]+/
    ];

    return dependencySectionPatterns.some(pattern => pattern.test(lineText));
  }

  /**
   * Fetch additional package details for richer hover information
   */
  private async fetchPackageDetails(packageName: string): Promise<PyPIPackageInfo | null> {
    try {
      return await this.pypiService.getPackageInfo(packageName);
    } catch (error) {
      // Gracefully handle errors - return null to show basic info only
      if (error instanceof PackageNotFoundError) {
        return null;
      }

      console.warn(`[Tombo] Failed to fetch package details for ${packageName}:`, error);
      return null;
    }
  }

  /**
   * Create rich hover content with package information
   */
  private createHoverContent(metadata: PackageMetadata, packageInfo: PyPIPackageInfo | null): MarkdownString {
    const content = new MarkdownString();
    content.isTrusted = true;
    content.supportHtml = true;

    // Package header
    content.appendMarkdown(`# ${metadata.name}\n\n`);

    if (metadata.summary) {
      content.appendMarkdown(`${metadata.summary}\n\n`);
    }

    // Version information
    content.appendMarkdown(`**Latest Version:** \`${metadata.latestVersion}\`\n\n`);

    if (metadata.requiresPython) {
      content.appendMarkdown(`**Python Requirements:** \`${metadata.requiresPython}\`\n\n`);
    }

    // Recent versions section
    const recentVersions = metadata.versions.slice(0, 5);
    if (recentVersions.length > 0) {
      content.appendMarkdown('**Recent Versions:**\n');
      recentVersions.forEach((version) => {
        let versionLine = `- \`${version}\``;

        if (metadata.yankedVersions.has(version)) {
          versionLine += ' ⚠️ *yanked*';
        } else if (metadata.preReleaseVersions.has(version)) {
          versionLine += ' 🔄 *pre-release*';
        } else if (version === metadata.latestVersion) {
          versionLine += ' ✓ *latest*';
        }

        content.appendMarkdown(`${versionLine}\n`);
      });
      content.appendMarkdown('\n');
    }

    // Links section (if we had full package info)
    if (packageInfo) {
      this.addLinksSection(content, packageInfo);
    } else {
      // Add basic PyPI link
      const pypiUrl = `https://pypi.org/project/${metadata.name}/`;
      content.appendMarkdown(`**Links:**\n- [PyPI](${pypiUrl})\n\n`);
    }

    // Classifiers (if available and meaningful)
    if (metadata.classifiers && metadata.classifiers.length > 0) {
      const importantClassifiers = this.filterImportantClassifiers(metadata.classifiers);
      if (importantClassifiers.length > 0) {
        content.appendMarkdown('**Categories:**\n');
        importantClassifiers.slice(0, 5).forEach(classifier => {
          content.appendMarkdown(`- ${classifier}\n`);
        });
        content.appendMarkdown('\n');
      }
    }

    // Footer
    content.appendMarkdown('---\n*Tombo • Python Package Management*');

    return content;
  }

  /**
   * Add links section to hover content
   */
  private addLinksSection(content: MarkdownString, packageInfo: PyPIPackageInfo): void {
    content.appendMarkdown('**Links:**\n');

    // PyPI link
    if (packageInfo.package_url) {
      content.appendMarkdown(`- [PyPI](${packageInfo.package_url})\n`);
    }

    // Homepage
    if (packageInfo.home_page) {
      content.appendMarkdown(`- [Homepage](${packageInfo.home_page})\n`);
    }

    // Project URLs (repository, documentation, etc.)
    if (packageInfo.project_urls) {
      Object.entries(packageInfo.project_urls).forEach(([name, url]) => {
        if (url && name.toLowerCase() !== 'homepage') {
          const displayName = name.charAt(0).toUpperCase() + name.slice(1);
          content.appendMarkdown(`- [${displayName}](${url})\n`);
        }
      });
    }

    // Documentation URL
    if (packageInfo.docs_url) {
      content.appendMarkdown(`- [Documentation](${packageInfo.docs_url})\n`);
    }

    content.appendMarkdown('\n');

    // Author information
    if (packageInfo.author || packageInfo.maintainer) {
      content.appendMarkdown('**Maintainers:**\n');
      if (packageInfo.author) {
        content.appendMarkdown(`- Author: ${packageInfo.author}\n`);
      }
      if (packageInfo.maintainer && packageInfo.maintainer !== packageInfo.author) {
        content.appendMarkdown(`- Maintainer: ${packageInfo.maintainer}\n`);
      }
      content.appendMarkdown('\n');
    }

    // License
    if (packageInfo.license) {
      content.appendMarkdown(`**License:** ${packageInfo.license}\n\n`);
    }
  }

  /**
   * Filter classifiers to show only the most important ones
   */
  private filterImportantClassifiers(classifiers: string[]): string[] {
    const importantPrefixes = [
      'Development Status',
      'Intended Audience',
      'License',
      'Programming Language :: Python',
      'Topic',
      'Framework'
    ];

    return classifiers.filter(classifier =>
      importantPrefixes.some(prefix => classifier.startsWith(prefix))
    );
  }

  /**
   * Validate if a word could be a valid package name
   * Prevents 'unknown' package errors for random text
   */
  private isValidPackageName(name: string): boolean {
    if (!name || name.length === 0) {
      return false;
    }

    // Package names must start with letter or number, can contain letters, numbers, hyphens, underscores, dots
    // Minimum length of 2 to avoid single character false positives
    const packageNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{1,}$/;

    // Additional checks to avoid common false positives
    const commonNonPackages = ['if', 'or', 'and', 'not', 'in', 'is', 'for', 'while', 'def', 'class', 'try', 'except', 'finally', 'with', 'as', 'import', 'from', 'return', 'pass', 'break', 'continue', 'true', 'false', 'none', 'abc', 'test', 'example'];

    return packageNamePattern.test(name) &&
           !commonNonPackages.includes(name.toLowerCase()) &&
           name.length >= 2;
  }

  /**
   * Handle hover errors gracefully
   * FIXED: Better error handling to prevent showing errors for invalid package names
   */
  private handleHoverError(error: any): Hover | null {
    if (error instanceof PackageNotFoundError) {
      // Silently ignore - don't show hover for non-existent packages
      return null;
    }

    if (error instanceof PyPIError) {
      // Log but don't show hover for API errors
      console.warn(`[Tombo] PyPI error during hover: ${error.message}`);
      return null;
    }

    console.error('[Tombo] Unexpected error during hover:', error);
    return null;
  }
}
