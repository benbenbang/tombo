import axios from 'axios';
import Dependency from './Dependency';
import { StatusBar } from '../ui/status-bar';
import { CompletionItem, CompletionItemKind, CompletionList, MarkdownString } from 'vscode';
import { sortText } from '../providers/autoCompletion';
import Package from './Package';
import { TomboSettings } from './settings';
import { PyPIService, PyPIServiceFactory } from '../api/services/pypi-service';
import { PackageMetadata } from '../api/types/pypi';
import { PyPIError, PackageNotFoundError } from '../core/errors/pypi-errors';
import { ParsedDependency } from '../toml/parser';

// Import NodeCache properly for TypeScript
import NodeCache = require('node-cache');

// Create a cache for PyPI responses
const pypiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache for 1 hour, check expiry every 10 mins

/**
 * Enhanced dependency result with richer metadata
 */
export interface EnhancedDependency {
    dependency: ParsedDependency;
    metadata: PackageMetadata | null;
    error: PyPIError | null;
    completionItems: CompletionItem[];
}

/**
 * Fetch package versions from PyPI for a list of package names or Package objects
 * @param dependencies List of package names or Package objects
 * @returns A tuple containing a Promise of Dependency objects and a Map for quick lookup
 */
export async function fetchPackageVersions(dependencies: string[] | Package[]): Promise<[Promise<Dependency[]>, Map<string, Dependency[]>]> {
    const settings = new TomboSettings();
    const shouldListPreRels = settings.getListPreReleases();
    const indexServerURL = settings.getPypiIndexUrl();

    StatusBar.setText('Loading', '👀 Fetching ' + indexServerURL.replace(/^https?:\/\//, ''));

    const responsesMap: Map<string, Dependency[]> = new Map();

    // Extract package names from Package objects if needed
    const packageNames = dependencies.map(dep => typeof dep === 'string' ? dep : dep.key);

    // Filter out duplicates
    const uniquePackages = Array.from(new Set(packageNames));

    const responses = uniquePackages.map(transformServerResponse(shouldListPreRels, indexServerURL, dependencies));

    return [Promise.all(responses), responsesMap];
}

/**
 * Transforms the PyPI server response into a Dependency object
 */
function transformServerResponse(
    shouldListPreRels: boolean,
    indexServerURL: string,
    dependencies: string[] | Package[]
): (packageName: string) => Promise<Dependency> {
    return function (packageName: string): Promise<Dependency> {
        // Check if we have a cached response
        const cachedData = pypiCache.get(packageName) as any;
        if (cachedData) {
            return Promise.resolve(processPackageData(packageName, cachedData, shouldListPreRels, dependencies));
        }

        return axios.get(indexServerURL + packageName + '/json')
            .then((response: any) => {
                // Cache the response
                pypiCache.set(packageName, response.data);
                return processPackageData(packageName, response.data, shouldListPreRels, dependencies);
            })
            .catch((error: Error) => {
                console.error(`Error fetching ${packageName}:`, error);
                return {
                    package: findPackageObject(packageName, dependencies),
                    error: packageName + ': ' + error.message,
                };
            });
    };
}

/**
 * Process PyPI package data into a Dependency object
 */
function processPackageData(
    packageName: string,
    data: any,
    shouldListPreRels: boolean,
    dependencies: string[] | Package[]
): Dependency {
    // Extract all versions
    const versions = Object.keys(data.releases).reduce((result: string[], version: string) => {
        const isPreRelease = !shouldListPreRels && (
            version.indexOf('a') !== -1 ||
            version.indexOf('b') !== -1 ||
            version.indexOf('rc') !== -1 ||
            version.indexOf('dev') !== -1
        );

        if (!isPreRelease) {
            result.push(version);
        }
        return result;
    }, [])
    .sort((a, b) => {
        // Custom sort for semver-like versions
        const aParts = a.split('.');
        const bParts = b.split('.');

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aNum = parseInt(aParts[i] || '0', 10);
            const bNum = parseInt(bParts[i] || '0', 10);

            if (aNum !== bNum) {
                return bNum - aNum;  // Descending order
            }
        }

        return b.localeCompare(a);  // Fallback to string comparison
    });

    // Create completion items with descriptions
    let i = 0;
    const versionCompletionItems = new CompletionList(
        versions.map((version: string) => {
            const completionItem = new CompletionItem(
                version,
                CompletionItemKind.Class
            );

            // Add package info as documentation
            completionItem.documentation = new MarkdownString();

            if (data.info) {
                const summary = data.info.summary || 'No summary available';
                const releaseUrl = `https://pypi.org/project/${packageName}/${version}/`;

                (completionItem.documentation as MarkdownString).appendMarkdown(
                    `## ${packageName} ${version}\n\n`
                );

                (completionItem.documentation as MarkdownString).appendMarkdown(
                    `${summary}\n\n`
                );

                (completionItem.documentation as MarkdownString).appendMarkdown(
                    `[View on PyPI](${releaseUrl})`
                );
            }

            completionItem.preselect = i === 0;
            completionItem.sortText = sortText(i++);
            return completionItem;
        }),
        true
    );

    return {
        package: findPackageObject(packageName, dependencies),
        versions,
        versionCompletionItems,
    };
}

/**
 * Find the Package object for a given package name
 */
function findPackageObject(packageName: string, dependencies: string[] | Package[]): Package {
    if (dependencies.length > 0 && typeof dependencies[0] !== 'string') {
        // If we have Package objects, find the matching one
        const pkg = (dependencies as Package[]).find(p => p.key === packageName);
        if (pkg) {
            return pkg;
        }
    }

    // Create a new Package object if not found
    const pkg = new Package();
    pkg.key = packageName;
    return pkg;
}

/**
 * Enhanced package fetcher that uses the modern PyPIService architecture
 * Provides richer metadata and better error handling
 */
export async function fetchPackageMetadataEnhanced(
    dependencies: ParsedDependency[],
    settings?: TomboSettings
): Promise<EnhancedDependency[]> {
    const tomboSettings = settings || new TomboSettings();
    const includePreReleases = tomboSettings.getListPreReleases();
    const indexUrl = tomboSettings.getPypiIndexUrl();

    // Create PyPI service instance
    const pypiService = PyPIServiceFactory.createWithConfig({
        baseUrl: indexUrl,
        timeout: 10000,
        retryAttempts: 2,
        retryDelay: 1000
    });

    StatusBar.setText('Loading', `🔍 Fetching from ${indexUrl.replace(/^https?:\/\//, '')}`);

    const results: EnhancedDependency[] = [];

    // Process dependencies concurrently with controlled parallelism
    const batchSize = 5; // Process 5 packages at a time
    for (let i = 0; i < dependencies.length; i += batchSize) {
        const batch = dependencies.slice(i, i + batchSize);
        const batchPromises = batch.map(async (dependency) => {
            return await processSingleDependency(dependency, pypiService, includePreReleases);
        });

        const batchResults = await Promise.allSettled(batchPromises);

        // Process batch results
        for (let j = 0; j < batchResults.length; j++) {
            const result = batchResults[j];
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                // Handle rejected promises
                const dependency = batch[j];
                const error = new PyPIError(
                    'PROCESSING_ERROR',
                    result.reason?.message || 'Unknown processing error',
                    dependency.name,
                    result.reason
                );

                results.push({
                    dependency,
                    metadata: null,
                    error,
                    completionItems: []
                });
            }
        }

        // Update progress
        const progress = Math.min(i + batchSize, dependencies.length);
        StatusBar.setText('Loading', `🔍 Processed ${progress}/${dependencies.length} packages`);
    }

    StatusBar.setText('Info', `✅ Processed ${dependencies.length} packages`);

    return results;
}

