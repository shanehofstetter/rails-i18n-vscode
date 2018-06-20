import { TextDocument, workspace } from "vscode";

export class I18nDefaultLocaleDetector {

    private readonly rbPattern = 'config/**/*.rb';

    /**
     * detect configured i18n default locale
     * @returns default locale key or null if not found
     */
    public detectDefaultLocale(): Thenable<string | null> {
        return workspace.findFiles(this.rbPattern).then(files => {
            return Promise.all<string>(files.map(file => {
                return this.detectConfigurationInFile(file.path);
            })).then(values => {
                return values.find(value => value != null);
            })
        });
    }

    /**
     * detect configured i18n default locale with fallback to one of the available locales
     * @param i18nTree translations tree to get the fallback from
     */
    public detectDefaultLocaleWithFallback(i18nTree: object): Thenable<string> {
        return this.detectDefaultLocale().then(locale => {
            if (i18nTree) {
                if (locale && !this.translationsForLocaleExistInTree(locale, i18nTree)) {
                    let newDefault = this.getFallbackLocaleFromTree(i18nTree);
                    console.warn(`no translations found for default locale '${locale}', using '${newDefault}' instead`);
                    locale = newDefault;
                }
                if (!locale) {
                    locale = this.getFallbackLocaleFromTree(i18nTree);
                }
            }
            return locale;
        })
    }

    private detectConfigurationInFile(filePath: string): Thenable<string | null> {
        return workspace.openTextDocument(filePath).then((document: TextDocument) => {
            return this.detectConfigurationInDocument(document);
        });
    }

    private detectConfigurationInDocument(document: TextDocument): string | null {
        let searchResult = document.getText().search(/^[\s]*[^\#]?[\s]*[\S\.]*i18n\.default_locale[\s]*=[\s]*[:]?[\S]{2,}/gmi);
        if (searchResult === -1) {
            return null;
        }
        let position = document.positionAt(searchResult);
        let lineText = document.lineAt(position.line).text.trim();
        let locale = lineText.split("=")[1].replace(/\:|\ |\'|\"/g, "").trim();
        return locale;
    }

    private translationsForLocaleExistInTree(locale: string, tree: object): boolean {
        return !!Object.keys(tree).find(key => key === locale);
    }

    private getFallbackLocaleFromTree(tree: object): string {
        return Object.keys(tree)[0];
    }
}
