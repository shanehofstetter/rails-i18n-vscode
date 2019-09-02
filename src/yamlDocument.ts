import { Translation } from "./i18nTree";

export interface YAMLDocument {
    contents: { items: YAMLDocumentItem[] };
    errors: Array<any>;
    toJSON(arg?: any);
}

export interface YAMLDocumentItem {
    stringKey: string;
    value: any;
}

export function parseYAMLDocument(document: YAMLDocument): Translation {
    if (document.errors.length > 0) throw document.errors[0]
    return document.toJSON()
}
