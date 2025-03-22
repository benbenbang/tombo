import axios from 'axios';
import Dependency from "./Dependency";
import { StatusBar } from "../ui/status-bar";
import { CompletionItem, CompletionItemKind, CompletionList, MarkdownString } from "vscode";
import { sortText } from "../providers/autoCompletion";
import Package from "./Package";
import { TomboSettings } from './settings';

// Use require instead of import to avoid TypeScript error with NodeCache
const NodeCache = require('node-cache');

// Create a cache for PyPI responses
const pypiCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache for 1 hour, check expiry every 10 mins

/**
 * Fetch package versions from PyPI for a list of package names or Package objects
 * @param dependencies List of package names or Package objects
 * @returns A tuple containing a Promise of Dependency objects and a Map for quick lookup
 */
export async function fetchPackageVersions(dependencies: string[] | Package[]): Promise<[Promise<Dependency[]>, Map<string, Dependency[]>]> {
    const settings = new TomboSettings();
    const shouldListPreRels = settings.listPreReleases;
    const indexServerURL = settings.pypiIndexUrl;

    StatusBar.setText("Loading", "👀 Fetching " + indexServerURL.replace(/^https?:\/\//, ''));

    let responsesMap: Map<string, Dependency[]> = new Map();

    // Extract package names from Package objects if needed
    const packageNames = dependencies.map(dep => typeof dep === 'string' ? dep : dep.key);

    // Filter out duplicates
    const uniquePackages = [...new Set(packageNames)];

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

        return axios.get(indexServerURL + packageName + "/json")
            .then((response: any) => {
                // Cache the response
                pypiCache.set(packageName, response.data);
                return processPackageData(packageName, response.data, shouldListPreRels, dependencies);
            })
            .catch((error: Error) => {
                console.error(`Error fetching ${packageName}:`, error);
                return {
                    package: findPackageObject(packageName, dependencies),
                    error: packageName + ": " + error.message,
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
            version.indexOf("a") !== -1 ||
            version.indexOf("b") !== -1 ||
            version.indexOf("rc") !== -1 ||
            version.indexOf("dev") !== -1
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
