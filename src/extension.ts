'use strict';
/**
 * Tombo VS Code Extension
 * Modern Python package dependency manager with clean architecture
 */

import { ExtensionContext } from 'vscode';
import { TomboExtension } from './extension/tombo-extension';

let tomboExtension: TomboExtension | null = null;

/**
 * Extension activation entry point
 */
export async function activate(context: ExtensionContext): Promise<void> {
    try {
        tomboExtension = new TomboExtension(context);
        await tomboExtension.activate();

        console.log('[Tombo] Extension activated with modern architecture');
    } catch (error) {
        console.error('[Tombo] Failed to activate extension:', error);
        throw error;
    }
}

/**
 * Extension deactivation entry point
 */
export async function deactivate(): Promise<void> {
    if (tomboExtension) {
        try {
            await tomboExtension.deactivate();
            tomboExtension = null;
            console.log('[Tombo] Extension deactivated cleanly');
        } catch (error) {
            console.error('[Tombo] Error during deactivation:', error);
        }
    }
}

/**
 * Get the active Tombo extension instance
 * Useful for testing and debugging
 */
export function getTomboExtension(): TomboExtension | null {
    return tomboExtension;
}
