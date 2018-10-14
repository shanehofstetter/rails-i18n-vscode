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
            return null;
        }
        let yamlPair = yamlPairs.find(item => item.stringKey === locale);
        if (!yamlPair) {
            return null;
        }
        yamlPairs = yamlPair.value.items;

        for (let i = 0; i < keyParts.length; i++) {
            const keyPart = keyParts[i];
            const yamlPair = yamlPairs.find(item => item.stringKey === keyPart);
            if (!yamlPair) {
                return null;
            }
            let value = yamlPair.value;
            logger.debug('current value:', value);
            if (['PLAIN', 'QUOTE_DOUBLE', 'QUOTE_SINGLE'].indexOf(value.type) >= 0) {
                logger.debug('findKeyValueRangeInYamlDocument', { value });
                return value.range;
            } else if (value.items) {
                yamlPairs = value.items;
            } else {
                return null;
            }
        }
        return null;
    }
}