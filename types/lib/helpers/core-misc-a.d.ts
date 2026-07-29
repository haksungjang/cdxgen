export declare function getPyModules(src: any, epkgList: any, options: any): Promise<{
    allImports: {};
    pkgList: any;
    dependenciesList: {
        ref: string;
        dependsOn: never[];
    }[];
    modList: any;
}>;
export declare function getMillCommand(srcPath: any): string;
export declare function parsePodfileLock(podfileLock: any, projectPath: any): Promise<Map<any, any>>;
export declare function parsePodfileTargets(target: any, allDependencies: any, prefix?: undefined): void;
export declare function parseCocoaDependency(dependencyLine: any, parseVersion?: boolean): {
    name: any;
};
export declare function executePodCommand(parameters: any, path: any, options: any): Object;
export declare function buildObjectForCocoaPod(dependency: any, options: any, type?: string): Promise<any>;
export declare function getMavenCommand(srcPath: any, rootPath: any): string;
export declare function getAtomCommand(): any;
export declare function executeAtom(src: any, args: any, extra_env?: {}): boolean;
export declare function findAppModules(src: any, language: any, methodology?: string, slicesFile?: undefined, options?: {}): any;
export declare function createUVLock(basePath: any, options: any): void;
export declare function getPipFrozenTree(basePath: any, reqOrSetupFile: any, tempVenvDir: any, parentComponent: any, projectRoot: any): Promise<{
    pkgList: {
        name: any;
        version: any;
        purl: string;
        type: string;
        "bom-ref": string;
        scope: string | undefined;
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
        properties: {
            name: string;
            value: any;
        }[];
    }[];
    formulationList: {
        name: any;
        version: any;
        purl: string;
        type: string;
        "bom-ref": string;
        scope: string | undefined;
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
        properties: {
            name: string;
            value: any;
        }[];
    }[];
    rootList: {
        name: any;
        version: any;
        purl: string;
        "bom-ref": string;
    }[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
    frozen: boolean;
}>;
export declare function getPipTreeForPackages(basePath: any, pkgList: any, tempVenvDir: any, parentComponent: any): {
    failedPkgList?: undefined;
    rootList?: undefined;
    dependenciesList?: undefined;
} | {
    failedPkgList: any[];
    rootList: {
        name: any;
        version: any;
        purl: string;
        "bom-ref": string;
    }[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
};
//# sourceMappingURL=core-misc-a.d.ts.map