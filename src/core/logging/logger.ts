/**
 * Tombo logging service with switchable debug output
 * Provides clean production experience with optional debug logging
 */

import { OutputChannel, window, workspace } from 'vscode';

export class Logger {
  private static instance: Logger | null = null;
  private outputChannel: OutputChannel | null = null;
  private debugEnabled = false;

  private constructor() {
    this.updateDebugSetting();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize the logger and create output channel if needed
   */
  initialize(): void {
    this.updateDebugSetting();

    if (this.debugEnabled && !this.outputChannel) {
      this.outputChannel = window.createOutputChannel('Tombo');
    }
  }

  /**
   * Update debug setting from VS Code configuration
   */
  updateDebugSetting(): void {
    const config = workspace.getConfiguration('tombo');
    this.debugEnabled = config.get('enableDebugLogging', false);
  }

  /**
   * Log info message (only when debug enabled)
   */
  info(message: string): void {
    if (this.debugEnabled && this.outputChannel) {
      const timestamp = new Date().toLocaleTimeString();
      this.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }
  }

  /**
   * Log warning message (only when debug enabled)
   */
  warn(message: string): void {
    if (this.debugEnabled && this.outputChannel) {
      const timestamp = new Date().toLocaleTimeString();
      this.outputChannel.appendLine(`[${timestamp}] WARN: ${message}`);
    }
  }

  /**
   * Log error message (always logged, but to output panel only when debug enabled)
   */
  error(message: string, error?: any): void {
    if (this.debugEnabled && this.outputChannel) {
      const timestamp = new Date().toLocaleTimeString();
      this.outputChannel.appendLine(`[${timestamp}] ERROR: ${message}`);

      if (error) {
        if (error instanceof Error) {
          this.outputChannel.appendLine(`  Stack: ${error.stack}`);
        } else {
          this.outputChannel.appendLine(`  Details: ${JSON.stringify(error, null, 2)}`);
        }
      }
    } else {
      // Always log errors to console for debugging, even in production
      console.error(`[Tombo] ${message}`, error);
    }
  }

  /**
   * Log debug message with detailed completion/hover info
   */
  debug(message: string): void {
    if (this.debugEnabled && this.outputChannel) {
      const timestamp = new Date().toLocaleTimeString();
      this.outputChannel.appendLine(`[${timestamp}] DEBUG: ${message}`);
    }
  }

  /**
   * Log completion-specific debug information
   */
  completion(message: string): void {
    if (this.debugEnabled && this.outputChannel) {
      const timestamp = new Date().toLocaleTimeString();
      this.outputChannel.appendLine(`[${timestamp}] COMPLETION: ${message}`);
    }
  }

  /**
   * Show the output panel (useful for debugging)
   */
  show(): void {
    if (this.outputChannel) {
      this.outputChannel.show();
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.outputChannel) {
      this.outputChannel.dispose();
      this.outputChannel = null;
    }
  }

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return this.debugEnabled;
  }
}
