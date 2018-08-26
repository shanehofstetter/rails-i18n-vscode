import { workspace, Uri, WorkspaceFolder } from "vscode";
import { logger } from "./logger";
import { RailsCommands } from "./railsCommands";

type WorkspaceFolderConfig = { workspaceFolderName: string; locale: string; };
export type LocaleDefaults = { [workspaceFolderName: string]: string };

export class I18nDefaultLocaleDetector {

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
                logger.warn(`no translations found for default locale '${locale}', using '${newDefault}' instead.`, 'workspace dir:', workspaceFolderConfig.workspaceFolderName);
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
        return RailsCommands.getDefaultLocale(workspaceFolder);
    }

    private detectDefaultLocales(): Thenable<WorkspaceFolderConfig[]> {
        return Promise.all(workspace.workspaceFolders.map(workspaceFolder => {
            return this.detectDefaultLocale(workspaceFolder).then(locale => {
                return Promise.resolve({
                    workspaceFolderName: workspaceFolder.name,
                    locale: locale
                });
            }, _ => {
                logger.warn('could not get default locale for workspace dir:', workspaceFolder.name)
                return Promise.resolve({
                    workspaceFolderName: workspaceFolder.name,
                    locale: null
                });
            })
        }))
    }

    private translationsForLocaleExistInTree(locale: string, tree: object, workspaceFolderName: string): boolean {
        return !!Object.keys(tree[workspaceFolderName]).find(key => key === locale);
    }

    private getFallbackLocaleFromTree(tree: object, workspaceFolderName: string): string {
        return Object.keys(tree[workspaceFolderName])[0];
    }
}
