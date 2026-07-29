import { BLOCKED_HOST_ERROR_CODE, cdxgenAgent, createBlockedHostError, createDryRunError, DEBUG_MODE, DRY_RUN_ERROR_CODE, getRecordedActivities, hasDangerousUnicode, isAllowedHttpHost, isDryRun, isDryRunError, isSecureMode, isSensitiveEnvironmentVariableName, readEnvironmentVariable, recordActivity, recordDecisionActivity, recordDiscoveryActivity, recordEnvironmentRead, recordObservedActivity, recordPolicyActivity, recordSensitiveFileRead, recordSymlinkResolution, remoteHostsAccessed, resetActivityContext, resetRecordedActivities, setActivityContext, setDryRunMode } from "./core-activity.js";
import { CARGO_CMD, CDXGEN_SPDX_CREATED_BY, CDXGEN_TEMP_DIR, CLJ_CMD, DOTNET_CMD, FETCH_LICENSE, GCC_CMD, GO_CMD, getJavaCommand, getPythonCommand, includeMavenTestScope, isBun, isDeno, isNode, JAVA_CMD, LEIN_CMD, NODE_CMD, NPM_CMD, PACKAGE_MANAGER_ALIASES, PREFER_MAVEN_DEPS_TREE, PROJECT_TYPE_ALIASES, PYTHON_CMD, PYTHON_EXCLUDED_COMPONENTS, parseMavenArgs, RUBY_CMD, RUSTC_CMD, SEARCH_MAVEN_ORG, SWIFT_CMD, shouldFetchLicense, shouldFetchPackageMetadata, shouldFetchVCS, TABLE_BORDER_STYLE, YARN_CMD } from "./core-env.js";
import { checksumFile, commandsExecuted, getAllFiles, getAllFilesWithIgnore, getTimestamp, getTmpDir, MAX_BUFFER, multiChecksumFile, safeCopyFileSync, safeExistsSync, safeExtractArchive, safeMkdirSync, safeMkdtempSync, safeRmSync, safeSpawnSync, safeUnlinkSync, safeWriteSync, TIMEOUT_MS } from "./core-fs.js";
import { buildObjectForCocoaPod, createUVLock, executeAtom, executePodCommand, findAppModules, getAtomCommand, getMavenCommand, getMillCommand, getPipFrozenTree, getPipTreeForPackages, getPyModules, parseCocoaDependency, parsePodfileLock, parsePodfileTargets } from "./core-misc-a.js";
import { addEvidenceForDotnet, addEvidenceForImports, attachIdentityTools, collectExecutables, collectSharedLibs, convertOSQueryResults, extractPathEnv, extractToolRefs, getCppModules, getDefaultBomAuditCategories, getOSPackageForFile, getRuntimeInformation, hasAnyProjectType, isFeatureEnabled, isPackageManagerAllowed, isPartialTree, isValidDriveRoot, isValidIriReference, recomputeScope, retrieveCdxgenPluginVersion, retrieveCdxgenVersion, shouldRunPredictiveBomAudit, toCamel } from "./core-misc-b.js";
import { collectJarNS, collectMvnDependencies, componentSorter, convertJarNSToPackages, getJarClasses, getPomPropertiesFromMavenDir, inferJarGroupFromManifest, parseJarManifest, parsePomProperties, parsePomXml, readZipEntry, trimJarGroupSuffix } from "./deps.js";
import { composePomXmlUrl, extractJarArchive, extractLicenseCommentFromPomXml, fetchPomXml, fetchPomXmlAsJson, findLocalMvnArtifact, getCratesMetadata, getDartMetadata, getGithubUrlParts, getGoPkgLicense, getMvnMetadata, getNpmMetadata, getNugetMetadata, getPyMetadata, getRepoLicense, getSwiftPackageMetadata, guessPypiMatchingVersion, metadata_cache, parseBdistMetadata, parseLicenseEntryOrArrayFromPomXml, repoMetadataToGitHubApiUrl, toGitHubApiUrl } from "./ecosystems.js";
import { createNpmWorkspacePurl } from "./npmutils.js";
import { getPropertyGroupTextNodes, parseCsPkgData, parseCsPkgLockData, parseCsProjAssetsData, parseCsProjData, parseNupkg, parseNuspecData, parsePaketLockData } from "./parsers-dotnet.js";
import { getGoPkgComponent, parseGoListDep, parseGoModData, parseGoModGraph, parseGoModulesTxt, parseGoModWhy, parseGopkgData, parseGosumData, parseGoVersionData } from "./parsers-go.js";
import { findPnpmPackagePath, getVersionNumPnpm, parseBowerJson, parseMinJs, parseNodeShrinkwrap, parsePackageJsonName, parsePkgJson, parsePkgLock, parsePnpmLock, parsePnpmWorkspace, parseYarnLock, parseYarnWorkspace, pnpmMetadata, splitCommandArgs, yarnLockToIdentMap } from "./parsers-js.js";
import { parseBazelActionGraph, parseBazelBuild, parseBazelSkyframe, parseCljDep, parseEdnData, parseKVDep, parseLeinDep, parseLeiningenData, parseLeinMap, parseMavenTree, parseMavenTreeJson, parseMillDependency, parsePom } from "./parsers-jvm.js";
import { executeAlpmList, executeApkList, executeDpkgList, executeEqueryList, executeRpmList, identifyFlow, parseBitbucketPipelinesFile, parseCabalData, parseCloudBuildData, parseCmakeDotFile, parseCmakeLikeFile, parseColliderLockData, parseComposerJson, parseComposerLock, parseConanData, parseConanLockData, parseContainerFile, parseContainerSpecData, parseCUsageSlice, parseFlakeLock, parseFlakeNix, parseGitHubWorkflowData, parseHelmYamlData, parseMakeDFile, parseMixLockData, parseOpenapiSpecData, parsePrivadoFile, parsePubLockData, parsePubYamlData, parseSwiftJsonTree, parseSwiftJsonTreeObject, parseSwiftResolved, recurseImageNameLookup } from "./parsers-misc.js";
import { derivePythonLockMetadataFileName, generatePixiLockFile, parsePiplockData, parsePixiLockFile, parsePixiTomlFile, parsePyLockData, parsePyProjectTomlFile, parsePyRequiresDist, parseReqEnvMarkers, parseReqFile, parseSetupPyFile } from "./parsers-python.js";
import { parseCargoAuditableData, parseCargoData, parseCargoDependencyData, parseCargoManifestDependencyData, parseCargoTomlData } from "./parsers-rust.js";
import { dirNameStr, isMac, isWin } from "./paths.js";
import { encodeForPurl, locateGenericPackage, mapConanPkgRefToPurlStringAndNameAndVersion, purlFromUrlString } from "./purl.js";
import { addLicenseText, adjustLicenseInformation, findLicenseId, getKnownLicense, getLicenses, guessLicenseId, isSpdxLicenseExpression, readLicenseText } from "./spdx.js";
import { CDXGEN_VERSION, frameworksList } from "./state.js";
export { addEvidenceForDotnet, addEvidenceForImports, addLicenseText, adjustLicenseInformation, attachIdentityTools, BLOCKED_HOST_ERROR_CODE, buildObjectForCocoaPod, CARGO_CMD, CDXGEN_SPDX_CREATED_BY, CDXGEN_TEMP_DIR, CDXGEN_VERSION, CLJ_CMD, cdxgenAgent, checksumFile, collectExecutables, collectJarNS, collectMvnDependencies, collectSharedLibs, commandsExecuted, componentSorter, composePomXmlUrl, convertJarNSToPackages, convertOSQueryResults, createBlockedHostError, createDryRunError, createNpmWorkspacePurl, createUVLock, DEBUG_MODE, DOTNET_CMD, DRY_RUN_ERROR_CODE, derivePythonLockMetadataFileName, dirNameStr, encodeForPurl, executeAlpmList, executeApkList, executeAtom, executeDpkgList, executeEqueryList, executePodCommand, executeRpmList, extractJarArchive, extractLicenseCommentFromPomXml, extractPathEnv, extractToolRefs, FETCH_LICENSE, fetchPomXml, fetchPomXmlAsJson, findAppModules, findLicenseId, findLocalMvnArtifact, findPnpmPackagePath, frameworksList, GCC_CMD, GO_CMD, generatePixiLockFile, getAllFiles, getAllFilesWithIgnore, getAtomCommand, getCppModules, getCratesMetadata, getDartMetadata, getDefaultBomAuditCategories, getGithubUrlParts, getGoPkgComponent, getGoPkgLicense, getJarClasses, getJavaCommand, getKnownLicense, getLicenses, getMavenCommand, getMillCommand, getMvnMetadata, getNpmMetadata, getNugetMetadata, getOSPackageForFile, getPipFrozenTree, getPipTreeForPackages, getPomPropertiesFromMavenDir, getPropertyGroupTextNodes, getPyMetadata, getPyModules, getPythonCommand, getRecordedActivities, getRepoLicense, getRuntimeInformation, getSwiftPackageMetadata, getTimestamp, getTmpDir, getVersionNumPnpm, guessLicenseId, guessPypiMatchingVersion, hasAnyProjectType, hasDangerousUnicode, identifyFlow, includeMavenTestScope, inferJarGroupFromManifest, isAllowedHttpHost, isBun, isDeno, isDryRun, isDryRunError, isFeatureEnabled, isMac, isNode, isPackageManagerAllowed, isPartialTree, isSecureMode, isSensitiveEnvironmentVariableName, isSpdxLicenseExpression, isValidDriveRoot, isValidIriReference, isWin, JAVA_CMD, LEIN_CMD, locateGenericPackage, MAX_BUFFER, mapConanPkgRefToPurlStringAndNameAndVersion, metadata_cache, multiChecksumFile, NODE_CMD, NPM_CMD, PACKAGE_MANAGER_ALIASES, PREFER_MAVEN_DEPS_TREE, PROJECT_TYPE_ALIASES, PYTHON_CMD, PYTHON_EXCLUDED_COMPONENTS, parseBazelActionGraph, parseBazelBuild, parseBazelSkyframe, parseBdistMetadata, parseBitbucketPipelinesFile, parseBowerJson, parseCabalData, parseCargoAuditableData, parseCargoData, parseCargoDependencyData, parseCargoManifestDependencyData, parseCargoTomlData, parseCljDep, parseCloudBuildData, parseCmakeDotFile, parseCmakeLikeFile, parseCocoaDependency, parseColliderLockData, parseComposerJson, parseComposerLock, parseConanData, parseConanLockData, parseContainerFile, parseContainerSpecData, parseCsPkgData, parseCsPkgLockData, parseCsProjAssetsData, parseCsProjData, parseCUsageSlice, parseEdnData, parseFlakeLock, parseFlakeNix, parseGitHubWorkflowData, parseGoListDep, parseGoModData, parseGoModGraph, parseGoModulesTxt, parseGoModWhy, parseGopkgData, parseGosumData, parseGoVersionData, parseHelmYamlData, parseJarManifest, parseKVDep, parseLeinDep, parseLeiningenData, parseLeinMap, parseLicenseEntryOrArrayFromPomXml, parseMakeDFile, parseMavenArgs, parseMavenTree, parseMavenTreeJson, parseMillDependency, parseMinJs, parseMixLockData, parseNodeShrinkwrap, parseNupkg, parseNuspecData, parseOpenapiSpecData, parsePackageJsonName, parsePaketLockData, parsePiplockData, parsePixiLockFile, parsePixiTomlFile, parsePkgJson, parsePkgLock, parsePnpmLock, parsePnpmWorkspace, parsePodfileLock, parsePodfileTargets, parsePom, parsePomProperties, parsePomXml, parsePrivadoFile, parsePubLockData, parsePubYamlData, parsePyLockData, parsePyProjectTomlFile, parsePyRequiresDist, parseReqEnvMarkers, parseReqFile, parseSetupPyFile, parseSwiftJsonTree, parseSwiftJsonTreeObject, parseSwiftResolved, parseYarnLock, parseYarnWorkspace, pnpmMetadata, purlFromUrlString, RUBY_CMD, RUSTC_CMD, readEnvironmentVariable, readLicenseText, readZipEntry, recomputeScope, recordActivity, recordDecisionActivity, recordDiscoveryActivity, recordEnvironmentRead, recordObservedActivity, recordPolicyActivity, recordSensitiveFileRead, recordSymlinkResolution, recurseImageNameLookup, remoteHostsAccessed, repoMetadataToGitHubApiUrl, resetActivityContext, resetRecordedActivities, retrieveCdxgenPluginVersion, retrieveCdxgenVersion, SEARCH_MAVEN_ORG, SWIFT_CMD, safeCopyFileSync, safeExistsSync, safeExtractArchive, safeMkdirSync, safeMkdtempSync, safeRmSync, safeSpawnSync, safeUnlinkSync, safeWriteSync, setActivityContext, setDryRunMode, shouldFetchLicense, shouldFetchPackageMetadata, shouldFetchVCS, shouldRunPredictiveBomAudit, splitCommandArgs, TABLE_BORDER_STYLE, TIMEOUT_MS, toCamel, toGitHubApiUrl, trimJarGroupSuffix, YARN_CMD, yarnLockToIdentMap, };
/**
 * Function to validate an externalReference URL for conforming to the JSON schema or bomLink
 * https://github.com/CycloneDX/cyclonedx-core-java/blob/75575318b268dda9e2a290761d7db11b4f414255/src/main/resources/bom-1.5.schema.json#L1140
 * https://datatracker.ietf.org/doc/html/rfc3987#section-2.2
 * https://cyclonedx.org/capabilities/bomlink/
 *
 * @param {String} iri IRI to validate
 *
 * @returns {Boolean} Flag indicating whether the supplied URL is valid or not
 *
 */
