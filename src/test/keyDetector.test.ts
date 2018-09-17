import * as assert from 'assert';
import { I18nKeyDetector } from '../i18nKeyDetector';

describe("Key Detector", () => {
    describe("makeAbsoluteKey", () => {
        context("when already absolute", () => {
            it(" returns given key", () => {
                assert.equal(
                    I18nKeyDetector.makeAbsoluteKey("hello.world", ""),
                    "hello.world"
                );
            });
        });

        context("with relative key and filename", () => {
            it("adds key parts based on file path", () => {
                assert.equal(
                    I18nKeyDetector.makeAbsoluteKey(".world", "xy/test/app/views/hello/show.html.haml"),
                    "hello.show.world"
                );
            });
        })
    });
});
