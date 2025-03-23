/**
 * Listener for Python package dependency files.
 * Filters active editor files according to the extension.
 * Supports both pyproject.toml and requirements.txt files.
 */
import { Position, Range, TextDocument, TextEditor } from "vscode";
import { parse, filterPackages } from "../toml/parser";
import { StatusBar } from "../ui/status-bar";
import { status } from "../toml/commands";
import Package from "./Package";
import decorate, { decorationHandle } from "../ui/decorator";
import { fetchPackageVersions } from "./fetcher";
import Dependency from "./Dependency";
import { parseRequirementsTxt } from "../core/python";

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

var dependencies: Package[];
var fetchedDeps: Dependency[];
var fetchedDepsMap: Map<string, Dependency[]>;
export { dependencies, fetchedDeps, fetchedDepsMap };

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

export default async function listener(editor: TextEditor | undefined): Promise<void> {
    if (editor) {
        const { fileName } = editor.document;
        if (fileName.toLocaleLowerCase().endsWith("pyproject.toml") ||
            (fileName.toLocaleLowerCase().includes("requirements") && fileName.toLocaleLowerCase().endsWith(".txt"))) {
            status.inProgress = true;
            status.replaceItems = [];
            StatusBar.show();
            await parseAndDecorate(editor);
        } else {
            StatusBar.hide();
        }
        status.inProgress = false;
    } else {
        console.log("No active editor found.");
    }
    return Promise.resolve();
}
