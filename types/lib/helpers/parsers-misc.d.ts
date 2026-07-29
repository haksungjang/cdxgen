export declare function parsePubLockData(pubLockData: any, lockFile: any): Promise<never[] | {
    rootList: {
        name: string;
        version: any;
        properties: never[];
    }[];
    pkgList: any[];
}>;
export declare function parsePubYamlData(pubYamlData: any): any[];
export declare function parseHelmYamlData(helmData: any): any[];
export declare function recurseImageNameLookup(keyValueObj: any, pkgList: any, imgList: any): any;
export declare function parseContainerFile(fileContents: any): {
    image: any;
}[];
export declare function parseBitbucketPipelinesFile(fileContents: any): {
    image: any;
}[];
export declare function parseContainerSpecData(dcData: any): any[];
export declare function identifyFlow(processingObj: any): string;
export declare function parsePrivadoFile(f: any): any[];
export declare function parseOpenapiSpecData(oaData: any): any[];
export declare function parseCabalData(cabalData: any): any[];
export declare function parseMixLockData(mixData: any): any[];
export declare function parseGitHubWorkflowData(f: any): Object[];
export declare function parseCloudBuildData(cbwData: any): any[];
export declare function parseConanLockData(conanLockData: any): {
    pkgList: any[];
    dependencies: {};
    parentComponentDependencies: any[];
};
export declare function parseConanData(conanData: any): any[];
export declare function parseColliderLockData(colliderLockData: any, lockFile: any): {
    pkgList: any[];
    dependencies: {};
    parentComponentDependencies: any[];
};
export declare function parseFlakeNix(flakeNixFile: any): {
    pkgList: any[];
    dependencies: any[];
};
export declare function parseFlakeLock(flakeLockFile: any): {
    pkgList: any[];
    dependencies: any[];
};
export declare function parseComposerJson(composerJsonFile: any): {
    rootRequires: any;
    moduleParent: {
        group: any;
        name: any;
        type: string;
        version: any;
        description: any;
        licenses: any[] | undefined;
        purl: string;
        "bom-ref": string;
    };
};
export declare function parseComposerLock(pkgLockFile: any, rootRequires: any): never[] | {
    pkgList: {
        group: any;
        name: any;
        purl: string;
        "bom-ref": string;
        version: any;
        repository: any;
        license: any;
        description: any;
        scope: string;
        properties: {
            name: string;
            value: any;
        }[];
        evidence: {
            identity: {
                field: string;
                confidence: number;
                methods: {
                    technique: string;
                    confidence: number;
                    value: any;
                }[];
            };
        };
    }[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
    rootList: {
        group: any;
        name: any;
        purl: string;
        "bom-ref": string;
        version: any;
        repository: any;
        license: any;
        description: any;
        scope: string;
        properties: {
            name: string;
            value: any;
        }[];
        evidence: {
            identity: {
                field: string;
                confidence: number;
                methods: {
                    technique: string;
                    confidence: number;
                    value: any;
                }[];
            };
        };
    }[];
};
export declare function executeDpkgList(pkgName: any): any;
export declare function executeRpmList(pkgName: any): any;
export declare function executeApkList(pkgName: any): any;
export declare function executeAlpmList(pkgName: any): any;
export declare function executeEqueryList(pkgName: any): any;
export declare function parseSwiftJsonTreeObject(pkgList: any, dependenciesList: any, jsonObject: any, pkgFile: any): string;
export declare function parseSwiftJsonTree(rawOutput: any, pkgFile: any): {
    dependenciesList?: undefined;
    pkgList?: undefined;
    rootList?: undefined;
} | {
    rootList: any[];
    pkgList: any[];
    dependenciesList: any[];
};
export declare function parseSwiftResolved(resolvedFile: any): {
    name: string;
    group: string | null | undefined;
    version: string | null | undefined;
    purl: string;
    "bom-ref": string;
    properties: {
        name: string;
        value: any;
    }[];
    evidence: {
        identity: {
            field: string;
            confidence: number;
            methods: {
                technique: string;
                confidence: number;
                value: any;
            }[];
        };
    };
}[];
export declare function parseCmakeDotFile(dotFile: any, pkgType: any, options?: {}): {
    parentComponent: {};
    pkgList: any[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
};
export declare function parseCmakeLikeFile(cmakeListFile: any, pkgType: any, options?: {}): {
    parentComponent: {};
    pkgList: any[];
};
export declare function parseCUsageSlice(sliceData: any): {} | undefined;
export declare function parseMakeDFile(dfile: any): {};
//# sourceMappingURL=parsers-misc.d.ts.map