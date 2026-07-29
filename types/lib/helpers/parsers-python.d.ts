export declare function parsePyRequiresDist(dist_string: any): {
    name: string;
    version: string;
} | undefined;
export declare function parsePiplockData(lockData: any): Promise<any>;
export declare function addComponentProperty(component: any, name: any, value: any): void;
export declare function parsePyProjectTomlFile(tomlFile: any): {
    parentComponent?: undefined;
    poetryMode?: undefined;
    uvMode?: undefined;
    hatchMode?: undefined;
    workspacePaths?: undefined;
    directDepsKeys?: undefined;
    groupDepsKeys?: undefined;
    dependencySourceMap?: undefined;
} | {
    parentComponent: {
        type: string;
        "bom-ref": any;
        purl: any;
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
    };
    poetryMode: boolean;
    uvMode: boolean;
    hatchMode: boolean;
    workspacePaths: any[];
    directDepsKeys: {};
    groupDepsKeys: {};
    dependencySourceMap: {};
};
export declare function derivePythonLockMetadataFileName(fileEntry: any): any;
export declare function parsePyLockData(lockData: any, lockFile: any, pyProjectFile: any): Promise<{
    parentComponent?: undefined;
    pkgList: any[];
    dependenciesList: any[];
    rootList?: undefined;
    pyLockProperties?: undefined;
    workspaceWarningShown?: undefined;
} | {
    parentComponent: {
        type: string;
        "bom-ref": any;
        purl: any;
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
    } | undefined;
    pkgList: any;
    rootList: {
        name: any;
        version: any;
        description: any;
        properties: never[];
    }[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
    pyLockProperties: any[];
    workspaceWarningShown: boolean;
}>;
export declare function parseReqFile(reqFile: any, fetchDepsInfo?: boolean): Promise<any>;
export declare function parseReqEnvMarkers(markersStr: any): ({
    operator: any;
    variable?: undefined;
    value?: undefined;
    raw?: undefined;
} | {
    variable: any;
    operator: any;
    value: any;
    raw?: undefined;
} | {
    variable?: undefined;
    operator?: undefined;
    value?: undefined;
    raw: any;
})[];
export declare function parseSetupPyFile(setupPyData: any): Promise<any>;
export declare function parsePixiLockFile(pixiLockFileName: any, path: any): {
    pkgList: any;
    formulationList: any[];
    rootList: any[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
    frozen: boolean;
};
export declare function parsePixiTomlFile(pixiToml: any): {};
export declare function generatePixiLockFile(_path: any): void;
//# sourceMappingURL=parsers-python.d.ts.map