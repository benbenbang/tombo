import { TextEditor, TextEditorDecorationType, workspace, DecorationOptions, DecorationInstanceRenderOptions } from "vscode";
import { StatusBar } from "./status-bar";
import Dependency from "../core/Dependency";
import decoration, { latestVersion } from "./decoration";

export let decorationHandle: TextEditorDecorationType;

/**
 *
 * @param editor Takes package info and editor. Decorates the editor.
 * @param dependencies
 */
export default function decorate(editor: TextEditor, dependencies: Array<Dependency>) {
    const pref = loadPref();

    const errors: Array<string> = [];
    const filtered = dependencies.filter((dep: Dependency) => {
        if (dep && !dep.error && (dep.versions && dep.versions.length)) {
            return dep;
        } else if (!dep.error) {
            dep.error = dep.package.key + ": " + "No versions found";
        }
        errors.push(`${dep.error}`);
        return dep;
    });
    const options: DecorationOptions[] = [];

    for (let i = filtered.length - 1; i > -1; i--) {
        const dependency: Dependency = filtered[i];
        try {
            let decor = decoration(
                editor,
                dependency.package,
                dependency.versions || [],
                JSON.parse(JSON.stringify(pref)),
                dependency.error,
            );
            if (decor) {
                options.push(decor);
            }
        } catch (e) {
            console.error(e);
            errors.push(`Failed to build build decorator (${dependency.package.value})`);
        }
    }
    if (decorationHandle) {
        decorationHandle.dispose();
    }
    decorationHandle = latestVersion();
    editor.setDecorations(decorationHandle, options);

    if (errors.length) {
        StatusBar.setText("Error", `Completed with errors
${errors.join('\n')}`);
    } else {
        StatusBar.setText("Info");
    }
}

import { TomboSettings } from "../core/settings";

function loadPref() {
    const settings = new TomboSettings();

    const compatibleDecoratorText = settings.compatibleDecorator;
    let compatibleDecoratorCss = settings.compatibleDecoratorCss;

    const errorDecoratorText = settings.errorDecorator;
    let errorDecoratorCss = settings.errorDecoratorCss;

    const incompatibleDecoratorText = settings.incompatibleDecorator;
    let incompatibleDecoratorCss = settings.incompatibleDecoratorCss;

    if (compatibleDecoratorCss.after == undefined) {
        compatibleDecoratorCss.after = {}
    }
    if (incompatibleDecoratorCss.after == undefined) {
        incompatibleDecoratorCss.after = {}
    }
    if (errorDecoratorCss.after == undefined) {
        errorDecoratorCss.after = {}
    }

    compatibleDecoratorCss.after.contentText = compatibleDecoratorText;
    incompatibleDecoratorCss.after.contentText = incompatibleDecoratorText;
    errorDecoratorCss.after.contentText = errorDecoratorText;

    return {
        compatibleDecoratorCss: compatibleDecoratorCss,
        incompatibleDecoratorCss: incompatibleDecoratorCss,
        errorDecoratorCss: errorDecoratorCss
    };
}
