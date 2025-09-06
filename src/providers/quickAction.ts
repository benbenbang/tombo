/**
 * Quick actions provider for package version updates and fixes
 * Provides code actions for updating packages to latest versions
 */

import {
  CodeActionProvider,
  TextDocument,
  Range,
  CodeActionContext,
  CancellationToken,
  CodeAction,
  CodeActionKind,
  WorkspaceEdit,
  Position,
  workspace
} from 'vscode';

import { PyPIService } from '../api/services/pypi-service';
import { PackageMetadata } from '../api/types/pypi';
import { PyPIError, PackageNotFoundError } from '../core/errors/pypi-errors';
import { ExtensionConfig } from '../core/config/extension-config';
import { parseDependenciesWithMetadata } from '../toml/parser';

export class QuickActions implements CodeActionProvider {
  private readonly pypiService: PyPIService;
  private readonly config: ExtensionConfig;

  constructor(pypiService: PyPIService, config: ExtensionConfig) {
    this.pypiService = pypiService;
    this.config = config;
  }

  async provideCodeActions(
    document: TextDocument,
    range: Range,
    _context: CodeActionContext,
    token: CancellationToken
  ): Promise<CodeAction[]> {
    const actions: CodeAction[] = [];

    try {
      // Extract package information from the current selection/position
      const packageInfo = this.extractPackageInfo(document, range);
      if (!packageInfo) {
        return actions;
      }

      // Check for cancellation
      if (token.isCancellationRequested) {
        return actions;
      }

      // Get package metadata
      const config = this.config.getConfig();
      const metadata = await this.pypiService.getPackageMetadata(
        packageInfo.name,
        config.listPreReleases
      );

      // Check for cancellation after async operation
      if (token.isCancellationRequested) {
        return actions;
      }

      // Create quick actions based on package state
      actions.push(...this.createVersionUpdateActions(document, packageInfo, metadata));
      actions.push(...this.createVersionSelectActions(document, packageInfo, metadata));

    } catch (error) {
      this.handleQuickActionError(error);
    }

    return actions;
  }

