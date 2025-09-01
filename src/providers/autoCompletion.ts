/**
 * Placeholder for legacy auto completion providers
 * This file maintains compatibility while migrating to the new architecture
 */

import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionItem } from 'vscode';

export class VersionCompletions implements CompletionItemProvider {
  async provideCompletionItems(
    _document: TextDocument,
    _position: Position,
    _token: CancellationToken
  ): Promise<CompletionItem[]> {
    // Placeholder implementation - actual logic moved to version-completion-provider.ts
    return [];
  }
}

export class FeaturesCompletions implements CompletionItemProvider {
  async provideCompletionItems(
    _document: TextDocument,
    _position: Position,
    _token: CancellationToken
  ): Promise<CompletionItem[]> {
    // Placeholder implementation for features completion
    return [];
  }
}

/**
 * Generate sort text for completion items
 */
export function sortText(index: number): string {
  return index.toString().padStart(3, '0');
}
