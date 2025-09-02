/**
 * Modern decoration system that integrates with PyPIService
 * Provides enhanced visual indicators for package compatibility and versions
 */
import {
    window,
    DecorationOptions,
    Range,
    TextEditor,
    MarkdownString,
    DecorationInstanceRenderOptions
} from 'vscode';

import { checkVersion } from '../semver/semverUtils';
import { status, ReplaceItem } from '../toml/commands';
import { validRange } from 'semver';
import DecorationPreferences from '../core/DecorationText';
import Package from '../core/Package';
import { PackageMetadata } from '../api/types/pypi';
import { PyPIError } from '../core/errors/pypi-errors';
import { ParsedDependency } from '../toml/parser';

export const latestVersion = () =>
    window.createTextEditorDecorationType({
        after: {
            margin: '2em',
        },
    });

/**
 * Enhanced decoration result with additional metadata
 */
export interface EnhancedDecorationResult {
    decoration: DecorationOptions;
    hasError: boolean;
    isOutdated: boolean;
    isPreRelease: boolean;
    availableVersions: string[];
}

/**
 * Create a decoration for the given package using legacy format.
 * @param editor - VS Code text editor
 * @param item - Legacy package item
 * @param versions - Available versions
 * @param decorationPreferences - Decoration styling preferences
 * @param error - Error message if any
 * @returns Decoration options for the package
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
    const endofline = editor.document.lineAt(itemEndPosition).range.end;
    const version = item.value?.replace(',', '');
    const [satisfies, maxSatisfying] = checkVersion(version, versions);

    const formatError = (error: string) => {
        // Markdown does not like newlines in middle of emphasis, or spaces next to emphasis characters.
        const error_parts = error.split('\n');
        const markdown = new MarkdownString('#### Errors ');
        markdown.appendMarkdown('\n');
        // Ignore empty strings
        error_parts.filter(s => s).forEach(part => {
            markdown.appendMarkdown('* ');
            markdown.appendText(part.trim()); // Gets rid of Markdown-breaking spaces, then append text safely escaped.
            markdown.appendMarkdown('\n'); // Put the newlines back
        });
        return markdown;
    };
    let hoverMessage = new MarkdownString();
    let contentCss = {} as DecorationInstanceRenderOptions;
    if (error) {
        hoverMessage = formatError(error);
        contentCss = decorationPreferences.errorDecoratorCss;
    } else {
        hoverMessage.appendMarkdown('#### Versions');
        hoverMessage.appendMarkdown(` _( [View Package](https://pypi.org/project/${item.key.replace(/"/g, '')}) )_`);
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
            const command = `${isCurrent ? '**' : ''}[${version}](command:python.replaceVersion?${encoded})${isCurrent ? '**' : ''}`;
            hoverMessage.appendMarkdown('\n* ');
            hoverMessage.appendMarkdown(command);
        }
        if (version == '?') {
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
        if (version === '?' && versions.length > 0) {
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

        contentCss.after!.contentText = contentCss.after!.contentText!.replace('${version}', versions[0]);
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
    if (version != '?' && contentCss.after!.contentText!.length > 0) {
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

/**
 * Enhanced decoration function that integrates with PackageMetadata
 * Provides richer information and better error handling
 */
export function createEnhancedDecoration(
    editor: TextEditor,
    dependency: ParsedDependency,
    packageMetadata: PackageMetadata | null,
    decorationPreferences: DecorationPreferences,
    error?: PyPIError,
): EnhancedDecorationResult {
    const { name, version, startPosition, endPosition } = dependency;
    const startPos = editor.document.positionAt(startPosition);
    const endPos = editor.document.positionAt(endPosition);

    let hoverMessage = new MarkdownString();
    let contentCss = {} as DecorationInstanceRenderOptions;
    let hasError = false;
    let isOutdated = false;
    let isPreRelease = false;
    let availableVersions: string[] = [];

    // Handle error states
    if (error) {
        hasError = true;
        hoverMessage = createErrorMarkdown(error);
        contentCss = decorationPreferences.errorDecoratorCss;
    } else if (!packageMetadata) {
        hasError = true;
        hoverMessage.appendMarkdown('#### Package Not Found');
        hoverMessage.appendMarkdown(`\n\nPackage '${name}' could not be found on PyPI.`);
        contentCss = decorationPreferences.errorDecoratorCss;
    } else {
        // Package found, create rich decoration
        const result = createPackageDecoration(
            dependency,
            packageMetadata,
            decorationPreferences
        );

        hoverMessage = result.hoverMessage;
        contentCss = result.contentCss;
        isOutdated = result.isOutdated;
        isPreRelease = result.isPreRelease;
        availableVersions = packageMetadata.versions;

        // Update status for version replacement commands
        if (packageMetadata.versions.length > 0) {
            status.replaceItems.push({
                item: `"${packageMetadata.versions[0]}"`,
                start: startPosition,
                end: endPosition,
            });
        }
    }

    const decoration: DecorationOptions = {
        range: new Range(startPos, endPos),
        hoverMessage,
        renderOptions: contentCss,
    };

    return {
        decoration,
        hasError,
        isOutdated,
        isPreRelease,
        availableVersions,
    };
}

