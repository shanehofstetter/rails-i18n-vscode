import { Uri, WorkspaceFolder } from "vscode";
import { Translation, LookupMap } from "./i18nTree";
import { LookupMapGenerator } from "./lookupMapGenerator";
import { logger } from "./logger";
import * as merge from "merge";
import { YAMLDocument } from "./yamlDocument";
import { start } from "repl";

export type TranslationPart = { file: Uri, translations: Translation, yamlDocument: YAMLDocument }

export class WorkspaceFolderTranslation {
    public workspaceFolder: WorkspaceFolder;
    public translation: Translation = {};
    public translationParts: TranslationPart[] = [];
    public lookupMap: LookupMap = {};

    constructor(workspaceFolder: WorkspaceFolder) {
        this.workspaceFolder = workspaceFolder;
    }

    public mergeIntoI18nTree(i18nTreePart: Translation, yamlDocument: YAMLDocument, sourceFile?: Uri) {
        this.addTranslationPart(i18nTreePart, yamlDocument, sourceFile || null);
        this.translation = {};
        this.translationParts.forEach((translationPart) => {
            this.translation = merge.recursive(
                true,
                this.translation,
                translationPart.translations
            );
        });

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

        const keyParts = this.makeKeyParts(key, locale);
        const fullKey = keyParts.join(".");

        const simpleLookupResult = this.lookupMap[fullKey];
        logger.debug('key:', key, 'fullKey:', fullKey, 'simpleLookupResult:', simpleLookupResult, typeof simpleLookupResult);

        if (['string', 'number', 'boolean'].indexOf(typeof simpleLookupResult) >= 0) return simpleLookupResult.toString();
        if (simpleLookupResult === null) return "null"; // special case when null is defined as translation

        // if simpleLookupResult returned undefined (not found) or some other unknown type,
        // this could mean that only a part of the key is given.
        // try to find the resulting sub-tree and return that instead (converted to text).

        const lookupResult = this.traverseTranslation(keyParts, this.translation);
        logger.debug('key:', key, 'fullKey:', fullKey, 'lookupResult:', lookupResult);
        if (lookupResult !== null && typeof lookupResult === "object") {
            return this.transformMultiResultIntoText(lookupResult);
        }

        return lookupResult;
    }

    /**
     * find the translation part containing given key (first match is returned)
     * @param key i18n key
     * @param locale locale key
     */
    public getTranslationPart(key: string, locale: string): TranslationPart {
        return this.translationParts.find(translationPart => {
            const result = this.traverseTranslation(this.makeKeyParts(key, locale), translationPart.translations);
            return typeof result === "string";
        });
    }

    public getFullKeyFromOffset(startOffset: number, file: Uri): string {
        const translationPart = this.translationParts.find(tp => tp.file && tp.file.path === file.path);
        if (!translationPart || !translationPart.yamlDocument) {
            return null;
        }

        return translationPart.yamlDocument.getFullKeyFromOffset(startOffset);
    }

    public lookupKey(key: string): any {
        return this.lookupMap[key];
    }

    private addTranslationPart(translation: Translation, yamlDocument: YAMLDocument, sourceFile: Uri) {
        const translationPart = { translations: translation, yamlDocument: yamlDocument, file: sourceFile };
        if (this.translationParts.length > 0 && translationPart.file) {
            this.translationParts = this.translationParts.filter(tp => tp.file && tp.file.path !== translationPart.file.path);
        }
        this.translationParts.push(translationPart);
    }

    private makeKeyParts(key: string, locale: string): string[] {
        let keys = key.split(".");
        keys.unshift(locale);
        keys = keys.filter(key => key.length > 0);
        return keys;
    }

    private traverseTranslation(keyParts: string[], translation: Translation): string | Translation {
        let result: any = translation;
        for (let index = 0; index < keyParts.length; index++) {
            const keyPart: string = keyParts[index];
            if (result !== undefined) {
                const flatKey: string = keyParts.slice(index).join('.');
                logger.debug('traverseTranslation', { flatKey, index });
                if (flatKey in result) {
                    result = result[flatKey];
                } else if (keyPart in result) {
                    result = result[keyPart];
                } else {
                    result = undefined;
                }
            }
            if (['string', 'number', 'boolean'].indexOf(typeof result) >= 0) {
                return result.toString();
            }
        }

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
