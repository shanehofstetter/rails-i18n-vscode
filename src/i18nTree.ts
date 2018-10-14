import { logger } from "./logger";
import { Uri, WorkspaceFolder } from "vscode";
import { WorkspaceFolderTranslation, TranslationPart } from "./workspaceFolderTranslation";

export type Translation = { [key: string]: string | Translation }
export type LookupMap = { [key: string]: string }

export class I18nTree {
    private workspaceFolderTranslations: WorkspaceFolderTranslation[] = [];

    public init() {
        this.workspaceFolderTranslations = [];
    }

    public mergeIntoI18nTree(i18nTreePart: Translation, workspaceFolder: WorkspaceFolder, sourceFile?: Uri) {
        this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).mergeIntoI18nTree(i18nTreePart, sourceFile);
    }

    public getKeysStartingWith(keyPart: string, workspaceFolder: WorkspaceFolder): string[] {
        return this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).getKeysStartingWith(keyPart);
    }

    public translationsForLocaleExist(locale: string, workspaceFolder: WorkspaceFolder): boolean {
        return this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).translationsForLocaleExist(locale);
    }

    public getFallbackLocale(workspaceFolder: WorkspaceFolder): string {
        return this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).getFallbackLocale();
    }

    /**
     * resolve text value for i18n key in default locale
     * @param key i18n key (e.g. "hello.world")
     */
    public getTranslation(key: string, locale: string, workspaceFolder: WorkspaceFolder): any {
        logger.debug('getTranslation', 'key', key, 'locale', locale, 'workspaceFolder', workspaceFolder);
        return this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).getTranslation(key, locale);
    }

    public getTranslationPart(key: string, locale: string, workspaceFolder: WorkspaceFolder): TranslationPart {
        logger.debug('getTranslationPart', 'key', key, 'locale', locale, 'workspaceFolder', workspaceFolder);
        return this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).getTranslationPart(key, locale);
    }

    public getWorkspaceFolders(): WorkspaceFolder[] {
        return this.workspaceFolderTranslations.map((workspaceFolderTranslation) => workspaceFolderTranslation.workspaceFolder);
    }

    public lookupKey(key: string, workspaceFolder: WorkspaceFolder): any {
        return this.getOrCreateWorkspaceFolderTranslation(workspaceFolder).lookupKey(key)
    }

    private getWorkspaceFolderTranslation(workspaceFolder: WorkspaceFolder): WorkspaceFolderTranslation {
        if (!workspaceFolder || this.workspaceFolderTranslations.length === 0) {
            return null;
        }
        return this.workspaceFolderTranslations.find((workspaceFolderTranslation) => workspaceFolderTranslation.workspaceFolder.name === workspaceFolder.name);
    }

    private getOrCreateWorkspaceFolderTranslation(workspaceFolder: WorkspaceFolder): WorkspaceFolderTranslation {
        if (!workspaceFolder) {
            return null;
        }
        let workspaceFolderTranslation = this.getWorkspaceFolderTranslation(workspaceFolder);
        if (!workspaceFolderTranslation) {
            workspaceFolderTranslation = new WorkspaceFolderTranslation(workspaceFolder)
            this.workspaceFolderTranslations.push(workspaceFolderTranslation);
        }
        return workspaceFolderTranslation;
    }
}

export const i18nTree = new I18nTree();
