import { workspace, Uri, ExtensionContext } from "vscode";
import * as path from 'path';
import * as assert from 'assert';
import { i18nResolver, activate } from "../extension";
import * as fs from 'fs-extra';
import { i18nTree } from "../i18nTree";

const fixturePath = path.join(__dirname, "..", "..", "src", "test", 'fixtures');
const translations = {
    de: {
        hello: 'Hallo'
    },
    en: {
        hello: 'hello'
    }
}

describe("Extension", () => {
    beforeEach(() => {
        fs.copySync(fixturePath, __dirname);
        workspace.updateWorkspaceFolders(0, 0, { uri: Uri.file(path.join(__dirname)), name: 'test' });
    });

    describe('activation', () => {
        let mockContext: ExtensionContext = {
            subscriptions: [],
            workspaceState: null,
            globalState: null,
            extensionPath: '',
            asAbsolutePath: null,
            storagePath: null
        }

        beforeEach(() => {
            activate(mockContext);
            assert.equal(mockContext.subscriptions.length, 4);
        });

        it('does load translations and returns translation for existing key', function (done) {
            let viewFile = Uri.file(path.join(__dirname, 'app', 'views', 'blog', 'show.html.haml'));
            workspace.openTextDocument(viewFile).then(() => {
                i18nResolver.onDidLoad(() => {
                    Object.keys(translations).forEach(locale => {
                        assert.equal(i18nResolver.getTranslationForKey('hello', locale, viewFile), translations[locale].hello);
                        assert.equal(i18nTree.lookupKey(`test.${locale}.hello`), translations[locale].hello);
                        assert.equal(i18nTree.getTranslation('hello', locale, 'test'), translations[locale].hello);
                        assert.equal(i18nTree.translationsForLocaleExist(locale, 'test'), true);
                    });
                    assert.equal(i18nTree.translationsForLocaleExist('it', 'test'), false);
                    done();
                });
            });
        });
    });
});
