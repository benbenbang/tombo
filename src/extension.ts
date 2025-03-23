'use strict';
/**
 * This extension helps to manage Python package dependency versions.
 * It supports both pyproject.toml and requirements.txt files.
 */
import {
    window,
    workspace,
    ExtensionContext,
    TextDocumentChangeEvent,
    languages,
    DocumentSelector,
    CodeActionKind,
} from 'vscode';
import pyListener from './core/listener';
import PyCommands from './toml/commands';
import { VersionCompletions, FeaturesCompletions } from './providers/autoCompletion';
import { QuickActions } from './providers/quickAction';
import { quickFillListener } from './providers/quickFill';
import { CursorTracker } from './providers/cursorTracker';

export function activate(context: ExtensionContext) {
    // Support both pyproject.toml and requirements.txt files
    const tomlSelector: DocumentSelector = { language: 'toml', pattern: '**/pyproject.toml' };
    const requirementsSelector: DocumentSelector = { pattern: '**/requirements*.txt' };

    context.subscriptions.push(
        // Add active text editor listener and run once on start.
        window.onDidChangeActiveTextEditor(pyListener),

        // When the text document is changed, fetch + check dependencies
        workspace.onDidChangeTextDocument((e: TextDocumentChangeEvent) => {
            const { fileName } = e.document;
            if (
                fileName.toLocaleLowerCase().endsWith('pyproject.toml') ||
                (fileName.toLocaleLowerCase().includes('requirements') && fileName.toLocaleLowerCase().endsWith('.txt'))
            ) {
                if (!e.document.isDirty) {
                    pyListener(window.activeTextEditor);
                }

                // Handle quick fill functionality (typing "?" to auto-fill latest version)
                quickFillListener(e);
            }
        }),

        // Register the versions completions provider for both file types
        languages.registerCompletionItemProvider(
            tomlSelector,
            new VersionCompletions(),
            "'",
            '"',
            '.',
            '+',
            '-',
            '=',
            '0',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
        ),

        languages.registerCompletionItemProvider(
            requirementsSelector,
            new VersionCompletions(),
            '=',
            '~',
            '>',
            '<',
            '^',
            '!',
            ' ',
        ),

        // Register the Quick Actions provider
        languages.registerCodeActionsProvider([tomlSelector, requirementsSelector], new QuickActions(), {
            providedCodeActionKinds: [CodeActionKind.QuickFix],
        }),

        // Register the features auto completions provider
        languages.registerCompletionItemProvider(tomlSelector, new FeaturesCompletions(), "'", '"'),
    );

    pyListener(window.activeTextEditor);

    // Add commands
    context.subscriptions.push(PyCommands.replaceVersion);

    // Start the cursor tracker for idle detection
    const cursorTracker = new CursorTracker();
    cursorTracker.start();
    context.subscriptions.push({
        dispose: () => cursorTracker.dispose(),
    });
}

export function deactivate() {}
