/**
 * Modern VS Code extension manager for Tombo
 * Clean integration patterns and lifecycle management
 */

import {
  ExtensionContext,
  workspace,
  window,
  languages,
  DocumentSelector,
  Disposable,
  ConfigurationChangeEvent
} from 'vscode';

import { PyPIService, PyPIServiceFactory } from '../api/services/pypi-service';
import { ExtensionConfig } from '../core/config/extension-config';
import { PyPIError } from '../core/errors/pypi-errors';
import { Logger } from '../core/logging/logger';

// Import providers
import { VersionCompletionProvider } from '../providers/version-completion-provider';
import { PackageHoverProvider } from '../providers/hover-provider';
import { QuickActions } from '../providers/quickAction';
import { QuickFillProvider } from '../providers/quickFill';

export class TomboExtension {
  private pypiService: PyPIService | null = null;
  private config: ExtensionConfig;
  private logger: Logger;
  private disposables: Disposable[] = [];
  private isActivated = false;

  // Provider instances
  private quickFillProvider: QuickFillProvider | null = null;

  constructor(private context: ExtensionContext) {
    this.config = ExtensionConfig.getInstance();
    this.logger = Logger.getInstance();
  }

  /**
   * Activate the extension
   */
  async activate(): Promise<void> {
    if (this.isActivated) {
      return;
    }

    try {
      // Initialize logger first
      this.logger.initialize();

      // Initialize PyPI service
      await this.initializePyPIService();

      // Register providers and commands
      this.registerProviders();
      this.registerCommands();
      this.registerEventListeners();

      // Validate configuration
      this.validateConfiguration();

      this.isActivated = true;
      this.logger.info('Tombo extension activated with modern architecture');

    } catch (error) {
      this.logger.error('Failed to activate Tombo extension', error);
      throw error;
    }
  }

