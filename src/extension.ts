'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    console.log('extension "rails-i18n" activated');

    let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        vscode.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}