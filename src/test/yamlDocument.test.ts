import * as assert from 'assert';
import { YAMLDocument } from '../yamlDocument';

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

const multiKeyYaml = `
en:
    somekey: foo
    otherkey:
        morenesting: bar`;

describe("YAMLDocument", () => {
    describe("findKeyValueRange", () => {
        context('when key is defined', () => {
            it("returns correct range", () => {
                assert.deepEqual(
                    YAMLDocument.parse(yaml).findKeyValueRange('hello', 'en'),
                    [16, 21]
                );
            });

            it("finds singlequoted value", () => {
                assert.deepEqual(
                    YAMLDocument.parse(yamlSingleQuoted).findKeyValueRange('hello', 'en'),
                    [16, 23]
                );
            });

            it("finds doublequoted value", () => {
                assert.deepEqual(
                    YAMLDocument.parse(yamlDoubleQuoted).findKeyValueRange('hello', 'en'),
                    [16, 23]
                );
            });

            it("finds value with flat key", () => {
                assert.deepEqual(
                    YAMLDocument.parse(yamlFlatKeys).findKeyValueRange('hello.world', 'en'),
                    [22, 29]
                );
            });

            it("finds value with all flat keys", () => {
                assert.deepEqual(
                    YAMLDocument.parse(yamlAllFlatKeys).findKeyValueRange('hello.world', 'en'),
                    [17, 24]
                );
            });
        });

        context('when key is not defined', () => {
            it('returns null', () => {
                assert.equal(
                    YAMLDocument.parse('en:').findKeyValueRange('hello', 'en'),
                    null,
                    'handles yaml document without any keys'
                );
                assert.equal(
                    YAMLDocument.parse(incompleteYaml).findKeyValueRange('hello', 'en'),
                    null,
                    'handles valid document without target key'
                );
                assert.equal(
                    YAMLDocument.parse(yaml).findKeyValueRange('hello', 'de'),
                    null,
                    'handles valid document without target key'
                );
            });
        });
    });

    describe('getFullKeyFromOffset', () => {
        it('returns only the first part of the key when first line is selected', () => {
            assert.equal(YAMLDocument.parse(yaml).getFullKeyFromOffset(1), 'en');
        });

        it('returns multiple parts of key, up to and including selected key', () => {
            assert.equal(YAMLDocument.parse(yaml).getFullKeyFromOffset(9), 'en.hello');
        });

        context('with flat-key', () => {
            it('returns full flat key if only prefix portion is selected', () => {
                assert.equal(YAMLDocument.parse(yamlAllFlatKeys).getFullKeyFromOffset(5), 'en.hello.world');
            });

            it('returns the full flat key if final part is selected', () => {
                assert.equal(YAMLDocument.parse(yamlAllFlatKeys).getFullKeyFromOffset(15), 'en.hello.world');
            });
        });

        context('with multi-key file', () => {
            it('returns expected key', () => {
                assert.equal(YAMLDocument.parse(multiKeyYaml).getFullKeyFromOffset(50), 'en.otherkey.morenesting');
            });
        });
    });
});