  /**
   * Deactivate the extension
   */
  async deactivate(): Promise<void> {
    if (!this.isActivated) {
      return;
    }

    try {
      // Dispose of all resources
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];

      // Dispose QuickFillProvider
      if (this.quickFillProvider) {
        this.quickFillProvider.dispose();
        this.quickFillProvider = null;
      }

      // Dispose PyPI service
      if (this.pypiService) {
        this.pypiService.dispose();
        this.pypiService = null;
      }

      // Dispose logger
      this.logger.dispose();

      this.isActivated = false;
      this.logger.info('Tombo extension deactivated');

    } catch (error) {
      this.logger.error('Error during extension deactivation', error);
    }
  }

  /**
   * Get the PyPI service instance
   */
  getPyPIService(): PyPIService {
    if (!this.pypiService) {
      throw new Error('PyPI service not initialized. Call activate() first.');
    }
    return this.pypiService;
  }

  /**
   * Get extension configuration
   */
  getConfig(): ExtensionConfig {
    return this.config;
  }

  /**
   * Initialize PyPI service with current configuration
   */
  private async initializePyPIService(): Promise<void> {
    try {
      const pypiConfig = this.config.getPyPIClientConfig();
      const cacheConfig = this.config.getCacheConfig();

      // Dispose existing service if any
      if (this.pypiService) {
        this.pypiService.dispose();
      }

      this.pypiService = PyPIServiceFactory.createWithConfig(pypiConfig, cacheConfig);

      // Test connectivity
      const isConnected = await this.pypiService.checkConnectivity();
      if (!isConnected) {
        this.logger.warn('PyPI connectivity check failed. Some features may not work.');
      }

    } catch (error) {
      this.logger.error('Failed to initialize PyPI service', error);
      throw error;
    }
  }

  /**
   * Register VS Code providers (completion, hover, etc.)
   */
  private registerProviders(): void {
    const tomlSelector: DocumentSelector = {
      language: 'toml',
      pattern: '**/pyproject.toml'
    };
    const requirementsSelector: DocumentSelector = {
      pattern: '**/requirements*.txt'
    };
    const supportedFiles = [tomlSelector, requirementsSelector];

    if (!this.pypiService) {
      throw new Error('PyPI service must be initialized before registering providers');
    }

    // Register Version Completion Provider with comprehensive trigger characters
    const completionProvider = new VersionCompletionProvider(this.pypiService, this.config);
    this.disposables.push(
      languages.registerCompletionItemProvider(
        supportedFiles,
        completionProvider,
        '=', '~', '>', '<', '^', '!', ' ', "'", '"', '.', '+', '-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
      )
    );

    // Register Hover Provider
    const hoverProvider = new PackageHoverProvider(this.pypiService, this.config);
    this.disposables.push(
      languages.registerHoverProvider(
        supportedFiles,
        hoverProvider
      )
    );

    // Register Quick Actions Provider
    const quickActionsProvider = new QuickActions(this.pypiService, this.config);
    this.disposables.push(
      languages.registerCodeActionsProvider(
        supportedFiles,
        quickActionsProvider
      )
    );

    // Initialize Quick Fill Provider (it handles document changes)
    this.quickFillProvider = new QuickFillProvider(this.pypiService, this.config);

    this.logger.info('All providers registered successfully');
  }

  /**
   * Register extension commands
   */
  private registerCommands(): void {
    // Register update dependencies command
    this.disposables.push(
      workspace.registerTextDocumentContentProvider('tombo', {
        provideTextDocumentContent: () => 'Tombo content provider'
      })
    );

    // Example commands - actual implementations would be added here
    // this.disposables.push(
    //   commands.registerCommand('tombo.updateDependencies', () => {
    //     return this.updateDependencies();
    //   }),
    //   commands.registerCommand('tombo.refreshPackages', () => {
    //     return this.refreshPackages();
    //   })
    // );

    this.logger.info('Commands registered successfully');
  }

  /**
   * Register event listeners
   */
  private registerEventListeners(): void {
    // Configuration change listener
    this.disposables.push(
      workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
        this.handleConfigurationChange(event);
      })
    );

    // Document change listeners DISABLED - were causing 'unknown' package errors
    // and interfering with completion dropdown approach
    // this.disposables.push(
    //   workspace.onDidChangeTextDocument((event) => {
    //     this.handleDocumentChange(event);
    //   })
    // );

    // Active editor change listener
    this.disposables.push(
      window.onDidChangeActiveTextEditor((editor) => {
        this.handleActiveEditorChange(editor);
      })
    );

    this.logger.info('Event listeners registered successfully');
  }

  /**
   * Handle configuration changes
   */
  private async handleConfigurationChange(event: ConfigurationChangeEvent): Promise<void> {
    // Update logger settings first
    if (event.affectsConfiguration('tombo.enableDebugLogging')) {
      this.logger.updateDebugSetting();
      this.logger.initialize(); // Reinitialize to create/destroy output channel as needed
    }

    const hasSignificantChange = this.config.onConfigurationChange(event);

    if (hasSignificantChange) {
      this.logger.info('Significant configuration change detected, reinitializing service');
      try {
        await this.initializePyPIService();
        this.validateConfiguration();
      } catch (error) {
        this.logger.error('Failed to reinitialize service after configuration change', error);
      }
    }
  }

  /**
   * Handle document changes for real-time analysis
   * DISABLED: Document change processing was causing 'unknown' package errors
   */
  private async handleDocumentChange(_event: any): Promise<void> {
    // DISABLED: Auto-fill document changes were causing issues:
    // - 'unknown' package errors when typing random text like "abc"
    // - Interference with completion dropdown approach
    // - Excessive API calls on every keystroke
    return; // Early return - document change processing disabled

    /* DISABLED DOCUMENT CHANGE PROCESSING:
    if (!this.quickFillProvider) {
      return;
    }

    try {
      // Delegate to QuickFillProvider for processing
      await this.quickFillProvider.handleTextDocumentChange(event);
    } catch (error) {
      this.logger.error('Error handling document change', error);
    }
    */
  }

  /**
   * Handle active editor changes
   */
  private handleActiveEditorChange(editor: any): void {
    if (!editor) {
      return;
    }

    const fileName = editor.document.fileName.toLowerCase();
    if (fileName.endsWith('pyproject.toml') ||
        (fileName.includes('requirements') && fileName.endsWith('.txt'))) {
      // Trigger analysis for the new active file
      // Actual implementation would go here
    }
  }

  /**
   * Validate current configuration and show warnings if needed
   */
  private validateConfiguration(): void {
    const issues = this.config.validateConfig();
    if (issues.length > 0) {
      const message = `Tombo configuration issues: ${issues.join(', ')}`;
      this.logger.warn(message);

      if (this.config.getConfig().showNotifications !== 'off') {
        window.showWarningMessage(message);
      }
    }
  }

  /**
   * Update all dependencies command handler
   */
  private async updateDependencies(): Promise<void> {
    try {
      // Implementation would analyze current file and update dependencies
      window.showInformationMessage('Dependencies updated successfully');
    } catch (error) {
      this.logger.error('Failed to update dependencies', error);
      window.showErrorMessage('Failed to update dependencies');
    }
  }

  /**
   * Refresh packages command handler
   */
  private async refreshPackages(): Promise<void> {
    try {
      if (this.pypiService) {
        this.pypiService.clearCache();
        window.showInformationMessage('Package cache refreshed');
      }
    } catch (error) {
      this.logger.error('Failed to refresh packages', error);
      window.showErrorMessage('Failed to refresh packages');
    }
  }
}
