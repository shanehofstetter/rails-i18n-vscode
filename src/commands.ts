import { window, workspace, env } from 'vscode';
import { i18nTree } from './i18nTree';

export function copyYamlKey() {
    const editor = window.activeTextEditor;
    const startOffset = editor.document.offsetAt(editor.selection.start);
    const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);
    const key = i18nTree.getFullKeyFromOffset(startOffset, editor.document.uri, workspaceFolder);
    if (key) {
        env.clipboard.writeText(key);
    }
};
