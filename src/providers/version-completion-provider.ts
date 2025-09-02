/**
 * Modern completion provider using the new PyPI service
 * Demonstrates clean integration patterns
 */

import {
  CompletionItemProvider,
  TextDocument,
  Position,
  CompletionItem,
  CompletionItemKind,
  CompletionContext,
  CancellationToken,
  CompletionList,
  Range,
  MarkdownString
} from 'vscode';

import { PyPIService } from '../api/services/pypi-service';
import { PackageMetadata } from '../api/types/pypi';
import { PyPIError, PackageNotFoundError } from '../core/errors/pypi-errors';
import { ExtensionConfig } from '../core/config/extension-config';
import { Logger } from '../core/logging/logger';
// Removed unused: parseDependenciesWithMetadata

export class VersionCompletionProvider implements CompletionItemProvider {
  private readonly pypiService: PyPIService;
  private readonly config: ExtensionConfig;
  private readonly logger: Logger;

  constructor(pypiService: PyPIService, config: ExtensionConfig) {
    this.pypiService = pypiService;
    this.config = config;
    this.logger = Logger.getInstance();
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    _context: CompletionContext
  ): Promise<CompletionItem[] | CompletionList | null> {
    this.logger.completion(`Triggered at ${document.fileName}:${position.line}:${position.character}`);

    try {
      // Check if we're in a dependency context
      const packageInfo = this.extractPackageInfo(document, position);
      this.logger.debug(`Package info: ${JSON.stringify(packageInfo)}`);
      if (!packageInfo) {
        this.logger.debug('No package info found - completion will not trigger');
        return null;
      }

      // Check for cancellation
      if (token.isCancellationRequested) {
        return null;
      }

      // Get package metadata with version preferences
      const config = this.config.getConfig();
      const metadata = await this.pypiService.getPackageMetadata(
        packageInfo.name,
        config.listPreReleases
      );

      // Check for cancellation after async operation
      if (token.isCancellationRequested) {
        return null;
      }

      return this.createCompletionItems(metadata, packageInfo);

    } catch (error) {
      this.handleCompletionError(error);
      return null;
    }
  }

  /**
   * Extract package name and context from document position
   */
  private extractPackageInfo(document: TextDocument, position: Position): { name: string; range: Range } | null {
    const line = document.lineAt(position);
    const lineText = line.text;

    // Handle pyproject.toml format
    if (document.fileName.endsWith('pyproject.toml')) {
      return this.extractFromTOML(lineText, position, line);
    }

    // Handle requirements.txt format
    if (document.fileName.includes('requirements') && document.fileName.endsWith('.txt')) {
      return this.extractFromRequirements(lineText, position, line);
    }

    return null;
  }

