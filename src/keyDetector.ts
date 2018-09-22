import { Position, Range, TextDocument } from 'vscode';

/**
 * Provides functions to detect and transform i18n keys
 */
export class KeyDetector {

    /**
     * check if i18n key is valid
     * @param key i18n to validate
     */
    public static isValidI18nKey(key: string): boolean {
        return typeof key === "string";
    }

    /**
     * find a i18n.translation call at position and return its range
     * @param position position to look for the i18n call
     * @param document current document
     */
    public static getRangeOfI18nKeyAtPosition(position: Position, document: TextDocument): Range {
        let i18nCallRegex = /(I18n\.)?t(ranslate)?[\(\s]+[\"\']{1}[\w+\.\/]+[\"\'\.]{1}\)?/g;
        return document.getWordRangeAtPosition(position, i18nCallRegex);
    }

    /**
     * get the i18n key as text from i18n call range 
     * @param range range where i18n call occurs
     * @param document current document
     */
    public static getI18nKeyAtRangeFromDocument(range: Range, document: TextDocument): string {
        return document.getText(range).replace(/\"|\'|(I18n\.)?t(ranslate)?[\(\s]+|\)/g, "");
    }

    /**
     * make absolute i18n key based on relative key, depending on current file location
     * @param key key to make absolute (a relative key begins with a period)
     * @param currentFilename current file name / path
     */
    public static makeAbsoluteKey(key: string, currentFilename: string): string {
        if (!this.isRelativeKey(key)) {
            return key;
        }
        let relativeKeyPart = this.getRelativeKeyPart(currentFilename);
        if (!relativeKeyPart) {
            return key;
        }
        return relativeKeyPart + key;
    }

    public static getRelativeKeyPart(currentFilename: string): string {
        try {
            // get the relative key from current file path, starting at directory "views"
            let relativeKey = currentFilename.split("views")[1].split(".")[0].replace(/\\|\//g, ".");
            if (relativeKey.startsWith(".")) {
                relativeKey = relativeKey.substring(1);
            }
            let relativeKeyParts = relativeKey.split(".");
            relativeKeyParts = relativeKeyParts.map(keyPart => {
                if (keyPart.startsWith("_")) {
                    return keyPart.substring(1);
                }
                return keyPart;
            });
            return relativeKeyParts.join(".");
        } catch (Error) {
            return "";
        }
    }

    public static isRelativeKey(key: string): boolean {
        return key.startsWith(".");
    }
}