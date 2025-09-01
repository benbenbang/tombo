/**
 * Quick fill functionality for package version operations
 * AUTO-FILL DISABLED: Was causing range calculation bugs and 'unknown' package errors
 * Now provides only manual trigger functionality for cursor idle events
 */

import {
  TextDocumentChangeEvent,
  TextEditor,
  Position,
  Range,
  TextEdit,
  WorkspaceEdit,
  workspace,
  window
} from 'vscode';

import { PyPIService } from '../api/services/pypi-service';
import { PackageMetadata } from '../api/types/pypi';
import { PyPIError, PackageNotFoundError } from '../core/errors/pypi-errors';
import { ExtensionConfig } from '../core/config/extension-config';
import { parseDependenciesWithMetadata } from '../toml/parser';

export class QuickFillProvider {
  private readonly pypiService: PyPIService;
  private readonly config: ExtensionConfig;
  private readonly debounceMap = new Map<string, NodeJS.Timeout>();

  constructor(pypiService: PyPIService, config: ExtensionConfig) {
    this.pypiService = pypiService;
    this.config = config;
  }

  /**
   * Handle text document changes to trigger quick fill functionality
   * DISABLED: Auto-fill was causing range calculation bugs and 'unknown' package errors
   */
  async handleTextDocumentChange(_event: TextDocumentChangeEvent): Promise<void> {
    // Auto-fill functionality disabled to prevent:
    // - Range calculation bugs (version placed outside quotes)
    // - 'unknown' package errors on random text input
    // - Interference with completion dropdown approach
    return; // Early return - auto-fill disabled

    /* DISABLED AUTO-FILL CODE:
    const document = event.document;

    // Only process supported file types
    if (!this.isSupportedFile(document.fileName)) {
      return;
    }

    // Check each change for quick fill triggers
    for (const change of event.contentChanges) {
      await this.processChange(document, change);
    }
    */
  }

  /**
   * Check and fetch version for a specific position (for cursor idle functionality)
   */
  async checkAndFetchVersionForPosition(editor: TextEditor, position: Position): Promise<void> {
    const document = editor.document;

    if (!this.isSupportedFile(document.fileName)) {
      return;
    }

    const packageInfo = this.extractPackageInfoAtPosition(document, position);
    if (!packageInfo || packageInfo.currentVersion) {
      return; // Already has version or not a package line
    }

    try {
      const metadata = await this.pypiService.getPackageMetadata(
        packageInfo.name,
        this.config.getConfig().listPreReleases
      );

      // Show inline hint or suggestion for latest version
      await this.showVersionSuggestion(editor, packageInfo, metadata);
    } catch (error) {
      this.handleQuickFillError(error);
    }
  }

  /**
   * Process a single text change to determine if quick fill should trigger
   * DISABLED: This was causing 'unknown' package errors and range calculation bugs
   */
  private async processChange(_document: any, _change: any): Promise<void> {
    // DISABLED: Auto-fill processing causes too many issues
    return;

    /* DISABLED AUTO-FILL PROCESSING:
    const changeText = change.text;

    // Look for trigger patterns like "?" or "=" followed by certain characters
    const quickFillTriggers = ['?', '=', '"', "'"];
    const shouldTrigger = quickFillTriggers.some(trigger => changeText.includes(trigger));

    if (!shouldTrigger) {
      return;
    }

    // Debounce to avoid excessive API calls
    const debounceKey = `${document.uri.toString()}:${change.range.start.line}`;
    const existingTimeout = this.debounceMap.get(debounceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(async () => {
      await this.processQuickFill(document, change);
      this.debounceMap.delete(debounceKey);
    }, 300); // 300ms debounce

    this.debounceMap.set(debounceKey, timeout);
    */
  }

