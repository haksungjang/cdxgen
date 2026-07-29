export declare function getGoPkgComponent(group: any, name: any, version: any, hash: any): Promise<{
    group: any;
    name: any;
    version: any;
    _integrity: any;
    license: any;
    purl: string;
    "bom-ref": string;
}>;
export declare function parseGoModData(goModData: any, gosumMap: any): Promise<{
    parentComponent?: undefined;
    pkgList?: undefined;
    rootList?: undefined;
} | {
    parentComponent: {
        name: any;
        type: string;
        purl: string;
        "bom-ref": string;
        properties: {
            name: string;
            value: any;
        }[];
    };
    pkgList: {
        group: any;
        name: any;
        version: any;
        _integrity: any;
        license: any;
        purl: string;
        "bom-ref": string;
    }[];
    rootList: {
        group: any;
        name: any;
        version: any;
        _integrity: any;
        license: any;
        purl: string;
        "bom-ref": string;
    }[];
}>;
export declare function parseGoModulesTxt(txtFile: any, gosumMap: any): Promise<any[]>;
export declare function parseGoListDep(rawOutput: any, gosumMap: any): Promise<{
    parentComponent: {};
    pkgList: {
        group: any;
        name: any;
        version: any;
        _integrity: any;
        license: any;
        purl: string;
        "bom-ref": string;
    }[];
}>;
export declare function parseGoModGraph(rawOutput: any, goModFile: any, gosumMap: any, epkgList?: any[], parentComponent?: {}): Promise<{
    pkgList: any[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
    parentComponent: any;
    rootList: any;
}>;
export declare function parseGoModWhy(rawOutput: any): undefined;
export declare function parseGosumData(gosumData: any): Promise<any[]>;
export declare function parseGopkgData(gopkgData: any): Promise<any[]>;
export declare function parseGoVersionData(buildInfoData: any): Promise<any[]>;
//# sourceMappingURL=parsers-go.d.ts.map