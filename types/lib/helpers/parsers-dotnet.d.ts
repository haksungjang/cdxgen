export declare function parseNupkg(nupkgFile: any): Promise<never[] | {
    pkgList: any[];
    dependenciesMap: {};
}>;
export declare function parseNuspecData(nupkgFile: any, nuspecData: any): {
    pkgList: any[];
    dependenciesMap: {};
};
export declare function parseCsPkgData(pkgData: any, pkgFile: any, pkgNameVersions?: {}): any[];
export declare function getPropertyGroupTextNodes(propsFiles: any): {};
export declare function parseCsProjData(csProjData: any, projFile: any, pkgNameVersions?: {}, msbuildInstalled?: boolean, pkgVersionLabelCandidates?: {}): any[] | {
    pkgList: {
        group: string;
    }[];
    parentComponent: {
        type: string;
        properties: never[];
    };
    dependencies: any[];
};
export declare function parseCsProjAssetsData(csProjData: any, assetsJsonFile: any): {
    pkgList: any[];
    dependenciesList: any[];
};
export declare function parseCsPkgLockData(csLockData: any, pkgLockFile: any): {
    pkgList: any[];
    dependenciesList: any[];
    rootList: any[];
};
export declare function parsePaketLockData(paketLockData: any, pkgLockFile: any): {
    pkgList: any[];
    dependenciesList: any[];
};
//# sourceMappingURL=parsers-dotnet.d.ts.map