import * as assert from 'assert';
import { KeyDetector } from '../keyDetector';

describe("Key Detector", () => {
    describe("makeAbsoluteKey", () => {
        context("when already absolute", () => {
            it(" returns given key", () => {
                assert.equal(
                    KeyDetector.makeAbsoluteKey("hello.world", ""),
                    "hello.world"
                );
            });
        });

        context("with relative key and filename", () => {
            it("adds key parts based on file path", () => {
                assert.equal(
                    KeyDetector.makeAbsoluteKey(".world", "xy/test/app/views/hello/show.html.haml"),
                    "hello.show.world"
                );
            });
        })
    });
});
