import { CancellationToken, Hover, HoverProvider, Position, TextDocument, workspace } from 'vscode';
import { i18nResolver } from './extension';

export class I18nHoverProvider implements HoverProvider {

    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Thenable<Hover> {
        console.log("provideHover", document, position);
        
        // 1. get i18n key of current location

        let lineText = document.lineAt(position.line).text;
        let afterI18nCall = lineText.split(/I18n\.t\(| t\(/)[1]
        let i18nKey = afterI18nCall.split(/\ |\,|\)/)[0].replace(/'|\"/g, "")
        console.log("i18nKey", i18nKey);

        // 2. ask resolver for its value
        
        let result = i18nResolver.getLocaleForKey(i18nKey);
        console.log("result", result);
        // 3. return hover definition

        return null;
    }
}