import { CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, CompletionList, Position, ProviderResult, TextDocument, CompletionItemKind, workspace, WorkspaceFolder } from 'vscode';
import { KeyDetector } from './keyDetector';
import { i18nResolver } from './extension';
import { logger } from './logger';
import { i18nTree } from './i18nTree';

export class I18nCompletionProvider implements CompletionItemProvider {
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        const range = KeyDetector.getRangeOfI18nKeyAtPosition(position, document);
        if (!range) return null;
        
        const i18nKey = KeyDetector.getI18nKeyAtRangeFromDocument(range, document);
        let keyPrefix = i18nResolver.getDefaultLocaleKey(document.uri) + ".";
        logger.debug('provideCompletionItems', 'range:', range, 'i18nkey', i18nKey, 'keyPrefix', keyPrefix);

        if (KeyDetector.isRelativeKey(i18nKey)) {
            keyPrefix += KeyDetector.getRelativeKeyPart(document.fileName);
        }

        return this.buildCompletionItemList(keyPrefix, i18nKey, workspace.getWorkspaceFolder(document.uri));
    }

    private buildCompletionItemList(keyPrefix: string, i18nKey: string, workspaceFolder: WorkspaceFolder): CompletionItem[] {
        let fullKey = keyPrefix + i18nKey;
        let filteredKeys = i18nTree.getKeysStartingWith(fullKey, workspaceFolder);
        logger.debug('buildCompletionItemList', 'filteredKeys:', filteredKeys);
        return this.transformFilterResultIntoCompletionItemList(filteredKeys, keyPrefix, i18nKey, workspaceFolder);
    }

    private transformFilterResultIntoCompletionItemList(filteredKeys: string[], prefixToRemove: string, i18nKeyToComplete: string, workspaceFolder: WorkspaceFolder): CompletionItem[] {
        return filteredKeys.map(filteredKey => {
            return this.buildCompletionItem(filteredKey, prefixToRemove, i18nKeyToComplete, workspaceFolder);
        });
    }

    private buildCompletionItem(filteredKey: string, prefixToRemove: string, i18nKeyToComplete: string, workspaceFolder: WorkspaceFolder): CompletionItem {
        // remove the prefix (locale key and possibly key-part relative to current file location)
        let relevantKey = filteredKey.substring(prefixToRemove.length);
        // use the relevant key part as label for completion item
        let completionItem = new CompletionItem(relevantKey, CompletionItemKind.Value);
        // current word gets replaced, so we need to provide the current full keypart that is being typed 
        completionItem.insertText = relevantKey.substring(i18nKeyToComplete.lastIndexOf(".") + 1);
        // provide the translation as additional info
        completionItem.detail = i18nTree.lookupKey(filteredKey, workspaceFolder);
        return completionItem;
    }
}
