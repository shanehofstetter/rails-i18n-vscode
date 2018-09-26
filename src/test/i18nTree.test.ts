import * as assert from 'assert';
import { I18nTree } from '../i18nTree';
import { WorkspaceFolder, Uri } from 'vscode';

describe("I18nTree", () => {
    const blogWorkspaceFolder: WorkspaceFolder = {
        name: 'blog',
        uri: Uri.file('/blog'),
        index: 0
    }
    const xyWorkspaceFolder: WorkspaceFolder = {
        name: 'xy',
        uri: Uri.file('/xy'),
        index: 1
    }

    beforeEach(() => {
        this.i18nTree = new I18nTree();
    })

    describe("init", () => {
        context("when translations loaded", () => {
            beforeEach(() => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder)
            });

            it("resets translations", () => {
                assert.equal(
                    this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder),
                    'hi'
                );
                this.i18nTree.init();
                assert.equal(
                    this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder),
                    null
                );
            });
        });
    });

    describe("mergeIntoI18nTree", () => {
        beforeEach(() => { this.i18nTree.init(); });

        it('does not remove existing translations', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder)
            assert.equal(
                this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder),
                'hi'
            );
            this.i18nTree.mergeIntoI18nTree({ en: { bye: 'bye' } }, blogWorkspaceFolder)
            assert.equal(
                this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder),
                'hi'
            );
            assert.equal(
                this.i18nTree.lookupKey('en.bye', blogWorkspaceFolder),
                'bye'
            );
        });

        context('when sourceFile is specified', () => {
            it('does not keep no longer existing keys', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder, Uri.file('/file/a'));
                this.i18nTree.mergeIntoI18nTree({ en: { bye: 'bye' } }, blogWorkspaceFolder, Uri.file('/file/b'));
                assert.equal(this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder), 'hi');
                assert.equal(this.i18nTree.lookupKey('en.bye', blogWorkspaceFolder), 'bye');
                this.i18nTree.mergeIntoI18nTree({ en: { ciao: 'ciao' } }, blogWorkspaceFolder, Uri.file('/file/a'));
                assert.equal(this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder), undefined);
                assert.equal(this.i18nTree.lookupKey('en.ciao', blogWorkspaceFolder), 'ciao');
            });
        });
    });

    describe("getKeysStartingWith", () => {
        beforeEach(() => { this.i18nTree.init(); });

        it('returns keys which begin with substring', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi', help: 'help', bye: 'bye' } }, blogWorkspaceFolder)
            assert.deepStrictEqual(
                this.i18nTree.getKeysStartingWith('en.he', blogWorkspaceFolder),
                [
                    "en.hello",
                    "en.help"
                ]
            );
        });
    });

    describe('translationsForLocaleExist', () => {
        beforeEach(() => { this.i18nTree.init(); });

        context('when translations exist', () => {
            it('returns true', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder)
                assert.equal(this.i18nTree.translationsForLocaleExist('en', blogWorkspaceFolder), true);
            });
        });

        context('when no translations exist', () => {
            it('returns false if no translations for workspace folder available', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder)
                assert.equal(this.i18nTree.translationsForLocaleExist('en', xyWorkspaceFolder), false);
            });

            it('returns false if no translations for workspace folder and locale available', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder)
                assert.equal(this.i18nTree.translationsForLocaleExist('fr', blogWorkspaceFolder), false);
            });
        });
    });

    describe('getFallbackLocale', () => {
        beforeEach(() => { this.i18nTree.init(); });

        it('returns first locale of workspacefolder translations', () => {
            this.i18nTree.mergeIntoI18nTree({ fr: { hello: 'hi' }, it: { hello: 'hi' } }, blogWorkspaceFolder)
            assert.equal(this.i18nTree.getFallbackLocale(blogWorkspaceFolder), 'fr');
        });

        it('returns en if no translations for workspace folder loaded', () => {
            this.i18nTree.mergeIntoI18nTree({}, blogWorkspaceFolder)
            assert.equal(this.i18nTree.getFallbackLocale(blogWorkspaceFolder), 'en');
        });

        it('returns en if workspace folder not present in translations', () => {
            this.i18nTree.mergeIntoI18nTree({}, xyWorkspaceFolder)
            assert.equal(this.i18nTree.getFallbackLocale(blogWorkspaceFolder), 'en');
        });
    });

    describe('getTranslation', () => {
        beforeEach(() => { this.i18nTree.init(); });

        context('with translations for workspace', () => {
            it('returns string translation', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder);
                assert.equal(this.i18nTree.getTranslation('hello', 'en', blogWorkspaceFolder), 'hi');
            });

            it('returns multiresult', () => {
                this.i18nTree.mergeIntoI18nTree(
                    { en: { greetings: { hi: 'hi', hello: 'hello' } } },
                    blogWorkspaceFolder);
                assert.equal(this.i18nTree.getTranslation('greetings', 'en', blogWorkspaceFolder),
                    'hi: hi\nhello: hello');
            });
        });

        context('with non-existent translations workspace', () => {
            it('returns undefined', () => {
                assert.equal(this.i18nTree.getTranslation('hi', 'en', blogWorkspaceFolder),
                    undefined);
            });
        });

        context('when given key is null or empty', () => {
            it('returns null', () => {
                assert.equal(this.i18nTree.getTranslation(null, 'en', blogWorkspaceFolder),
                    null);
            });
        })
    });

    describe('getWorkspaceFolderNames', () => {
        it('returns list of workspace folder names', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder);
            assert.deepStrictEqual(this.i18nTree.getWorkspaceFolders(), [blogWorkspaceFolder]);
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder);
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, xyWorkspaceFolder);
            assert.deepStrictEqual(this.i18nTree.getWorkspaceFolders(), [blogWorkspaceFolder, xyWorkspaceFolder]);
        });

        it('returns empty array if no translations exist', () => {
            assert.deepStrictEqual(this.i18nTree.getWorkspaceFolders(), []);
        });
    });

    describe('lookupKey', () => {
        it('returns translation for given full key', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, blogWorkspaceFolder);
            assert.equal(this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder), 'hi');
        });

        it('returns undefined if key does not exist', () => {
            assert.equal(this.i18nTree.lookupKey('en.hello', blogWorkspaceFolder), undefined);
        });
    });
});
