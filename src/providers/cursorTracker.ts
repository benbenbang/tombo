import { window, Position, TextEditor, Disposable } from 'vscode';
import { checkAndFetchVersionForPosition } from './quickFill';

/**
 * Tracks cursor position and triggers version fetching when cursor is stationary
 */
export class CursorTracker {
    private currentPosition: Position | null = null;
    private timer: NodeJS.Timeout | null = null;
    private disposable: Disposable | null = null;
    private readonly IDLE_TIME = 5000; // 5 seconds in milliseconds

    /**
     * Start tracking cursor position
     */
    start(): void {
        if (this.disposable) {
            return; // Already started
        }

        this.disposable = window.onDidChangeTextEditorSelection(_ => {
            const editor = window.activeTextEditor;
            if (!editor) {
                return;
            }

            // Get the current cursor position
            const position = editor.selection.active;

            // Check if position has changed
            if (this.currentPosition &&
                this.currentPosition.line === position.line &&
                this.currentPosition.character === position.character) {
                return; // Position hasn't changed
            }

            // Reset timer
            this.resetTimer();

            // Update current position
            this.currentPosition = position;

            // Set a new timer
            this.timer = setTimeout(() => {
                this.onCursorIdle(editor, position);
            }, this.IDLE_TIME);
        });

        // Clear timer when editor changes
        window.onDidChangeActiveTextEditor(() => {
            this.resetTimer();
        });
    }

    /**
     * Stop tracking cursor position
     */
    dispose(): void {
        this.resetTimer();
        if (this.disposable) {
            this.disposable.dispose();
            this.disposable = null;
        }
    }

    /**
     * Reset the timer
     */
    private resetTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     * Handle cursor being idle
     */
    private onCursorIdle(editor: TextEditor, position: Position): void {
        // Only trigger for pyproject.toml and requirements*.txt files
        const fileName = editor.document.fileName.toLowerCase();
        if (fileName.endsWith('pyproject.toml') ||
            (fileName.includes('requirements') && fileName.endsWith('.txt'))) {

            console.log(`Cursor idle for ${this.IDLE_TIME}ms at position ${position.line}:${position.character}`);
            checkAndFetchVersionForPosition(editor, position);
        }
    }
}