/**
 * Method to check if a given dependency tree is partial or not.
 *
 * @param {Array} dependencies List of dependencies
 * @param {Number} componentsCount Number of components
 * @returns {Boolean} True if the dependency tree lacks any non-root parents without children. False otherwise.
 */
/**
 * Re-compute and set the scope based on the dependency tree
 *
 * @param {Array} pkgList List of components
 * @param {Array} dependencies List of dependencies
 *
 * @returns {Array} Updated list
 */
/**
 * Function to parse a list of environment variables to identify the paths containing executable binaries
 *
 * @param envValues {Array[String]} Environment variables list
 * @returns {Array[String]} Binary Paths identified from the environment variables
 */
/**
 * Collect all executable files from the given list of binary paths
 *
 * @param basePath Base directory
 * @param binPaths {Array[String]} Paths containing potential binaries
 * @param excludePaths {Array[String]} Container-relative paths that should be excluded from the result set
 * @return {Array[String]} List of executables
 */
/**
 * Collect all shared library files from the given list of paths
 *
 * @param basePath Base directory
 * @param libPaths {Array[String]} Paths containing potential libraries
 * @param ldConf {String} Config file used by ldconfig to locate additional paths
 * @param ldConfDirPattern {String} Config directory that can contain more .conf files for ldconfig
 * @param excludePaths {Array[String]} Container-relative paths that should be excluded from the result set
 *
 * @return {Array[String]} List of executables
 */
