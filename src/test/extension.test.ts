import { workspace, Uri } from "vscode";
import * as path from 'path';
import * as assert from 'assert';
import { i18nResolver } from "../extension";
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
        workspace.updateWorkspaceFolders(0, 0, { uri: Uri.file(path.join(__dirname)), name: 'test' });
        fs.copySync(fixturePath, __dirname);
    });

    it('does load translations on activation and returns translation for existing key', (done) => {
        let viewFile = Uri.file(path.join(__dirname, 'app', 'views', 'blog', 'show.html.haml'));
        workspace.openTextDocument(viewFile).then(() => {
            setTimeout(function () {
                Object.keys(translations).forEach(locale => {
                    assert.equal(i18nResolver.getTranslationForKey('hello', locale, viewFile), translations[locale].hello);
                    assert.equal(i18nTree.lookupKey(`test.${locale}.hello`), translations[locale].hello);
                    assert.equal(i18nTree.getTranslation('hello', locale, 'test'), translations[locale].hello);
                    assert.equal(i18nTree.translationsForLocaleExist(locale, 'test'), true);
                });
                assert.equal(i18nTree.translationsForLocaleExist('it', 'test'), false);
                done();
            }, 500);
        });
    });
});
