import { logger } from "./logger";
import { TextDocument, Uri, workspace, WorkspaceFolder, RelativePattern } from "vscode";

export class RailsConfigFileParser {

    private readonly rbPattern = 'config/**/*.rb';

    public detectDefaultLocaleForWorkspaceFolder(workspaceFolder: WorkspaceFolder) {
        return workspace.findFiles(new RelativePattern(workspaceFolder, this.rbPattern)).then(uris => {
            return this.raceSuccess(uris.map(uri => {
                return this.detectConfigurationInUri(uri);
            }), () => Promise.resolve());
        });
    }
    
    public detectConfigurationInUri(uri: Uri): Thenable<string | null> {
        return workspace.openTextDocument(uri).then((document: TextDocument) => {
            const detectedLocale = this.detectConfigurationInDocument(document);
            if (detectedLocale) {
                return Promise.resolve(detectedLocale);
            }
            return Promise.reject();
        });
    }

    public detectConfigurationInDocument(document: TextDocument): string | null {
        let searchResult = document.getText().search(/^[\t ]*[^\#\r\n]?[\t ]*[\S\.]*i18n\.default_locale[\s]*=[\s]*[:]?[\S]{2,}/gmi);
        if (searchResult === -1) {
            return null;
        }
        let position = document.positionAt(searchResult);
        let lineText = document.lineAt(position.line).text.trim();
        logger.debug('detectConfigurationInDocument', 'position', position, 'searchResult', searchResult, 'lineText', lineText);
        let locale = lineText.split("=")[1].replace(/\:|\ |\'|\"/g, "").trim();
        return locale;
    }

    private raceSuccess(promises, onAllRejected: (errors) => Promise<any>) {
        return Promise.all(promises.map(p => {
            return p.then(
                val => Promise.reject(val),
                err => Promise.resolve(err)
            );
        })).then(
            errors => onAllRejected(errors),
            val => Promise.resolve(val)
        );
    }
}

