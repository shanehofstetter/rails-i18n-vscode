import { safeLoad, load } from "js-yaml";
import * as merge from "merge";
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { I18nDefaultLocaleDetector } from './i18nDefaultLocaleDetector';
import { LookupMapGenerator } from './lookupMapGenerator';
import { logger } from "./logger";

export class I18nResolver implements vscode.Disposable {

    private i18nTree = {};
    private lookupMap = {};
    private defaultLocaleKey = "en";
    private fileSystemWatcher;
    private readonly yamlPattern = 'config/locales/**/*.yml';

    /**
     * load ressources
     */
    public load(): void {
        this.loadYamlFiles().then(_ => {
            this.generateLookupMap();
            this.loadDefaultLocale();
            this.registerFileWatcher();
        }, error => {
            logger.error(error);
        });
    }

    /**
     * load yaml locale files and generate single map out of them
     * register file watcher and reload changed files into map
     */
    private loadYamlFiles(): Thenable<any> {
        return workspace.findFiles(this.yamlPattern).then(files => {
            return Promise.all(files.map(file => {
                logger.debug('loading locale file:', file.path);
                return this.loadDocumentIntoMap(file.path);
            }));
        });
    }

    private registerFileWatcher(): void {
        this.fileSystemWatcher = workspace.createFileSystemWatcher(new vscode.RelativePattern(workspace.rootPath, this.yamlPattern));
        this.fileSystemWatcher.onDidChange((e: vscode.Uri) => {
            this.loadDocumentIntoMap(e.fsPath);
            this.generateLookupMap();
        });
    }

    private loadDocumentIntoMap(filePath: string): Thenable<void> {
        // TODO: detect removed keys and remove them from i18nTree
        return workspace.openTextDocument(filePath).then((document: vscode.TextDocument) => {
            try {
                this.i18nTree = merge.recursive(false, this.i18nTree, load(document.getText()));
            } catch (error) {
                logger.error(filePath, error.message);
            }
        });
    }

    /**
     * load the default locale
     */
    private loadDefaultLocale(): Thenable<string> {
        let i18nLocaleDetector = new I18nDefaultLocaleDetector();
        return i18nLocaleDetector.detectDefaultLocaleWithFallback(this.i18nTree).then(locale => {
            this.defaultLocaleKey = locale;
            logger.info('default locale:', this.defaultLocaleKey);
            return this.defaultLocaleKey;
        }, error => {
            logger.error(error);
        });
    }

    public getDefaultLocaleKey(): string {
        return this.defaultLocaleKey;
    }

    /**
     * resolve text value for i18n key in default locale
     * @param key i18n key (e.g. "hello.world")
     */
    public getTranslationForKey(key: string): any {
        if (!key) {
            return null;
        }

        let keyParts = this.makeKeyParts(key);
        let fullKey = keyParts.join(".");

        let simpleLookupResult = this.lookupMap[fullKey];
        if (typeof simpleLookupResult === "string") {
            logger.debug('key:', key, 'fullKey:', fullKey, 'simpleLookupResult:', simpleLookupResult);
            return simpleLookupResult;
        }

        let lookupResult = this.traverseThroughMap(keyParts);
        logger.debug('key:', key, 'fullKey:', fullKey, 'lookupResult:', lookupResult);
        if (lookupResult !== null && typeof lookupResult === "object") {
            return this.transformMultiResultIntoText(lookupResult);
        }

        return lookupResult;
    }

    private makeKeyParts(key: string): string[] {
        let keys = key.split(".");
        keys.unshift(this.getDefaultLocaleKey());
        keys = keys.filter(key => key.length > 0);
        return keys;
    }

    private traverseThroughMap(keyParts: string[]): any {
        let result = this.i18nTree;
        keyParts.forEach(keyPart => {
            if (result !== undefined) {
                result = result[keyPart];
            }
        });
        return result;
    }

    private transformMultiResultIntoText(result: object): string {
        // if last part of i18n key is missing (e.g. because its interpolated), 
        // we can still show a list of possible translations 
        let resultLines = [];
        Object.keys(result).forEach(key => {
            let text = result[key];
            if (typeof text === 'object') {
                // values are objects, meaning its not only the last part of the key which is missing
                return null;
            }
            resultLines.push(`${key}: ${text}`);
        });
        return resultLines.join("\n");
    }

    private generateLookupMap(): void {
        this.lookupMap = new LookupMapGenerator(this.i18nTree).generateLookupMap();
    }

    public getLookupMap(): object {
        return this.lookupMap;
    }

    public dispose() {
        if (this.fileSystemWatcher) {
            this.fileSystemWatcher.dispose();
        }
    }
}