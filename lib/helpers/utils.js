import {
  BLOCKED_HOST_ERROR_CODE,
  cdxgenAgent,
  createBlockedHostError,
  createDryRunError,
  DEBUG_MODE,
  DRY_RUN_ERROR_CODE,
  getRecordedActivities,
  hasDangerousUnicode,
  isAllowedHttpHost,
  isDryRun,
  isDryRunError,
  isSecureMode,
  isSensitiveEnvironmentVariableName,
  readEnvironmentVariable,
  recordActivity,
  recordDecisionActivity,
  recordDiscoveryActivity,
  recordEnvironmentRead,
  recordObservedActivity,
  recordPolicyActivity,
  recordSensitiveFileRead,
  recordSymlinkResolution,
  remoteHostsAccessed,
  resetActivityContext,
  resetRecordedActivities,
  setActivityContext,
  setDryRunMode,
} from "./core-activity.js";
import {
  CARGO_CMD,
  CDXGEN_SPDX_CREATED_BY,
  CDXGEN_TEMP_DIR,
  CLJ_CMD,
  DOTNET_CMD,
  FETCH_LICENSE,
  GCC_CMD,
  GO_CMD,
  getJavaCommand,
  getPythonCommand,
  includeMavenTestScope,
  isBun,
  isDeno,
  isNode,
  JAVA_CMD,
  LEIN_CMD,
  NODE_CMD,
  NPM_CMD,
  PACKAGE_MANAGER_ALIASES,
  PREFER_MAVEN_DEPS_TREE,
  PROJECT_TYPE_ALIASES,
  PYTHON_CMD,
  PYTHON_EXCLUDED_COMPONENTS,
  parseMavenArgs,
  RUBY_CMD,
  RUSTC_CMD,
  SEARCH_MAVEN_ORG,
  SWIFT_CMD,
  shouldFetchLicense,
  shouldFetchPackageMetadata,
  shouldFetchVCS,
  TABLE_BORDER_STYLE,
  YARN_CMD,
} from "./core-env.js";
import {
  checksumFile,
  commandsExecuted,
  getAllFiles,
  getAllFilesWithIgnore,
  getTimestamp,
  getTmpDir,
  MAX_BUFFER,
  multiChecksumFile,
  safeCopyFileSync,
  safeExistsSync,
  safeExtractArchive,
  safeMkdirSync,
  safeMkdtempSync,
  safeRmSync,
  safeSpawnSync,
  safeUnlinkSync,
  safeWriteSync,
  TIMEOUT_MS,
} from "./core-fs.js";
import {
  buildObjectForCocoaPod,
  createUVLock,
  executeAtom,
  executePodCommand,
  findAppModules,
  getAtomCommand,
  getMavenCommand,
  getMillCommand,
  getPipFrozenTree,
  getPipTreeForPackages,
  getPyModules,
  parseCocoaDependency,
  parsePodfileLock,
  parsePodfileTargets,
} from "./core-misc-a.js";
import {
  addEvidenceForDotnet,
  addEvidenceForImports,
  attachIdentityTools,
  collectExecutables,
  collectSharedLibs,
  convertOSQueryResults,
  extractPathEnv,
  extractToolRefs,
  getCppModules,
  getDefaultBomAuditCategories,
  getOSPackageForFile,
  getRuntimeInformation,
  hasAnyProjectType,
  isFeatureEnabled,
  isPackageManagerAllowed,
  isPartialTree,
  isValidDriveRoot,
  isValidIriReference,
  recomputeScope,
  retrieveCdxgenPluginVersion,
  retrieveCdxgenVersion,
  shouldRunPredictiveBomAudit,
  toCamel,
} from "./core-misc-b.js";
import {
  collectJarNS,
  collectMvnDependencies,
  componentSorter,
  convertJarNSToPackages,
  getJarClasses,
  getPomPropertiesFromMavenDir,
  inferJarGroupFromManifest,
  parseJarManifest,
  parsePomProperties,
  parsePomXml,
  readZipEntry,
  trimJarGroupSuffix,
} from "./deps.js";
import {
  composePomXmlUrl,
  extractJarArchive,
  extractLicenseCommentFromPomXml,
  fetchPomXml,
  fetchPomXmlAsJson,
  findLocalMvnArtifact,
  getCratesMetadata,
  getDartMetadata,
  getGithubUrlParts,
  getGoPkgLicense,
  getMvnMetadata,
  getNpmMetadata,
  getNugetMetadata,
  getPyMetadata,
  getRepoLicense,
  getSwiftPackageMetadata,
  guessPypiMatchingVersion,
  metadata_cache,
  parseBdistMetadata,
  parseLicenseEntryOrArrayFromPomXml,
  repoMetadataToGitHubApiUrl,
  toGitHubApiUrl,
} from "./ecosystems.js";
import { createNpmWorkspacePurl } from "./npmutils.js";
import {
  getPropertyGroupTextNodes,
  parseCsPkgData,
  parseCsPkgLockData,
  parseCsProjAssetsData,
  parseCsProjData,
  parseNupkg,
  parseNuspecData,
  parsePaketLockData,
} from "./parsers-dotnet.js";
import {
  getGoPkgComponent,
  parseGoListDep,
  parseGoModData,
  parseGoModGraph,
  parseGoModulesTxt,
  parseGoModWhy,
  parseGopkgData,
  parseGosumData,
  parseGoVersionData,
} from "./parsers-go.js";
import {
  findPnpmPackagePath,
  getVersionNumPnpm,
  parseBowerJson,
  parseMinJs,
  parseNodeShrinkwrap,
  parsePackageJsonName,
  parsePkgJson,
  parsePkgLock,
  parsePnpmLock,
  parsePnpmWorkspace,
  parseYarnLock,
  parseYarnWorkspace,
  pnpmMetadata,
  splitCommandArgs,
  yarnLockToIdentMap,
} from "./parsers-js.js";
import {
  parseBazelActionGraph,
  parseBazelBuild,
  parseBazelSkyframe,
  parseCljDep,
  parseEdnData,
  parseKVDep,
  parseLeinDep,
  parseLeiningenData,
  parseLeinMap,
  parseMavenTree,
  parseMavenTreeJson,
  parseMillDependency,
  parsePom,
} from "./parsers-jvm.js";
import {
  executeAlpmList,
  executeApkList,
  executeDpkgList,
  executeEqueryList,
  executeRpmList,
  identifyFlow,
  parseBitbucketPipelinesFile,
  parseCabalData,
  parseCloudBuildData,
  parseCmakeDotFile,
  parseCmakeLikeFile,
  parseColliderLockData,
  parseComposerJson,
  parseComposerLock,
  parseConanData,
  parseConanLockData,
  parseContainerFile,
  parseContainerSpecData,
  parseCUsageSlice,
  parseFlakeLock,
  parseFlakeNix,
  parseGitHubWorkflowData,
  parseHelmYamlData,
  parseMakeDFile,
  parseMixLockData,
  parseOpenapiSpecData,
  parsePrivadoFile,
  parsePubLockData,
  parsePubYamlData,
  parseSwiftJsonTree,
  parseSwiftJsonTreeObject,
  parseSwiftResolved,
  recurseImageNameLookup,
} from "./parsers-misc.js";
import {
  derivePythonLockMetadataFileName,
  generatePixiLockFile,
  parsePiplockData,
  parsePixiLockFile,
  parsePixiTomlFile,
  parsePyLockData,
  parsePyProjectTomlFile,
  parsePyRequiresDist,
  parseReqEnvMarkers,
  parseReqFile,
  parseSetupPyFile,
} from "./parsers-python.js";
import {
  parseCargoAuditableData,
  parseCargoData,
  parseCargoDependencyData,
  parseCargoManifestDependencyData,
  parseCargoTomlData,
} from "./parsers-rust.js";
import { dirNameStr, isMac, isWin } from "./paths.js";
import {
  encodeForPurl,
  locateGenericPackage,
  mapConanPkgRefToPurlStringAndNameAndVersion,
  purlFromUrlString,
} from "./purl.js";
import {
  addLicenseText,
  adjustLicenseInformation,
  findLicenseId,
  getKnownLicense,
  getLicenses,
  guessLicenseId,
  isSpdxLicenseExpression,
  readLicenseText,
} from "./spdx.js";
import { CDXGEN_VERSION, frameworksList } from "./state.js";

