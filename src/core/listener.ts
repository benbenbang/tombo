/**
 * Modern listener for Python package dependency files.
 * Integrates with PyPIService for enhanced functionality.
 * Supports both pyproject.toml and requirements.txt files.
 */
import { Position, Range, TextDocument, TextEditor } from "vscode";
import { parse, filterPackages, parseDependenciesWithMetadata, ParsedDependency } from "../toml/parser";
import { StatusBar } from "../ui/status-bar";
import { status } from "../toml/commands";
import Package from "./Package";
import decorate, { decorationHandle } from "../ui/decorator";
import { fetchPackageVersions, fetchPackageMetadataEnhanced, EnhancedDependency, convertToLegacyDependencies } from "./fetcher";
import Dependency from "./Dependency";
import { parseRequirementsTxt } from "../core/python";
import { PyPIServiceFactory } from '../api/services/pypi-service';
import { TomboSettings } from './settings';

// Parse TOML files (pyproject.toml)
function parseToml(text: string): Package[] {
    console.log("Parsing TOML...");
    const txt = parse(text);
    const txtDependencies = filterPackages(txt.values);
    console.log("Parsed TOML");
    return txtDependencies;
}

// Parse requirements.txt files
function parseRequirements(text: string): Package[] {
    console.log("Parsing requirements.txt...");
    const requirements = parseRequirementsTxt(text);
    console.log("Parsed requirements.txt");
    return requirements;
}

/**
 * Enhanced TOML parsing with modern architecture
 */
async function parseTomlEnhanced(document: TextDocument): Promise<ParsedDependency[]> {
    console.log("Enhanced TOML parsing...");
    const result = await parseDependenciesWithMetadata(document, pypiService || undefined);

    if (result.errors.length > 0) {
        console.warn("TOML parsing errors:", result.errors);
    }

    console.log(`Parsed ${result.dependencies.length} dependencies from TOML`);
    return result.dependencies;
}

/**
 * Enhanced requirements.txt parsing with modern architecture
 */
function parseRequirementsEnhanced(text: string): ParsedDependency[] {
    console.log("Enhanced requirements.txt parsing...");
    const legacyRequirements = parseRequirementsTxt(text);

    // Convert legacy Package objects to ParsedDependency
    const parsedDependencies: ParsedDependency[] = legacyRequirements.map(pkg => ({
        name: pkg.key,
        version: pkg.value || undefined,
        startPosition: pkg.start,
        endPosition: pkg.end,
        source: 'dependencies' as const,
        extras: []
    }));

    console.log(`Parsed ${parsedDependencies.length} dependencies from requirements.txt`);
    return parsedDependencies;
}

var dependencies: Package[];
var fetchedDeps: Dependency[];
var fetchedDepsMap: Map<string, Dependency[]>;

// Enhanced modern dependencies
var enhancedDependencies: ParsedDependency[];
var fetchedEnhancedDeps: EnhancedDependency[];
var pypiService: ReturnType<typeof PyPIServiceFactory.create> | null = null;

export { dependencies, fetchedDeps, fetchedDepsMap, enhancedDependencies, fetchedEnhancedDeps };

export function getFetchedDependency(document: TextDocument, item: string, position: Position): Dependency | undefined {
    console.log(`Searching for dependency: ${item}`);

    // First try to get from the map
    const fetchedDep = fetchedDepsMap.get(item);
    if (!fetchedDep) {
        console.log(`No dependency found for ${item}`);

        // For files not in the map, try creating a dummy dependency
        if (document.fileName.toLowerCase().endsWith('.txt') &&
            document.fileName.toLowerCase().includes('requirements')) {

            console.log(`Creating dummy dependency for ${item} (requirements.txt)`);

            // Create a dummy Package
            const pkg = new Package();
            pkg.key = item;
            pkg.start = document.getText().indexOf(item);
            pkg.end = pkg.start + item.length;

            // Try fetching the dependency on-demand
            fetchPackageVersions([pkg]).then(() => {
                console.log(`Fetched package info for ${item}`);
            }).catch(err => {
                console.error(`Error fetching package info for ${item}:`, err);
            });
        }

        return undefined;
    }

    if (fetchedDep.length === 1) {
        console.log(`Found single dependency for ${item}`);
        return fetchedDep[0];
    } else {
        console.log(`Found multiple dependencies for ${item}, searching for position match`);
        for (let i = 0; i < fetchedDep.length; i++) {
            const range = new Range(
                document.positionAt(fetchedDep[i].package.start + 1),
                document.positionAt(fetchedDep[i].package.end - 1)
            );
            if (range.contains(position)) {
                console.log(`Found matching dependency for ${item} at position ${position.line}:${position.character}`);
                return fetchedDep[i];
            }
        }
    }

    // If we couldn't find a position match but have a dependency, return the first one
    if (fetchedDep.length > 0) {
        console.log(`No position match found for ${item}, returning first dependency`);
        return fetchedDep[0];
    }

    console.log(`No dependency found for ${item}`);
    return undefined;
}

