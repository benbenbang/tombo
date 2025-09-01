import { CompletionList } from 'vscode';
import Package from './Package';

/**
 * Dependency is a data structure to define parsed package index, versions and error
 */
export default interface Dependency {
    package: Package;
    versions?: Array<string>;
    error?: string;

    versionCompletionItems?: CompletionList;
    featureCompletionItems?: Map<string, CompletionList>;
};
