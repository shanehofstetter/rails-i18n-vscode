import { safeLoad } from "js-yaml";
import * as merge from "merge";
import * as vscode from 'vscode';
import { Position, Range, TextDocument, workspace } from 'vscode';

export class I18nResolver {

    private locales;
    private defaultLocale = "en";
    private fileSystemWatcher;
    private readonly yamlPattern = 'config/locales/**/*.yml';

    /**
     * generates map of locales
     */
    public loadYamlFiles() {
        if (this.locales) {
            return;
        }
        this.locales = {};
        workspace.findFiles(this.yamlPattern).then(files => {
            files.forEach(file => {
                workspace.openTextDocument(file.path).then((document: vscode.TextDocument) => {
                    this.locales = merge.recursive(false, this.locales, safeLoad(document.getText()));
                });
            });
        });

        this.getDefaultLocale().then(locale => { this.defaultLocale = locale; });

        this.fileSystemWatcher = workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace.rootPath, this.yamlPattern));
        this.fileSystemWatcher.onDidChange((e: vscode.Uri) => {
            workspace.openTextDocument(e.fsPath).then((document: vscode.TextDocument) => {
                this.locales = merge.recursive(false, this.locales, safeLoad(document.getText()));
            });
        });
    }

    /**
     * get the default locale configured in application.rb
     * @returns default locale key or 'en' as fallback if default cant be found
     */
    private getDefaultLocale(): Thenable<string> {
        return workspace.openTextDocument(`${workspace.rootPath}/config/application.rb`).then((document: vscode.TextDocument) => {
            let searchResult = document.getText().search(/i18n\.default_locale/g);
            if (!searchResult) {
                return "en";
            }
            let position = document.positionAt(searchResult);
            let lineText = document.lineAt(position.line).text;
            let locale = lineText.split("=")[1].replace(/\:|\ |\'|\"/g, "").trim();
            return locale;
        });
    }

    /**
     * resolve text value for i18n key in default locale
     * @param key i18n key (e.g. "hello.world")
     */
    public getLocaleForKey(key: string): string | null | undefined {
        if (!key) {
            return null;
        }

        let currentLocaleMap = this.locales;
        let keys = key.split(".");
        keys.unshift(this.defaultLocale);
        keys = keys.filter(key => key.length > 0);
        keys.forEach(keyPart => {
            if (currentLocaleMap !== undefined) {
                currentLocaleMap = currentLocaleMap[keyPart];
            }
        });

        if (currentLocaleMap !== null && typeof currentLocaleMap === "object") {
            let resultLines = [];
            Object.keys(currentLocaleMap).forEach(key => {
                let text = currentLocaleMap[key];
                if (typeof text === 'object') {
                    return null;
                }
                resultLines.push(`${key}: ${text}`);
            });
            return resultLines.join("\n");
        }

        return currentLocaleMap;
    }

    public makeAbsoluteKey(key: string, currentFilename: string): string {
        if (!key.startsWith(".")) {
            return key;
        }
        try {
            // get the relative key from current file path, starting at directory "views"
            let relativeKey = currentFilename.split("views")[1].split(".")[0].replace(/\\|\//g, ".");
            if (relativeKey.startsWith(".")) {
                relativeKey = relativeKey.substring(1);
            }

            // remove all underlines at beginning of key parts
            let relativeKeyParts = relativeKey.split(".");
            relativeKeyParts = relativeKeyParts.map(keyPart => {
                if (keyPart.startsWith("_")) {
                    return keyPart.substring(1);
                }
                return keyPart;
            });
            return relativeKeyParts.join(".") + key;
        } catch (Error) {
            return key;
        }
    }

    public isValidI18nKey(key: string) {
        return key.indexOf(".") >= 0;
    }

    public getRangeOfI18nKeyAtPosition(position: Position, document: TextDocument): Range {
        let i18nCallRegex = /(I18n\.)?t[\(\s]+[\"\']{1}[\w+\.\/]+[\"\'\.]{1}\)?/g;
        return document.getWordRangeAtPosition(position, i18nCallRegex);
    }

    public getI18nKeyAtRangeFromDocument(range: Range, document: TextDocument): string {
        return document.getText(range).replace(/\"|\'|(I18n\.)?t[\(\s]+|\)/g, "");
    }
}