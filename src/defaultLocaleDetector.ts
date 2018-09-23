import { workspace, Uri, WorkspaceFolder } from "vscode";
import { logger } from "./logger";
import { RailsCommands } from "./railsCommands";
import { RailsConfigFileParser } from "./railsConfigFileParser";
import { I18nTree } from "./i18nTree";

type WorkspaceFolderConfig = { workspaceFolderName: string; locale: string; };
export type LocaleDefaults = { [workspaceFolderName: string]: string };

export class DefaultLocaleDetector {

    private workspaceFolderDefaults: LocaleDefaults = {};

    /**
     * detect configured i18n default locale with fallback to one of the available locales
     * @param i18nTree translations tree to get the fallback from
     */
    public detectDefaultLocaleWithFallback(i18nTree: I18nTree): Thenable<LocaleDefaults> {
        return this.detectDefaultLocales(i18nTree.getWorkspaceFolderNames()).then(locales => {
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

    private getFallbackLocaleIfNotAvailable(i18nTree: I18nTree, locale: string, workspaceFolderConfig: WorkspaceFolderConfig): string {
        if (i18nTree) {
            if (locale && !i18nTree.translationsForLocaleExist(locale, workspaceFolderConfig.workspaceFolderName)) {
                let newDefault = i18nTree.getFallbackLocale(workspaceFolderConfig.workspaceFolderName);
                logger.warn(`no translations found for default locale '${locale}', using '${newDefault}' instead.`, 'workspace dir:', workspaceFolderConfig.workspaceFolderName);
                locale = newDefault;
            }
            if (!locale) {
                locale = i18nTree.getFallbackLocale(workspaceFolderConfig.workspaceFolderName);
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

    private detectDefaultLocales(workspaceFolderNames: string[]): Thenable<WorkspaceFolderConfig[]> {
        // TODO: refactor, parameter should be a list of vscode.WorkspaceFolder objects
        const workspaceFolders = workspace.workspaceFolders.filter(workspaceFolder => workspaceFolderNames.indexOf(workspaceFolder.name) >= 0);
        return Promise.all(workspaceFolders.map(workspaceFolder => {
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
}
