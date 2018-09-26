import { workspace, Uri, WorkspaceFolder } from "vscode";
import { logger } from "./logger";
import { RailsCommands } from "./railsCommands";
import { RailsConfigFileParser } from "./railsConfigFileParser";
import { I18nTree } from "./i18nTree";

type WorkspaceFolderConfig = { workspaceFolder: WorkspaceFolder; locale: string; };
export type LocaleDefaults = { [workspaceFolderPath: string]: string };

export class DefaultLocaleDetector {

    private workspaceFolderDefaults: LocaleDefaults = {};

    /**
     * detect configured i18n default locale with fallback to one of the available locales
     * @param i18nTree translations tree to get the fallback from
     */
    public detectDefaultLocaleWithFallback(i18nTree: I18nTree): Thenable<LocaleDefaults> {
        return this.detectDefaultLocales(i18nTree.getWorkspaceFolders()).then(locales => {
            locales.forEach(workspaceFolderConfig => {
                let locale = workspaceFolderConfig.locale;

                locale = this.getFallbackLocaleIfNotAvailable(i18nTree, locale, workspaceFolderConfig);

                this.workspaceFolderDefaults[workspaceFolderConfig.workspaceFolder.uri.path] = locale;
            })
            return Promise.resolve(this.workspaceFolderDefaults);
        })
    }

    /**
     * get the default locale for an uri
     * @param uri file uri
     */
    public getDefaultLocaleForUri(uri: Uri): string {
        return this.workspaceFolderDefaults[workspace.getWorkspaceFolder(uri).uri.path];
    }

    private getFallbackLocaleIfNotAvailable(i18nTree: I18nTree, locale: string, workspaceFolderConfig: WorkspaceFolderConfig): string {
        if (i18nTree) {
            if (locale && !i18nTree.translationsForLocaleExist(locale, workspaceFolderConfig.workspaceFolder)) {
                let newDefault = i18nTree.getFallbackLocale(workspaceFolderConfig.workspaceFolder);
                logger.warn(`no translations found for default locale '${locale}', using '${newDefault}' instead.`, 'workspace dir:', workspaceFolderConfig.workspaceFolder);
                locale = newDefault;
            }
            if (!locale) {
                locale = i18nTree.getFallbackLocale(workspaceFolderConfig.workspaceFolder);
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
        return RailsCommands.getDefaultLocale(workspaceFolder).then(locale => Promise.resolve(locale), error => {
            logger.warn('failed to get default locale from rails, parsing config files..');
            return new RailsConfigFileParser().detectDefaultLocaleForWorkspaceFolder(workspaceFolder);
        });
    }

    private detectDefaultLocales(workspaceFolders: WorkspaceFolder[]): Thenable<WorkspaceFolderConfig[]> {
        return Promise.all(workspaceFolders.map(workspaceFolder => {
            return this.detectDefaultLocale(workspaceFolder).then(locale => {
                return Promise.resolve({
                    workspaceFolder: workspaceFolder,
                    locale: locale
                });
            }, _ => {
                logger.warn('could not get default locale for workspace dir:', workspaceFolder.uri.path)
                return Promise.resolve({
                    workspaceFolder: workspaceFolder,
                    locale: null
                });
            })
        }))
    }
}
