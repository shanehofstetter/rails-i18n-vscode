import { Position, Range, TextDocument } from 'vscode';
import { logger } from './logger';
import { RailsCommands } from './railsCommands';

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
        let i18nCallRegex = /(I18n\.)?t(ranslate)?[\(\s]+[\"\'][\w-\.\/]+[\"\'\.]\)?/g;
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
    public static makeAbsoluteKey(key: string, document: TextDocument, position: Position): string {
        if (!this.isRelativeKey(key)) {
            return key;
        }
        let relativeKeyPart = this.getRelativeKeyPart(document, position);
        if (!relativeKeyPart) {
            return key;
        }
        return relativeKeyPart + key;
    }

    public static getStaticPart(document: TextDocument, line: number): string {
        const fileName = document.fileName
        const projectPath = fileName.split("app/")[1] // Gets the path after 'app/': 'views/products/index.html.rb'
        const pathAndAction = projectPath.split(".")[0] // Gets the path and action part: 'views/products/index'
        const staticPart = pathAndAction.replace(/\\|\//g, ".") // Replace the forward (or backward) slashes: 'views.products.index'
        const parts = staticPart.split(".") // Split into parts: ['views', 'products', 'index']
        const type = parts[0]
        
        // If translation is in a controller, get the action name and add it to the list of parts
        // ['controllers', 'products_controller', 'index']
        if (type === "controllers") {
            const methodName = RailsCommands.getMethodName(document, line)
            parts.push(methodName)
        }
        
        const resource = parts.slice(1).join(".") // Remove first element and join: 'products.index'

        return resource
    }

    public static getRelativeKeyPart(document: TextDocument, position: Position): string {
        try {
            // get the relative key from current file path
            let relativeKey = KeyDetector.getStaticPart(document, position.line);
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

    public static getAbsoluteKeyFromPositionInDocument(position: Position, document: TextDocument): { key: string, range: Range } | null {
        let range = KeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        if (!range) {
            return null;
        }
        let i18nKey = KeyDetector.getI18nKeyAtRangeFromDocument(range, document);
        logger.debug('getAbsoluteKeyFromPositionInDocument', { i18nKey, range });
        if (!KeyDetector.isValidI18nKey(i18nKey)) {
            return null;
        }

        return { key: KeyDetector.makeAbsoluteKey(i18nKey, document, position), range };
    }
}