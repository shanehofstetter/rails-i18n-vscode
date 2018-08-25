import { TextDocument, workspace, Uri, WorkspaceFolder, RelativePattern } from "vscode";
import { logger } from "./logger";
import { raceSuccess } from "./promiseExtras";

type WorkspaceFolderConfig = { workspaceFolderName: string; locale: string; };
export type LocaleDefaults = { [workspaceFolderName: string]: string };

export class I18nDefaultLocaleDetector {

    private readonly rbPattern = 'config/**/*.rb';
    private workspaceFolderDefaults: LocaleDefaults = {};

    /**
     * detect configured i18n default locale with fallback to one of the available locales
     * @param i18nTree translations tree to get the fallback from
     */
    public detectDefaultLocaleWithFallback(i18nTree: object): Thenable<LocaleDefaults> {
        return this.detectDefaultLocales().then(locales => {
            locales.forEach(workspaceFolderConfig => {
                let locale = workspaceFolderConfig.locale;

                locale = this.getFallbackLocaleIfNotAvailable(i18nTree, locale, workspaceFolderConfig);

                this.workspaceFolderDefaults[workspaceFolderConfig.workspaceFolderName] = locale;
            })
            return Promise.resolve(this.workspaceFolderDefaults);
        })
    }

    /**
     * get the default locale for an uri
     * @param uri file uri
     */
    public getDefaultLocaleForUri(uri: Uri): string {
        return this.workspaceFolderDefaults[workspace.getWorkspaceFolder(uri).name];
    }

    private getFallbackLocaleIfNotAvailable(i18nTree: object, locale: string, workspaceFolderConfig: WorkspaceFolderConfig): string {
        if (i18nTree) {
            if (locale && !this.translationsForLocaleExistInTree(locale, i18nTree, workspaceFolderConfig.workspaceFolderName)) {
                let newDefault = this.getFallbackLocaleFromTree(i18nTree, workspaceFolderConfig.workspaceFolderName);
                logger.warn(`no translations found for default locale '${locale}', using '${newDefault}' instead`);
                locale = newDefault;
            }
            if (!locale) {
                locale = this.getFallbackLocaleFromTree(i18nTree, workspaceFolderConfig.workspaceFolderName);
                logger.info('using fallback locale:', locale);
            }
        }
        return locale;
    }

    /**
    * detect configured i18n default locale
    * @returns default locale key or null if not found
    */
    private detectDefaultLocale(workspaceFolder: WorkspaceFolder): Thenable<string | null> {
        return workspace.findFiles(new RelativePattern(workspaceFolder, this.rbPattern)).then(uris => {
            return raceSuccess(uris.map(uri => {
                return this.detectConfigurationInUri(uri);
            }), () => Promise.resolve());
        });
    }

    private detectDefaultLocales(): Thenable<WorkspaceFolderConfig[]> {
        return Promise.all(workspace.workspaceFolders.map(workspaceFolder => {
            return this.detectDefaultLocale(workspaceFolder).then(locale => {
                return Promise.resolve({
                    workspaceFolderName: workspaceFolder.name,
                    locale: locale
                });
            })
        }))
    }

    private detectConfigurationInUri(uri: Uri): Thenable<string | null> {
        return workspace.openTextDocument(uri).then((document: TextDocument) => {
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
        logger.debug('detectConfigurationInDocument', 'position', position, 'searchResult', searchResult, 'lineText', lineText);
        let locale = lineText.split("=")[1].replace(/\:|\ |\'|\"/g, "").trim();
        return locale;
    }

    private translationsForLocaleExistInTree(locale: string, tree: object, workspaceFolderName: string): boolean {
        logger.debug('translationsForLocaleExistInTree', locale, tree, workspaceFolderName);
        return !!Object.keys(tree[workspaceFolderName]).find(key => key === locale);
    }

    private getFallbackLocaleFromTree(tree: object, workspaceFolderName: string): string {
        return Object.keys(tree[workspaceFolderName])[0];
    }
}