/**
 * Get information about the runtime.
 *
 * @returns {Object} Object containing the name and version of the runtime
 */
/**
 * Checks for dangerous Unicode characters that could enable homograph attacks
  if (zeroWidthChars.test(str)) {
    return true;
  }

  // Check for control characters (except common ones like \n, \r, \t)
  const controlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;
  return controlChars.test(str);
}
// biome-ignore-end lint/suspicious/noControlCharactersInRegex: validation

/**
 * Validates that a root is a legitimate Windows drive letter format
 *
 * @param {string} root Root to validate
 * @returns {boolean} true if valid drive format
 */
/**
 * Get version and runtime information
 */
/**
 * Retrieve the version of the cdxgen plugins binary package from package.json.
 *
 * Reads the local package.json and searches the `optionalDependencies` for a package
 * whose name starts with `@cdxgen/cdxgen-plugins-bin`, returning its declared version.
 *
 * @returns {string|undefined} Version string of the plugins binary package, or undefined if not found
 */
/**
 * Helper to split a command line string into an array of arguments,
 * respecting single and double quotes.
 *
 * @param {String} commandString The full command line string
 * @returns {Array<String>} Array of tokens
 */
/**
 * Convert hyphenated strings to camel case.
 *
 * @param {String} str String to convert
 * @returns {String} camelCased string
 */
//# sourceMappingURL=utils.d.ts.map