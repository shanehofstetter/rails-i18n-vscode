import { CancellationToken, Hover, HoverProvider, Position, TextDocument } from 'vscode';
import { i18nResolver } from './extension';
import { KeyDetector } from './keyDetector';
import { logger } from './logger';

export class I18nHoverProvider implements HoverProvider {

    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Hover {
        let { key, range } = KeyDetector.getAbsoluteKeyFromPositionInDocument(position, document);

        if (!key) return null;

        let i18nText = i18nResolver.getTranslationForKey(key);
        logger.debug('provideHover', { i18nText });

        return new Hover({ language: 'text', value: i18nText }, range);
    }
}