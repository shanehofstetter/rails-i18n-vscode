import * as assert from 'assert';
import { I18nKeyDetector } from '../i18nKeyDetector';
import { RailsConfigFileParser } from '../railsConfigFileParser';
import * as vscode from 'vscode';
import * as path from 'path';

const fixturePath = path.join(__dirname, "..", "..", "src", "test", 'fixtures');

describe("Rails Config File Parser", () => {
    describe("detectConfigurationInUri", () => {
        it("returns configured locale", (done) => {
            const parser = new RailsConfigFileParser();
            const configFileUri = vscode.Uri.file(path.join(fixturePath, 'config', 'application.rb'));
            parser.detectConfigurationInUri(configFileUri).then(locale => {
                assert.equal(locale, "en");
                done();
            }, error => {
                assert.fail(null, "en", error.message);
                done();
            })
        });
    });
});
