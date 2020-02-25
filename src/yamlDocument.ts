import { Translation } from "./i18nTree";
import { logger } from "./logger";
import YAML from "yaml";

export interface ParsedDocument {
    contents: { items: ParsedDocumentItem[] };
    errors: Array<any>;
    toJSON(arg?: any);
}

export interface ParsedDocumentItem {
    stringKey: string;
    value: any;
}

const SCALAR_TYPES = ['PLAIN', 'QUOTE_DOUBLE', 'QUOTE_SINGLE', 'BLOCK_FOLDED', 'BLOCK_LITERAL'];
const PAIR_TYPES = ['PAIR'];

export class YAMLDocument {
    parsedDocument: any;

    public static parse(text: string): YAMLDocument {
        const parsedDocument = YAML.parseDocument(text);
        if (parsedDocument.errors.length > 0) {
            throw parsedDocument.errors[0];
        }

        return new YAMLDocument(parsedDocument);
    }

    constructor(parsedDocument: any) {
        this.parsedDocument = parsedDocument;
    }

    public toTranslation(): Translation {
        return this.parsedDocument.toJSON();
    }

    public findKeyValueRange(absoluteKey: string, locale: string): number[] {
        logger.debug('findKeyValueRange', { absoluteKey, locale });

        const keyParts: string[] = absoluteKey.split('.').filter(key => key.length > 0);

        let yamlPairs = this.parsedDocument.contents.items;
        if (!yamlPairs) {
            logger.warn('yamlDocument does not have any items');
            return null;
        }

        keyParts.unshift(locale);

        for (let i = 0; i < keyParts.length; i++) {
            const keyPart = keyParts[i];
            const flatKey: string = keyParts.slice(i).join('.');
            let yamlPair = yamlPairs.find(item => item.stringKey === flatKey);
            if (!yamlPair) {
                yamlPair = yamlPairs.find(item => item.stringKey === keyPart);
                if (!yamlPair) {
                    logger.debug('key could not be located in yaml document');
                    return null;
                }
            }
            let value = yamlPair.value;
            logger.debug('current value:', value, 'typeof value', typeof value);

            if (typeof value !== 'object') {
                logger.debug('unknown value object (not an object)', { value });
                return null;
            }

            if (SCALAR_TYPES.indexOf(value.type) >= 0) {
                logger.debug('findKeyValueRangeInYamlDocument', { value });
                return value.range;
            } else if (value.items) {
                yamlPairs = value.items;
            } else {
                logger.debug('unknown value object (complex type with no child items)', { ...value });
                return null;
            }
        }
        return null;
    }

    public getFullKeyFromOffset(startOffset: number): string {
        let keyParts = [];

        this.findRemainingKeyParts(this.parsedDocument.contents, startOffset, true, keyParts);
        return keyParts.slice(1).join('.'); // remove first key part, i.e. the locale
    }

    private findRemainingKeyParts(node: any, targetOffset: number, validateRange: boolean, keyParts: Array<string>): boolean {
        const nodeRange = this.nodeRange(node);

        if (validateRange && !this.rangeCovers(nodeRange, targetOffset)) {
            return false;
        }

        let match = false;
        if (this.isPairNode(node)) {
            this.findRemainingKeyParts(node.key, targetOffset, false, keyParts);
            if (this.isScalarNode(node.value)) {
                // stop if value is a scalar, i.e. the translation text
                match = true;
            } else {
                match = match || this.findRemainingKeyParts(node.value, targetOffset, true, keyParts);
            }
        }
        else if (this.isScalarNode(node) && node.value) {
            keyParts.push(node.value);
            match = true;
        }
        else if (node.items) {
            for (let item of node.items) {
                match = match || this.findRemainingKeyParts(item, targetOffset, true, keyParts);
                if (match) {
                    break;
                }
            }
        }

        console.log("match", match, keyParts);
        return match;
    }

    private nodeRange(node: any) {
        const pairNode = this.isPairNode(node);
        if (pairNode) {
            const keyRange = node.key && node.key.range || [];
            const valueRange = node.value && node.value.range || [];
            const adjustedRange = [Math.min(...keyRange, ...valueRange), Math.max(...keyRange, ...valueRange)];

            if (isFinite(adjustedRange[0]) && isFinite(adjustedRange[1])) {
                return adjustedRange;
            }
        }

        return node.range;
    }

    private isPairNode(node: any) {
        return PAIR_TYPES.indexOf(node.type) >= 0;
    }

    private isScalarNode(node: any) {
        return SCALAR_TYPES.indexOf(node.type) >= 0;
    }

    private rangeCovers(range: any, value: number) {
        return range[0] <= value && range[1] >= value;
    }
}
