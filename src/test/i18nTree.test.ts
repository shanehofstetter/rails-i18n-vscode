import * as assert from 'assert';
import { I18nTree } from '../i18nTree';

describe("I18nTree", () => {
    let i18nTree: I18nTree;

    beforeEach(() => {
        this.i18nTree = new I18nTree();
    })

    describe("init", () => {
        context("when translations loaded", () => {
            beforeEach(() => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog")
            });

            it("resets translations", () => {
                assert.equal(
                    this.i18nTree.lookupKey('blog.en.hello'),
                    'hi'
                );
                this.i18nTree.init();
                assert.equal(
                    this.i18nTree.lookupKey('blog.en.hello'),
                    null
                );
            });
        });
    });

    describe("mergeIntoI18nTree", () => {
        beforeEach(() => { this.i18nTree.init(); });

        it('does not remove existing translations', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog")
            assert.equal(
                this.i18nTree.lookupKey('blog.en.hello'),
                'hi'
            );
            this.i18nTree.mergeIntoI18nTree({ en: { bye: 'bye' } }, "blog")
            assert.equal(
                this.i18nTree.lookupKey('blog.en.hello'),
                'hi'
            );
            assert.equal(
                this.i18nTree.lookupKey('blog.en.bye'),
                'bye'
            );
        });
    });

    describe("getKeysStartingWith", () => {
        beforeEach(() => { this.i18nTree.init(); });

        it('returns keys which begin with substring', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi', help: 'help', bye: 'bye' } }, "blog")
            assert.deepStrictEqual(
                this.i18nTree.getKeysStartingWith('blog.en.he'),
                [
                    "blog.en.hello",
                    "blog.en.help"
                ]
            );
        });
    });

    describe('translationsForLocaleExist', () => {
        beforeEach(() => { this.i18nTree.init(); });

        context('when translations exist', () => {
            it('returns true', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog")
                assert.equal(this.i18nTree.translationsForLocaleExist('en', 'blog'), true);
            });
        });

        context('when no translations exist', () => {
            it('returns false if no translations for workspace folder available', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog")
                assert.equal(this.i18nTree.translationsForLocaleExist('en', 'xy'), false);
            });

            it('returns false if no translations for workspace folder and locale available', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog")
                assert.equal(this.i18nTree.translationsForLocaleExist('fr', 'blog'), false);
            });
        });
    });

    describe('getFallbackLocale', () => {
        beforeEach(() => { this.i18nTree.init(); });

        it('returns first locale of workspacefolder translations', () => {
            this.i18nTree.mergeIntoI18nTree({ fr: { hello: 'hi' }, it: { hello: 'hi' } }, "blog")
            assert.equal(this.i18nTree.getFallbackLocale('blog'), 'fr');
        });

        it('returns en if no translations for workspace folder loaded', () => {
            this.i18nTree.mergeIntoI18nTree({}, "blog")
            assert.equal(this.i18nTree.getFallbackLocale('blog'), 'en');
        });

        it('returns en if workspace folder not present in translations', () => {
            this.i18nTree.mergeIntoI18nTree({}, "xy")
            assert.equal(this.i18nTree.getFallbackLocale('blog'), 'en');
        });
    });

    describe('getTranslation', () => {
        beforeEach(() => { this.i18nTree.init(); });

        context('with translations for workspace', () => {
            it('returns string translation', () => {
                this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog");
                assert.equal(this.i18nTree.getTranslation('hello', 'en', 'blog'), 'hi');
            });

            it('returns multiresult', () => {
                this.i18nTree.mergeIntoI18nTree(
                    { en: { greetings: { hi: 'hi', hello: 'hello' } } },
                    "blog");
                assert.equal(this.i18nTree.getTranslation('greetings', 'en', 'blog'),
                    'hi: hi\nhello: hello');
            });
        });

        context('with non-existent translations workspace', () => {
            it('returns undefined', () => {
                assert.equal(this.i18nTree.getTranslation('hi', 'en', 'blog'),
                    undefined);
            });
        });

        context('when given key is null or empty', () => {
            it('returns null', () => {
                assert.equal(this.i18nTree.getTranslation(null, 'en', 'blog'),
                    null);
            });
        })
    });

    describe('getWorkspaceFolderNames', () => {
        it('returns list of workspace folder names', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog");
            assert.deepStrictEqual(this.i18nTree.getWorkspaceFolderNames(), ['blog']);
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog");
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "xy");
            assert.deepStrictEqual(this.i18nTree.getWorkspaceFolderNames(), ['blog', 'xy']);
        });

        it('returns empty array if no translations exist', () => {
            assert.deepStrictEqual(this.i18nTree.getWorkspaceFolderNames(), []);
        });
    });

    describe('lookupKey', () => {
        it('returns translation for given full key', () => {
            this.i18nTree.mergeIntoI18nTree({ en: { hello: 'hi' } }, "blog");
            assert.equal(this.i18nTree.lookupKey('blog.en.hello'), 'hi');
        });

        it('returns undefined if key does not exist', () => {
            assert.equal(this.i18nTree.lookupKey('blog.en.hello'), undefined);
        });
    });
});