export {
  addEvidenceForDotnet,
  addEvidenceForImports,
  addLicenseText,
  adjustLicenseInformation,
  attachIdentityTools,
  BLOCKED_HOST_ERROR_CODE,
  buildObjectForCocoaPod,
  CARGO_CMD,
  CDXGEN_SPDX_CREATED_BY,
  CDXGEN_TEMP_DIR,
  CDXGEN_VERSION,
  CLJ_CMD,
  cdxgenAgent,
  checksumFile,
  collectExecutables,
  collectJarNS,
  collectMvnDependencies,
  collectSharedLibs,
  commandsExecuted,
  componentSorter,
  composePomXmlUrl,
  convertJarNSToPackages,
  convertOSQueryResults,
  createBlockedHostError,
  createDryRunError,
  createNpmWorkspacePurl,
  createUVLock,
  DEBUG_MODE,
  DOTNET_CMD,
  DRY_RUN_ERROR_CODE,
  derivePythonLockMetadataFileName,
  dirNameStr,
  encodeForPurl,
  executeAlpmList,
  executeApkList,
  executeAtom,
  executeDpkgList,
  executeEqueryList,
  executePodCommand,
  executeRpmList,
  extractJarArchive,
  extractLicenseCommentFromPomXml,
  extractPathEnv,
  extractToolRefs,
  FETCH_LICENSE,
  fetchPomXml,
  fetchPomXmlAsJson,
  findAppModules,
  findLicenseId,
  findLocalMvnArtifact,
  findPnpmPackagePath,
  frameworksList,
  GCC_CMD,
  GO_CMD,
  generatePixiLockFile,
  getAllFiles,
  getAllFilesWithIgnore,
  getAtomCommand,
  getCppModules,
  getCratesMetadata,
  getDartMetadata,
  getDefaultBomAuditCategories,
  getGithubUrlParts,
  getGoPkgComponent,
  getGoPkgLicense,
  getJarClasses,
  getJavaCommand,
  getKnownLicense,
  getLicenses,
  getMavenCommand,
  getMillCommand,
  getMvnMetadata,
  getNpmMetadata,
  getNugetMetadata,
  getOSPackageForFile,
  getPipFrozenTree,
  getPipTreeForPackages,
  getPomPropertiesFromMavenDir,
  getPropertyGroupTextNodes,
  getPyMetadata,
  getPyModules,
  getPythonCommand,
  getRecordedActivities,
  getRepoLicense,
  getRuntimeInformation,
  getSwiftPackageMetadata,
  getTimestamp,
  getTmpDir,
  getVersionNumPnpm,
  guessLicenseId,
  guessPypiMatchingVersion,
  hasAnyProjectType,
  hasDangerousUnicode,
  identifyFlow,
  includeMavenTestScope,
  inferJarGroupFromManifest,
  isAllowedHttpHost,
  isBun,
  isDeno,
  isDryRun,
  isDryRunError,
  isFeatureEnabled,
  isMac,
  isNode,
  isPackageManagerAllowed,
  isPartialTree,
  isSecureMode,
  isSensitiveEnvironmentVariableName,
  isSpdxLicenseExpression,
  isValidDriveRoot,
  isValidIriReference,
  isWin,
  JAVA_CMD,
  LEIN_CMD,
  locateGenericPackage,
  MAX_BUFFER,
  mapConanPkgRefToPurlStringAndNameAndVersion,
  metadata_cache,
  multiChecksumFile,
  NODE_CMD,
  NPM_CMD,
  PACKAGE_MANAGER_ALIASES,
  PREFER_MAVEN_DEPS_TREE,
  PROJECT_TYPE_ALIASES,
  PYTHON_CMD,
  PYTHON_EXCLUDED_COMPONENTS,
  parseBazelActionGraph,
  parseBazelBuild,
  parseBazelSkyframe,
  parseBdistMetadata,
  parseBitbucketPipelinesFile,
  parseBowerJson,
  parseCabalData,
  parseCargoAuditableData,
  parseCargoData,
  parseCargoDependencyData,
  parseCargoManifestDependencyData,
  parseCargoTomlData,
  parseCljDep,
  parseCloudBuildData,
  parseCmakeDotFile,
  parseCmakeLikeFile,
  parseCocoaDependency,
  parseColliderLockData,
  parseComposerJson,
  parseComposerLock,
  parseConanData,
  parseConanLockData,
  parseContainerFile,
  parseContainerSpecData,
  parseCsPkgData,
  parseCsPkgLockData,
  parseCsProjAssetsData,
  parseCsProjData,
  parseCUsageSlice,
  parseEdnData,
  parseFlakeLock,
  parseFlakeNix,
  parseGitHubWorkflowData,
  parseGoListDep,
  parseGoModData,
  parseGoModGraph,
  parseGoModulesTxt,
  parseGoModWhy,
  parseGopkgData,
  parseGosumData,
  parseGoVersionData,
  parseHelmYamlData,
  parseJarManifest,
  parseKVDep,
  parseLeinDep,
  parseLeiningenData,
  parseLeinMap,
  parseLicenseEntryOrArrayFromPomXml,
  parseMakeDFile,
  parseMavenArgs,
  parseMavenTree,
  parseMavenTreeJson,
  parseMillDependency,
  parseMinJs,
  parseMixLockData,
  parseNodeShrinkwrap,
  parseNupkg,
  parseNuspecData,
  parseOpenapiSpecData,
  parsePackageJsonName,
  parsePaketLockData,
  parsePiplockData,
  parsePixiLockFile,
  parsePixiTomlFile,
  parsePkgJson,
  parsePkgLock,
  parsePnpmLock,
  parsePnpmWorkspace,
  parsePodfileLock,
  parsePodfileTargets,
  parsePom,
  parsePomProperties,
  parsePomXml,
  parsePrivadoFile,
  parsePubLockData,
  parsePubYamlData,
  parsePyLockData,
  parsePyProjectTomlFile,
  parsePyRequiresDist,
  parseReqEnvMarkers,
  parseReqFile,
  parseSetupPyFile,
  parseSwiftJsonTree,
  parseSwiftJsonTreeObject,
  parseSwiftResolved,
  parseYarnLock,
  parseYarnWorkspace,
  pnpmMetadata,
  purlFromUrlString,
  RUBY_CMD,
  RUSTC_CMD,
  readEnvironmentVariable,
  readLicenseText,
  readZipEntry,
  recomputeScope,
  recordActivity,
  recordDecisionActivity,
  recordDiscoveryActivity,
  recordEnvironmentRead,
  recordObservedActivity,
  recordPolicyActivity,
  recordSensitiveFileRead,
  recordSymlinkResolution,
  recurseImageNameLookup,
  remoteHostsAccessed,
  repoMetadataToGitHubApiUrl,
  resetActivityContext,
  resetRecordedActivities,
  retrieveCdxgenPluginVersion,
  retrieveCdxgenVersion,
  SEARCH_MAVEN_ORG,
  SWIFT_CMD,
  safeCopyFileSync,
  safeExistsSync,
  safeExtractArchive,
  safeMkdirSync,
  safeMkdtempSync,
  safeRmSync,
  safeSpawnSync,
  safeUnlinkSync,
  safeWriteSync,
  setActivityContext,
  setDryRunMode,
  shouldFetchLicense,
  shouldFetchPackageMetadata,
  shouldFetchVCS,
  shouldRunPredictiveBomAudit,
  splitCommandArgs,
  TABLE_BORDER_STYLE,
  TIMEOUT_MS,
  toCamel,
  toGitHubApiUrl,
  trimJarGroupSuffix,
  YARN_CMD,
  yarnLockToIdentMap,
};

