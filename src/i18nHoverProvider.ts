import { CancellationToken, Hover, HoverProvider, Position, TextDocument } from 'vscode';
import { i18nResolver } from './extension';

export class I18nHoverProvider implements HoverProvider {

    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Hover {
        let lineText = document.lineAt(position.line).text;

        let range = i18nResolver.getRangeOfI18nKeyAtPosition(position, document);
        if (!range) {
            return null;
        }
        let i18nKey = i18nResolver.getI18nKeyAtRangeFromDocument(range, document);
        if (!i18nResolver.isValidI18nKey(i18nKey)) {
            return null;
        }

        let i18nText = i18nResolver.getLocaleForKey(i18nResolver.makeAbsoluteKey(i18nKey, document.fileName));

        return new Hover({ language: 'text', value: i18nText }, range);
    }
}