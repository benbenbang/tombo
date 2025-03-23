/**
 * Helps to manage decorations for the TOML files.
 */
import {
    window,
    DecorationOptions,
    Range,
    TextEditor,
    MarkdownString,
    DecorationInstanceRenderOptions
} from "vscode";

import { checkVersion } from "../semver/semverUtils";
import { status, ReplaceItem } from "../toml/commands";
import { validRange } from "semver";
import DecorationPreferences from "../core/DecorationText";
import Package from "../core/Package";

export const latestVersion = () =>
    window.createTextEditorDecorationType({
        after: {
            margin: "2em",
        },
    });

/**
 * Create a decoration for the given package.
 * @param editor
 * @param package
 * @param version
 * @param versions
 */
export default function decoration(
    editor: TextEditor,
    item: Package,
    versions: string[],
    decorationPreferences: DecorationPreferences,
    error?: string,
): DecorationOptions {
    // Also handle json valued dependencies

    const start = item.start;
    const end = item.end;
    // Get the position of the item's end
    const itemEndPosition = editor.document.positionAt(end);
    // Get the line containing the end position
    let endofline = editor.document.lineAt(itemEndPosition).range.end;
    const version = item.value?.replace(",", "");
    const [satisfies, maxSatisfying] = checkVersion(version, versions);

    const formatError = (error: string) => {
        // Markdown does not like newlines in middle of emphasis, or spaces next to emphasis characters.
        const error_parts = error.split('\n');
        const markdown = new MarkdownString("#### Errors ");
        markdown.appendMarkdown("\n");
        // Ignore empty strings
        error_parts.filter(s => s).forEach(part => {
            markdown.appendMarkdown("* ");
            markdown.appendText(part.trim()); // Gets rid of Markdown-breaking spaces, then append text safely escaped.
            markdown.appendMarkdown("\n"); // Put the newlines back
        });
        return markdown;
    };
    let hoverMessage = new MarkdownString();
    let contentCss = {} as DecorationInstanceRenderOptions;
    if (error) {
        hoverMessage = formatError(error);
        contentCss = decorationPreferences.errorDecoratorCss;
    } else {
        hoverMessage.appendMarkdown("#### Versions");
        hoverMessage.appendMarkdown(` _( [View Package](https://pypi.org/project/${item.key.replace(/"/g, "")}) )_`);
        hoverMessage.isTrusted = true;

        if (versions.length > 0) {
            status.replaceItems.push({
                item: `"${versions[0]}"`,
                start,
                end,
            });
        }

        // Build markdown hover text
        for (let i = 0; i < versions.length; i++) {
            const version = versions[i];
            const replaceData: ReplaceItem = {
                item: `"${version}"`,
                start,
                end,
            };
            const isCurrent = version === maxSatisfying;
            const encoded = encodeURI(JSON.stringify(replaceData));
            const command = `${isCurrent ? "**" : ""}[${version}](command:python.replaceVersion?${encoded})${isCurrent ? "**" : ""}`;
            hoverMessage.appendMarkdown("\n* ");
            hoverMessage.appendMarkdown(command);
        }
        if (version == "?") {
            // Only auto-replace if versions are available
            if (versions && versions.length > 0) {
                const latestVersion = versions[0];
                const info: ReplaceItem = {
                    item: `"${latestVersion}"`,
                    start,
                    end,
                };

                console.log(`Auto-replacing "${item.key}" with version "${latestVersion}"`);

                // Make sure the positions are valid
                if (info.start >= 0 && info.end > info.start) {
                    try {
                        editor.edit((edit) => {
                            edit.replace(
                                new Range(
                                    editor.document.positionAt(info.start + 1),
                                    editor.document.positionAt(info.end - 1),
                                ),
                                info.item.substr(1, info.item.length - 2),
                            );
                        }).then(success => {
                            if (success) {
                                editor.document.save();
                                console.log(`Successfully auto-replaced version for ${item.key}`);
                            } else {
                                console.log(`Failed to auto-replace version for ${item.key}`);
                            }
                        });
                    } catch (err) {
                        console.error(`Error auto-replacing version for ${item.key}:`, err);
                    }
                } else {
                    console.error(`Invalid position for auto-replace: start=${info.start}, end=${info.end}`);
                }
            } else {
                console.log(`No versions available for ${item.key}, skipping auto-replace`);
            }
        }
        contentCss = decorationPreferences.compatibleDecoratorCss;
        // Special handling for placeholder versions
        if (version === "?" && versions.length > 0) {
            // Question mark is a valid placeholder - treat it as compatible
            contentCss = decorationPreferences.compatibleDecoratorCss;
        }
        else if (!version || !validRange(version)) {
            contentCss = decorationPreferences.errorDecoratorCss;
        }
        else if (versions[0] !== maxSatisfying) {
            if (satisfies) {
                contentCss = decorationPreferences.compatibleDecoratorCss;
            } else {
                contentCss = decorationPreferences.incompatibleDecoratorCss;
            }
        }

        contentCss.after!.contentText = contentCss.after!.contentText!.replace("${version}", versions[0])
    }

    // Create a more precise range for the decoration - just the package name and version
    // This is especially important for single-line arrays where multiple deps are on the same line
    const itemStartPosition = editor.document.positionAt(start);

    // Check if decoration is on a line with multiple dependencies
    const lineText = editor.document.lineAt(itemEndPosition.line).text;
    const isMultipleItemsOnLine = (lineText.match(/",\s*"/) || []).length > 0;

    const deco = {
        range: new Range(
            itemStartPosition,
            itemEndPosition
        ),
        hoverMessage,
        renderOptions: {},
    };

    // Only apply after-text decorations if version is valid and it's not on a line with multiple items
    if (version != "?" && contentCss.after!.contentText!.length > 0) {
        // For items on a single line with multiple deps, don't show after-text to avoid overlapping
        if (!isMultipleItemsOnLine) {
            deco.renderOptions = contentCss;
        } else {
            // For multiple items on a line, use a simpler decoration without after-text
            // but preserve the hover capability
            const simpleRenderOptions: DecorationInstanceRenderOptions = {};

            // Copy only the properties we care about
            if (contentCss.before) {
                simpleRenderOptions.before = { ...contentCss.before };
                // Remove any contentText to avoid overlap
                if (simpleRenderOptions.before.contentText) {
                    simpleRenderOptions.before.contentText = '';
                }
            }

            deco.renderOptions = simpleRenderOptions;
        }
    }

    return deco;
}