export async function parseAndDecorate(
    editor: TextEditor,
    _wasSaved: boolean = false,
    fetchDeps: boolean = true
) {
    const text = editor.document.getText();
    const { fileName } = editor.document;

    try {
        // Parse based on file type
        if (fileName.toLocaleLowerCase().endsWith("pyproject.toml")) {
            StatusBar.setText("Loading", "Parsing pyproject.toml");
            dependencies = parseToml(text);
        } else if (fileName.toLocaleLowerCase().includes("requirements") && fileName.toLocaleLowerCase().endsWith(".txt")) {
            StatusBar.setText("Loading", "Parsing requirements.txt");
            dependencies = parseRequirements(text);
        } else {
            return; // Unsupported file type
        }

        if (fetchDeps || !fetchedDeps || !fetchedDepsMap) {
            const packageNames = dependencies.map(dep => dep.key);
            const data = await fetchPackageVersions(packageNames);
            fetchedDeps = await data[0];
            fetchedDepsMap = data[1];
        }

        decorate(editor, fetchedDeps);
        // StatusBar.setText("Info", "Done");

    } catch (e) {
        console.error(e);
        StatusBar.setText("Error", `${fileName} is not valid!`);
        if (decorationHandle) {
            decorationHandle.dispose();
        }
    }
}

/**
 * Enhanced parse and decorate function using modern architecture
 */
export async function parseAndDecorateEnhanced(
    editor: TextEditor,
    _wasSaved: boolean = false,
    fetchDeps: boolean = true
) {
    const text = editor.document.getText();
    const { fileName } = editor.document;

    // Initialize PyPI service if not already done
    if (!pypiService) {
        const settings = new TomboSettings();
        pypiService = PyPIServiceFactory.createWithConfig({
            baseUrl: settings.pypiIndexUrl,
            timeout: 10000,
            retryAttempts: 2,
            retryDelay: 1000
        });
    }

    try {
        // Parse based on file type using enhanced parsers
        if (fileName.toLocaleLowerCase().endsWith("pyproject.toml")) {
            StatusBar.setText("Loading", "📋 Parsing pyproject.toml");
            enhancedDependencies = await parseTomlEnhanced(editor.document);

            // Also update legacy dependencies for backward compatibility
            dependencies = parseToml(text);
        } else if (fileName.toLocaleLowerCase().includes("requirements") && fileName.toLocaleLowerCase().endsWith(".txt")) {
            StatusBar.setText("Loading", "📋 Parsing requirements.txt");
            enhancedDependencies = parseRequirementsEnhanced(text);

            // Also update legacy dependencies for backward compatibility
            dependencies = parseRequirements(text);
        } else {
            return; // Unsupported file type
        }

        if (fetchDeps || !fetchedEnhancedDeps) {
            // Fetch using enhanced fetcher
            fetchedEnhancedDeps = await fetchPackageMetadataEnhanced(enhancedDependencies);

            // Convert to legacy format for backward compatibility
            fetchedDeps = convertToLegacyDependencies(fetchedEnhancedDeps);

            // Update legacy map
            fetchedDepsMap = new Map();
            fetchedDeps.forEach(dep => {
                const existing = fetchedDepsMap.get(dep.package.key) || [];
                existing.push(dep);
                fetchedDepsMap.set(dep.package.key, existing);
            });
        }

        // Use existing decorator (this could be enhanced later)
        decorate(editor, fetchedDeps);

        StatusBar.setText("Info", `✅ Processed ${enhancedDependencies.length} dependencies`);

    } catch (e) {
        console.error("Enhanced parsing error:", e);
        StatusBar.setText("Error", `❌ Error parsing ${fileName}`);
        if (decorationHandle) {
            decorationHandle.dispose();
        }
    }
}

export default async function listener(editor: TextEditor | undefined): Promise<void> {
    if (editor) {
        const { fileName } = editor.document;
        if (fileName.toLocaleLowerCase().endsWith("pyproject.toml") ||
            (fileName.toLocaleLowerCase().includes("requirements") && fileName.toLocaleLowerCase().endsWith(".txt"))) {
            status.inProgress = true;
            status.replaceItems = [];
            StatusBar.show();

            // Use enhanced parsing by default, fall back to legacy if needed
            try {
                await parseAndDecorateEnhanced(editor);
            } catch (error) {
                console.warn("Enhanced parsing failed, falling back to legacy:", error);
                await parseAndDecorate(editor);
            }
        } else {
            StatusBar.hide();
        }
        status.inProgress = false;
    } else {
        console.log("No active editor found.");
    }
    return Promise.resolve();
}
