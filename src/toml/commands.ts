/**
 * Enhanced commands with modern PyPIService integration
 * Supports both legacy and enhanced parsing workflows
 */
import { commands, TextEditor, TextEditorEdit, Range } from "vscode";
import jsonListener, { parseAndDecorateEnhanced } from "../core/listener";
import { PyPIError } from '../core/errors/pypi-errors';

export interface ReplaceItem {
    item: string;
    start: number;
    end: number;
}

export const status = {
    inProgress: false,
    replaceItems: [] as ReplaceItem[],
};

export const replaceVersion = commands.registerTextEditorCommand(
    "pypi.replaceVersion",
    (editor: TextEditor, edit: TextEditorEdit, info: ReplaceItem) => {
        if (editor && info && !status.inProgress) {
            const { fileName } = editor.document;
            if (fileName.toLocaleLowerCase().endsWith("requirements.txt")) {
                status.inProgress = true;
                console.log("Replacing", info.item);
                edit.replace(
                    new Range(
                        editor.document.positionAt(info.start + 1),
                        editor.document.positionAt(info.end - 1),
                    ),
                    info.item.substr(1, info.item.length - 2),
                );
                status.inProgress = false;
            }
        }
    },
);

export const reload = commands.registerTextEditorCommand(
    "pypi.retry",
    async (editor: TextEditor) => {
        if (editor) {
            try {
                // Try enhanced parsing first, fall back to legacy
                await parseAndDecorateEnhanced(editor, false, true);
            } catch (error) {
                console.warn("Enhanced reload failed, using legacy:", error);
                await jsonListener(editor);
            }
        }
    },
);

export const updateAll = commands.registerTextEditorCommand(
    "pypi.updateAll",
    async (editor: TextEditor, edit: TextEditorEdit) => {
        if (
            editor &&
            !status.inProgress &&
            status.replaceItems &&
            status.replaceItems.length > 0 &&
            (editor.document.fileName.toLocaleLowerCase().endsWith("requirements.txt") ||
             editor.document.fileName.toLocaleLowerCase().endsWith("pyproject.toml"))
        ) {
            status.inProgress = true;
            console.log(`Updating all ${status.replaceItems.length} dependencies`);

            try {
                // Apply all replacements in reverse order to maintain positions
                for (let i = status.replaceItems.length - 1; i > -1; i--) {
                    const rItem = status.replaceItems[i];
                    edit.replace(
                        new Range(
                            editor.document.positionAt(rItem.start),
                            editor.document.positionAt(rItem.end),
                        ),
                        rItem.item,
                    );
                }

                // Save the document
                const saved = await editor.document.save();
                if (!saved) {
                    console.warn("Initial save failed, retrying...");
                    await editor.document.save();
                }

                console.log("All dependencies updated successfully");

                // Refresh decorations after updates
                try {
                    await parseAndDecorateEnhanced(editor, true, true);
                } catch (error) {
                    console.warn("Enhanced refresh failed after update:", error);
                    await jsonListener(editor);
                }

            } catch (error) {
                console.error("Error during bulk update:", error);
            } finally {
                status.inProgress = false;
            }
        }
    },
);

/**
 * Enhanced command for checking PyPI connectivity
 */
export const checkConnectivity = commands.registerCommand(
    "tombo.checkConnectivity",
    async () => {
        const { PyPIServiceFactory } = await import('../api/services/pypi-service');
        const { TomboSettings } = await import('../core/settings');

        try {
            const settings = new TomboSettings();
            const pypiService = PyPIServiceFactory.createWithConfig({
                baseUrl: settings.pypiIndexUrl,
                timeout: 5000,
                retryAttempts: 1,
                retryDelay: 1000
            });

            const isConnected = await pypiService.checkConnectivity();
            const { window } = await import('vscode');

            if (isConnected) {
                window.showInformationMessage(
                    `✅ Connected to PyPI at ${settings.pypiIndexUrl}`
                );
            } else {
                window.showWarningMessage(
                    `⚠️ Unable to connect to PyPI at ${settings.pypiIndexUrl}`
                );
            }

        } catch (error) {
            const { window } = await import('vscode');
            const errorMsg = error instanceof PyPIError
                ? error.message
                : 'Unknown connectivity error';

            window.showErrorMessage(
                `❌ PyPI connectivity check failed: ${errorMsg}`
            );
        }
    }
);

export default { replaceVersion, reload, updateAll, checkConnectivity };
