export declare function isFeatureEnabled(cliOptions: any, feature: any): boolean;
export declare function hasAnyProjectType(projectTypes: any, options: any, defaultStatus?: boolean): any;
export declare function shouldRunPredictiveBomAudit(options: any, commandPath: any): boolean;
export declare function getDefaultBomAuditCategories(options: any, commandPath: any): string | undefined;
export declare function isPackageManagerAllowed(name: any, conflictingManagers: any, options: any): boolean;
export declare function convertOSQueryResults(queryCategory: any, queryObj: any, results: any, enhance?: boolean): {
    name: any;
    group: string;
    version: any;
    description: any;
    publisher: any;
    "bom-ref": string;
    purl: string | undefined;
    scope: any;
    type: any;
}[];
export declare function extractToolRefs(tools: any, predicate: any): any[];
export declare function attachIdentityTools(subjects: any, toolRefs: any): any;
export declare function addEvidenceForImports(pkgList: any, allImports: any, allExports: any, deep: any): Promise<any>;
export declare function getOSPackageForFile(afile: any, osPkgsList: any): any;
export declare function getCppModules(src: any, options: any, osPkgsList: any, epkgList: any): {
    parentComponent: {} | undefined;
    pkgList: any[];
    dependenciesList: {
        ref: any;
        dependsOn: any[];
    }[];
};
export declare function addEvidenceForDotnet(pkgList: any, slicesFile: any): any;
export declare function isValidIriReference(iri: any): boolean;
export declare function isPartialTree(dependencies: any, componentsCount?: number): boolean;
export declare function recomputeScope(pkgList: any, dependencies: any): any;
export declare function extractPathEnv(envValues: any): any[];
export declare function collectExecutables(basePath: any, binPaths: any, excludePaths?: any[]): any[];
export declare function collectSharedLibs(basePath: any, libPaths: any, ldConf: any, ldConfDirPattern: any, excludePaths?: any[]): string[];
export declare function getRuntimeInformation(): {
    runtime: string;
    version: any;
    components: {
        name: string;
        version: any;
        description: string;
        type: string;
        scope: string;
        purl: string;
        "bom-ref": string;
    }[] | {
        name: any;
        type: string;
        scope: string;
        purl: string;
        "bom-ref": string;
    }[];
};
export declare function isValidDriveRoot(root: any): boolean;
export declare function retrieveCdxgenVersion(): string;
export declare function retrieveCdxgenPluginVersion(): any;
export declare function toCamel(str: any): any;
//# sourceMappingURL=core-misc-b.d.ts.map