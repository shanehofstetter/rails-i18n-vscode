import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, CompletionItemKind } from 'vscode';
import { I18nKeyDetector } from './i18nKeyDetector';
import { i18nResolver } from './extension';

export class I18nCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let range = I18nKeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        let i18nKey = I18nKeyDetector.getI18nKeyAtRangeFromDocument(range, document);

        if (I18nKeyDetector.isRelativeKey(i18nKey)) {
            // get the relative part and do a lookup, but return results without relative part
            return null;
        } else {
            let fullKey = `${i18nResolver.getDefaultLocaleKey()}.${i18nKey}`
            let filteredKeys = Object.keys(i18nResolver.getLookupMap()).filter(lookupKey => {
                return lookupKey.startsWith(fullKey);
            });
            return filteredKeys.map(filteredKey => {
                let keyWithoutLocale = filteredKey.substring(3);
                let completionItem = new CompletionItem(keyWithoutLocale, CompletionItemKind.Value);
                completionItem.insertText = keyWithoutLocale.substring(i18nKey.length);
                return completionItem;
            })
        }
    }

    public resolveCompletionItem?(item: CompletionItem, token: CancellationToken): ProviderResult<CompletionItem> {
        return null;
    }
}