/**
 * Create rich package decoration with version information
 */
function createPackageDecoration(
    dependency: ParsedDependency,
    packageMetadata: PackageMetadata,
    decorationPreferences: DecorationPreferences
): {
    hoverMessage: MarkdownString;
    contentCss: DecorationInstanceRenderOptions;
    isOutdated: boolean;
    isPreRelease: boolean;
} {
    const { name, version } = dependency;
    const { versions, latestVersion, summary, yankedVersions, preReleaseVersions } = packageMetadata;

    const hoverMessage = new MarkdownString();
    let contentCss = decorationPreferences.compatibleDecoratorCss;
    let isOutdated = false;
    let isPreRelease = false;

    // Build header with package information
    hoverMessage.appendMarkdown(`#### ${name}`);
    hoverMessage.appendMarkdown(` _([View on PyPI](https://pypi.org/project/${name}/))_`);
    hoverMessage.isTrusted = true;

    if (summary) {
        hoverMessage.appendMarkdown(`\n\n${summary}`);
    }

    // Current version analysis
    if (version) {
        const [satisfies, maxSatisfying] = checkVersion(version, versions);
        const currentIsLatest = version === latestVersion;
        const currentIsYanked = yankedVersions.has(version);
        const currentIsPreRelease = preReleaseVersions.has(version);

        hoverMessage.appendMarkdown(`\n\n**Current:** ${version}`);

        if (currentIsYanked) {
            hoverMessage.appendMarkdown(' ⚠️ *Yanked*');
            contentCss = decorationPreferences.errorDecoratorCss;
        } else if (currentIsPreRelease) {
            hoverMessage.appendMarkdown(' 🧪 *Pre-release*');
            isPreRelease = true;
        } else if (!currentIsLatest && satisfies) {
            hoverMessage.appendMarkdown(' 📅 *Outdated*');
            isOutdated = true;
            contentCss = decorationPreferences.incompatibleDecoratorCss;
        } else if (!satisfies) {
            hoverMessage.appendMarkdown(' ❌ *Incompatible*');
            contentCss = decorationPreferences.incompatibleDecoratorCss;
        }

        hoverMessage.appendMarkdown(`\n**Latest:** ${latestVersion}`);
    }

    // Python version requirements
    if (packageMetadata.requiresPython) {
        hoverMessage.appendMarkdown(`\n**Requires Python:** ${packageMetadata.requiresPython}`);
    }

    // Available versions with commands
    hoverMessage.appendMarkdown('\n\n#### Available Versions');
    const displayVersions = versions.slice(0, 10); // Limit to 10 most recent

    for (const availableVersion of displayVersions) {
        const replaceData: ReplaceItem = {
            item: `"${availableVersion}"`,
            start: dependency.startPosition,
            end: dependency.endPosition,
        };

        const isCurrent = availableVersion === version;
        const isLatest = availableVersion === latestVersion;
        const isYanked = yankedVersions.has(availableVersion);
        const isPre = preReleaseVersions.has(availableVersion);

        const encoded = encodeURI(JSON.stringify(replaceData));
        let versionText = `[${availableVersion}](command:python.replaceVersion?${encoded})`;

        if (isCurrent) {
            versionText = `**${versionText}** ← *current*`;
        } else if (isLatest) {
            versionText = `**${versionText}** ← *latest*`;
        }

        if (isYanked) {
            versionText += ' ⚠️';
        } else if (isPre) {
            versionText += ' 🧪';
        }

        hoverMessage.appendMarkdown(`\n* ${versionText}`);
    }

    if (versions.length > 10) {
        hoverMessage.appendMarkdown(`\n\n*... and ${versions.length - 10} more versions*`);
    }

    // Apply latest version to CSS template
    if (contentCss.after?.contentText) {
        contentCss.after.contentText = contentCss.after.contentText.replace(
            '${version}',
            latestVersion
        );
    }

    return { hoverMessage, contentCss, isOutdated, isPreRelease };
}

/**
 * Create error markdown for PyPI errors
 */
function createErrorMarkdown(error: PyPIError): MarkdownString {
    const markdown = new MarkdownString();
    markdown.appendMarkdown('#### Error');
    markdown.appendMarkdown(`\n\n${error.message}`);

    if (error.packageName) {
        markdown.appendMarkdown(`\n\n**Package:** ${error.packageName}`);
    }

    if (error.code) {
        markdown.appendMarkdown(`\n**Error Code:** ${error.code}`);
    }

    if (error.retryAfter) {
        markdown.appendMarkdown(`\n**Retry After:** ${error.retryAfter}s`);
    }

    return markdown;
}