  /**
   * Extract package information from document range
   */
  private extractPackageInfo(document: TextDocument, range: Range): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    line: string;
    isToml: boolean;
  } | null {
    const line = document.lineAt(range.start.line);
    const lineText = line.text;

    // Handle pyproject.toml format
    if (document.fileName.endsWith('pyproject.toml')) {
      return this.extractFromTOML(document, lineText, range);
    }

    // Handle requirements.txt format
    if (document.fileName.includes('requirements') && document.fileName.endsWith('.txt')) {
      return this.extractFromRequirements(document, lineText, range);
    }

    return null;
  }

  /**
   * Extract package info from TOML format
   */
  private extractFromTOML(_document: TextDocument, lineText: string, range: Range): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    line: string;
    isToml: boolean;
  } | null {
    // First check for PEP 621 array format
    const pep621Result = this.extractFromPep621Array(lineText, range);
    if (pep621Result) {
      return pep621Result;
    }

    // Fall back to traditional TOML patterns: package = "^1.0.0" or package = { version = "^1.0.0" }
    const tomlPatterns = [
      /^(\w+[-\w.]*)\s*=\s*["']([^"']*)["']/,  // package = "version"
      /^(\w+[-\w.]*)\s*=\s*\{\s*version\s*=\s*["']([^"']*)["']/,  // package = { version = "version" }
    ];

    for (const pattern of tomlPatterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageName = match[1];
        const currentVersion = match[2];

        // Calculate the range for the version part more accurately
        // For patterns like package = "version" or package = { version = "version" }
        // Find the quote that contains our version
        const beforeVersion = match[0].substring(0, match[0].lastIndexOf(currentVersion));
        const versionStart = match.index! + beforeVersion.length;
        const versionEnd = versionStart + currentVersion.length;

        const versionRange = new Range(
          range.start.line,
          versionStart,
          range.start.line,
          versionEnd
        );

        return {
          name: packageName,
          currentVersion: currentVersion || undefined,
          versionRange,
          line: lineText,
          isToml: true
        };
      }
    }

    return null;
  }

  /**
   * Extract package info from PEP 621 array format
   */
  private extractFromPep621Array(lineText: string, range: Range): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    line: string;
    isToml: boolean;
  } | null {
    // Enhanced PEP 621 patterns for different formats:
    // "package>=1.0.0", "package[extra]~=1.0", "package", "package (>=1.0.0,<2.0.0)"
    const pep621Patterns = [
      {
        // Pattern for: "package>=1.0.0", "package~=1.0", "package==1.0.0"
        pattern: /^\s*["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)([><=!~]+)([^"',]*?)["'],?\s*$/,
        type: 'version_constraint',
        operatorGroup: 2,
        versionGroup: 3
      },
      {
        // Pattern for: "package (>=1.0.0,<2.0.0)", "package (==1.0.0)"
        pattern: /^\s*["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)\s*\(([^)]+)\)["'],?\s*$/,
        type: 'parentheses_version',
        operatorGroup: null,
        versionGroup: 2
      },
      {
        // Pattern for: "package", "package[extra]" (no version constraint)
        pattern: /^\s*["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)["'],?\s*$/,
        type: 'no_version',
        operatorGroup: null,
        versionGroup: null
      }
    ];

    for (const { pattern, type, operatorGroup, versionGroup } of pep621Patterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageWithExtras = match[1];
        const packageName = packageWithExtras.replace(/\[[^\]]*\]/, ''); // Remove extras
        const operator = operatorGroup ? (match[operatorGroup] || '') : '';
        const currentVersion = versionGroup ? (match[versionGroup] || '') : '';

        let versionStart: number;
        let versionEnd: number;

        if (type === 'parentheses_version') {
          // For parentheses format: "package (>=1.0.0,<2.0.0)"
          const parenStart = lineText.indexOf('(');
          versionStart = parenStart + 1;
          versionEnd = lineText.indexOf(')', parenStart);
        } else if (type === 'version_constraint') {
          // For version constraint format: "package>=1.0.0" or "package>="
          // Find the position right after the operator
          const quoteChar = lineText.includes('"') ? '"' : "'";
          const packageStart = lineText.indexOf(quoteChar) + 1;
          const operatorStart = packageStart + packageWithExtras.length;
          const operatorEnd = operatorStart + operator.length;

          // Version starts right after the operator
          versionStart = operatorEnd;

          // Version ends before the closing quote
          const closingQuoteIndex = lineText.indexOf(quoteChar, operatorEnd);
          if (closingQuoteIndex !== -1) {
            versionEnd = closingQuoteIndex;
          } else {
            // If no closing quote, version goes to end of line
            versionEnd = lineText.length;
          }
        } else {
          // For packages without version, place at end of package name inside quotes
          const quoteChar = lineText.includes('"') ? '"' : "'";
          const packageStart = lineText.indexOf(quoteChar) + 1;
          const packageEnd = packageStart + packageWithExtras.length;
          versionStart = packageEnd;
          versionEnd = packageEnd;
        }

        const versionRange = new Range(
          range.start.line,
          versionStart,
          range.start.line,
          versionEnd
        );

        return {
          name: packageName,
          currentVersion: currentVersion || undefined,
          versionRange,
          line: lineText,
          isToml: true
        };
      }
    }

    return null;
  }

  /**
   * Extract package info from requirements.txt format
   */
  private extractFromRequirements(_document: TextDocument, lineText: string, range: Range): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    line: string;
    isToml: boolean;
  } | null {
    // Match patterns like: package==1.0.0, package>=1.0.0, etc.
    const reqPattern = /^(\w+[-\w.]*)\s*([><=!~]+)\s*([^#\s]*)/;
    const match = lineText.match(reqPattern);

    if (match) {
      const packageName = match[1];
      const operator = match[2];
      const currentVersion = match[3];

      // Calculate the range for the version part more accurately
      // Version starts right after the package name and operator
      const packageEnd = match.index! + match[1].length;
      const operatorEnd = packageEnd + match[2].length;
      // Account for any whitespace after operator
      const operatorMatch = lineText.substring(operatorEnd).match(/^\s*/);
      const whitespaceLength = operatorMatch ? operatorMatch[0].length : 0;
      const versionStart = operatorEnd + whitespaceLength;
      const versionEnd = versionStart + match[3].length;

      const versionRange = new Range(
        range.start.line,
        versionStart,
        range.start.line,
        versionEnd
      );

      return {
        name: packageName,
        currentVersion: currentVersion || undefined,
        versionRange,
        line: lineText,
        isToml: false
      };
    }

    return null;
  }

  /**
   * Create actions for updating to latest/specific versions
   * ENHANCED: Better constraint preservation and manual update focus
   */
  private createVersionUpdateActions(
    document: TextDocument,
    packageInfo: { name: string; currentVersion?: string; versionRange: Range; line: string; isToml: boolean },
    _metadata: PackageMetadata
  ): CodeAction[] {
    const actions: CodeAction[] = [];

    // Action to update to latest version while preserving constraints
    if (_metadata.latestVersion && _metadata.latestVersion !== packageInfo.currentVersion) {
      const updateToLatestAction = new CodeAction(
        `Update ${packageInfo.name} to latest version (${_metadata.latestVersion})`,
        CodeActionKind.QuickFix
      );
      updateToLatestAction.isPreferred = true; // Make it prominent in the UI

      const edit = new WorkspaceEdit();

      // For PEP 621 array format, determine the replacement text format
      const replacementVersion = this.formatVersionForReplacement(
        packageInfo,
        _metadata.latestVersion
      );

      edit.replace(document.uri, packageInfo.versionRange, replacementVersion);
      updateToLatestAction.edit = edit;

      actions.push(updateToLatestAction);
    }

    // Action to change constraint type if there's an existing constraint
    if (packageInfo.currentVersion && this.isPep621ArrayFormat(packageInfo.line)) {
      actions.push(...this.createConstraintChangeActions(document, packageInfo, _metadata));
    }

    return actions;
  }

  /**
   * Format version for replacement based on the context (PEP 621 vs traditional TOML)
   * ENHANCED: Better constraint operator preservation and positioning
   */
  private formatVersionForReplacement(
    packageInfo: { name: string; currentVersion?: string; versionRange: Range; line: string; isToml: boolean },
    version: string
  ): string {
    // Check if this is a PEP 621 array format
    if (this.isPep621ArrayFormat(packageInfo.line)) {
      // For PEP 621, we need to be careful about operators
      const line = packageInfo.line;

      // Check if there's already an operator in the line (e.g., "package>=")
      const operatorMatch = line.match(/["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)([><=!~]+)([^"']*?)["']/);

      if (operatorMatch) {
        // Operator exists in line, just return the version number
        // The range should already be positioned after the operator
        return version;
      } else {
        // No operator in line, add operator + version (e.g., "package" → "package~=1.0.0")
        return `~=${version}`;
      }
    }

    // For traditional TOML format, just return the version
    return version;
  }

  /**
   * Check if the line is in PEP 621 array format
   */
  private isPep621ArrayFormat(line: string): boolean {
    // Check for patterns that indicate PEP 621 array entries
    const pep621Indicators = [
      /^\s*["']\w+[><=!~]/,    // "package>=1.0.0"
      /^\s*["']\w+\s*\(/,      // "package (>=1.0.0)"
      /^\s*["']\w+["'],?\s*$/, // "package",
    ];

    return pep621Indicators.some(pattern => pattern.test(line));
  }

  /**
   * Create actions for selecting from recent versions
   * ENHANCED: Better version selection with constraint preservation
   */
  private createVersionSelectActions(
    document: TextDocument,
    packageInfo: { name: string; currentVersion?: string; versionRange: Range; line: string; isToml: boolean },
    _metadata: PackageMetadata
  ): CodeAction[] {
    const actions: CodeAction[] = [];

    // Actions for recent stable versions (more selective)
    const recentVersions = _metadata.versions
      .filter(v => !_metadata.yankedVersions.has(v) && !_metadata.preReleaseVersions.has(v))
      .slice(0, 3);

    recentVersions.forEach((version, index) => {
      // Skip if it's the current version
      const currentVersionOnly = packageInfo.currentVersion?.replace(/^[><=!~]+/, '');
      if (version !== currentVersionOnly) {
        const action = new CodeAction(
          `Update ${packageInfo.name} to version ${version}`,
          CodeActionKind.QuickFix
        );

        // Make the latest version more prominent
        if (index === 0) {
          action.title = `${action.title} (latest)`;
        }

        const edit = new WorkspaceEdit();
        const formattedVersion = this.formatVersionForReplacement(packageInfo, version);
        edit.replace(document.uri, packageInfo.versionRange, formattedVersion);
        action.edit = edit;

        actions.push(action);
      }
    });

    return actions;
  }

  /**
   * Create actions for changing constraint types (PEP 621 only)
   * NEW: Allow users to manually change constraint operators like ~= to >= or ==
   */
  private createConstraintChangeActions(
    document: TextDocument,
    packageInfo: { name: string; currentVersion?: string; versionRange: Range; line: string; isToml: boolean },
    _metadata: PackageMetadata
  ): CodeAction[] {
    const actions: CodeAction[] = [];

    // Extract operator and version from the line directly
    const line = packageInfo.line;
    const operatorMatch = line.match(/["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)([><=!~]+)([^"']*?)["']/);

    if (!operatorMatch) {
      // No operator in line, skip constraint changes
      return actions;
    }

    const currentOperator = operatorMatch[2];
    const versionNumber = operatorMatch[3];

    // Only show constraint change actions if there's a version number
    if (!versionNumber || versionNumber.trim() === '') {
      return actions;
    }

    // Define constraint change options
    const constraintOptions = [
      { operator: '==', description: 'exact version (pin)' },
      { operator: '~=', description: 'compatible release' },
      { operator: '>=', description: 'minimum version' },
      { operator: '^', description: 'caret constraint (semver)' }
    ];

    constraintOptions.forEach(({ operator, description }) => {
      if (operator !== currentOperator) {
        const action = new CodeAction(
          `Change ${packageInfo.name} to ${operator}${versionNumber} (${description})`,
          CodeActionKind.Refactor
        );

        const edit = new WorkspaceEdit();

        // For constraint changes, we need to replace both operator and version
        // Calculate the range from the start of the operator to the end of the version
        const quoteChar = line.includes('"') ? '"' : "'";
        const packageStart = line.indexOf(quoteChar) + 1;
        const packageWithExtras = operatorMatch[1];
        const operatorStart = packageStart + packageWithExtras.length;
        const closingQuoteIndex = line.indexOf(quoteChar, operatorStart);

        const operatorAndVersionRange = new Range(
          packageInfo.versionRange.start.line,
          operatorStart,
          packageInfo.versionRange.start.line,
          closingQuoteIndex !== -1 ? closingQuoteIndex : line.length
        );

        edit.replace(document.uri, operatorAndVersionRange, `${operator}${versionNumber}`);
        action.edit = edit;

        actions.push(action);
      }
    });

    return actions;
  }

  /**
   * Handle errors during code action provision
   * CLEANED UP: Simplified error handling
   */
  private handleQuickActionError(error: any): void {
    if (error instanceof PackageNotFoundError) {
      // Silently ignore - package doesn't exist
      return;
    }

    if (error instanceof PyPIError) {
      console.warn(`[Tombo] PyPI error during quick action: ${error.message}`);
      return;
    }

    console.error('[Tombo] Unexpected error during quick action:', error);
  }
}
