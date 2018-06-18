import { flatten } from "flat"

export class LookupMapGenerator {

    private i18nTree;
    private lookupMap = {};

    public constructor(i18nTree: object) {
        this.i18nTree = i18nTree;
    }

    public generateLookupMap(): object {
        return flatten(this.i18nTree);
    }
}