import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, CompletionItemKind } from 'vscode';
import { I18nKeyDetector } from './i18nKeyDetector';
import { i18nResolver } from './extension';
import { logger } from './logger';

export class I18nCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let range = I18nKeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        let i18nKey = I18nKeyDetector.getI18nKeyAtRangeFromDocument(range, document);
        let keyPrefix = i18nResolver.getDefaultLocaleKey() + ".";
        logger.debug('provideCompletionItems', 'range:', range, 'i18nkey', i18nKey, 'keyPrefix', keyPrefix);

        if (I18nKeyDetector.isRelativeKey(i18nKey)) {
            keyPrefix += I18nKeyDetector.getRelativeKeyPart(document.fileName);
        }

        return this.buildCompletionItemList(keyPrefix, i18nKey);
    }

    private buildCompletionItemList(keyPrefix, i18nKey): CompletionItem[] {
        let fullKey = keyPrefix + i18nKey;
        let filteredKeys = this.filterLookupMap(fullKey);
        logger.debug('buildCompletionItemList', 'filteredKeys:', filteredKeys);
        return this.transformFilterResultIntoCompletionItemList(filteredKeys, keyPrefix, i18nKey);
    }

    private transformFilterResultIntoCompletionItemList(filteredKeys: string[], prefixToRemove: string, i18nKeyToComplete: string): CompletionItem[] {
        return filteredKeys.map(filteredKey => {
            return this.buildCompletionItem(filteredKey, prefixToRemove, i18nKeyToComplete);
        });
    }

    private buildCompletionItem(filteredKey: string, prefixToRemove: string, i18nKeyToComplete: string): CompletionItem {
        // remove the prefix (locale key and possibly key-part relative to current file location)
        let relevantKey = filteredKey.substring(prefixToRemove.length);
        // use the relevant key part as label for completion item
        let completionItem = new CompletionItem(relevantKey, CompletionItemKind.Value);
        // current word gets replaced, so we need to provide the current full keypart that is being typed 
        completionItem.insertText = relevantKey.substring(i18nKeyToComplete.lastIndexOf(".") + 1);
        // provide the translation as additional info
        completionItem.detail = i18nResolver.getLookupMap()[filteredKey];
        return completionItem;
    }

    private filterLookupMap(fullKey: string): string[] {
        return Object.keys(i18nResolver.getLookupMap()).filter(lookupKey => {
            return lookupKey.startsWith(fullKey);
        });
    }
}