  /**
   * Process quick fill for a specific change
   * DISABLED: Auto-fill was causing range calculation and quote placement bugs
   */
  private async processQuickFill(_document: any, _change: any): Promise<void> {
    // DISABLED: Auto-fill causes too many range calculation bugs
    return;

    /* DISABLED AUTO-FILL LOGIC:
    const line = document.lineAt(change.range.start.line);
    const lineText = line.text;

    const packageInfo = this.extractPackageInfoFromLine(document, lineText, change.range.start.line);
    if (!packageInfo) {
      return;
    }

    // Check for specific quick fill patterns
    if (this.shouldAutoFillVersion(lineText, packageInfo)) {
      await this.autoFillLatestVersion(document, packageInfo);
    }
    */
  }

  /**
   * Determine if we should auto-fill the version
   * DISABLED: Auto-fill pattern matching was too aggressive and error-prone
   */
  private shouldAutoFillVersion(_lineText: string, _packageInfo: any): boolean {
    // DISABLED: Auto-fill patterns were causing false positives and errors
    return false;

    /* DISABLED AUTO-FILL PATTERN MATCHING:
    console.log(`[Tombo QuickFill Debug] Checking if should auto-fill for line: "${lineText}"`);
    console.log(`[Tombo QuickFill Debug] Package info - name: ${packageInfo.name}, current version: "${packageInfo.currentVersion}"`);

    // Auto-fill for patterns like: package = "?" or package = ""
    const autoFillPatterns = [
      { pattern: /=\s*["']\?["']?\s*$/, name: 'question_mark' },     // package = "?"
      { pattern: /=\s*["']["']\s*$/, name: 'empty_quotes' },        // package = ""
      { pattern: /=\s*["']\s*["']\s*$/, name: 'spaced_quotes' },    // package = " "
      { pattern: /=\s*$/, name: 'equals_only' },                     // package =
      // PEP 621 array patterns
      { pattern: /^\s*["']\w+["'],?\s*$/, name: 'pep621_no_version' }, // "package",
      { pattern: /^\s*["']\w+\s*["'],?\s*$/, name: 'pep621_spaced' }    // "package ",
    ];

    for (const { pattern, name } of autoFillPatterns) {
      if (pattern.test(lineText)) {
        console.log(`[Tombo QuickFill Debug] Matched auto-fill pattern: ${name}`);
        return true;
      }
    }

    // Also auto-fill if the current version is empty or just "?"
    if (!packageInfo.currentVersion || packageInfo.currentVersion.trim() === '' || packageInfo.currentVersion.trim() === '?') {
      console.log(`[Tombo QuickFill Debug] Auto-fill triggered due to empty/question mark version`);
      return true;
    }

    console.log(`[Tombo QuickFill Debug] No auto-fill pattern matched`);
    return false;
    */
  }

  /**
   * Auto-fill the latest version for a package
   * DISABLED: Range calculation bugs caused versions to be placed outside quotes
   */
  private async autoFillLatestVersion(_document: any, _packageInfo: any): Promise<void> {
    // DISABLED: Range calculation was buggy and caused malformed version strings
    // like: pydantic = 2.11.7"" (version outside quotes)
    return;

    /* DISABLED AUTO-FILL LOGIC:
    try {
      console.log(`[Tombo QuickFill Debug] Auto-filling version for package: ${packageInfo.name}`);
      console.log(`[Tombo QuickFill Debug] Current version: "${packageInfo.currentVersion}"`);
      console.log(`[Tombo QuickFill Debug] Version range: line ${packageInfo.versionRange.start.line}, chars ${packageInfo.versionRange.start.character}-${packageInfo.versionRange.end.character}`);

      const metadata = await this.pypiService.getPackageMetadata(
        packageInfo.name,
        this.config.getConfig().listPreReleases
      );

      if (!metadata.latestVersion) {
        console.log(`[Tombo QuickFill Debug] No latest version found for ${packageInfo.name}`);
        return;
      }

      console.log(`[Tombo QuickFill Debug] Latest version from PyPI: ${metadata.latestVersion}`);

      // Get the line text to verify what we're replacing
      const line = document.lineAt(packageInfo.versionRange.start.line);
      const lineText = line.text;
      const rangeText = lineText.substring(packageInfo.versionRange.start.character, packageInfo.versionRange.end.character);

      console.log(`[Tombo QuickFill Debug] Full line text: "${lineText}"`);
      console.log(`[Tombo QuickFill Debug] Text being replaced: "${rangeText}"`);
      console.log(`[Tombo QuickFill Debug] Expected result: line should become something like: package = "${metadata.latestVersion}"`);

      // Create edit to replace the version placeholder
      const edit = new WorkspaceEdit();

      // For TOML, we're replacing content inside quotes, so just use the version
      // For requirements.txt, use the version as-is
      edit.replace(document.uri, packageInfo.versionRange, metadata.latestVersion);

      console.log(`[Tombo QuickFill Debug] Applying edit: replacing "${rangeText}" with "${metadata.latestVersion}"`);

      const success = await workspace.applyEdit(edit);

      console.log(`[Tombo QuickFill Debug] Edit applied successfully: ${success}`);

      if (success) {
        // Verify the result
        const updatedLine = document.lineAt(packageInfo.versionRange.start.line);
        console.log(`[Tombo QuickFill Debug] Updated line text: "${updatedLine.text}"`);

        // Show information about the filled version
        const message = `Auto-filled ${packageInfo.name} with latest version: ${metadata.latestVersion}`;
        window.setStatusBarMessage(message, 3000);
      } else {
        console.error(`[Tombo QuickFill Debug] Failed to apply edit for ${packageInfo.name}`);
      }

    } catch (error) {
      console.error(`[Tombo QuickFill Debug] Error during auto-fill:`, error);
      this.handleQuickFillError(error);
    }
    */
  }

