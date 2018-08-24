import { CancellationToken, Hover, HoverProvider, Position, TextDocument } from 'vscode';
import { i18nResolver } from './extension';
import { I18nKeyDetector } from './i18nKeyDetector';
import { logger } from './logger';

export class I18nHoverProvider implements HoverProvider {

    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Hover {
        let range = I18nKeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        if (!range) {
            return null;
        }
        let i18nKey = I18nKeyDetector.getI18nKeyAtRangeFromDocument(range, document);
        logger.debug('provideHover', `i18nkey: '${i18nKey}'`);
        if (!I18nKeyDetector.isValidI18nKey(i18nKey)) {
            return null;
        }

        let i18nText = i18nResolver.getTranslationForKey(I18nKeyDetector.makeAbsoluteKey(i18nKey, document.fileName));
        logger.debug('provideHover', `i18nText: '${i18nText}'`);

        return new Hover({ language: 'text', value: i18nText }, range);
    }
}