import { Uri, WorkspaceFolder } from "vscode";
import { Translation, LookupMap } from "./i18nTree";
import { LookupMapGenerator } from "./lookupMapGenerator";
import { logger } from "./logger";
import * as merge from "merge";

type TranslationPart = { file: Uri, translations: Translation }

export class WorkspaceFolderTranslation {
    public workspaceFolder: WorkspaceFolder;
    public translation: Translation = {};
    public translationParts: TranslationPart[] = [];
    public lookupMap: LookupMap = {};

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolder = workspaceFolder;
    }

    public mergeIntoI18nTree(i18nTreePart: Translation, sourceFile?: Uri) {
        // TODO: save i18nTreePart as TranslationPart (override if already exists), then merge all parts again
        this.translation = merge.recursive(
            false,
            this.translation,
            i18nTreePart
        );
        this.lookupMap = new LookupMapGenerator(this.translation).generateLookupMap();
    }

    public getKeysStartingWith(keyPart: string): string[] {
        return Object.keys(this.lookupMap).filter(lookupKey => {
            return lookupKey.startsWith(keyPart);
        });
    }

    public translationsForLocaleExist(locale: string): boolean {
        return !!Object.keys(this.translation).find(key => key === locale);
    }

    public getFallbackLocale(): string {
        if (this.translation && Object.keys(this.translation).length > 0) {
            return Object.keys(this.translation)[0];
        }
        return 'en';
    }

    /**
     * resolve text value for i18n key in default locale
     * @param key i18n key (e.g. "hello.world")
     */
    public getTranslation(key: string, locale: string): any {
        if (!key) {
            return null;
        }

        let keyParts = this.makeKeyParts(key, locale);
        let fullKey = keyParts.join(".");

        let simpleLookupResult = this.lookupMap[fullKey];
        if (typeof simpleLookupResult === "string") {
            logger.debug('key:', key, 'fullKey:', fullKey, 'simpleLookupResult:', simpleLookupResult);
            return simpleLookupResult;
        }

        let lookupResult = this.traverseThroughMap(keyParts);
        logger.debug('key:', key, 'fullKey:', fullKey, 'lookupResult:', lookupResult);
        if (lookupResult !== null && typeof lookupResult === "object") {
            return this.transformMultiResultIntoText(lookupResult);
        }

        return lookupResult;
    }

    public lookupKey(key: string): any {
        return this.lookupMap[key];
    }

    private makeKeyParts(key: string, locale: string): string[] {
        let keys = key.split(".");
        keys.unshift(locale);
        keys = keys.filter(key => key.length > 0);
        return keys;
    }

    private traverseThroughMap(keyParts: string[]): string | Translation {
        let result: any = this.translation;
        keyParts.forEach(keyPart => {
            if (result !== undefined) {
                result = result[keyPart];
            }
        });
        return result;
    }

    private transformMultiResultIntoText(result: object): string {
        // if last part of i18n key is missing (e.g. because its interpolated), 
        // we can still show a list of possible translations 
        let resultLines = [];
        Object.keys(result).forEach(key => {
            let text = result[key];
            if (typeof text === 'object') {
                // values are objects, meaning its not only the last part of the key which is missing
                return null;
            }
            resultLines.push(`${key}: ${text}`);
        });
        return resultLines.join("\n");
    }
}