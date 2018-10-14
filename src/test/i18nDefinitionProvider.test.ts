import * as assert from 'assert';
import { I18nDefinitionProvider } from '../i18nDefinitionProvider';
import * as path from 'path';
import * as vscode from 'vscode';

const i18nDefinitionProvider = new I18nDefinitionProvider();
const yamlPath = path.join(__dirname, "..", "..", "src", "test", 'fixtures', 'config', 'locales', 'en.yml');

const yaml = `
en:
    hello: hello`;

const yamlSingleQuoted = `
en:
    hello: 'hello'`;

const yamlDoubleQuoted = `
en:
    hello: "hello"`;

const incompleteYaml = `
en:
    someotherkey: hello`;

describe("Definition Provider", () => {
    describe('findKeyValueLocationInDocument', () => {
        it('returns the correct range', (done) => {
            const uri = vscode.Uri.file(yamlPath)
            i18nDefinitionProvider.findKeyValueLocationInDocument(uri, 'hello', 'en').then(location => {
                assert.equal(location.uri, uri);
                assert.equal(location.range.start.line, 1);
                assert.equal(location.range.end.line, 1);
                done();
            }, error => {
                assert.fail(null, null, error);
                done();
            })
        });
    });

    describe("findKeyValueRangeInYAML", () => {
        context('when key is defined', () => {
            it("returns correct range", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYAML(yaml, 'hello', 'en'),
                    [16, 21]
                );
            });

            it("finds singlequoted value", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYAML(yamlSingleQuoted, 'hello', 'en'),
                    [16, 23]
                );
            });

            it("finds doublequoted value", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYAML(yamlDoubleQuoted, 'hello', 'en'),
                    [16, 23]
                );
            });
        });

        context('when key is not defined', () => {
            it('returns null', () => {
                assert.equal(i18nDefinitionProvider.findKeyValueRangeInYAML('', 'hello', 'en'), null, 'handles empty yaml document');
                assert.equal(i18nDefinitionProvider.findKeyValueRangeInYAML('en:', 'hello', 'en'), null, 'handles yaml document without any keys');
                assert.equal(i18nDefinitionProvider.findKeyValueRangeInYAML(incompleteYaml, 'hello', 'en'), null, 'handles valid document without target key');
                assert.equal(i18nDefinitionProvider.findKeyValueRangeInYAML(yaml, 'hello', 'de'), null, 'handles valid document without target key');
            });
        });
    });
});