/**
 * Method to check if a given feature flag is enabled.
 *
 * @param {Object} cliOptions CLI options
 * @param {String} feature Feature flag
 *
 * @returns {Boolean} True if the feature is enabled
 */
/**
 * Method to check if the given project types are allowed by checking against include and exclude types passed from the CLI arguments.
 *
 * @param {Array} projectTypes project types to check
 * @param {Object} options CLI options
 * @param {Boolean} defaultStatus Default return value if there are no types provided
 */
/**
 * Determine whether the predictive dependency audit should run for the current
 * CLI invocation.
 *
 * OBOM-focused runs (`obom` or explicit `-t os` / OS aliases only) should keep
 * the direct BOM audit findings but skip the predictive dependency audit.
 *
 * @param {object} options CLI options
 * @param {string} [commandPath] Invoked command path or name
 * @returns {boolean} True when predictive dependency audit should run
 */
/**
 * Determine the default BOM audit categories for the current CLI invocation.
 *
 * OBOM-focused runs should default to the runtime-specific rule pack unless the
 * user explicitly requests other categories.
 *
 * @param {object} options CLI options
 * @param {string} [commandPath] Invoked command path or name
 * @returns {string | undefined} Default category string, if any
 */
/**
 * Convenient method to check if the given package manager is allowed.
 *
 * @param {String} name Package manager name
 * @param {Array} conflictingManagers List of package managers
 * @param {Object} options CLI options
 *
 * @returns {Boolean} True if the package manager is allowed
 */
/**
 * Method to get files matching a pattern
 *
 * @param {string} dirPath Root directory for search
 * @param {string} pattern Glob pattern (eg: *.gradle)
 * @param {Object} options CLI options
 *
 * @returns {Array[string]} List of matched files
 */
/**
 * Method to encode hex string to base64 string
 *
 * @param {string} hexString hex string
 * @returns {string} base64 encoded string
 */
/**
 * Fetches license information for a list of Swift packages by querying the
 * GitHub repository license API for packages hosted on github.com.
 *
 * @param {Object[]} pkgList List of Swift package objects with optional repository.url fields
 * @returns {Promise<Object[]>} Resolved list of package objects, each augmented with a license field where available
 */
/**
 * Method to retrieve metadata for npm packages by querying npmjs
 *
 * @param {Array} pkgList Package list
 */
/**
 * Parse nodejs package json file
 *
 * @param {string} pkgJsonFile package.json file
 * @param {boolean} simple Return a simpler representation of the component by skipping extended attributes and license fetch.
 * @param {boolean} securityProps Collect security-related properties
 */
/**
 * Parse nodejs package lock file
 *
 * @param {string} pkgLockFile package-lock.json file
 * @param {object} options Command line options
 */
/**
 * Given a lock file this method would return an Object with the identity as the key and parsed name and value
 * eg: "@actions/core@^1.2.6", "@actions/core@^1.6.0":
 *        version "1.6.0"
 * would result in two entries
 *
 * @param {string} lockData Yarn Lockfile data
 */
/**
 * Parse nodejs yarn lock file
 *
 * @param {string} yarnLockFile yarn.lock file
 * @param {Object} parentComponent parent component
 * @param {Array[String]} workspacePackages Workspace packages
 * @param {Object} workspaceSrcFiles Workspace package.json files
 * @param {Object} _workspaceDirectDeps Direct dependencies of each workspace
 * @param {Object} depsWorkspaceRefs Workspace references for each dependency
 */
/**
 * Parse nodejs shrinkwrap deps file
 *
 * @param {string} swFile shrinkwrap-deps.json file
 */
/**
 * Parse pnpm workspace file
 *
 * @param {string} workspaceFile pnpm-workspace.yaml
 * @returns {object} Object containing packages and catalogs
 */
/**
 * Parses the workspaces field from a package.json file and returns the list of
 * workspace glob patterns. Handles both array and object (with packages key) formats.
 *
 * @param {string} packageJsonFile Path to the package.json file to parse
 * @returns {Object} Object with a packages array of workspace glob patterns, or an empty object on error
 */
/**
 * Helper function to find a package path in pnpm node_modules structure
 *
 * @param {string} baseDir Base directory containing node_modules
 * @param {string} packageName Package name (with or without scope)
 * @param {string} version Package version
 * @returns {string|null} Path to the package directory or null if not found
 */
