import { TextDocument } from 'vscode';
import Item from '../core/Package';
// Removed unused imports: PackageMetadata, VersionInfo
import { PyPIService } from '../api/services/pypi-service';

/**
 * Represents a dependency found in TOML with enhanced metadata
 */
export interface ParsedDependency {
  name: string;
  version?: string;
  startPosition: number;
  endPosition: number;
  source: 'dependencies' | 'dev-dependencies' | 'optional-dependencies';
  extras?: string[];
  isPep621?: boolean; // Indicates if this is from PEP 621 array format
  originalText?: string; // Original dependency string for PEP 621 entries
}

/**
 * Result of parsing dependencies with enhanced metadata integration
 */
export interface DependencyParseResult {
  dependencies: ParsedDependency[];
  errors: string[];
}

// This regex is for complex TOML with nested versions
export const RE_VERSION = /^[ \t]*(?<!#)(\S+?)([ \t]*=[ \t]*)(?:({.*?version[ \t]*=[ \t]*)("|')(.*?)\4|("|')(.*?)\6)/;

// This simpler regex handles the common case of package = "version"
export const RE_SIMPLE_VERSION = /^[ \t]*(?<!#)(\S+?)[ \t]*=[ \t]*("|')(.*?)\2/;
export const RE_FEATURES = /^[ \t]*(?<!#)((?:[\S]+?[ \t]*=[ \t]*.*?{.*?)?features[ \t]*=[ \t]*\[[ \t]*)(.+?)[ \t]*\]/;

const RE_TABLE_HEADER = /^[ \t]*(?!#)[ \t]*\[[ \t]*(.+?)[ \t]*\][ \t]*$/;
const RE_TABLE_HEADER_DEPENDENCY = /^(?:.+?\.)?(?:dev-)?dependencies(?:\.([^.]+?))?$/;
const RE_PROJECT_DEPENDENCIES = /^project$/;
const RE_PROJECT_OPTIONAL_DEPENDENCIES = /^project\.optional-dependencies$/;

// PEP 621 dependency patterns for array format
// Matches: "package>=1.0.0", "package[extra]~=1.0", "package", etc.
const RE_PEP621_DEPENDENCY = /^"?([a-zA-Z0-9_-]+(?:\[[^\]]*\])?)(.*?)"?$/;
const RE_PEP621_VERSION_CONSTRAINT = /([><=!~]+)(.+)/;
const RE_PEP621_EXTRAS = /\[([^\]]+)\]/;
export function findPackage(document: TextDocument, line: number): string | undefined {
    while (--line >= 0) {
        const match = document.lineAt(line).text.match(RE_TABLE_HEADER);
        if (!match) continue;
        return match[1].match(RE_TABLE_HEADER_DEPENDENCY)?.[1];
    }
    return undefined;
}

export function findPackageAndVersion(
    document: TextDocument,
    line: number
): [string, string] | undefined {
    let item;
    let version;

    let i = line;
    while (!item && --i >= 0) {
        const lineText = document.lineAt(i).text;
        const match = lineText.match(RE_TABLE_HEADER);
        if (!match) {
            if (!version) {
                const versionMatch = lineText.match(RE_VERSION);
                if (versionMatch && versionMatch[1] === 'version') {
                    version = versionMatch[7];
                }
            }
        } else {
            item = match[1].match(RE_TABLE_HEADER_DEPENDENCY)?.[1];
        }
    }

    i = line;
    while (!version && ++i < document.lineCount) {
        const lineText = document.lineAt(i).text;
        const match = lineText.match(RE_TABLE_HEADER);
        if (!match) {
            if (!version) {
                const versionMatch = lineText.match(RE_VERSION);
                if (versionMatch && versionMatch[1] === 'version') {
                    version = versionMatch[7];
                }
            }
        } else {
            return undefined;
        }
    }

    if (item && version) {
        return [item, version];
    }
    return undefined;
}

/**
 * Finds all version items with a flat package=version pair.
 * @param item - Item to search in
 * @returns Array of dependency items
 */
function findVersion(item: Item): Item[] {
    const dependencies: Item[] = [];
    for (const field of item.values) {
        if (field.key.endsWith('.workspace')) continue;
        if (field.values.length > 0) {
            const dependency = findVersionTable(field);
            if (dependency) dependencies.push(dependency);
        } else if (field.value != null) {
            dependencies.push(field);
        }
    }
    return dependencies;
}

function findVersionTable(table: Item): Item | null {
    let item = null;
    let itemName = null;
    for (const field of table.values) {
        if (field.key === 'workspace') return null;
        if (field.key === 'version') {
            item = new Item(field);
            item.key = table.key;
        }
        if (field.key === 'package') itemName = field.value;
    }
    if (item && itemName) item.key = itemName;
    return item;
}

/**
 * Filters all dependency related items with a flat package=version match.
 * @param items - Parsed TOML items
 * @returns Filtered dependency items
 */
export function filterPackages(items: Item[]): Item[] {
    let dependencies: Item[] = [];
    for (let i = 0; i < items.length; i++) {
        const value = items[i];

        // Handle Poetry 1.x format
        if (!value.key.startsWith('package.metadata') && value.key.endsWith('dependencies')) {
            dependencies = dependencies.concat(findVersion(value));
        }
        // Handle PEP 621 [project] format
        else if (value.key.match(RE_PROJECT_DEPENDENCIES)) {
            for (const field of value.values) {
                if (field.key === 'dependencies' && field.values.length > 0) {
                    // PEP 621 project.dependencies is an array of strings like "requests>=2.28.0"
                    const projectDeps = parsePep621Dependencies(field.values, 'dependencies');
                    dependencies = dependencies.concat(projectDeps);
                }
            }
        }
        // Handle PEP 621 [project.optional-dependencies] format
        else if (value.key.match(RE_PROJECT_OPTIONAL_DEPENDENCIES)) {
            for (const field of value.values) {
                if (field.values.length > 0) {
                    // Each field represents a dependency group (e.g., dev, test, docs)
                    const optionalDeps = parsePep621Dependencies(field.values, 'optional-dependencies');
                    dependencies = dependencies.concat(optionalDeps);
                }
            }
        }
        // Handle other formats
        else {
            const dotIndex = value.key.lastIndexOf('.');
            const wordIndex = dotIndex - 12;
            if (value.key.indexOf('dependencies') === wordIndex) {
                const mock = new Item(value);
                mock.key = value.key.substring(dotIndex + 1);
                const dependency = findVersionTable(mock);
                if (dependency) dependencies.push(dependency);
            }
        }
    }
    return dependencies;
}

/**
 * Parse the given document and index all items.
 * @param data - TOML document content
 * @returns Parsed root item containing all TOML data
 */
export function parse(data: string): Item {
    const item: Item = new Item();
    item.start = 0;
    item.end = data.length;
    parseTables(data, item);
    return item;
}


/**
 * Parse table level items.
 * @param data - TOML content
 * @param parent - Parent item to populate
 * @returns Updated parent item
 */
function parseTables(data: string, parent: Item): Item {
    let item: Item = new Item();
    let i = -1;
    let buff = [];

    while (i++ < data.length) {
        const ch = data.charAt(i);
        if (isWhiteSpace(ch) || isNewLine(ch)) {
            continue;
        } else if (isComment(ch)) {
            i = skipLineData(data, i);
        } else if (ch === '[') {
            item = new Item();
            item.start = i;
            buff = [];
        } else if (ch === ']') {
            item.key = buff.join('');
            i = parseValues(data, item, i);
            item = initNewItem(item, parent, i);
        } else {
            buff.push(ch);
        }
    }

    return parent;
}

/**
 * Parse key=value pairs.
 * @param data - TOML content
 * @param parent - Parent item to populate
 * @param index - Current parsing position
 * @returns Updated parsing position
 */
function parseValues(data: string, parent: Item, index: number): number {
    let i = index;
    let item = new Item();
    let last_ch = '';

    let isParsingKey = true;
    while (i++ < data.length) {
        const ch = data.charAt(i);
        let current_line = '';
        if (isNewLine(last_ch)) {
            current_line = getLine(data, i);
        }
        last_ch = ch;

        if (isWhiteSpace(ch) || isNewLine(ch) || isComma(ch)) {
            continue;
        } else if (isComment(ch) || isGitConflictLine(current_line) || isDisabledLine(current_line)) {
            i = skipLineData(data, i);
        } else if (isParsingKey) {
            if (ch === '[') {
                return --i;
            } else if (ch === '}') {
                return i;
            }
            i = parseKey(data, item, i);
            isParsingKey = false;
        } else if (ch === '"' || ch === "'") {
            i = parseString(data, item, i, ch);
            item = initNewItem(item, parent, i);
            isParsingKey = true;
        } else if (ch === '[') {
            i = parseArray(data, item, i);
            item = initNewItem(item, parent, i);
            isParsingKey = true;
        } else if (ch === '{') {
            i = parseValues(data, item, i);
            if (!isCratesDep(item)) {
                item.start = -1;
            }
            item = initNewItem(item, parent, i);
            isParsingKey = true;
        } else if (isBoolean(data, i)) {
            i = parseBoolean(data, item, i);
            item = initNewItem(item, parent, i);
            isParsingKey = true;
        } else if (isNumber(data, i)) {
            i = parseNumber(data, item, i);
            item = initNewItem(item, parent, i);
            isParsingKey = true;
        }
    }

    return i;
}

function isCratesDep(i: Item): boolean {
    if (i.values && i.values.length) {
        for (const value of i.values) {
            if (value.key === 'git' || value.key === 'path') {
                return false;
            } else if (value.key === 'package') {
                i.key = value.value;
            }
        }
    }
    return true;
}

/**
 * Parse array elements.
 * @param data - TOML content
 * @param parent - Parent item to populate
 * @param index - Current parsing position
 * @returns Updated parsing position
 */
function parseArray(data: string, parent: Item, index: number): number {
    let i = index;
    let item = new Item();
    while (i++ < data.length) {
        const ch = data.charAt(i);
        if (isWhiteSpace(ch) || isNewLine(ch) || isComma(ch)) {
            continue;
        } else if (isComment(ch)) {
            i = skipLineData(data, i);
        } else if (ch === '"' || ch === "'") {
            i = parseString(data, item, i, ch);
            item = initNewItem(item, parent, i);
        } else if (ch === ']') {
            return i;
        }
    }

    return i;
}

/**
 * Parse string
 * @param data - TOML content
 * @param item - Item to populate
 * @param index - Current parsing position
 * @param opener - Quote character
 * @returns Updated parsing position
 */
function parseString(data: string, item: Item, index: number, opener: string): number {
    let i = index;
    item.start = index;
    const buff: string[] = [];
    const multiline = data.substring(i, i + 3) === opener.repeat(3);
    if (multiline) {
        i += 2;
    }
    while (i++ < data.length) {
        const ch = data.charAt(i);
        switch (ch) {
            case '"':
            case "'":
                if (ch === opener && (!multiline || data.substring(i, i + 3) === opener.repeat(3))) {
                    if (multiline) {
                        i += 2;
                    }
                    item.value = buff.join('');
                    item.end = i;
                    return i;
                }
                buff.push(ch);
                break;
            default:
                buff.push(ch);
        }
    }
    return i;
}

/**
 * Skip data until '\n'
 * @param data - TOML content
 * @param index - Current parsing position
 * @returns Updated parsing position
 */
function skipLineData(data: string, index: number): number {
    let i = index;
    while (i++ < data.length) {
        const ch = data.charAt(i);
        if (isNewLine(ch)) {
            return i;
        }
    }
    return i;
}

/**
 * Get current line data
 * @param data - TOML content
 * @param index - Current parsing position
 * @returns Current line content
 */
function getLine(data: string, index: number): string {
    let i = index;
    let line = '';
    while (i < data.length) {
        const ch = data.charAt(i);
        if (isNewLine(ch)) {
            return line;
        }
        line += ch;
        i++;
    }
    return line;
}

/**
 * Parse key
 * @param data - TOML content
 * @param item - Item to populate
 * @param index - Current parsing position
 * @returns Updated parsing position
 */
function parseKey(data: string, item: Item, index: number): number {
    let i = index;
    const buff: string[] = [];
    item.start = index;
    while (i < data.length) {
        const ch = data.charAt(i);
        if (ch === '=') {
            item.key = buff.join('');
            return i;
        } else if (!isWhiteSpace(ch)) {
            buff.push(ch);
        }
        i++;
    }
    return i;
}

/**
 * Parse boolean
 * @param data - TOML content
 * @param item - Item to populate
 * @param index - Current parsing position
 * @returns Updated parsing position
 */
function parseBoolean(data: string, item: Item, index: number): number {
    const ch = data.charAt(index);
    switch (ch) {
        case 't':
            item.value = 'true';
            return index + 3;
        case 'f':
            item.value = 'false';
            return index + 4;
        default:
            return index;
    }
}

/**
 * Parse number
 * @param data - TOML content
 * @param item - Item to populate
 * @param index - Current parsing position
 * @returns Updated parsing position
 */
function parseNumber(data: string, item: Item, index: number): number {
    const ch = data.charAt(index);
    if (ch === '+' || ch === '-') {
        index++;
    }
    let i = index;
    item.start = index;
    const buff: string[] = [];
    while (i < data.length) {
        const ch = data.charAt(i);
        switch (ch) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '.':
                buff.push(ch);
                break;
            default:
                if (isNewLine(ch)) {
                    item.value = buff.join('');
                    item.end = i;
                    return i;
                }
        }
        i++;
    }
    return i;
}

/**
 * Reset some values and create new item
 * @param item - Current item to finalize
 * @param parent - Parent item to add to
 * @param i - Current parsing position
 * @returns New empty item
 */
function initNewItem(item: Item, parent: Item, i: number) {
    if (item.start !== -1) {
        item.end = i + 1;
        parent.values.push(item);
    }
    return new Item();
}

function isWhiteSpace(ch: string) {
    return ch === ' ' || ch === '\t';
}
function isNewLine(ch: string) {
    return ch === '\n' || ch === '\r';
}

function isComma(ch: string) {
    return ch === ',';
}

function isComment(ch: string) {
    return ch === '#';
}

function isBoolean(data: string, i: number) {
    return data.substring(i, i + 4) === 'true' || data.substring(i, i + 5) === 'false';
}

function isNumber(data: string, i: number) {
    const ch = data.charAt(i);
    if (ch === '+' || ch === '-') {
        return true;
    }
    return parseInt(data.charAt(i), 10);
}

function isGitConflictLine(line: string) {
    return line.startsWith('<<<<<<<') || line.startsWith('>>>>>>>') || line.startsWith('=======');
}

function isDisabledLine(line: string) {
    return line.replace(/\s/g, '').endsWith('#crates:disable-check');
}

/**
 * Enhanced dependency parser that integrates with PyPIService
 * Converts legacy Item parsing to modern ParsedDependency format
 */
export async function parseDependenciesWithMetadata(
    document: TextDocument,
    pypiService?: PyPIService
): Promise<DependencyParseResult> {
    const tomlContent = document.getText();
    const rootItem = parse(tomlContent);
    const legacyItems = filterPackages([rootItem]);

    const dependencies: ParsedDependency[] = [];
    const errors: string[] = [];

    for (const item of legacyItems) {
        try {
            const dependency = convertItemToParsedDependency(item);
            if (dependency) {
                dependencies.push(dependency);

                // Optionally validate with PyPI if service is provided
                if (pypiService && dependency.name) {
                    try {
                        await pypiService.getPackageMetadata(dependency.name);
                        // Package exists on PyPI
                    } catch (error) {
                        errors.push(`Package '${dependency.name}' not found on PyPI`);
                    }
                }
            }
        } catch (error) {
            errors.push(`Failed to parse dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return { dependencies, errors };
}

/**
 * Convert legacy Item to modern ParsedDependency
 */
export function convertItemToParsedDependency(item: Item): ParsedDependency | null {
    if (!item.key) {
        return null;
    }

    // Check if this is a PEP 621 dependency with additional metadata
    const isPep621 = (item as any).isPep621 || false;
    const originalText = (item as any).originalText || '';
    const itemExtras = (item as any).extras || [];
    const itemSource = (item as any).source;

    // Determine dependency source based on context
    let source: ParsedDependency['source'] = 'dependencies';
    if (itemSource) {
        source = itemSource;
    } else if (item.key.includes('dev')) {
        source = 'dev-dependencies';
    } else if (item.key.includes('optional')) {
        source = 'optional-dependencies';
    }

    return {
        name: item.key.trim(),
        version: item.value?.toString().trim() || undefined,
        startPosition: item.start,
        endPosition: item.end,
        source,
        extras: itemExtras,
        isPep621,
        originalText: isPep621 ? originalText : undefined
    };
}

/**
 * Parse PEP 621 dependency arrays into Item format for compatibility
 * @param depArray - Array of dependency items from TOML parsing
 * @param source - Source type for the dependencies
 * @returns Array of Items representing dependencies
 */
function parsePep621Dependencies(depArray: Item[], source: 'dependencies' | 'optional-dependencies'): Item[] {
    const dependencies: Item[] = [];

    for (const dep of depArray) {
        if (typeof dep.value === 'string') {
            const parsed = parsePep621DependencyString(dep.value, dep.start, dep.end);
            if (parsed) {
                const item = new Item();
                item.key = parsed.name;
                item.value = parsed.version || '';
                item.start = dep.start;
                item.end = dep.end;
                // Store additional PEP 621 metadata
                (item as any).isPep621 = true;
                (item as any).originalText = dep.value;
                (item as any).extras = parsed.extras;
                (item as any).source = source;
                dependencies.push(item);
            }
        }
    }

    return dependencies;
}

/**
 * Parse a single PEP 621 dependency string
 * @param depString - Dependency string like "requests>=2.28.0" or "package[extra]~=1.0"
 * @param start - Start position in document
 * @param end - End position in document
 * @returns Parsed dependency information
 */
function parsePep621DependencyString(
    depString: string,
    _start: number,
    _end: number
): { name: string; version?: string; extras?: string[] } | null {
    // Remove surrounding quotes and whitespace
    const cleanString = depString.replace(/^["']|["']$/g, '').trim();

    // Skip git/url dependencies for now
    if (cleanString.startsWith('git+') || cleanString.startsWith('http')) {
        return null;
    }

    // Extract package name, version constraint, and extras
    const match = cleanString.match(RE_PEP621_DEPENDENCY);
    if (!match) {
        return null;
    }

    const packageWithExtras = match[1];
    const versionPart = match[2]?.trim();

    // Extract extras if present
    const extrasMatch = packageWithExtras.match(RE_PEP621_EXTRAS);
    const extras = extrasMatch ? extrasMatch[1].split(',').map(e => e.trim()) : [];
    const packageName = packageWithExtras.replace(RE_PEP621_EXTRAS, '');

    // Extract version constraint
    let version: string | undefined;
    if (versionPart) {
        const versionMatch = versionPart.match(RE_PEP621_VERSION_CONSTRAINT);
        if (versionMatch) {
            // Include the operator with the version (e.g., ">=2.28.0")
            version = versionMatch[1] + versionMatch[2];
        } else {
            // Handle cases like "package (>=1.0.0,<2.0.0)" - extract everything in parentheses
            const parenMatch = versionPart.match(/\((.+)\)/);
            if (parenMatch) {
                version = parenMatch[1];
            }
        }
    }

    return {
        name: packageName,
        version: version,
        extras: extras.length > 0 ? extras : undefined
    };
}

/**
 * Enhanced package filtering with better type safety and PyPI integration
 * @param items - Parsed TOML items
 * @param includeWorkspaceDeps - Whether to include workspace dependencies
 * @returns Filtered and enhanced dependency items
 */
export function filterPackagesEnhanced(items: Item[], includeWorkspaceDeps = false): ParsedDependency[] {
    const legacyItems = filterPackages(items);
    const dependencies: ParsedDependency[] = [];

    for (const item of legacyItems) {
        // Skip workspace dependencies unless explicitly requested
        if (!includeWorkspaceDeps && item.key.endsWith('.workspace')) {
            continue;
        }

        const dependency = convertItemToParsedDependency(item);
        if (dependency) {
            dependencies.push(dependency);
        }
    }

    return dependencies;
}
