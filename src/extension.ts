'use strict';

import * as vscode from 'vscode';
import { I18nHoverProvider } from './i18nHoverProvider';
import { I18nResolver } from './i18nResolver';
import { I18nCompletionProvider } from './i18nCompletionProvider';
import { workspace } from 'vscode';
import { I18nDefinitionProvider } from './i18nDefinitionProvider';

export let i18nResolver = new I18nResolver();

function loadWithProgress(): void{
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: "Loading translations.."
    }, () => i18nResolver.load());
}

export function activate(context: vscode.ExtensionContext) {
    loadWithProgress();
    context.subscriptions.push(i18nResolver);
    context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(e => loadWithProgress()));

    const documentFilters = [
        { language: 'haml', scheme: 'file' },
        { language: 'erb', scheme: 'file' },
        { language: 'slim', scheme: 'file' },
        { language: 'ruby', scheme: 'file' },
    ];

    context.subscriptions.push(vscode.languages.registerHoverProvider(documentFilters, new I18nHoverProvider()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(documentFilters, new I18nDefinitionProvider()));

    const triggerCharacters = ".abcdefghijklmnopqrstuvwxyz".split("");
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(documentFilters, new I18nCompletionProvider(), ...triggerCharacters));
}
