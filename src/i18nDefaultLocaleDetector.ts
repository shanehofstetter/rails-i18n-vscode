import { TextDocument, workspace } from "vscode";
import { logger } from "./logger";
import { raceSuccess } from "./promiseExtras";

export class I18nDefaultLocaleDetector {

    private readonly rbPattern = 'config/**/*.rb';

    /**
     * detect configured i18n default locale
     * @returns default locale key or null if not found
     */
    public detectDefaultLocale(): Thenable<string | null> {
        return workspace.findFiles(this.rbPattern).then(files => {
            return raceSuccess(files.map(file => {
                return this.detectConfigurationInFile(file.path);
            }), () => Promise.resolve());
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
                    logger.warn(`no translations found for default locale '${locale}', using '${newDefault}' instead`);
                    locale = newDefault;
                }
                if (!locale) {
                    locale = this.getFallbackLocaleFromTree(i18nTree);
                    logger.info('using fallback locale:', locale)
                }
            }
            return locale;
        })
    }

    private detectConfigurationInFile(filePath: string): Thenable<string | null> {
        logger.debug('detectConfigurationInFile', filePath);
        return workspace.openTextDocument(filePath).then((document: TextDocument) => {
            const detectedLocale = this.detectConfigurationInDocument(document);
            if (detectedLocale) {
                return Promise.resolve(detectedLocale);
            }
            return Promise.reject();
        });
    }

    private detectConfigurationInDocument(document: TextDocument): string | null {
        let searchResult = document.getText().search(/^[\t ]*[^\#\r\n]?[\t ]*[\S\.]*i18n\.default_locale[\s]*=[\s]*[:]?[\S]{2,}/gmi);
        if (searchResult === -1) {
            return null;
        }
        let position = document.positionAt(searchResult);
        let lineText = document.lineAt(position.line).text.trim();
        logger.debug('position', position, 'searchResult', searchResult, 'lineText', lineText);
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
