import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, CompletionItemKind } from 'vscode';
import { I18nKeyDetector } from './i18nKeyDetector';
import { i18nResolver } from './extension';

export class I18nCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let range = I18nKeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        let i18nKey = I18nKeyDetector.getI18nKeyAtRangeFromDocument(range, document);
        let defaultLocaleKeyPrefix = i18nResolver.getDefaultLocaleKey() + ".";
        let keyPrefix;

        if (I18nKeyDetector.isRelativeKey(i18nKey)) {
            keyPrefix = defaultLocaleKeyPrefix + I18nKeyDetector.getRelativeKeyPart(document.fileName);
        } else {
            keyPrefix = defaultLocaleKeyPrefix;
        }

        return this.buildCompletionItemList(keyPrefix, i18nKey);
    }

    private buildCompletionItemList(keyPrefix, i18nKey): CompletionItem[] {
        let fullKey = keyPrefix + i18nKey;
        let filteredKeys = this.filterLookupMap(fullKey);
        return this.transformFilterResultIntoCompletionItemList(filteredKeys, keyPrefix, i18nKey);
    }

    private transformFilterResultIntoCompletionItemList(filteredKeys: string[], prefixToRemove: string, i18nKeyToComplete: string): CompletionItem[] {
        return filteredKeys.map(filteredKey => {
            return this.buildCompletionItem(filteredKey, prefixToRemove, i18nKeyToComplete);
        });
    }

    private buildCompletionItem(filteredKey: string, prefixToRemove: string, i18nKeyToComplete: string): CompletionItem {
        let relevantKey = filteredKey.substring(prefixToRemove.length);
        let completionItem = new CompletionItem(relevantKey, CompletionItemKind.Value);
        completionItem.insertText = relevantKey.substring(i18nKeyToComplete.length);
        completionItem.detail = i18nResolver.getLookupMap()[filteredKey];
        return completionItem;
    }

    private filterLookupMap(fullKey: string): string[] {
        return Object.keys(i18nResolver.getLookupMap()).filter(lookupKey => {
            return lookupKey.startsWith(fullKey);
        });
    }
}