/**
 * pnpm packages with metadata from local node_modules
 *
 * @param {Array} pkgList Package list to enhance
 * @param {string} lockFilePath Path to the pnpm-lock.yaml file
 * @returns {Array} Enhanced package list
 */
/**
 * Parse nodejs pnpm lock file
 *
 * @param {string} pnpmLock pnpm-lock.yaml file
 * @param {Object} parentComponent parent component
 * @param {Array[String]} workspacePackages Workspace packages
 * @param {Object} workspaceSrcFiles Workspace package.json files
 * @param {Object} _workspaceCatalogs Workspace catalogs
 * @param {Object} _workspaceDirectDeps Direct dependencies of each workspace
 * @param {Object} depsWorkspaceRefs Workspace references for each dependency
 * @param {string} projectRoot Root path used to relativize pnpm-lock evidence paths
 */
/**
 * Parse bower json file
 *
 * @param {string} bowerJsonFile bower.json file
 */
/**
 * Parse minified js file
 *
 * @param {string} minJsFile min.js file
 */
/**
 * Parse pom file
 *
 * @param {string} pomFile pom file to parse
 * @returns {Object} Object containing pom properties, modules, and array of dependencies
 */
/**
 * Parse maven dependency:tree json output
 *
 * @param rawOutput
 * @param pomFile
 * @returns {{parentComponent: {}, pkgList: *[], dependenciesList: *[]}|{}|{}|*|{parentComponent: {[p: string]: *}|{}, pkgList: [], dependenciesList: []}}
 */
/**
 * Parse maven tree output
 * @param {string} rawOutput Raw string output
 * @param {string} pomFile .pom file for evidence
 *
 * @returns {Object} Object containing packages and dependencies
 */
/**
 * Parse mill dependencies from file
 *
 * @param {string} module name of the module
 * @param {map} dependencies the parsed dependencies
 * @param {map} relations a map containing all relations
 * @param {string} millRootPath root of the project
 *
 * @returns the bom-ref of the module
 */
/**
 * Parse clojure cli dependencies output
 * @param {string} rawOutput Raw string output
 */
/**
 * Parse lein dependency tree output
 * @param {string} rawOutput Raw string output
 */
/**
 * Recursively walks a parsed EDN map node produced by the Leiningen dependency
 * tree and collects unique dependency entries into the deps array.
 *
 * @param {Object} node Parsed EDN node (expected to have a "map" property)
 * @param {Object} keys_cache Cache object used to deduplicate entries by group-name-version key
 * @param {Object[]} deps Accumulator array of dependency objects with group, name, and version fields
 * @returns {Object[]} The populated deps array
 */
/**
 * Parse bazel action graph output
 * @param {string} rawOutput Raw string output
 */
/**
 * Parse bazel skyframe state output
 * @param {string} rawOutput Raw string output
 */
/**
 * Parse bazel BUILD file
 * @param {string} rawOutput Raw string output
 */
/**
 * Parse dependencies in Key:Value format
 */
/**
 * Method to locate local Gradle, Maven, or Coursier cache files for a given maven coordinate.
 *
 * @param {string} group Maven groupId
 * @param {string} name Maven artifactId
 * @param {string} version Package version
 * @returns {Object|null} Object containing jarPath, sha1, and pomPath, or null
 */
/**
 * Method to retrieve metadata for maven packages by querying maven central
 *
 * @param {Array} pkgList Package list
 * @param {Object} jarNSMapping Jar Namespace mapping object
 * @param {Boolean} force Force fetching of license
 *
 * @returns {Array} Updated package list
 */
/**
 * Method to compose URL of pom.xml
 *
 * @param {String} urlPrefix
 * @param {String} group
 * @param {String} name
 * @param {String} version
 *
 * @return {String} fullUrl
 */
/**
 * Method to fetch pom.xml data and parse it to JSON
 *
 * @param {String} urlPrefix
 * @param {String} group
 * @param {String} name
 * @param {String} version
 *
 * @return {Object|undefined}
 */
/**
 * Method to fetch pom.xml data
 *
 * @param {String} urlPrefix
 * @param {String} group
 * @param {String} name
 * @param {String} version
 *
 * @return {Promise<String>}
 */
/**
 * Method extract single or multiple license entries that might appear in pom.xml
 *
 * @param {Object|Array} license
 */
/**
 * Method to parse pom.xml in search of a comment containing license text
 *
 * @param {String} urlPrefix
 * @param {String} group
 * @param {String} name
 * @param {String} version
 *
 * @return {Promise<String>} License ID
 */
/**
 * Method to parse python requires_dist attribute found in pypi setup.py
 *
 * @param {String} dist_string string
 */
/**
 * Method to mimic pip version solver using node-semver
 *
 * @param {Array} versionsList List of version numbers available
 * @param {*} versionSpecifiers pip version specifier
 */
/**
 * Method to retrieve metadata for python packages by querying pypi
 *
 * @param {Array} pkgList Package list
 * @param {Boolean} fetchDepsInfo Fetch dependencies info from pypi
 */
/**
 * Method to parse bdist_wheel metadata (dist-info/METADATA)
 *
 * @param {string} mDataFile bdist_wheel metadata file
 * @param {string} rawMetadata Raw metadata
 *
 */
/**
 * Method to parse pipfile.lock data
 *
 * @param {Object} lockData JSON data from Pipfile.lock
 */
/**
 * Method to parse python pyproject.toml file
 *
 * @param {string} tomlFile pyproject.toml file
 * @returns {Object} Object with parent component, root dependencies, and metadata.
 */
/**
 * Derive a file name for a file entry of a python lock file.
 *
 *  - poetry.lock `[metadata.files]` entries carry a `file` key.
 *  - pdm.lock `[metadata.files]` entries carry a `url` key (no `file`).
 *  - pylock.toml / uv.lock artifacts can carry an explicit `name`, a local
 *    `path`, and/or a `url`.
 *
 * @param {object} fileEntry A single lock-file file entry.
 * @returns {string | undefined} The derived file name, or undefined when none can be derived.
 */
/**
 * Method to parse python lock files such as poetry.lock, pdm.lock, uv.lock, and pylock.toml.
 *
 * @param {string} lockData Raw TOML text from poetry.lock, pdm.lock, uv.lock, or pylock.toml
 * @param {string} lockFile Lock file name for evidence
 * @param {string} pyProjectFile pyproject.toml file
 */
/**
 * Method to parse requirements.txt file. This must be replaced with atom parsedeps.
 *
 * @param {String} reqFile Requirements.txt file
 * @param {Boolean} fetchDepsInfo Fetch dependencies info from pypi
 *
 * @returns {Promise[Array<Object>]} List of direct dependencies from the requirements file
 */
