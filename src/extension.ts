'use strict';

import * as vscode from 'vscode';
import { I18nHoverProvider } from './i18nHoverProvider';
import { I18nResolver } from './i18nResolver';
import { I18nCompletionProvider } from './i18nCompletionProvider';

export let i18nResolver = new I18nResolver();

export function activate(context: vscode.ExtensionContext) {

    i18nResolver.load();

    const HAML = { language: 'haml', scheme: 'file' };
    const ERB = { language: 'erb', scheme: 'file' };
    const SLIM = { language: 'slim', scheme: 'file' };

    context.subscriptions.push(vscode.languages.registerHoverProvider(HAML, new I18nHoverProvider()));
    context.subscriptions.push(vscode.languages.registerHoverProvider(ERB, new I18nHoverProvider()));
    context.subscriptions.push(vscode.languages.registerHoverProvider(SLIM, new I18nHoverProvider()));

    const triggerCharacters = ".abcdefghijklmnopqrstuvwxyz".split("");
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(HAML, new I18nCompletionProvider(), ...triggerCharacters));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(ERB, new I18nCompletionProvider(), ...triggerCharacters));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(SLIM, new I18nCompletionProvider(), ...triggerCharacters));
}

export function deactivate() {
    i18nResolver.dispose();
}
