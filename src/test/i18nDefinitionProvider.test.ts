import * as assert from 'assert';
import { I18nDefinitionProvider } from '../i18nDefinitionProvider';
import * as path from 'path';
import * as vscode from 'vscode';

const i18nDefinitionProvider = new I18nDefinitionProvider();
const fixtureDirectory =  path.join(__dirname, "..", "..", "src", "test", 'fixtures', 'config', 'locales');
const yamlPath = path.join(fixtureDirectory, 'en.yml');
const emptyYamlPath = path.join(fixtureDirectory, 'empty.yml');

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
});