/**
 * Method to parse requirements.txt file. Must only be used internally.
 *
 * @param {String} reqFile Requirements.txt file
 * @param {Object} reqData Requirements.txt data for internal invocations from setup.py file etc.
 * @param {Boolean} fetchDepsInfo Fetch dependencies info from pypi
 * @returns {Promise<Array<Object>>} List of direct dependencies from the requirements file
 */
/**
 * Parse environment markers into structured format
 *
 * @param {String} markersStr Raw markers string
 * @returns {Array<Object>} Structured markers array
 */
/**
 * Method to find python modules by parsing the imports and then checking with PyPI to obtain the latest version
 *
 * @param {string} src directory
 * @param {Array} epkgList Existing package list
 * @param {Object} options CLI options
 * @returns List of packages
 */
/**
 * Method to parse setup.py data
 *
 * @param {Object} setupPyData Contents of setup.py
 */
/**
 * Method to create purl using information in pixi.lock file.
 * According to pixi lock file satisfiability (https://pixi.sh/latest/features/lockfile/#lockfile-satisfiability)
 *
 *
 *
 * @param {*} packageData
 * @returns
 */
/**
 * Method to parse pixi.lock data
 *
 * @param {String} pixiLockFileName  pixi.lock file name
 * @param {String} path File path
 */
/**
 * Method to parse pixi.toml file
 *
 * @param {String} pixiToml
 */
/**
 * Method to construct a GitHub API url for the given repo metadata
 * @param {Object} repoMetadata Repo metadata with group and name
 * @return {String|undefined} github api url (or undefined - if not enough data)
 */
/**
 * Method to run cli command `pixi install`
 *
 *
 */
/**
 * Method to split GitHub url into its parts
 * @param {String} repoUrl Repository url
 * @return {[String]} parts from url
 */
/**
 * Method to construct GitHub api url from repo metadata or one of multiple formats of repo URLs
 * @param {String} repoUrl Repository url
 * @param {Object} repoMetadata Object containing group and package name strings
 * @return {String|undefined} github api url (or undefined - if not a GitHub repo)
 */
/**
 * Method to retrieve repo license by querying github api
 *
 * @param {String} repoUrl Repository url
 * @param {Object} repoMetadata Object containing group and package name strings
 * @return {Promise<String>} SPDX license id
 */
/**
 * Method to get go pkg license from go.dev site.
 *
 * @param {Object} repoMetadata Repo metadata
 */
/**
 * Method to get go pkg vcs url from go.dev site.
 *
 * @param {String} group Package group
 * @param {String} name Package name
 */
/**
 * Builds a Go package component object containing purl, bom-ref, integrity hash,
 * and optionally license and VCS external reference information.
 *
 * @param {string} group Package group (module path prefix, may be empty)
 * @param {string} name Package name (full module path when group is empty)
 * @param {string} version Package version string
 * @param {string} hash Integrity hash (e.g. "sha256-…"), used as _integrity
 * @returns {Promise<Object>} Component object ready for inclusion in a BOM package list
 */
/**
 * Method to get go pkg url (go.dev site).
 *
 * @param {Object} pkgMetadata pkg metadata
 */
/**
 * Method to get go pkg full name.
 *
 * @param {String} group Package group
 * @param {String} name Package name
 */
/**
 * Method to parse go.mod files
 *
 * @param {String} goModData Contents of go.mod file
 * @param {Object} gosumMap Data from go.sum files
 *
 * @returns {Object} Object containing parent component, rootList and packages list
 */
/**
 * Parses a Go modules text file (e.g. vendor/modules.txt) and returns a list of
 * Go package components. Cross-references the go.sum map for integrity hashes and
 * sets scope and confidence based on hash availability.
 *
 * @param {string} txtFile Path to the modules.txt file
 * @param {Object} gosumMap Map of "module@version" keys to sha256 hash values from go.sum
 * @returns {Promise<Object[]>} List of Go package component objects with evidence
 */
/**
 * Parse go list output
 *
 * @param {string} rawOutput Output from go list invocation
 * @param {Object} gosumMap go.sum data
 * @returns Object with parent component and List of packages
 */
/**
 * Parse go mod graph
 *
 * @param {string} rawOutput Output from go mod graph invocation
 * @param {string} goModFile go.mod file
 * @param {Object} gosumMap Hashes from gosum for lookups
 * @param {Array} epkgList Existing package list
 * @param {Object} parentComponent Current parent component
 *
 * @returns Object containing List of packages and dependencies
 */
/**
 * Parse go mod why output.
 *
 * @param {string} rawOutput Output from go mod why
 * @returns {string|undefined} package name or none
 */
/**
 * Parse go sum data
 * @param {string} gosumData Content of go.sum
 * @returns package list
 */
/**
 * Parses the contents of a Gopkg.lock or Gopkg.toml file (dep tool format) and
 * returns a list of Go package components. Optionally fetches license information
 * for each package when FETCH_LICENSE is enabled.
 *
 * @param {string} gopkgData Raw string contents of the Gopkg lock/toml file
 * @returns {Promise<Object[]>} List of Go package component objects
 */
/**
 * Parses the output of `go version -m` (build info) and returns a list of Go
 * package components for each "dep" line, including name, version, and integrity hash.
 *
 * @param {string} buildInfoData Raw string output from `go version -m`
 * @returns {Promise<Object[]>} List of Go package component objects
 */
/**
 * Method to retrieve metadata for rust packages by querying crates
 *
 * @param {Array} pkgList Package list
 */
/**
 * Method to retrieve metadata for dart packages by querying pub.dev
 *
 * @param {Array} pkgList Package list
 */
/**
 * Convert list of file paths to components
 *
 * @param {Array} fileList List of file paths
 *
 * @returns {Array} List of components
 */
/**
 * Parse dependency info from the `[package]` node in `cargo.toml` or `cargo.lock`
 * @param {Object} packageNode
 * @returns {Object} dependency info
 * @throws {Error} if dependency name or version is invalid
 */
/**
 * Method to parse cargo.toml data
 *
 * The component described by a [package] section will be put at the front of
 * the list, regardless of if [package] appears before or after
 * [dependencies]. Found dependencies will be placed at the back of the
 * list.
 *
 * The Cargo documentation specifies that the [package] section should appear
 * first as a convention, but it is not enforced.
 * https://doc.rust-lang.org/stable/style-guide/cargo.html#formatting-conventions
 *
 * @param {String} cargoTomlFile cargo.toml file
 * @param {boolean} simple Return a simpler representation of the component by skipping extended attributes and license fetch.
 * @param {Object} pkgFilesMap Object with package name and list of files
 *
 * @returns {Array} Package list
 */
