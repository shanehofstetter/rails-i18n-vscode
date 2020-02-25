import { DefinitionProvider, TextDocument, Position, Definition, ProviderResult, CancellationToken, workspace, Location, Range, Uri } from "vscode";
import { logger } from "./logger";
import { KeyDetector } from "./keyDetector";
import { i18nResolver } from "./extension";
import { i18nTree } from "./i18nTree";
import { YAMLDocument } from "./yamlDocument";
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

        return this.findKeyValueLocationInDocument(translationPart.file, key, locale, translationPart.yamlDocument);
    }

    findKeyValueLocationInDocument(file: Uri, absoluteKey: string, locale: string, yamlDocument?: YAMLDocument): Thenable<Location> {
        return workspace.openTextDocument(file.path).then((document: TextDocument) => {
            if (!yamlDocument) {
                try {
                    yamlDocument = YAMLDocument.parse(document.getText());
                } catch (error) {
                    logger.error('could not parse yaml document', { error })
                    return null;
                }
            }
            const range: number[] = yamlDocument.findKeyValueRange(absoluteKey, locale);
            if (!range) {
                return null;
            }
            return new Location(file, new Range(document.positionAt(range[0]), document.positionAt(range[1])));
        });
    }
}