  /**
   * Extract package info from TOML format
   */
  private extractFromTOML(lineText: string, position: Position, _line: any): { name: string; range: Range } | null {
    // First check for PEP 621 array format: "package>=1.0.0", "package[extra]~=1.0", etc.
    const pep621Result = this.extractFromPep621Array(lineText, position);
    if (pep621Result) {
      return pep621Result;
    }

    // Check for operator-based patterns without quotes: package~=1.0, package>=2.0, etc.
    const operatorResult = this.extractFromOperatorContext(lineText, position);
    if (operatorResult) {
      return operatorResult;
    }

    // Enhanced traditional TOML patterns with better position detection
    const tomlPatterns = [
      // Pattern 1: package = "version" (completed quotes)
      /^(\w+[-\w]*)\s*=\s*["']([^"']*)["']/,
      // Pattern 2: package = "version (incomplete, no closing quote)
      /^(\w+[-\w]*)\s*=\s*["']([^"']*)/,
      // Pattern 3: package = { version = "version" }
      /^(\w+[-\w]*)\s*=\s*\{\s*version\s*=\s*["']([^"']*)/,
      // Pattern 4: package = version (unquoted numbers - Poetry v1 common format)
      /^(\w+[-\w]*)\s*=\s*([0-9][0-9a-zA-Z\.\-\+]*)\s*$/,
    ];

    for (const pattern of tomlPatterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageName = match[1];
        const version = match[2] || '';
        const fullMatch = match[0];

        // Find where the version content starts (after the opening quote)
        const beforeVersion = fullMatch.substring(0, fullMatch.length - version.length);
        const versionStart = match.index! + beforeVersion.length;

        // For incomplete strings (no closing quote), version ends at line end
        // For complete strings, version ends before closing quote
        let versionEnd = versionStart + version.length;
        if (lineText.includes('"', versionStart + version.length) || lineText.includes("'", versionStart + version.length)) {
          // Complete string - don't include closing quote in range
          versionEnd = versionStart + version.length;
        } else {
          // Incomplete string - version content goes to end of what user has typed
          versionEnd = lineText.length;
        }

        // Check if cursor is within or right after the version content area
        // For empty versions, allow cursor right at the quote or just after
        const effectiveEnd = version === '' ? Math.max(versionEnd, versionStart + 1) : versionEnd;

        if (position.character >= versionStart && position.character <= effectiveEnd) {
          this.logger.completion(`TOML match found: package="${packageName}", version="${version}", range=${versionStart}-${versionEnd}, cursor=${position.character}`);
          return {
            name: packageName,
            range: new Range(
              position.line,
              versionStart,
              position.line,
              versionEnd
            )
          };
        }
      }
    }

    return null;
  }

  /**
   * Extract package info from operator context (package~=, package>=, etc.)
   */
  private extractFromOperatorContext(lineText: string, position: Position): { name: string; range: Range } | null {
    // Match patterns like: package~=1.0, package>=2.0, package==, etc.
    // This handles cases where users type directly after operators without quotes
    // IMPORTANT: Exclude Poetry assignment syntax (package = "version") by requiring no space before operator
    const operatorPattern = /^\s*(\w+[-\w]*)([~><=!]{2,}|[~><!][>=]|[><!]=|[~><!])([^\s#]*)/;
    const match = lineText.match(operatorPattern);

    if (match) {
      const packageName = match[1];
      const operator = match[2];
      const version = match[3];
      const operatorEnd = match.index! + match[1].length + match[2].length + (match[0].length - match[1].length - match[2].length - version.length);
      const versionStart = operatorEnd;
      const versionEnd = match.index! + match[0].length;

      // Check if cursor is after the operator (where version would be typed)
      if (position.character >= versionStart) {
        this.logger.completion(`Operator context match: package="${packageName}", operator="${operator}", version="${version}", range=${versionStart}-${versionEnd}, cursor=${position.character}`);
        return {
          name: packageName,
          range: new Range(
            position.line,
            versionStart,
            position.line,
            versionEnd
          )
        };
      }
    }

    return null;
  }

  /**
   * Extract package info from PEP 621 array format
   */
  private extractFromPep621Array(lineText: string, position: Position): { name: string; range: Range } | null {
    // Match PEP 621 dependency patterns in arrays:
    // "package>=1.0.0", "package[extra]~=1.0", "package", "package (>=1.0,<2.0)", etc.
    const pep621Patterns = [
      // Pattern for: "package>=1.0.0", "package~=1.0", etc. with operators
      /"([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)([><=!~]+)([^"]*)"/,
      // Pattern for: "package (>=1.0,<2.0)" parentheses format (Poetry v2)
      /"([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)\s*\(([^)]+)\)"/,
      // Pattern for: "package" at the end of quote (no operator yet)
      /"([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)$/,
      // Pattern for: "package" (no version, no operator)
      /"([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)"/,
    ];

    for (const pattern of pep621Patterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageName = match[1].replace(/\[[^\]]*\]/, ''); // Remove extras for completion

        if (match[2]) {
          // Has operator - check if cursor is in version part
          const operatorLength = match[2].length;
          const versionStart = match.index! + 1 + match[1].length + operatorLength; // +1 for opening quote
          const versionEnd = match.index! + match[0].length - 1; // -1 for closing quote

          if (position.character >= versionStart && position.character <= versionEnd) {
            return {
              name: packageName,
              range: new Range(
                position.line,
                versionStart,
                position.line,
                versionEnd
              )
            };
          }
        } else {
          // No operator yet - check if cursor is right after package name (for adding operator + version)
          const packageEnd = match.index! + 1 + match[1].length; // +1 for opening quote

          if (position.character >= packageEnd) {
            return {
              name: packageName,
              range: new Range(
                position.line,
                packageEnd,
                position.line,
                match.index! + match[0].length - 1 // -1 for closing quote
              )
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract package info from requirements.txt format
   */
  private extractFromRequirements(lineText: string, position: Position, _line: any): { name: string; range: Range } | null {
    // Match patterns like: package==1.0.0, package>=1.0.0, etc.
    const reqPattern = /^(\w+[-\w]*)\s*([><=!~]+)\s*([^#\s]*)/;
    const match = lineText.match(reqPattern);

    if (match && position.character >= match.index! + match[1].length + match[2].length) {
      return {
        name: match[1],
        range: new Range(
          position.line,
          match.index! + match[1].length + match[2].length,
          position.line,
          match.index! + match[0].length
        )
      };
    }

    return null;
  }

  /**
   * Create completion items from package metadata
   */
  private createCompletionItems(metadata: PackageMetadata, packageInfo: { name: string; range: Range }): CompletionItem[] {
    const items: CompletionItem[] = [];
    const config = this.config.getConfig();

    // Add latest version as primary suggestion
    if (metadata.latestVersion) {
      const latestItem = new CompletionItem(metadata.latestVersion, CompletionItemKind.Value);
      latestItem.detail = `📌 Latest version of ${metadata.name}`;
      latestItem.documentation = new MarkdownString(
        `**${metadata.name}** - ${metadata.summary}\n\n` +
        `Latest stable version: **${metadata.latestVersion}**\n\n` +
        (metadata.requiresPython ? `Requires Python: ${metadata.requiresPython}` : '')
      );
      latestItem.insertText = metadata.latestVersion;
      latestItem.range = packageInfo.range;
      latestItem.sortText = '0000'; // Sort first
      latestItem.filterText = metadata.latestVersion; // Help with filtering
      items.push(latestItem);
    }

    // Add other recent versions (limit to 25 for performance)
    const otherVersions = metadata.versions.filter(v => v !== metadata.latestVersion);
    otherVersions.slice(0, 25).forEach((version, index) => {
      const item = new CompletionItem(version, CompletionItemKind.Value);

      // Create rich detail with visual indicators
      let detail = `Version ${version}`;
      let icon = '📦';

      if (metadata.yankedVersions.has(version)) {
        detail += ' (yanked)';
        icon = '⚠️';
      } else if (metadata.preReleaseVersions.has(version)) {
        detail += ' (pre-release)';
        icon = '🧪';
      }

      item.detail = `${icon} ${detail}`;
      item.insertText = version;
      item.range = packageInfo.range;
      item.filterText = version; // Help with filtering

      // Smart sorting: stable versions before pre-releases, yanked versions last
      let sortPrefix = '1'; // Normal versions
      if (metadata.preReleaseVersions.has(version)) {
        sortPrefix = '2'; // Pre-release versions
      }
      if (metadata.yankedVersions.has(version)) {
        sortPrefix = '9'; // Yanked versions last
        item.tags = [1]; // Deprecated tag
      }

      item.sortText = `${sortPrefix}${String(index + 1).padStart(3, '0')}`;

      items.push(item);
    });

    return items;
  }

  /**
   * Handle completion errors gracefully
   */
  private handleCompletionError(error: any): void {
    if (error instanceof PackageNotFoundError) {
      // Silently ignore - package doesn't exist yet
      return;
    }

    if (error instanceof PyPIError) {
      this.logger.warn(`PyPI error during completion: ${error.message}`);
      this.logger.debug(`PyPI error details: ${JSON.stringify(error.toJSON())}`);
      return;
    }

    this.logger.error('Unexpected error during completion:', error);
  }

}
