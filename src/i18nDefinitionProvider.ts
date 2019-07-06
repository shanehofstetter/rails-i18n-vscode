import { DefinitionProvider, TextDocument, Position, Definition, ProviderResult, CancellationToken, workspace, Location, Range, Uri } from "vscode";
import { logger } from "./logger";
import { KeyDetector } from "./keyDetector";
import { i18nResolver } from "./extension";
import { i18nTree } from "./i18nTree";
import YAML from "yaml";

interface YAMLDocument {
    contents: { items: YAMLDocumentItem[] };
}

interface YAMLDocumentItem {
    stringKey: string;
    value: any;
}

export class I18nDefinitionProvider implements DefinitionProvider {

    provideDefinition(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Definition> {
        let { key } = KeyDetector.getAbsoluteKeyFromPositionInDocument(position, document);
        if (!key) {
            return null;
        }
        let i18nText = i18nResolver.getTranslationForKey(key);

        if (!i18nText) {
            return null;
        }

        const locale: string = i18nResolver.getDefaultLocaleKey(document.uri);
        const translationPart = i18nTree.getTranslationPart(key, locale, workspace.getWorkspaceFolder(document.uri));
        logger.debug('provideDefinition', { translationPart });

        if (!translationPart) {
            return null;
        }

        return this.findKeyValueLocationInDocument(translationPart.file, key, locale);
    }

    findKeyValueLocationInDocument(file: Uri, absoluteKey: string, locale: string): Thenable<Location> {
        return workspace.openTextDocument(file.path).then((document: TextDocument) => {
            const range: number[] = this.findKeyValueRangeInYAML(document.getText(), absoluteKey, locale);
            if (!range) {
                return null;
            }
            return new Location(file, new Range(document.positionAt(range[0]), document.positionAt(range[1])));
        });
    }

    findKeyValueRangeInYAML(yaml: string, absoluteKey: string, locale: string): number[] {
        let yamlDocument: YAMLDocument = null;
        try {
            yamlDocument = YAML.parseDocument(yaml);
        } catch (error) {
            logger.error('could not parse yaml document', { error })
            return null;
        }
        return this.findKeyValueRangeInYamlDocument(yamlDocument, absoluteKey, locale);
    }

    findKeyValueRangeInYamlDocument(yamlDocument: YAMLDocument, absoluteKey: string, locale: string): number[] {
        logger.debug('findKeyValueRangeInYamlDocument', { absoluteKey, locale });

        const keyParts: string[] = absoluteKey.split('.').filter(key => key.length > 0);

        let yamlPairs = yamlDocument.contents.items;
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

            if (['PLAIN', 'QUOTE_DOUBLE', 'QUOTE_SINGLE', 'BLOCK_FOLDED', 'BLOCK_LITERAL'].indexOf(value.type) >= 0) {
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
}