/**
 * Parse a Cargo.lock file to find components within the Rust project.
 *
 * @param {String} cargoLockFile A path to a Cargo.lock file. The Cargo.lock-file path may be used as information for extended attributes, such as manifest based evidence.
 * @param {boolean} simple Return a simpler representation of the component by skipping extended attributes and license fetch.
 * @param {Object} pkgFilesMap Object with package name and list of files
 *
 * @returns {Array} A list of the project's components as described by the Cargo.lock-file.
 */
/**
 * Build a Cargo dependency graph from manifest relationships so workspace roots
 * and member-to-member links can complement lockfile-derived dependency data.
 *
 * @param {string} cargoTomlFile Cargo.toml path
 * @param {object} [context] manifest graph context
 * @returns {object[]} Cargo dependency relationships
 */
/**
 * Parses a Cargo.lock file's TOML data and returns a flat dependency graph as an
 * array of objects mapping each package purl to the purls it directly depends on.
 *
 * @param {string} cargoLockData Raw TOML string contents of a Cargo.lock file
 * @returns {Object[]} Array of dependency relationship objects with ref and dependsOn fields
 */
/**
 * Parses tab-separated cargo-auditable binary metadata output and returns a list
 * of Rust package components. Optionally fetches crates.io metadata when
 * FETCH_LICENSE is enabled.
 *
 * @param {string} cargoData Tab-separated string output from cargo-auditable or similar tool
 * @returns {Promise<Object[]>} List of Rust package component objects with group, name, and version
 */
/**
 * Method to parse pubspec.lock files.
 *
 * @param pubLockData Contents of lock data
 * @param lockFile Filename for setting evidence
 *
 * @returns {Object}
 */
/**
 * Parses a Dart pub package's pubspec.yaml content and returns a list containing
 * a single component object with name, description, version, homepage, and purl.
 *
 * @param {string} pubYamlData Raw YAML string contents of a pubspec.yaml file
 * @returns {Object[]} List containing a single Dart package component object
 */
/**
 * Parses Helm chart YAML data (Chart.yaml or repository index.yaml) and returns
 * a list of Helm chart component objects including the chart itself and any
 * declared dependencies or index entries.
 *
 * @param {string} helmData Raw YAML string contents of a Helm Chart.yaml or index.yaml file
 * @returns {Object[]} List of Helm chart component objects with name, version, and optional homepage/repository
 */
/**
 * Recursively walks a parsed YAML/JSON object structure to find container image
 * references stored under common keys (image, repository, dockerImage, etc.) and
 * appends discovered image and service entries to pkgList while tracking seen
 * images in imgList to avoid duplicates.
 *
 * @param {Object|Array|string} keyValueObj The object, array, or string node to inspect
 * @param {Object[]} pkgList Accumulator array that receives {image} and {service} entries
 * @param {string[]} imgList Accumulator array of image name strings already seen
 * @returns {string[]} The updated imgList
 */
/**
 * Parses the contents of a Dockerfile or Containerfile and returns a list of
 * base image objects referenced by FROM instructions, substituting ARG default
 * values where possible and skipping multi-stage build alias references.
 *
 * @param {string} fileContents Raw string contents of the Dockerfile/Containerfile
 * @returns {Object[]} Array of objects with an image property for each unique base image
 */
/**
 * Parses a Bitbucket Pipelines YAML file and extracts all Docker image references
 * used as build environments and pipe references (docker:// pipes are normalized).
 *
 * @param {string} fileContents Raw string contents of the bitbucket-pipelines.yml file
 * @returns {Object[]} Array of objects with an image property for each referenced image or pipe
 */
/**
 * Parses container specification data such as Docker Compose files, Kubernetes
 * manifests, Tekton tasks, Skaffold configs, or Kustomize overlays (YAML, possibly
 * multi-document) and returns a list of image, service, and OCI spec entries.
 *
 * @param {string} dcData Raw YAML string contents of the container spec file
 * @returns {Object[]} Array of objects with image, service, or ociSpec properties
 */
/**
 * Identifies the data flow direction of a Privado processing object based on its
 * sinkId value: "write" sinks map to "inbound", "read" sinks to "outbound", and
 * HTTP/gRPC sinks to "bi-directional".
 *
 * @param {Object} processingObj Privado processing object, expected to have a sinkId property
 * @returns {string} Flow direction string: "inbound", "outbound", "bi-directional", or "unknown"
 */
/**
 * Parses a Privado data flow JSON file and returns a list of service objects
 * enriched with data classifications, endpoints, trust-boundary flag, violations,
 * and git metadata properties extracted from the scan result.
 *
 * @param {string} f Path to the Privado scan result JSON file
 * @returns {Object[]} List of service component objects suitable for a SaaSBOM
 */
/**
 * Parses an OpenAPI specification (JSON or YAML string) and returns a list
 * containing a single service object with name, version, endpoints, and
 * authentication flag derived from the spec's info, servers, paths, and
 * securitySchemes sections.
 *
 * @param {string} oaData Raw JSON or YAML string contents of an OpenAPI specification
 * @returns {Object[]} List containing a single service component object
 */
/**
 * Parses Haskell Cabal freeze file content and extracts package name and version
 * pairs from constraint lines (lines containing " ==").
 *
 * @param {string} cabalData Raw string contents of a Cabal freeze file
 * @returns {Object[]} List of package objects with name and version fields
 */
/**
 * Parses an Elixir mix.lock file and extracts Hex package name and version pairs
 * from lines containing ":hex".
 *
 * @param {string} mixData Raw string contents of a mix.lock file
 * @returns {Object[]} List of package objects with name and version fields
 */
/**
 * Parses a GitHub Actions workflow YAML file and returns a list of action
 * components for each step that uses an external action (steps with a "uses"
 * field). Each component captures the action name, group, version/commit SHA,
 * version pinning type, job context (runner, permissions, environment), and
 * workflow-level metadata (triggers, concurrency, write permissions).
 *
 * @param {string} f Path to the GitHub Actions workflow YAML file
 * @returns {Object[]} List of action component objects with purl, properties, and evidence
 */
/**
 * Parse Google Cloud Build YAML data and extract container image steps as packages.
 *
 * @param {string} cbwData Raw YAML string of a Cloud Build configuration file
 * @returns {Object[]} Array of package objects parsed from the build steps
 */
/**
 * Parse Conan lock file data (conan.lock) and return the package list, dependency map,
 * and parent component dependencies.
 *
 * Supports both the legacy `graph_lock.nodes` format (Conan 1.x) and the newer
 * `requires` format (Conan 2.x).
 *
 * @param {string} conanLockData Raw JSON string of the Conan lock file
 * @returns {{ pkgList: Object[], dependencies: Object, parentComponentDependencies: string[] }}
 */
/**
 * Parse a Conan conanfile.txt and extract required and optional packages.
 *
 * @param {string} conanData Raw text contents of a conanfile.txt
 * @returns {Object[]} Array of package objects with purl, name, version, and scope
 */
