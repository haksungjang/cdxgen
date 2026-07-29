export declare function parsePom(pomFile: any): {
    isQuarkus: boolean;
    pomPurl: string | undefined;
    modules: any[] | undefined;
    properties: {
        modelVersion: any;
        mavenRoot: any;
        preserveModelVersion: any;
        version: any;
        groupId: any;
        scm: any;
    };
    dependencies: {
        group: any;
        name: any;
        version: any;
        qualifiers: {
            type: any;
        };
        scope: string | undefined;
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
export declare function parseMavenTreeJson(rawOutput: any, pomFile: any): {
    parentComponent?: undefined;
    pkgList?: undefined;
    dependenciesList?: undefined;
} | {
    parentComponent: {};
    pkgList: any[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
};
export declare function parseMavenTree(rawOutput: any, pomFile: any): {
    parentComponent?: undefined;
    pkgList?: undefined;
    dependenciesList?: undefined;
} | {
    parentComponent: any;
    pkgList: any[];
    dependenciesList: {
        ref: string;
        dependsOn: any[];
    }[];
};
export declare function parseMillDependency(module: any, dependencies: any, relations: any, millRootPath: any): any;
export declare function parseCljDep(rawOutput: any): any[];
export declare function parseLeinDep(rawOutput: any): any;
export declare function parseLeinMap(node: any, keys_cache: any, deps: any): any;
export declare function parseBazelActionGraph(rawOutput: any): any[];
export declare function parseBazelSkyframe(rawOutput: any): any[];
export declare function parseBazelBuild(rawOutput: any): any[];
export declare function parseKVDep(rawOutput: any): any[];
export declare function parseLeiningenData(leinData: any): any[];
export declare function parseEdnData(rawEdnData: any): any[];
//# sourceMappingURL=parsers-jvm.d.ts.map