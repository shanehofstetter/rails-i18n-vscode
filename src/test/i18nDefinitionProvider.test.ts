import * as assert from 'assert';
import { I18nDefinitionProvider } from '../i18nDefinitionProvider';
import * as path from 'path';
import * as vscode from 'vscode';
import YAML from 'yaml';
import { YAMLDocument } from '../yamlDocument';

const i18nDefinitionProvider = new I18nDefinitionProvider();
const fixtureDirectory =  path.join(__dirname, "..", "..", "src", "test", 'fixtures', 'config', 'locales');
const yamlPath = path.join(fixtureDirectory, 'en.yml');
const emptyYamlPath = path.join(fixtureDirectory, 'empty.yml');

const yaml = `
en:
    hello: hello`;

const yamlSingleQuoted = `
en:
    hello: 'hello'`;

const yamlDoubleQuoted = `
en:
    hello: "hello"`;

const yamlFlatKeys = `
en:
    hello.world: "hello"`;

const yamlAllFlatKeys = `
en.hello.world: "hello"`;

const incompleteYaml = `
en:
    someotherkey: hello`;

const toYAMLDocument = (text: string): YAMLDocument => {
    return YAML.parseDocument(text);
}

describe("Definition Provider", () => {
    describe('findKeyValueLocationInDocument', () => {
        it('returns the correct range', (done) => {
            const uri = vscode.Uri.file(yamlPath);
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

        it('returns null when file is empty', (done) => {
            const uri = vscode.Uri.file(emptyYamlPath);
            i18nDefinitionProvider.findKeyValueLocationInDocument(uri, 'hello', 'en').then(location => {
                assert.equal(location, null);
                done();
            }, error => {
                assert.fail(null, null, error);
                done();
            })
        })
    });

    describe("findKeyValueRangeInYAML", () => {
        context('when key is defined', () => {
            it("returns correct range", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(yaml), 'hello', 'en'),
                    [16, 21]
                );
            });

            it("finds singlequoted value", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(yamlSingleQuoted), 'hello', 'en'),
                    [16, 23]
                );
            });

            it("finds doublequoted value", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(yamlDoubleQuoted), 'hello', 'en'),
                    [16, 23]
                );
            });

            it("finds value with flat key", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(yamlFlatKeys), 'hello.world', 'en'),
                    [22, 29]
                );
            });

            it("finds value with all flat keys", () => {
                assert.deepEqual(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(yamlAllFlatKeys), 'hello.world', 'en'),
                    [17, 24]
                );
            });
        });

        context('when key is not defined', () => {
            it('returns null', () => {
                assert.equal(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument('en:'), 'hello', 'en'),
                    null,
                    'handles yaml document without any keys'
                );
                assert.equal(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(incompleteYaml), 'hello', 'en'),
                    null,
                    'handles valid document without target key'
                );
                assert.equal(
                    i18nDefinitionProvider.findKeyValueRangeInYamlDocument(toYAMLDocument(yaml), 'hello', 'de'),
                    null,
                    'handles valid document without target key'
                );
            });
        });
    });
});