/**
 * Construct a generic package component object for collider-managed packages.
 *
 * @param {string} name Package name
 * @param {Object} pkgData Locked package entry from collider.lock
 * @param {string} lockFile Source lock file path
 * @param {string} dependencyKind Whether the package is direct or transitive
 * @returns {Object|undefined} Package component
 */
/**
 * Parse Collider lock file data (collider.lock) and return the package list and
 * parent component dependencies.
 *
 * @param {string} colliderLockData Raw JSON string of the Collider lock file
 * @param {string} lockFile Source lock file path
 * @returns {{ pkgList: Object[], dependencies: Object, parentComponentDependencies: string[] }}
 */
/**
 * Parse Leiningen project.clj data and extract dependency packages.
 *
 * @param {string} leinData Raw text contents of a Leiningen project.clj file
 * @returns {Object[]} Array of package objects with group, name, and version
 */
/**
 * Parse EDN (Extensible Data Notation) deps.edn data and extract dependency packages.
 *
 * Handles Clojure deps.edn files, extracting packages listed under the `:deps` key.
 *
 * @param {string} rawEdnData Raw EDN text contents of a deps.edn file
 * @returns {Object[]} Array of package objects with group, name, and version
 */
/**
 * Method to parse .nupkg files
 *
 * @param {String} nupkgFile .nupkg file
 * @returns {Object} Object containing package list and dependencies
 */
/**
 * Method to parse flake.nix files
 *
 * @param {String} flakeNixFile flake.nix file to parse
 * @returns {Object} Object containing package information
 */
/**
 * Method to parse flake.lock files
 *
 * @param {String} flakeLockFile flake.lock file to parse
 * @returns {Object} Object containing locked dependency information
 */
/**
 * Generate a Nix PURL from input information
 *
 * @param {String} name Package name
 * @param {String} version Package version
 * @returns {String} PURL string
 */
/**
 * Method to parse .nuspec files
 *
 * @param {String} nupkgFile .nupkg file
 * @param {String} nuspecData Raw nuspec data
 * @returns {Object} Object containing package list and dependencies
 */
/**
 * Parse a C# packages.config XML file and return a list of NuGet package components.
 *
 * @param {string} pkgData Raw XML string of a packages.config file
 * @param {string} pkgFile Path to the packages.config file, used for evidence properties
 * @param {Object} pkgNameVersions Package name - version map of versions already resolved
 *        from more precise manifests (project.assets.json / packages.lock.json), used to
 *        backfill templated or missing versions
 * @returns {Object[]} Array of NuGet package objects with purl, name, and version
 */
/**
 * Method to find all text nodes in PropertyGroup elements in .props files.
 *
 * @param {String} propsFiles .props files in this project
 *
 * @returns {Object} Containing text nodes from PropertyGroup elements and their values
 */
/**
 * Method to parse .csproj like xml files
 *
 * @param {String} csProjData Raw data
 * @param {String} projFile File name
 * @param {Object} pkgNameVersions Package name - version map object
 *
 * @returns {Object} Containing parent component, package, and dependencies
 */
/**
 * Parse a .NET project.assets.json file and return the package list and dependency tree.
 *
 * Extracts NuGet packages and their transitive dependency relationships from the
 * `libraries` and `targets` sections of a project.assets.json file produced by
 * the .NET restore process.
 *
 * @param {string} csProjData Raw JSON string of the project.assets.json file
 * @param {string} assetsJsonFile Path to the project.assets.json file, used for evidence properties
 * @returns {{ pkgList: Object[], dependenciesList: Object[] }}
 */
/**
 * Parse a .NET packages.lock.json file and return the package list, dependency tree,
 * and list of direct/root dependencies.
 *
 * @param {string} csLockData Raw JSON string of the packages.lock.json file
 * @param {string} pkgLockFile Path to the packages.lock.json file, used for evidence properties
 * @returns {{ pkgList: Object[], dependenciesList: Object[], rootList: Object[] }}
 */
/**
 * Parse a Paket dependency manager lock file (paket.lock) and return the package list
 * and dependency tree.
 *
 * @param {string} paketLockData Raw text contents of the paket.lock file
 * @param {string} pkgLockFile Path to the paket.lock file, used for evidence properties
 * @returns {{ pkgList: Object[], dependenciesList: Object[] }}
 */
/**
 * Parse composer.json file
 *
 * @param {string} composerJsonFile composer.json file
 *
 * @returns {Object} Object with rootRequires and parent component
 */
/**
 * Parse composer lock file
 *
 * @param {string} pkgLockFile composer.lock file
 * @param {array} rootRequires require section from composer.json
 */
/**
 * Method to execute dpkg --listfiles to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
/**
 * Method to execute dnf repoquery to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
/**
 * Method to execute apk -L info to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
/**
 * Method to execute alpm -Ql to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
/**
 * Method to execute equery files to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
/**
 * Convert OS query results
 *
 * @param {string} queryCategory Query category
 * @param {Object} queryObj Query Object from the queries.json configuration
 * @param {Array} results Query Results
 * @param {Boolean} enhance Optionally enhance results by invoking additional package manager commands
 */
/**
 * Parse swift dependency tree output json object
 *
 * @param {Array} pkgList Package list
 * @param {Array} dependenciesList Dependencies
 * @param {string} jsonObject Swift dependencies json object
 * @param {string} pkgFile Package.swift file
 */
/**
 * Parse swift dependency tree output
 * @param {string} rawOutput Swift dependencies json output
 * @param {string} pkgFile Package.swift file
 */
/**
 * Parse swift package resolved file
 * @param {string} resolvedFile Package.resolved file
 */
/**
 * Method to extract a war or ear file
 *
 * @param {string} jarFile Path to jar file
 * @param {string} tempDir Temporary directory to use for extraction
 * @param {object} jarNSMapping Jar class names mapping object
 *
 * @return pkgList Package list
 */
/**
 * Method to return the mill command to use.
 *
 * @param {string} srcPath Path to look for mill wrapper
 */
/**
 * Parse the contents of a 'Podfile.lock'
 *
 * @param {Object} podfileLock The content of the podfile.lock as an Object
 * @param {String} projectPath The path to the project root
 * @returns {Map} Map of all dependencies with their direct dependencies
 */
/**
 * Parse all targets and their direct dependencies from the 'Podfile'
 *
 * @param {Object} target A JSON-object representing a target
 * @param {Map} allDependencies The map containing all parsed direct dependencies for a target
 * @param {String} [prefix=undefined] Prefix to add to the targets name
 */
/**
 * Parse a single line representing a dependency
 *
 * @param {String} dependencyLine The line that should be parsed as a dependency
 * @param {boolean} [parseVersion=true] Include parsing the version of the dependency
 * @returns {Object} Object representing a dependency
 */
