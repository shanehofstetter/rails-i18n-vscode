import { workspace } from "vscode";
import * as vscode from 'vscode';
import { safeLoad } from "js-yaml";
import * as merge from "merge";

export class I18nResolver {

    private locales;
    private defaultLocale = "en";

    /**
     * generates map of locales
     */
    public loadYamlFiles() {
        // TODO populate locales
        console.log(workspace.rootPath);
        this.locales = {};
        workspace.findFiles('config/locales/**/*.yml').then(files => {
            console.log("files", files);
            files.forEach(file => {
                workspace.openTextDocument(file.path).then((document: vscode.TextDocument) => {
                    this.locales = merge.recursive(false, this.locales, safeLoad(document.getText()));
                });
            });
        });
    }

    public getDefaultLocale(): Thenable<string> {
        return workspace.openTextDocument(`${workspace.rootPath}/config/application.rb`).then((document: vscode.TextDocument) => {
            let searchResult = document.getText().search(/i18n\.default_locale/g);
            let position = document.positionAt(searchResult);
            let lineText = document.lineAt(position.line).text;
            let locale = lineText.split("=")[1].replace(/\:|\ |\'|\"/g, "").trim();
            console.log("default locale", locale);
            return locale;
        });
    }

    /**
     * get value for i18n key
     * @param key i18n key (e.g. "hello.world")
     */
    public getLocaleForKey(key: string): string | null {
        // TODO find key in locales and return value
        this.getDefaultLocale().then(locale => { this.defaultLocale = locale; });
        
        return null;
    }
}