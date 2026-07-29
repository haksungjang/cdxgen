export declare function parsePkgJson(pkgJsonFile: any, simple?: boolean, securityProps?: boolean): Promise<any[]>;
export declare function parsePkgLock(pkgLockFile: any, options?: {}): Promise<{
    pkgList: any;
    dependenciesList: any;
}>;
export declare function yarnLockToIdentMap(lockData: any): {};
export declare function parseYarnLock(yarnLockFile: any, parentComponent?: null, workspacePackages?: any[], workspaceSrcFiles?: {}, _workspaceDirectDeps?: {}, depsWorkspaceRefs?: {}): Promise<{
    pkgList: any[];
    dependenciesList: any[];
}>;
export declare function parseNodeShrinkwrap(swFile: any): Promise<any[]>;
export declare function getVersionNumPnpm(depPkg: any, relativePath: any): Promise<any>;
export declare function parsePnpmWorkspace(workspaceFile: any): {
    excludePackages?: undefined;
    packagePatterns?: undefined;
    packages?: undefined;
    catalogs?: undefined;
} | {
    excludePackages: any;
    packagePatterns: any;
    packages: any;
    catalogs: any;
};
export declare function parseYarnWorkspace(packageJsonFile: any): {
    packages?: undefined;
} | {
    packages: any;
};
export declare function findPnpmPackagePath(baseDir: any, packageName: any, version: any): any;
export declare function pnpmMetadata(pkgList: any, lockFilePath: any): Promise<any>;
export declare function parsePnpmLock(pnpmLock: any, parentComponent?: null, workspacePackages?: any[], workspaceSrcFiles?: {}, _workspaceCatalogs?: {}, _workspaceDirectDeps?: {}, depsWorkspaceRefs?: {}, projectRoot?: undefined): Promise<{
    dependenciesList?: undefined;
    parentSubComponents?: undefined;
    pkgList?: undefined;
} | {
    pkgList: any;
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
    parentSubComponents: {
        group: any;
        name: any;
        version: any;
        type: string;
        purl: string;
        "bom-ref": string;
    }[];
}>;
export declare function parseBowerJson(bowerJsonFile: any): Promise<any[]>;
export declare function parseMinJs(minJsFile: any): Promise<any[]>;
export declare function parsePackageJsonName(name: any): {
    scope: null;
    fullName: string;
    projectName: string;
    moduleName: string;
};
export declare function splitCommandArgs(commandString: any): string[];
//# sourceMappingURL=parsers-js.d.ts.map