/**
 * Execute the 'pod'-command with parameters
 *
 * @param {String[]} parameters The parameters for the command
 * @param {String} path The path where the command should be executed
 * @param {Object} options CLI options
 * @returns {Object} The result of running the command
 */
/**
 * Method that handles object creation for cocoa pods.
 *
 * @param {Object} dependency The dependency that is to be transformed into an SBOM object
 * @param {Object} options CLI options
 * @param {String} [type="library"] The type of Object to create
 * @returns {Object} An object representing the pod in SBOM-format
 */
/**
 * Method to return the maven command to use.
 *
 * @param {string} srcPath Path to look for maven wrapper
 * @param {string} rootPath Root directory to look for maven wrapper
 */
/**
 * Retrieves the atom command by referring to various environment variables
 */
/**
 * Execute the atom tool against a source directory or file with the given arguments.
 *
 * Resolves the atom binary via `getAtomCommand`, sets up the required environment
 * (including `JAVA_HOME` from `ATOM_JAVA_HOME` if set), and spawns the process.
 * Logs diagnostic messages for common failure modes such as unsupported Java versions,
 * missing `astgen`, and JVM crashes.
 *
 * @param {string} src Path to the source directory or file to analyse
 * @param {string[]} args Arguments to pass to the atom command
 * @param {Object} extra_env Additional environment variables to merge into the process environment
 * @returns {boolean} `true` if atom executed successfully and the language is supported; `false` otherwise
 */
/**
 * Find the imported modules in the application with atom parsedeps command
 *
 * @param {string} src
 * @param {string} language
 * @param {string} methodology
 * @param {string} slicesFile
 * @param {Object} options CLI options
 * @returns List of imported modules
 */
/**
 * Create uv.lock file with uv sync command.
 *
 * @param {string} basePath Path
 * @param {Object} options CLI options
 */
/**
 * Execute pip freeze by creating a virtual env in a temp directory and construct the dependency tree
 *
 * @param {string} basePath Base path
 * @param {string} reqOrSetupFile Requirements or setup.py file
 * @param {string} tempVenvDir Temp venv dir
 * @param {Object} parentComponent Parent component
 *
 * @returns {Object} List of packages from the virtual env
 */
/**
 * The problem: pip installation can fail for a number of reasons such as missing OS dependencies and devel packages.
 * When it fails, we don't get any dependency tree. As a workaroud, this method would attempt to install one package at a time to the same virtual environment and then attempts to obtain a dependency tree.
 * Such a tree could be incorrect or quite approximate, but some users might still find it useful to know the names of the indirect dependencies.
 *
 * @param {string} basePath Base path
 * @param {Array} pkgList Existing package list
 * @param {string} tempVenvDir Temp venv dir
 * @param {Object} parentComponent Parent component
 *
 * @returns List of packages from the virtual env
 */
// taken from a very old package https://github.com/keithamus/parse-packagejson-name/blob/master/index.js
/**
 * Parse a package.json `name` field (or a plain string) and extract its scope,
 * full name, project name, and module name components.
 *
 * @param {string|Object} name The package name string or an object with a `name` property
 * @returns {{ scope: string|null, fullName: string, projectName: string|null, moduleName: string|null }}
 */
/**
 * Collect bom-refs from metadata.tools entries.
 *
 * @param {Object[]|Object} tools CycloneDX metadata.tools section
 * @param {Function} predicate Optional filter function
 * @returns {string[]} Unique tool bom-refs
 */
/**
 * Attach evidence.identity.tools references to the supplied subjects.
 *
 * @param {Object|Object[]} subjects Component or service objects
 * @param {string[]} toolRefs Tool bom-refs
 * @returns {Object|Object[]} The same mutated subject(s)
 */
/**
 * Method to add occurrence evidence for components based on import statements. Currently useful for js
 *
 * @param {array} pkgList List of package
 * @param {object} allImports Import statements object with package name as key and an object with file and location details
 * @param {object} allExports Exported modules if available from node_modules
 * @param {Boolean} deep Deep mode
 */

/**
 * Parse a CMake-generated dot/graphviz file and extract components and their dependency
 * relationships.
 *
 * The first `digraph` entry becomes the parent component. Subsequent `node` entries
 * with a `label` attribute are treated as direct dependencies, while commented
 * `node -> node` relationships are used to construct the dependency graph.
 *
 * @param {string} dotFile Path to the CMake-generated dot file
 * @param {string} pkgType PackageURL type to assign to extracted packages (e.g. `"generic"`)
 * @param {Object} options CLI options; may contain `projectGroup`, `projectName`, and `projectVersion`
 * @returns {{ parentComponent: Object, pkgList: Object[], dependenciesList: Object[] }}
 */
/**
 * Parse a CMake-like build file (CMakeLists.txt, meson.build, etc.) and extract the
 * parent component and list of dependency packages.
 *
 * Handles `set`, `project`, `find_package`, `find_library`, `find_dependency`,
 * `find_file`, `FetchContent_MakeAvailable`, and `dependency()` directives.
 * Uses the MesonWrapDB to improve name resolution confidence.
 *
 * @param {string} cmakeListFile Path to the CMake-like build file
 * @param {string} pkgType PackageURL type to assign to extracted packages (e.g. `"generic"`)
 * @param {Object} options CLI options; may contain `projectGroup`, `projectName`, and `projectVersion`
 * @returns {{ parentComponent: Object, pkgList: Object[] }}
 */
/**
 * Find the OS package component that provides a given file, by searching the
 * `PkgProvides` property of each package in the OS package list.
 *
 * @param {string} afile Filename or path to look up (matched case-insensitively)
 * @param {Object[]} osPkgsList Array of OS package component objects to search
 * @returns {Object|undefined} The matching OS package component, or undefined if not found
 */
/**
 * Method to find c/c++ modules by collecting usages with atom
 *
 * @param {string} src directory
 * @param {object} options Command line options
 * @param {array} osPkgsList Array of OS pacakges represented as components
 * @param {array} epkgList Existing packages list
 */
/**
 * Method to retrieve metadata for nuget packages
 *
 * @param {Array} pkgList Package list
 * @param {Array} dependencies Dependencies
 */
/**
 * Enrich .NET package components with occurrence evidence and imported module/method
 * information from a dosai dependency slices file.
 *
 * Builds a mapping of DLL filenames to purls using the `PackageFiles` property of each
 * package, then reads the slices file to add occurrence locations, imported modules,
 * called methods, and assembly version information where available.
 *
 * @param {Object[]} pkgList Array of .NET package component objects to enrich
 * @param {string} slicesFile Path to the dosai dependency slices JSON file
 * @returns {Object[]} The enriched package list (same array, mutated in place)
 */
/**
 * Function to parse the .d make files
 *
 * @param {String} dfile .d file path
 *
 * @returns {Object} pkgFilesMap Object with package name and list of files
 */

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
