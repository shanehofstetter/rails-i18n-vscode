import { flatten } from "flat"
import { LookupMap, Translations } from "./i18nTree";

export class LookupMapGenerator {

    private i18nTree;

    public constructor(i18nTree: Translations) {
        this.i18nTree = i18nTree;
    }

    public generateLookupMap(): LookupMap {
        return flatten(this.i18nTree);
    }
}
