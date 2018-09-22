import { CancellationToken, Hover, HoverProvider, Position, TextDocument } from 'vscode';
import { i18nResolver } from './extension';
import { KeyDetector } from './keyDetector';
import { logger } from './logger';

export class I18nHoverProvider implements HoverProvider {

    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Hover {
        let range = KeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        if (!range) {
            return null;
        }
        let i18nKey = KeyDetector.getI18nKeyAtRangeFromDocument(range, document);
        logger.debug('provideHover', `i18nkey: '${i18nKey}'`);
        if (!KeyDetector.isValidI18nKey(i18nKey)) {
            return null;
        }

        let i18nText = i18nResolver.getTranslationForKey(KeyDetector.makeAbsoluteKey(i18nKey, document.fileName));
        logger.debug('provideHover', `i18nText: '${i18nText}'`);

        return new Hover({ language: 'text', value: i18nText }, range);
    }
}