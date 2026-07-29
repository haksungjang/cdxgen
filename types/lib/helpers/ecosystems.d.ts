export declare let metadata_cache: {};
/**
 * Internal helper to reset metadata_cache. Used by parseGoModData (still in
 * utils.js until batch 6) because ESM forbids reassigning an imported binding.
 * NOT re-exported through the utils.js barrel.
 */
export declare function _clearMetadataCache(): void;
export declare function getSwiftPackageMetadata(pkgList: any): Promise<any[]>;
export declare function getNpmMetadata(pkgList: any, registryUrl: any): Promise<any[]>;
export declare function findLocalMvnArtifact(group: any, name: any, version: any): {} | null;
export declare function getMvnMetadata(pkgList: any, jarNSMapping?: {}, force?: boolean): Promise<any>;
export declare function composePomXmlUrl({ urlPrefix, group, name, version }: {
    group: any;
    name: any;
    urlPrefix: any;
    version: any;
}): string;
export declare function fetchPomXmlAsJson({ urlPrefix, group, name, version }: {
    group: any;
    name: any;
    urlPrefix: any;
    version: any;
}): Promise<any>;
export declare function fetchPomXml({ urlPrefix, group, name, version }: {
    group: any;
    name: any;
    urlPrefix: any;
    version: any;
}): Promise<any>;
export declare function parseLicenseEntryOrArrayFromPomXml(license: any): any[] | undefined;
export declare function extractLicenseCommentFromPomXml({ urlPrefix, group, name, version, }: {
    group: any;
    name: any;
    urlPrefix: any;
    version: any;
}): Promise<any>;
export declare function guessPypiMatchingVersion(versionsList: any, versionSpecifiers: any): any;
export declare function getPyMetadata(pkgList: any, fetchDepsInfo: any): Promise<any>;
export declare function parseBdistMetadata(mDataFile: any, rawMetadata?: undefined): {
    name: string;
    version: string;
    description: string;
    author: string;
    licenses: never[];
    externalReferences: never[];
    properties: never[];
}[];
export declare function createExternalReferenceKey(reference: any): string;
export declare function mergeExternalReferences(component: any, references: any): void;
export declare function repoMetadataToGitHubApiUrl(repoMetadata: any): string | undefined;
export declare function getGithubUrlParts(repoUrl: any): any;
export declare function toGitHubApiUrl(repoUrl: any, repoMetadata: any): string | undefined;
export declare function getRepoLicense(repoUrl: any, repoMetadata: any): Promise<{
    url: any;
} | undefined>;
export declare function getGoPkgLicense(repoMetadata: any): Promise<any>;
export declare function getGoPkgVCSUrl(group: any, name: any): Promise<any>;
export declare function getCratesMetadata(pkgList: any): Promise<any[]>;
export declare function getDartMetadata(pkgList: any): Promise<any[]>;
export declare function normalizeCargoIntegrity(integrity: any): string | undefined;
export declare function extractJarArchive(jarFile: any, tempDir: any, jarNSMapping?: {}): Promise<any[]>;
export declare function getNugetMetadata(pkgList: any, dependencies?: undefined): Promise<{
    pkgList: any[];
    dependencies: any[];
}>;
//# sourceMappingURL=ecosystems.d.ts.map