  /**
   * Show version suggestion for a package
   */
  private async showVersionSuggestion(_editor: TextEditor, packageInfo: any, metadata: PackageMetadata): Promise<void> {
    // For now, just show in status bar - could be enhanced with inline decorations
    const message = `💡 ${packageInfo.name} latest version: ${metadata.latestVersion}`;
    window.setStatusBarMessage(message, 5000);
  }

  /**
   * Extract package information from a specific line
   */
  private extractPackageInfoFromLine(document: any, lineText: string, lineNumber: number): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    isToml: boolean;
  } | null {
    // Handle pyproject.toml format
    if (document.fileName.endsWith('pyproject.toml')) {
      return this.extractFromTOMLLine(lineText, lineNumber);
    }

    // Handle requirements.txt format
    if (document.fileName.includes('requirements') && document.fileName.endsWith('.txt')) {
      return this.extractFromRequirementsLine(lineText, lineNumber);
    }

    return null;
  }

  /**
   * Extract package info from TOML line
   * SIMPLIFIED: Removed complex auto-fill logic, kept basic parsing for manual triggers
   */
  private extractFromTOMLLine(lineText: string, lineNumber: number): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    isToml: boolean;
  } | null {
    // Simplified parsing - only for manual operations

    // Handle PEP 621 array format with enhanced pattern matching
    const pep621Results = this.extractFromPep621ArrayLine(lineText, lineNumber);
    if (pep621Results) {
      return pep621Results;
    }

    // Handle standard TOML formats
    const tomlPatterns = [
      {
        pattern: /^(\w+[-\w.]*)\s*=\s*["']([^"']*)["']\s*$/,  // package = "version"
        type: 'simple'
      },
      {
        pattern: /^(\w+[-\w.]*)\s*=\s*\{\s*version\s*=\s*["']([^"']*)["']\s*\}/,  // package = { version = "version" }
        type: 'table'
      }
    ];

    for (const { pattern, type } of tomlPatterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageName = match[1];
        const currentVersion = match[2] || '';

        // Simplified range calculation - only for basic extraction
        const versionStart = lineText.indexOf(currentVersion);
        const versionEnd = versionStart + currentVersion.length;

        const versionRange = new Range(
          lineNumber,
          versionStart,
          lineNumber,
          versionEnd
        );

        return {
          name: packageName,
          currentVersion: currentVersion || undefined,
          versionRange,
          isToml: true
        };
      }
    }

    return null;
  }

  /**
   * Extract package info from PEP 621 array line
   * SIMPLIFIED: Basic pattern matching without complex range calculation
   */
  private extractFromPep621ArrayLine(lineText: string, lineNumber: number): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    isToml: boolean;
  } | null {
    // Simplified PEP 621 patterns - basic extraction only
    const pep621Patterns = [
      {
        // Pattern for: "package>=1.0.0", "package~=1.0", "package==1.0.0"
        pattern: /^\s*["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)([><=!~]+)([^"',]*?)["'],?\s*$/,
        type: 'version_constraint',
        versionGroup: 3
      },
      {
        // Pattern for: "package (>=1.0.0,<2.0.0)", "package (==1.0.0)"
        pattern: /^\s*["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)\s*\(([^)]+)\)["'],?\s*$/,
        type: 'parentheses_version',
        versionGroup: 2
      },
      {
        // Pattern for: "package", "package[extra]" (no version constraint)
        pattern: /^\s*["']([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)["'],?\s*$/,
        type: 'no_version',
        versionGroup: null
      }
    ];

    for (const { pattern, type, versionGroup } of pep621Patterns) {
      const match = lineText.match(pattern);
      if (match) {
        const packageWithExtras = match[1];
        const packageName = packageWithExtras.replace(/\[[^\]]*\]/, ''); // Remove extras
        const currentVersion = versionGroup ? (match[versionGroup] || '') : '';

        // Simplified range calculation
        let versionStart: number;
        let versionEnd: number;

        if (versionGroup && currentVersion) {
          versionStart = lineText.indexOf(currentVersion);
          versionEnd = versionStart + currentVersion.length;
        } else {
          const packageStart = lineText.indexOf(packageWithExtras);
          versionStart = packageStart;
          versionEnd = packageStart + packageWithExtras.length;
        }

        const versionRange = new Range(
          lineNumber,
          versionStart,
          lineNumber,
          versionEnd
        );

        return {
          name: packageName,
          currentVersion: currentVersion || undefined,
          versionRange,
          isToml: true
        };
      }
    }

    return null;
  }

  /**
   * Extract package info from requirements line
   */
  private extractFromRequirementsLine(lineText: string, lineNumber: number): {
    name: string;
    currentVersion?: string;
    versionRange: Range;
    isToml: boolean;
  } | null {
    const reqPattern = /^(\w+[-\w.]*)\s*([><=!~]+)\s*([^#\s]*)/;
    const match = lineText.match(reqPattern);

    if (match) {
      const packageName = match[1];
      const currentVersion = match[3];

      const versionStart = lineText.indexOf(currentVersion);
      const versionRange = new Range(
        lineNumber,
        versionStart,
        lineNumber,
        versionStart + currentVersion.length
      );

      return {
        name: packageName,
        currentVersion: currentVersion || undefined,
        versionRange,
        isToml: false
      };
    }

    return null;
  }

  /**
   * Extract package information at a specific position
   */
  private extractPackageInfoAtPosition(document: any, position: Position): {
    name: string;
    currentVersion?: string;
    versionRange?: Range;
  } | null {
    const line = document.lineAt(position.line);
    const lineText = line.text;

    return this.extractPackageInfoFromLine(document, lineText, position.line);
  }

  /**
   * Check if file is supported for quick fill
   */
  private isSupportedFile(fileName: string): boolean {
    return fileName.endsWith('pyproject.toml') ||
           (fileName.includes('requirements') && fileName.endsWith('.txt'));
  }

  /**
   * Handle errors during quick fill operations
   */
  private handleQuickFillError(error: any): void {
    if (error instanceof PackageNotFoundError) {
      // Could show a subtle warning in status bar
      return;
    }

    if (error instanceof PyPIError) {
      console.warn(`[Tombo] PyPI error during quick fill: ${error.message}`, error.toJSON());
      return;
    }

    console.error('[Tombo] Unexpected error during quick fill:', error);
  }

  /**
   * Dispose of resources and clear timeouts
   */
  dispose(): void {
    // Clear all pending debounce timeouts
    this.debounceMap.forEach(timeout => clearTimeout(timeout));
    this.debounceMap.clear();
  }
}

// Legacy functions removed - auto-fill functionality disabled
// Use completion provider dropdown instead of automatic filling
