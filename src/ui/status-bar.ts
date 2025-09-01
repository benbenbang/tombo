/**
 * A utility to manage Status Bar operations.
 */
import { window, StatusBarAlignment, StatusBarItem } from 'vscode';

type Type = 'Error'
    | 'Warning'
    | 'Info'
    | 'Loading';

/**
 * Extends StatusBarItem in order to add support prefixed text changes.
*/
interface StatusBarItemExt extends StatusBarItem {
    setText: (t: Type, name?: string) => void;
}

export const StatusBar: StatusBarItemExt = window.createStatusBarItem(
    StatusBarAlignment.Right,
    0,
) as StatusBarItemExt;
StatusBar.setText = (t: Type, text?: string) => {
    switch (t) {
        case 'Error':
            StatusBar.color = 'statusBarItem.errorForeground';
            StatusBar.text = '$(error) PYPI Packages';
            StatusBar.tooltip = '';
            window.showErrorMessage(text || 'Error');
            return;
        case 'Warning':
            StatusBar.text = '$(warning) PYPI Packages';
            StatusBar.color = 'statusBarItem.warningForeground';
            break;
        case 'Info':
            StatusBar.color = 'statusBarItem.foreground';
            StatusBar.text = '$(check-all) PYPI Packages';
            break;
        case 'Loading':
            StatusBar.color = 'statusBarItem.activeForeground';
            StatusBar.text = '$(sync~spin) PYPI Packages';

    }
    if (text) {
        window.setStatusBarMessage(`PYPI Packages: ${text}`, 2000);
    }
    StatusBar.tooltip = text;
    StatusBar.command = 'pypi.retry';


};
export default {
    StatusBar,
};
