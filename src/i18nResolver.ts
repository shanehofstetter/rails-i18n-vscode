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
     * load yaml locale files and generate single map out of them
     * register file watcher and reload changed files into map
     */
    public loadYamlFiles(): void {
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

        this.fileSystemWatcher = workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace.rootPath, this.yamlPattern));
        this.fileSystemWatcher.onDidChange((e: vscode.Uri) => {
            workspace.openTextDocument(e.fsPath).then((document: vscode.TextDocument) => {
                this.locales = merge.recursive(false, this.locales, safeLoad(document.getText()));
            });
        });
    }

    /**
     * load the default locale
     */
    public loadDefaultLocale(): void {
        this.getDefaultLocale().then(locale => { this.defaultLocale = locale; });
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
            // convert object into text, each line consists of "key: value"
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

    /**
     * make absolute i18n key based on relative key, depending on current file location
     * @param key key to make absolute (a relative key begins with a period)
     * @param currentFilename current file name / path
     */
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

    /**
     * check if i18n key is valid
     * valid keys must include at least one period
     * @param key i18n to validate
     */
    public isValidI18nKey(key: string): boolean {
        return key.indexOf(".") >= 0;
    }

    /**
     * find a i18n.translation call at position and return its range
     * @param position position to look for the i18n call
     * @param document current document
     */
    public getRangeOfI18nKeyAtPosition(position: Position, document: TextDocument): Range {
        let i18nCallRegex = /(I18n\.)?t(ranslate)?[\(\s]+[\"\']{1}[\w+\.\/]+[\"\'\.]{1}\)?/g;
        return document.getWordRangeAtPosition(position, i18nCallRegex);
    }

    /**
     * get the i18n key as text from i18n call range 
     * @param range range where i18n call occurs
     * @param document current document
     */
    public getI18nKeyAtRangeFromDocument(range: Range, document: TextDocument): string {
        return document.getText(range).replace(/\"|\'|(I18n\.)?t(ranslate)?[\(\s]+|\)/g, "");
    }
}