/**
 * Process a single dependency with the PyPI service
 */
async function processSingleDependency(
    dependency: ParsedDependency,
    pypiService: PyPIService,
    includePreReleases: boolean
): Promise<EnhancedDependency> {
    try {
        const metadata = await pypiService.getPackageMetadata(dependency.name, includePreReleases);
        const completionItems = createEnhancedCompletionItems(dependency, metadata);

        return {
            dependency,
            metadata,
            error: null,
            completionItems
        };
    } catch (error) {
        let pypiError: PyPIError;

        if (error instanceof PyPIError) {
            pypiError = error;
        } else {
            pypiError = new PyPIError(
                'FETCH_ERROR',
                error instanceof Error ? error.message : 'Unknown error',
                dependency.name,
                error instanceof Error ? error : undefined
            );
        }

        return {
            dependency,
            metadata: null,
            error: pypiError,
            completionItems: []
        };
    }
}

/**
 * Create enhanced completion items with rich documentation
 */
function createEnhancedCompletionItems(
    _dependency: ParsedDependency,
    metadata: PackageMetadata
): CompletionItem[] {
    const completionItems: CompletionItem[] = [];

    metadata.versions.forEach((version, index) => {
        const completionItem = new CompletionItem(
            version,
            CompletionItemKind.Class
        );

        // Create rich documentation
        const documentation = new MarkdownString();
        documentation.isTrusted = true;

        // Header
        documentation.appendMarkdown(`## ${metadata.name} ${version}\n\n`);

        // Summary
        if (metadata.summary) {
            documentation.appendMarkdown(`${metadata.summary}\n\n`);
        }

        // Version status
        const isLatest = version === metadata.latestVersion;
        const isYanked = metadata.yankedVersions.has(version);
        const isPreRelease = metadata.preReleaseVersions.has(version);

        if (isLatest) {
            documentation.appendMarkdown('**Latest Version** ✨\n\n');
        }

        if (isYanked) {
            documentation.appendMarkdown('⚠️ **This version has been yanked**\n\n');
        }

        if (isPreRelease) {
            documentation.appendMarkdown('🧪 **Pre-release Version**\n\n');
        }

        // Python requirement
        if (metadata.requiresPython) {
            documentation.appendMarkdown(`**Requires Python:** ${metadata.requiresPython}\n\n`);
        }

        // Links
        const releaseUrl = `https://pypi.org/project/${metadata.name}/${version}/`;
        documentation.appendMarkdown(`[View on PyPI](${releaseUrl})`);

        completionItem.documentation = documentation;
        completionItem.preselect = index === 0; // Preselect latest version
        completionItem.sortText = sortText(index);

        // Add special indicators for problematic versions
        if (isYanked) {
            completionItem.tags = [1]; // CompletionItemTag.Deprecated
        }

        completionItems.push(completionItem);
    });

    return completionItems;
}

/**
 * Compatibility function to convert enhanced dependencies to legacy format
 * This allows gradual migration from the old system
 */
export function convertToLegacyDependencies(
    enhancedDeps: EnhancedDependency[]
): Dependency[] {
    return enhancedDeps.map(enhanced => {
        const legacy: Dependency = {
            package: convertParsedToLegacyPackage(enhanced.dependency),
            versions: enhanced.metadata?.versions || [],
            error: enhanced.error?.message,
            versionCompletionItems: new CompletionList(enhanced.completionItems, true)
        };

        return legacy;
    });
}

/**
 * Convert ParsedDependency to legacy Package format
 */
function convertParsedToLegacyPackage(dependency: ParsedDependency): Package {
    const pkg = new Package();
    pkg.key = dependency.name;
    pkg.value = dependency.version;
    pkg.start = dependency.startPosition;
    pkg.end = dependency.endPosition;
    return pkg;
}
