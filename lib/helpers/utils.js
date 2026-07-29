import { readFileSync, realpathSync } from "node:fs";
import { platform } from "node:os";
import {
  sep as _sep,
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
} from "node:path";
import process from "node:process";
import { URL } from "node:url";

import { globSync } from "glob";
import { PackageURL } from "packageurl-js";

import { IriValidationStrategy, validateIri } from "../parsers/iri.js";
import { DEFAULT_HBOM_AUDIT_CATEGORIES } from "./auditCategories.js";
import {
  BLOCKED_HOST_ERROR_CODE,
  buildReadCountSuffix,
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
  addDosaiSetValue,
  buildDosaiPurlAliasMap,
  dosaiSourceLocation,
  dosaiSourceLocationFromNode,
  resolveDosaiComponentPurl,
} from "./dosaiParsers.js";
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
import {
  createOccurrenceEvidence,
  parseOccurrenceEvidenceLocation,
} from "./evidenceUtils.js";
import { createGtfoBinsPropertiesFromRow } from "./gtfobins.js";
import { thoughtLog } from "./logger.js";
import { createLolbasProperties } from "./lolbas.js";
import { createNpmWorkspacePurl } from "./npmutils.js";
import {
  createOsQueryFallbackBomRef,
  createOsQueryPurl,
  deriveOsQueryDescription,
  deriveOsQueryName,
  deriveOsQueryPublisher,
  deriveOsQueryVersion,
  sanitizeOsQueryIdentity,
  shouldCreateOsQueryPurl,
} from "./osqueryTransform.js";
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
import { CDXGEN_VERSION, CPP_STD_MODULES, frameworksList } from "./state.js";

export {
  addLicenseText,
  adjustLicenseInformation,
  BLOCKED_HOST_ERROR_CODE,
  buildObjectForCocoaPod,
  CARGO_CMD,
  CDXGEN_SPDX_CREATED_BY,
  CDXGEN_TEMP_DIR,
  CDXGEN_VERSION,
  CLJ_CMD,
  cdxgenAgent,
  checksumFile,
  collectJarNS,
  collectMvnDependencies,
  commandsExecuted,
  componentSorter,
  composePomXmlUrl,
  convertJarNSToPackages,
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
  getCratesMetadata,
  getDartMetadata,
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
  getPipFrozenTree,
  getPipTreeForPackages,
  getPomPropertiesFromMavenDir,
  getPropertyGroupTextNodes,
  getPyMetadata,
  getPyModules,
  getPythonCommand,
  getRecordedActivities,
  getRepoLicense,
  getSwiftPackageMetadata,
  getTimestamp,
  getTmpDir,
  getVersionNumPnpm,
  guessLicenseId,
  guessPypiMatchingVersion,
  hasDangerousUnicode,
  identifyFlow,
  includeMavenTestScope,
  inferJarGroupFromManifest,
  isAllowedHttpHost,
  isBun,
  isDeno,
  isDryRun,
  isDryRunError,
  isMac,
  isNode,
  isSecureMode,
  isSensitiveEnvironmentVariableName,
  isSpdxLicenseExpression,
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
  splitCommandArgs,
  TABLE_BORDER_STYLE,
  TIMEOUT_MS,
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
export function isFeatureEnabled(cliOptions, feature) {
  if (cliOptions?.featureFlags?.includes(feature)) {
    return true;
  }
  if (
    process.env[feature.toUpperCase()] &&
    ["true", "1"].includes(process.env[feature.toUpperCase()])
  ) {
    return true;
  }
  // Retry by replacing hyphens with underscore
  return !!(
    process.env[feature.replaceAll("-", "_").toUpperCase()] &&
    ["true", "1"].includes(
      process.env[feature.replaceAll("-", "_").toUpperCase()],
    )
  );
}

/**
 * Method to check if the given project types are allowed by checking against include and exclude types passed from the CLI arguments.
 *
 * @param {Array} projectTypes project types to check
 * @param {Object} options CLI options
 * @param {Boolean} defaultStatus Default return value if there are no types provided
 */
export function hasAnyProjectType(projectTypes, options, defaultStatus = true) {
  // If no project type is specified, then consider it as yes
  if (
    !projectTypes ||
    (!options.projectType?.length && !options.excludeType?.length)
  ) {
    return defaultStatus;
  }
  // Convert string project types to an array
  if (
    projectTypes &&
    (typeof projectTypes === "string" || projectTypes instanceof String)
  ) {
    projectTypes = projectTypes.split(",");
  }
  // If only exclude type is specified, then do not allow oci type
  if (
    (projectTypes?.length === 1 || !defaultStatus) &&
    !options.projectType?.length &&
    options.excludeType?.length
  ) {
    const isExcluded = projectTypes.some((pt) => {
      const ptLower = pt.toLowerCase();
      if (options.excludeType.includes(ptLower)) {
        return true;
      }
      for (const et of options.excludeType) {
        const etLower = et.toLowerCase();
        for (const [key, aliases] of Object.entries(PROJECT_TYPE_ALIASES)) {
          if (
            (key === etLower || aliases.includes(etLower)) &&
            (key === ptLower || aliases.includes(ptLower))
          ) {
            return true;
          }
        }
      }
      return false;
    });
    if (isExcluded) {
      return false;
    }
    return (
      !projectTypes.includes("oci") &&
      !projectTypes.includes("oci-dir") &&
      !projectTypes.includes("os") &&
      !projectTypes.includes("docker") &&
      !options.excludeType.includes("oci")
    );
  }
  const allProjectTypes = [...projectTypes];
  // Convert the project types into base types
  const baseProjectTypes = [];
  // Support for arbitrary versioned ruby type
  if (
    options.projectType?.length &&
    projectTypes.filter((p) => p.startsWith("ruby")).length
  ) {
    baseProjectTypes.push("ruby");
  }
  const baseExcludeTypes = [];
  for (const abt of Object.keys(PROJECT_TYPE_ALIASES)) {
    if (
      PROJECT_TYPE_ALIASES[abt].filter((pt) =>
        new Set(options?.projectType).has(pt),
      ).length
    ) {
      baseProjectTypes.push(abt);
    }
    if (
      PROJECT_TYPE_ALIASES[abt].filter((pt) => new Set(projectTypes).has(pt))
        .length
    ) {
      allProjectTypes.push(abt);
    }
    if (
      PROJECT_TYPE_ALIASES[abt].filter((pt) =>
        new Set(options?.excludeType).has(pt),
      ).length
    ) {
      baseExcludeTypes.push(abt);
    }
  }
  const shouldInclude =
    !options.projectType?.length ||
    options.projectType?.includes("universal") ||
    options.projectType?.filter((pt) => new Set(allProjectTypes).has(pt))
      .length > 0 ||
    baseProjectTypes.filter((pt) => new Set(allProjectTypes).has(pt)).length >
      0;
  if (shouldInclude && options.excludeType) {
    return (
      !baseExcludeTypes.filter((pt) => pt && new Set(baseProjectTypes).has(pt))
        .length &&
      !baseExcludeTypes.filter((pt) => pt && new Set(allProjectTypes).has(pt))
        .length
    );
  }
  return shouldInclude;
}

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
export function shouldRunPredictiveBomAudit(options, commandPath) {
  const normalizedCommandPath = `${commandPath || ""}`.toLowerCase();
  if (normalizedCommandPath.includes("obom")) {
    return false;
  }
  if (normalizedCommandPath.includes("hbom")) {
    return false;
  }
  const projectTypes = Array.isArray(options?.projectType)
    ? options.projectType
    : typeof options?.projectType === "string"
      ? options.projectType.split(",")
      : [];
  const normalizedProjectTypes = projectTypes
    .map((projectType) => `${projectType || ""}`.trim().toLowerCase())
    .filter(Boolean);
  if (!normalizedProjectTypes.length) {
    return true;
  }
  const hbomProjectTypes = new Set(["hbom", "hardware"]);
  if (
    normalizedProjectTypes.every((projectType) =>
      hbomProjectTypes.has(projectType),
    )
  ) {
    return false;
  }
  const osProjectTypes = new Set(["os", ...(PROJECT_TYPE_ALIASES.os || [])]);
  return !normalizedProjectTypes.every((projectType) =>
    osProjectTypes.has(projectType),
  );
}

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
export function getDefaultBomAuditCategories(options, commandPath) {
  const normalizedCommandPath = `${commandPath || ""}`.toLowerCase();
  const defaultHbomCategories = options?.includeRuntime
    ? `${DEFAULT_HBOM_AUDIT_CATEGORIES},host-topology`
    : DEFAULT_HBOM_AUDIT_CATEGORIES;
  if (normalizedCommandPath.includes("hbom")) {
    return defaultHbomCategories;
  }
  const projectTypes = Array.isArray(options?.projectType)
    ? options.projectType
    : typeof options?.projectType === "string"
      ? options.projectType.split(",")
      : [];
  const normalizedProjectTypes = projectTypes
    .map((projectType) => `${projectType || ""}`.trim().toLowerCase())
    .filter(Boolean);
  if (
    normalizedProjectTypes.length &&
    normalizedProjectTypes.every((projectType) =>
      ["hbom", "hardware"].includes(projectType),
    )
  ) {
    return defaultHbomCategories;
  }
  if (!shouldRunPredictiveBomAudit(options, commandPath)) {
    return "obom-runtime";
  }
  return undefined;
}

/**
 * Convenient method to check if the given package manager is allowed.
 *
 * @param {String} name Package manager name
 * @param {Array} conflictingManagers List of package managers
 * @param {Object} options CLI options
 *
 * @returns {Boolean} True if the package manager is allowed
 */
export function isPackageManagerAllowed(name, conflictingManagers, options) {
  for (const apm of conflictingManagers) {
    if (options?.projectType?.includes(apm)) {
      return false;
    }
  }
  const res = !options.excludeType?.filter(
    (p) => p === name || PACKAGE_MANAGER_ALIASES[p]?.includes(name),
  ).length;
  if (res) {
    thoughtLog(
      `**PACKAGE MANAGER**: Let's make use of the package manager '${name}', which is allowed.`,
    );
  }
  return res;
}

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
export function convertOSQueryResults(
  queryCategory,
  queryObj,
  results,
  enhance = false,
) {
  const pkgList = [];
  if (results?.length) {
    for (const res of results) {
      const version = deriveOsQueryVersion(res);
      let name = deriveOsQueryName(res, results.length === 1, queryObj.name);
      if (queryObj.purlType === "chrome-extension") {
        name = (res.identifier || res.extension_id || name || "").toLowerCase();
      }
      let group = "";
      const subpath = res.path || res.admindir || res.source;
      const publisher = deriveOsQueryPublisher(res);
      // For vscode-extension purl type, the publisher is used as the namespace
      if (queryObj.purlType === "vscode-extension" && publisher) {
        group = publisher.toLowerCase();
      }
      let scope;
      const compScope = res.priority;
      if (["required", "optional", "excluded"].includes(compScope)) {
        scope = compScope;
      }
      const description =
        deriveOsQueryDescription(res) ||
        (queryObj.purlType === "chrome-extension" ? res.name || "" : "");
      let qualifiers;
      if (res.identifying_number?.length) {
        qualifiers = {
          tag_id: res.identifying_number.replace("{", "").replace("}", ""),
        };
      }
      if (name) {
        name = sanitizeOsQueryIdentity(name);
        group = sanitizeOsQueryIdentity(group);
        const isCryptoAsset = queryObj.componentType === "cryptographic-asset";
        const purl = shouldCreateOsQueryPurl(queryObj.componentType)
          ? createOsQueryPurl(
              queryObj.purlType,
              group,
              name,
              version,
              qualifiers,
              subpath,
            )
          : undefined;
        const props = [{ name: "cdx:osquery:category", value: queryCategory }];
        props.push(...createLolbasProperties(queryCategory, res));
        if (platform() === "linux") {
          props.push(...createGtfoBinsPropertiesFromRow(queryCategory, res));
        }
        let providesList;
        if (enhance) {
          switch (queryObj.purlType) {
            case "deb":
              providesList = executeDpkgList(name);
              break;
            case "rpm":
              providesList = executeRpmList(name);
              break;
            case "apk":
              providesList = executeApkList(name);
              break;
            case "ebuild":
              providesList = executeEqueryList(name);
              break;
            case "alpm":
              providesList = executeAlpmList(name);
              break;
            default:
              break;
          }
        }
        if (providesList) {
          props.push({ name: "PkgProvides", value: providesList.join(", ") });
        }
        const cryptoProperties = isCryptoAsset
          ? createOsQueryCryptoProperties(queryCategory, res, version)
          : undefined;
        const hashes = createOsQueryComponentHashes(res);
        const apkg = {
          name,
          group,
          version: version || "",
          description,
          publisher,
          "bom-ref": createOsQueryBomRef(
            queryCategory,
            queryObj.componentType,
            res,
            name,
            version,
            purl,
          ),
          purl,
          scope,
          type: queryObj.componentType,
        };
        if (hashes?.length) {
          apkg.hashes = hashes;
        }
        if (cryptoProperties) {
          apkg.cryptoProperties = cryptoProperties;
        }
        for (const k of Object.keys(res).filter((p) => {
          if (["version", "description", "publisher"].includes(p)) {
            return false;
          }
          return !(queryObj.purlType !== "chrome-extension" && p === "name");
        })) {
          if (res[k] && res[k] !== "null") {
            props.push({
              name: k,
              value: res[k],
            });
          }
        }
        apkg.properties = props;
        pkgList.push(apkg);
      }
    }
  }
  return pkgList;
}

function createOsQueryComponentHashes(res) {
  const hashes = [];
  if (res?.md5) {
    hashes.push({ alg: "MD5", content: res.md5 });
  }
  if (res?.sha1) {
    hashes.push({ alg: "SHA-1", content: res.sha1 });
  }
  if (res?.sha256) {
    hashes.push({ alg: "SHA-256", content: res.sha256 });
  }
  return hashes.length ? hashes : undefined;
}

function createOsQueryBomRef(
  queryCategory,
  componentType,
  res,
  name,
  version,
  purl,
) {
  if (purl) {
    return decodeURIComponent(purl);
  }
  if (componentType === "cryptographic-asset") {
    return createOsQueryCryptoBomRef(queryCategory, res, name, version);
  }
  const identityEntry = [
    ["path", res?.path],
    ["key_file", res?.key_file],
    ["history_file", res?.history_file],
    ["fragment_path", res?.fragment_path],
    ["source_path", res?.source_path],
    ["source", res?.source],
    ["key", res?.key],
    ["label", res?.label],
    ["identifier", res?.identifier],
    ["uuid", res?.uuid],
    ["device_id", res?.device_id],
    ["sid", res?.sid],
    ["logon_id", res?.logon_id],
    ["pid", res?.pid],
    ["uid", res?.uid],
  ].find(
    ([, value]) =>
      value !== undefined && value !== null && String(value).length,
  );
  return createOsQueryFallbackBomRef(
    queryCategory,
    componentType,
    name,
    version,
    identityEntry?.[0],
    identityEntry?.[1],
  );
}

function createOsQueryCryptoBomRef(queryCategory, res, name, version) {
  const encodedName = encodeURIComponent(
    name || queryCategory || "crypto-asset",
  );
  switch (queryCategory) {
    case "trusted_gpg_keys":
      return `crypto/related-crypto-material/public-key/${encodedName}@sha256:${res?.sha256 || version || "unknown"}`;
    case "kernel_keys":
      return `crypto/related-crypto-material/key/${encodedName}@${version || res?.serial_number || "unknown"}`;
    case "certificates":
    case "secureboot_certificates":
      return `crypto/certificate/${encodedName}@${res?.sha256 ? `sha256:${res.sha256}` : version || "unknown"}`;
    default:
      return `crypto/related-crypto-material/unknown/${encodedName}@${version || "unknown"}`;
  }
}

function createOsQueryCryptoProperties(queryCategory, res, version) {
  switch (queryCategory) {
    case "trusted_gpg_keys":
      return {
        assetType: "related-crypto-material",
        relatedCryptoMaterialProperties: {
          type: "public-key",
          id: res?.sha256 || version || res?.path || res?.name || "unknown",
          state: "active",
        },
      };
    case "kernel_keys":
      return {
        assetType: "related-crypto-material",
        relatedCryptoMaterialProperties: {
          type: "key",
          id:
            res?.serial_number ||
            version ||
            res?.description ||
            res?.name ||
            "unknown",
          state: res?.timeout === "expd" ? "deactivated" : "active",
        },
      };
    case "certificates":
    case "secureboot_certificates": {
      const certificateFileExtension = extname(res?.path || "")
        .replace(/^\./, "")
        .toLowerCase();
      const certificateFormat =
        queryCategory === "secureboot_certificates"
          ? "X.509"
          : deriveCertificateFormat(certificateFileExtension);
      return {
        assetType: "certificate",
        algorithmProperties: {
          executionEnvironment: "unknown",
          implementationPlatform: "unknown",
        },
        certificateProperties: {
          serialNumber: res?.serial || undefined,
          subjectName: res?.subject || res?.common_name || undefined,
          issuerName: res?.issuer || undefined,
          notValidBefore: normalizeCertificateDate(res?.not_valid_before),
          notValidAfter: normalizeCertificateDate(res?.not_valid_after),
          certificateFormat,
          certificateFileExtension: certificateFileExtension || undefined,
          fingerprint: res?.sha1
            ? { alg: "SHA-1", content: res.sha1 }
            : undefined,
        },
      };
    }
    default:
      return {
        assetType: "related-crypto-material",
        relatedCryptoMaterialProperties: {
          type: "unknown",
          id: version || res?.path || res?.name || "unknown",
        },
      };
  }
}

function deriveCertificateFormat(certificateFileExtension) {
  switch ((certificateFileExtension || "").toLowerCase()) {
    case "pem":
      return "PEM";
    case "der":
      return "DER";
    case "cer":
    case "crt":
      return "X.509";
    default:
      return undefined;
  }
}

function normalizeCertificateDate(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const stringValue = `${value}`.trim();
  if (!stringValue) {
    return undefined;
  }
  const numericValue = Number(stringValue);
  if (Number.isFinite(numericValue)) {
    const millis = stringValue.length > 10 ? numericValue : numericValue * 1000;
    const parsedDate = new Date(millis);
    return Number.isNaN(parsedDate.getTime())
      ? undefined
      : parsedDate.toISOString();
  }
  const parsedDate = new Date(stringValue);
  return Number.isNaN(parsedDate.getTime())
    ? undefined
    : parsedDate.toISOString();
}
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
export function extractToolRefs(tools, predicate) {
  if (!tools) {
    return [];
  }
  const toolRefs = new Set();
  const toolList = Array.isArray(tools)
    ? tools
    : [...(tools.components || []), ...(tools.services || [])];
  for (const tool of toolList) {
    let toolRef = tool?.["bom-ref"];
    if (!toolRef && tool?.purl) {
      toolRef = decodeURIComponent(tool.purl);
    }
    if (!toolRef && tool?.name) {
      try {
        toolRef = new PackageURL(
          "generic",
          tool.group || tool.publisher || tool.manufacturer?.name || undefined,
          tool.name,
          tool.version || undefined,
          null,
          null,
        ).toString();
      } catch (_err) {
        thoughtLog("Unable to derive bom-ref for external tool", {
          group: tool.group,
          manufacturer: tool.manufacturer?.name,
          name: tool.name,
          publisher: tool.publisher,
          version: tool.version,
        });
        toolRef = undefined;
      }
    }
    if (!toolRef) {
      continue;
    }
    if (!tool["bom-ref"]) {
      tool["bom-ref"] = toolRef;
    }
    if (predicate && !predicate(tool)) {
      continue;
    }
    toolRefs.add(toolRef);
  }
  return Array.from(toolRefs);
}

/**
 * Attach evidence.identity.tools references to the supplied subjects.
 *
 * @param {Object|Object[]} subjects Component or service objects
 * @param {string[]} toolRefs Tool bom-refs
 * @returns {Object|Object[]} The same mutated subject(s)
 */
export function attachIdentityTools(subjects, toolRefs) {
  if (!subjects || !toolRefs?.length) {
    return subjects;
  }
  const uniqueToolRefs = Array.from(new Set(toolRefs.filter(Boolean)));
  if (!uniqueToolRefs.length) {
    return subjects;
  }
  const subjectList = Array.isArray(subjects) ? subjects : [subjects];
  for (const subject of subjectList) {
    const identities = Array.isArray(subject?.evidence?.identity)
      ? subject.evidence.identity
      : subject?.evidence?.identity
        ? [subject.evidence.identity]
        : [];
    for (const identity of identities) {
      identity.tools = Array.from(
        new Set([...(identity.tools || []), ...uniqueToolRefs]),
      );
    }
  }
  return subjects;
}

/**
 * Method to add occurrence evidence for components based on import statements. Currently useful for js
 *
 * @param {array} pkgList List of package
 * @param {object} allImports Import statements object with package name as key and an object with file and location details
 * @param {object} allExports Exported modules if available from node_modules
 * @param {Boolean} deep Deep mode
 */
const NPM_BIN_IMPORT_PREFIX = "cdx:npm:bin/";

function getNpmBinPropertyValues(pkg, propertyName) {
  if (!Array.isArray(pkg?.properties)) {
    return [];
  }
  return pkg.properties
    .filter((property) => property.name === propertyName && property.value)
    .map((property) => String(property.value));
}

function splitNpmBinPropertyList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getNpmPackageBinCommandNames(pkg) {
  const binNames = new Set();
  if (pkg?.bin && typeof pkg.bin === "object") {
    for (const binName of Object.keys(pkg.bin)) {
      binNames.add(binName);
    }
  } else if (typeof pkg?.bin === "string") {
    binNames.add(pkg.name);
  }
  for (const binValue of getNpmBinPropertyValues(pkg, "cdx:npm:bin")) {
    for (const binName of splitNpmBinPropertyList(binValue)) {
      binNames.add(binName);
    }
  }
  for (const binPathValue of getNpmBinPropertyValues(pkg, "cdx:npm:binPaths")) {
    for (const binPath of splitNpmBinPropertyList(binPathValue)) {
      const normalizedBinPath = binPath.replaceAll("\\", "/");
      const binName = normalizedBinPath.split("/").filter(Boolean).pop();
      if (binName) {
        binNames.add(binName);
      }
    }
  }
  return binNames;
}

function getNpmBinCommandEvidenceKeys(allImports, pkg) {
  const binCommandNames = getNpmPackageBinCommandNames(pkg);
  if (!binCommandNames.size) {
    return [];
  }
  return Object.keys(allImports || {}).filter(
    (importName) =>
      importName.startsWith(NPM_BIN_IMPORT_PREFIX) &&
      binCommandNames.has(importName.slice(NPM_BIN_IMPORT_PREFIX.length)),
  );
}

function applyNpmBinCommandEvidence(pkg, allImports) {
  const binEvidenceKeys = getNpmBinCommandEvidenceKeys(allImports, pkg);
  if (!binEvidenceKeys.length) {
    return;
  }
  pkg.scope = "required";
  const seenOccurrenceLocations = new Set(
    (pkg.evidence?.occurrences || []).map(
      (occurrence) =>
        `${occurrence.location}${occurrence.line ? `#${occurrence.line}` : ""}`,
    ),
  );
  for (const binEvidenceKey of binEvidenceKeys) {
    for (const evidence of allImports[binEvidenceKey] || []) {
      if (!evidence?.fileName) {
        continue;
      }
      const occurrence = createOccurrenceEvidence(evidence.fileName, {
        ...(evidence.lineNumber ? { line: evidence.lineNumber } : {}),
      });
      if (!occurrence) {
        continue;
      }
      const occurrenceLocation = `${occurrence.location}${occurrence.line ? `#${occurrence.line}` : ""}`;
      if (seenOccurrenceLocations.has(occurrenceLocation)) {
        continue;
      }
      pkg.evidence = pkg.evidence || {};
      pkg.evidence.occurrences = pkg.evidence.occurrences || [];
      pkg.evidence.occurrences.push(occurrence);
      seenOccurrenceLocations.add(occurrenceLocation);
    }
  }
}

export async function addEvidenceForImports(
  pkgList,
  allImports,
  allExports,
  deep,
) {
  const impPkgs = Object.keys(allImports);
  const exportedPkgs = Object.keys(allExports);
  for (const pkg of pkgList) {
    if (impPkgs?.length) {
      // Assume that all packages are optional until we see an evidence
      pkg.scope = "optional";
    }
    const { group, name } = pkg;
    // Evidence belonging to a type must be associated with the package
    if (group === "@types") {
      continue;
    }
    const aliases = group?.length
      ? [name, `${group}/${name}`, `@${group}/${name}`]
      : [name];
    // Deno jsr packages are published under the `@jsr` npm-compat scope
    // (e.g. `@jsr/std__assert`) but are imported in source using their
    // original jsr specifier (e.g. `@std/assert`). Match occurrence evidence
    // against that specifier too, recovered from the `cdx:deno:jsrKey`
    // property recorded during deno.lock parsing.
    const jsrKey = (pkg.properties || []).find(
      (p) => p.name === "cdx:deno:jsrKey",
    )?.value;
    if (jsrKey) {
      const atIndex = jsrKey.lastIndexOf("@");
      const jsrSpecifier = atIndex > 0 ? jsrKey.substring(0, atIndex) : jsrKey;
      if (jsrSpecifier && !aliases.includes(jsrSpecifier)) {
        aliases.push(jsrSpecifier);
      }
    }
    let isImported = false;
    for (const alias of aliases) {
      const isWasmAlias = /\.wasm([?#].*)?$/i.test(alias);
      const all_includes = impPkgs.filter(
        (find_pkg) =>
          find_pkg.startsWith(alias) &&
          (find_pkg.length === alias.length || find_pkg[alias.length] === "/"),
      );
      const all_exports = exportedPkgs.filter((find_pkg) =>
        find_pkg.startsWith(alias),
      );
      if (all_exports?.length) {
        let exportedModules = new Set(isWasmAlias ? [] : all_exports);
        pkg.properties = pkg.properties || [];
        for (const subevidence of all_exports) {
          const evidences = allExports[subevidence];
          for (const evidence of evidences) {
            if (evidence && Object.keys(evidence).length) {
              if (isWasmAlias) {
                for (const wasmImportedModule of evidence.importedModules ||
                  []) {
                  if (wasmImportedModule?.length) {
                    exportedModules.add(wasmImportedModule);
                  }
                }
              }
              if (evidence.exportedModules.length > 1) {
                for (const aexpsubm of evidence.exportedModules) {
                  // Be selective on the submodule names
                  if (
                    !evidence.importedAs
                      .toLowerCase()
                      .includes(aexpsubm.toLowerCase()) &&
                    !alias.endsWith(aexpsubm)
                  ) {
                    // Store both the short and long form of the exported sub modules
                    if (aexpsubm.length > 3) {
                      exportedModules.add(aexpsubm);
                    }
                    exportedModules.add(
                      `${evidence.importedAs.replace("./", "")}/${aexpsubm}`,
                    );
                  }
                }
              }
            }
          }
        }
        exportedModules = Array.from(exportedModules);
        if (exportedModules.length) {
          pkg.properties.push({
            name: "ExportedModules",
            value: exportedModules.join(","),
          });
        }
      }
      // Identify all the imported modules of a component
      if (impPkgs.includes(alias) || all_includes.length) {
        isImported = true;
        let importedModules = new Set();
        let wasmExportedModules = new Set();
        const seenOccurrenceLocations = new Set();
        pkg.scope = "required";
        for (const subevidence of all_includes) {
          const evidences = allImports[subevidence];
          for (const evidence of evidences) {
            if (evidence && Object.keys(evidence).length && evidence.fileName) {
              const occurrence = createOccurrenceEvidence(evidence.fileName, {
                ...(evidence.lineNumber ? { line: evidence.lineNumber } : {}),
              });
              if (occurrence) {
                pkg.evidence = pkg.evidence || {};
                pkg.evidence.occurrences = pkg.evidence.occurrences || [];
                const occurrenceLocation = `${occurrence.location}${occurrence.line ? `#${occurrence.line}` : ""}`;
                if (!seenOccurrenceLocations.has(occurrenceLocation)) {
                  pkg.evidence.occurrences.push(occurrence);
                  seenOccurrenceLocations.add(occurrenceLocation);
                }
              }
              importedModules.add(evidence.importedAs);
              for (const importedSm of evidence.importedModules || []) {
                if (!importedSm) {
                  continue;
                }
                if (isWasmAlias) {
                  wasmExportedModules.add(importedSm);
                }
                // Store both the short and long form of the imported sub modules
                if (importedSm.length > 3) {
                  importedModules.add(importedSm);
                }
                importedModules.add(`${evidence.importedAs}/${importedSm}`);
              }
            }
          }
        }
        importedModules = Array.from(importedModules);
        wasmExportedModules = Array.from(wasmExportedModules);
        if (importedModules.length) {
          pkg.properties = pkg.properties || [];
          pkg.properties.push({
            name: "ImportedModules",
            value: importedModules.join(","),
          });
        }
        if (isWasmAlias && wasmExportedModules.length) {
          pkg.properties = pkg.properties || [];
          if (!pkg.properties.some((p) => p.name === "ExportedModules")) {
            pkg.properties.push({
              name: "ExportedModules",
              value: wasmExportedModules.join(","),
            });
          }
        }
        break;
      }
      if (
        impPkgs?.length > 0 &&
        !isImported &&
        DEBUG_MODE &&
        pkg?.scope !== "optional"
      ) {
        console.debug(
          `\x1b[1;35mNotice: Package ${pkg.name} has no usage in code. Check if it is needed.\x1b[0m`,
        );
      }
      // Capture metadata such as description from local node_modules in deep mode
      if (deep && !pkg.description && pkg.properties) {
        let localNodeModulesPath;
        for (const aprop of pkg.properties) {
          if (aprop.name === "LocalNodeModulesPath") {
            localNodeModulesPath = resolve(join(aprop.value, "package.json"));
            break;
          }
        }
        if (localNodeModulesPath && safeExistsSync(localNodeModulesPath)) {
          const lnmPkgList = await parsePkgJson(localNodeModulesPath, true);
          if (lnmPkgList && lnmPkgList.length === 1) {
            const lnmMetadata = lnmPkgList[0];
            if (lnmMetadata && Object.keys(lnmMetadata).length) {
              pkg.description = lnmMetadata.description;
              pkg.author = lnmMetadata.author;
              pkg.license = lnmMetadata.license;
              pkg.homepage = lnmMetadata.homepage;
              pkg.repository = lnmMetadata.repository;
            }
          }
        }
      }
    } // for alias
    // Trim the properties
    applyNpmBinCommandEvidence(pkg, allImports);
    pkg.properties = pkg.properties.filter(
      (p) => p.name !== "LocalNodeModulesPath",
    );
  } // for pkg
  return pkgList;
}

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
export function getOSPackageForFile(afile, osPkgsList) {
  for (const ospkg of osPkgsList) {
    for (const props of ospkg.properties || []) {
      if (
        props.name === "PkgProvides" &&
        props.value.includes(afile.toLowerCase())
      ) {
        delete ospkg.scope;
        // dev packages are libraries
        ospkg.type = "library";
        // Set the evidence to indicate how we identified this package from the header or .so file
        ospkg.evidence = {
          identity: {
            field: "purl",
            confidence: 0.8,
            methods: [
              {
                technique: "filename",
                confidence: 0.8,
                value: `PkgProvides ${afile}`,
              },
            ],
          },
        };
        return ospkg;
      }
    }
  }
  return undefined;
}

/**
 * Method to find c/c++ modules by collecting usages with atom
 *
 * @param {string} src directory
 * @param {object} options Command line options
 * @param {array} osPkgsList Array of OS pacakges represented as components
 * @param {array} epkgList Existing packages list
 */
export function getCppModules(src, options, osPkgsList, epkgList) {
  // Generic is the type to use where the package registry could not be located
  const pkgType = "generic";
  const pkgList = [];
  const pkgAddedMap = {};
  let sliceData;
  const epkgMap = {};
  let parentComponent;
  const dependsOn = new Set();

  (epkgList || []).forEach((p) => {
    epkgMap[`${p.group}/${p.name}`] = p;
  });
  // Let's look for any vcpkg.json file to tell us about the directory we're scanning
  // users can use this file to give us a clue even if they do not use vcpkg library manager
  if (safeExistsSync(join(src, "vcpkg.json"))) {
    const vcPkgData = JSON.parse(
      readFileSync(join(src, "vcpkg.json"), { encoding: "utf-8" }),
    );
    if (vcPkgData && Object.keys(vcPkgData).length && vcPkgData.name) {
      const parentPurl = new PackageURL(
        pkgType,
        "",
        vcPkgData.name,
        vcPkgData.version || "",
        null,
        null,
      ).toString();
      parentComponent = {
        name: vcPkgData.name,
        version: vcPkgData.version || "",
        description: vcPkgData.description,
        license: vcPkgData.license,
        purl: parentPurl,
        type: "application",
        "bom-ref": decodeURIComponent(parentPurl),
      };
      if (vcPkgData.homepage) {
        parentComponent.homepage = { url: vcPkgData.homepage };
      }
      // Are there any dependencies declared in vcpkg.json
      if (vcPkgData.dependencies && Array.isArray(vcPkgData.dependencies)) {
        for (const avcdep of vcPkgData.dependencies) {
          let avcpkgName;
          let scope;
          if (typeof avcdep === "string" || avcdep instanceof String) {
            avcpkgName = avcdep;
          } else if (Object.keys(avcdep).length && avcdep.name) {
            avcpkgName = avcdep.name;
            if (avcdep.host) {
              scope = "optional";
            }
          }
          // Is this a dependency we haven't seen before including the all lower and upper case version?
          if (
            avcpkgName &&
            !epkgMap[`/${avcpkgName}`] &&
            !epkgMap[`/${avcpkgName.toLowerCase()}`] &&
            !epkgMap[`/${avcpkgName.toUpperCase()}`]
          ) {
            const pkgPurl = new PackageURL(
              pkgType,
              "",
              avcpkgName,
              "",
              null,
              null,
            ).toString();
            const apkg = {
              group: "",
              name: avcpkgName,
              type: pkgType,
              version: "",
              purl: pkgPurl,
              scope,
              "bom-ref": decodeURIComponent(pkgPurl),
              evidence: {
                identity: {
                  field: "purl",
                  confidence: 0.5,
                  methods: [
                    {
                      technique: "source-code-analysis",
                      confidence: 0.5,
                      value: `Filename ${join(src, "vcpkg.json")}`,
                    },
                  ],
                },
              },
            };
            if (!pkgAddedMap[avcpkgName]) {
              pkgList.push(apkg);
              dependsOn.add(apkg["bom-ref"]);
              pkgAddedMap[avcpkgName] = true;
            }
          }
        }
      }
    } // if
  } else if (safeExistsSync(join(src, "CMakeLists.txt"))) {
    const retMap = parseCmakeLikeFile(join(src, "CMakeLists.txt"), pkgType);
    if (retMap.parentComponent && Object.keys(retMap.parentComponent).length) {
      parentComponent = retMap.parentComponent;
    }
  } else if (options.projectName && options.projectVersion) {
    parentComponent = {
      group: options.projectGroup || "",
      name: options.projectName || "",
      version: `${options.projectVersion}` || "latest",
      type: "application",
    };
    const parentPurl = new PackageURL(
      pkgType,
      parentComponent.group,
      parentComponent.name,
      parentComponent.version,
      null,
      null,
    ).toString();
    parentComponent.purl = parentPurl;
    parentComponent["bom-ref"] = decodeURIComponent(parentPurl);
  }
  if (options.usagesSlicesFile && safeExistsSync(options.usagesSlicesFile)) {
    sliceData = JSON.parse(
      readFileSync(options.usagesSlicesFile, { encoding: "utf-8" }),
    );
    if (DEBUG_MODE) {
      console.log("Re-using existing slices file", options.usagesSlicesFile);
    }
  } else {
    sliceData = findAppModules(
      src,
      options.deep ? "c" : "h",
      "usages",
      options.usagesSlicesFile,
      options,
    );
  }
  const usageData = parseCUsageSlice(sliceData);
  for (let afile of Object.keys(usageData)) {
    // Normalize windows separator
    afile = afile.replace("..\\", "").replace(/\\/g, "/");
    const fileName = basename(afile);
    if (!fileName?.length) {
      continue;
    }
    const extn = extname(fileName);
    let group = dirname(afile);
    if (
      group.startsWith(".") ||
      group.startsWith(_sep) ||
      safeExistsSync(resolve(afile)) ||
      safeExistsSync(resolve(src, afile))
    ) {
      group = "";
    }
    const version = "";
    // We need to resolve the name to an os package here
    const name = fileName.replace(extn, "");
    // Logic here if name matches the standard library of cpp
    // we skip it
    // Load the glibc-stdlib.json file, which contains std lib for cpp
    if (CPP_STD_MODULES.includes(name)) {
      continue;
    }
    let apkg = getOSPackageForFile(afile, osPkgsList) ||
      epkgMap[`${group}/${name}`] || {
        name,
        group,
        version: "",
        type: pkgType,
      };
    // If this is a relative file, there is a good chance we can reuse the project group
    if (!afile.startsWith(_sep) && !group.length) {
      group = options.projectGroup || "";
    }
    if (!apkg.purl) {
      apkg.purl = new PackageURL(
        pkgType,
        group,
        name,
        version,
        null,
        afile,
      ).toString();
      apkg.evidence = {
        identity: {
          field: "purl",
          confidence: 0,
          methods: [
            {
              technique: "source-code-analysis",
              confidence: 0,
              value: `Filename ${afile}`,
            },
          ],
        },
      };
      apkg["bom-ref"] = decodeURIComponent(apkg["purl"]);
    }
    if (usageData[afile]) {
      const usymbols = Array.from(usageData[afile])
        .filter(
          (v) =>
            !v.startsWith("<") &&
            !v.startsWith("__") &&
            v !== "main" &&
            !v.includes("anonymous_") &&
            !v.includes(afile),
        )
        .map((v) => v.split(":")[0])
        .sort();
      if (!apkg["properties"] && usymbols.length) {
        apkg["properties"] = [
          { name: "ImportedSymbols", value: usymbols.join("|") },
        ];
      } else {
        apkg["properties"] = [];
      }
      const newProps = [];
      let symbolsPropertyFound = false;
      for (const prop of apkg["properties"]) {
        if (prop.name === "ImportedSymbols") {
          symbolsPropertyFound = true;
          let existingSymbols = prop.value.split("|");
          existingSymbols = existingSymbols.concat(usymbols);
          prop.value = Array.from(new Set(existingSymbols)).sort().join("|");
        }
        newProps.push(prop);
      }
      if (!symbolsPropertyFound && usymbols.length) {
        apkg["properties"].push({
          name: "ImportedSymbols",
          value: usymbols.join("|"),
        });
      }
      apkg["properties"] = newProps;
    }
    // At this point, we have a package but we don't know what it's called
    // So let's try to locate this generic package using some heuristics
    apkg = locateGenericPackage(apkg);
    if (!pkgAddedMap[name]) {
      pkgList.push(apkg);
      dependsOn.add(apkg["bom-ref"]);
      pkgAddedMap[name] = true;
    }
  }
  const dependenciesList =
    dependsOn.size && parentComponent
      ? [
          {
            ref: parentComponent["bom-ref"],
            dependsOn: [...dependsOn].sort(),
          },
        ]
      : [];
  return {
    parentComponent,
    pkgList: pkgList.sort((a, b) => a.purl.localeCompare(b.purl)),
    dependenciesList,
  };
}
/**
 * Method to retrieve metadata for nuget packages
 *
 * @param {Array} pkgList Package list
 * @param {Array} dependencies Dependencies
 */
function addDotnetIdentityMethod(apkg, value) {
  if (!value) {
    return;
  }
  apkg.evidence = apkg.evidence || {};
  const identityList = Array.isArray(apkg.evidence.identity)
    ? apkg.evidence.identity
    : undefined;
  let identity = identityList
    ? identityList.find((entry) => entry?.field === "purl") ||
      identityList.find((entry) => !entry?.field)
    : apkg.evidence.identity;
  if (!identity) {
    identity = { field: "purl", confidence: 1, methods: [] };
    if (identityList) {
      identityList.push(identity);
    }
  }
  identity.field ??= "purl";
  identity.confidence ??= 1;
  identity.methods ??= [];
  if (
    !identity.methods.some(
      (method) =>
        method.technique === "source-code-analysis" && method.value === value,
    )
  ) {
    identity.methods.push({
      technique: "source-code-analysis",
      confidence: 1,
      value,
    });
  }
  apkg.evidence.identity = identityList || identity;
}

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
export function addEvidenceForDotnet(pkgList, slicesFile) {
  // We need two datastructures.
  // dll to purl mapping from the pkgList
  // purl to occurrences list using the slicesFile
  if (!slicesFile || !safeExistsSync(slicesFile)) {
    return pkgList;
  }
  const pkgFilePurlMap = {};
  const purlLocationMap = {};
  const purlModulesMap = {};
  const purlMethodsMap = {};
  const purlAliasMap = buildDosaiPurlAliasMap(pkgList);
  for (const apkg of pkgList) {
    if (apkg.properties && Array.isArray(apkg.properties)) {
      apkg.properties
        .filter((p) => p.name === "PackageFiles")
        .forEach((aprop) => {
          if (aprop.value) {
            const tmpA = aprop.value.split(", ");
            if (tmpA?.length) {
              tmpA.forEach((dllFile) => {
                pkgFilePurlMap[dllFile] = apkg.purl;
              });
            }
          }
        });
    }
  }
  let slicesData;
  try {
    slicesData = JSON.parse(readFileSync(slicesFile, "utf-8"));
  } catch (_err) {
    return pkgList;
  }
  if (slicesData && Object.keys(slicesData)) {
    thoughtLog(
      "Let's thoroughly inspect the dependency slice to identify where and how the components are used.",
    );
    if (slicesData.Dependencies) {
      for (const adep of slicesData.Dependencies) {
        if (adep.Purl) {
          const modPurl = resolveDosaiComponentPurl(adep.Purl, purlAliasMap);
          if (modPurl) {
            addDosaiSetValue(
              purlLocationMap,
              modPurl,
              dosaiSourceLocation(adep),
            );
            addDosaiSetValue(
              purlModulesMap,
              modPurl,
              adep.Name || adep.Namespace,
            );
          }
        }
        // Case 1: Dependencies slice has the .dll file
        if (adep.Module?.endsWith(".dll") && pkgFilePurlMap[adep.Module]) {
          const modPurl = pkgFilePurlMap[adep.Module];
          if (!purlLocationMap[modPurl]) {
            purlLocationMap[modPurl] = new Set();
          }
          purlLocationMap[modPurl].add(`${adep.Path}#${adep.LineNumber}`);
        } else if (
          adep?.Name &&
          (adep?.Namespace?.startsWith("System") ||
            adep?.Namespace?.startsWith("Microsoft"))
        ) {
          // Case 2: System packages where the .dll information is missing
          // In this case, the dll file name is the name followed by dll.
          const moduleDll = `${adep.Name}.dll`;
          if (pkgFilePurlMap[moduleDll]) {
            const modPurl = pkgFilePurlMap[moduleDll];
            if (!purlLocationMap[modPurl]) {
              purlLocationMap[modPurl] = new Set();
            }
            purlLocationMap[modPurl].add(`${adep.Path}#${adep.LineNumber}`);
          }
        }
      }
    }
    if (slicesData.PackageReachability) {
      const graphEdges = Object.fromEntries(
        (slicesData.CallGraph?.Edges || []).map((edge) => [edge.Id, edge]),
      );
      const graphNodes = Object.fromEntries(
        (slicesData.CallGraph?.Nodes || []).map((node) => [node.Id, node]),
      );
      for (const reachability of slicesData.PackageReachability) {
        const modPurl = resolveDosaiComponentPurl(
          reachability.Purl,
          purlAliasMap,
        );
        if (!modPurl) {
          continue;
        }
        let hasExplicitSourceLocations = false;
        for (const sourceLocation of reachability.SourceLocations || []) {
          const location = dosaiSourceLocation(sourceLocation);
          addDosaiSetValue(purlLocationMap, modPurl, location);
          hasExplicitSourceLocations ||= Boolean(location);
        }
        for (const edgeId of reachability.EdgeIds || []) {
          const edge = graphEdges[edgeId];
          if (!hasExplicitSourceLocations) {
            addDosaiSetValue(
              purlLocationMap,
              modPurl,
              dosaiSourceLocation(edge),
            );
          }
          addDosaiSetValue(
            purlMethodsMap,
            modPurl,
            edge?.CalledMethodName || edge?.TargetName,
          );
        }
        for (const nodeId of reachability.NodeIds || []) {
          const node = graphNodes[nodeId];
          if (!hasExplicitSourceLocations) {
            addDosaiSetValue(
              purlLocationMap,
              modPurl,
              dosaiSourceLocationFromNode(node),
            );
          }
          addDosaiSetValue(
            purlModulesMap,
            modPurl,
            node?.ClassName || node?.Module,
          );
          addDosaiSetValue(
            purlMethodsMap,
            modPurl,
            node?.Name || node?.Identity?.MethodName,
          );
        }
      }
    }
    if (slicesData.MethodCalls) {
      for (const amethodCall of slicesData.MethodCalls) {
        if (
          amethodCall.Module?.endsWith(".dll") &&
          pkgFilePurlMap[amethodCall.Module]
        ) {
          const modPurl = pkgFilePurlMap[amethodCall.Module];
          if (!purlLocationMap[modPurl]) {
            purlLocationMap[modPurl] = new Set();
          }
          if (!purlModulesMap[modPurl]) {
            purlModulesMap[modPurl] = new Set();
          }
          if (!purlMethodsMap[modPurl]) {
            purlMethodsMap[modPurl] = new Set();
          }
          purlLocationMap[modPurl].add(
            `${amethodCall.Path}#${amethodCall.LineNumber}`,
          );
          purlModulesMap[modPurl].add(amethodCall.ClassName);
          purlMethodsMap[modPurl].add(amethodCall.CalledMethod);
        }
      }
    }
    if (slicesData.AssemblyInformation) {
      for (const apkg of pkgList) {
        if (!apkg.version) {
          for (const assemblyInfo of slicesData.AssemblyInformation) {
            if (apkg.name === assemblyInfo.Name) {
              apkg.version = assemblyInfo.Version;
            }
          }
        }
      }
    }
  }
  if (Object.keys(purlLocationMap).length) {
    for (const apkg of pkgList) {
      if (purlLocationMap[apkg.purl]) {
        const locationOccurrences = Array.from(
          purlLocationMap[apkg.purl],
        ).sort();
        // Add the occurrences evidence
        apkg.evidence = apkg.evidence || {};
        apkg.evidence.occurrences = locationOccurrences.map((l) =>
          parseOccurrenceEvidenceLocation(l),
        );
        addDotnetIdentityMethod(apkg, locationOccurrences[0]);
        // Set the package scope
        apkg.scope = "required";
      }
      // Add the imported modules to properties
      if (purlModulesMap[apkg.purl]) {
        apkg.properties = apkg.properties || [];
        apkg.properties.push({
          name: "ImportedModules",
          value: Array.from(purlModulesMap[apkg.purl]).sort().join(", "),
        });
      }
      // Add the called methods to properties
      if (purlMethodsMap[apkg.purl]) {
        apkg.properties = apkg.properties || [];
        apkg.properties.push({
          name: "CalledMethods",
          value: Array.from(purlMethodsMap[apkg.purl]).sort().join(", "),
        });
      }
    }
  } else if (slicesData?.Dependencies || slicesData?.MethodCalls) {
    thoughtLog(
      "I didn't find any occurrence evidence or detailed imported modules, even though there is good dependency slice data from dosai. This is surprising.",
    );
  }
  return pkgList;
}

/**
 * Function to parse the .d make files
 *
 * @param {String} dfile .d file path
 *
 * @returns {Object} pkgFilesMap Object with package name and list of files
 */
const isAsciiHexCode = (code) => {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x46) ||
    (code >= 0x61 && code <= 0x66)
  );
};

const hasValidPercentEncoding = (value) => {
  for (let index = 0; index < value.length; index++) {
    if (value.charCodeAt(index) !== 0x25) {
      continue;
    }
    const firstHex = value.charCodeAt(index + 1);
    const secondHex = value.charCodeAt(index + 2);
    if (!isAsciiHexCode(firstHex) || !isAsciiHexCode(secondHex)) {
      return false;
    }
    index += 2;
  }
  return true;
};

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
export function isValidIriReference(iri) {
  if (typeof iri !== "string") {
    return false;
  }
  const trimmedIri = iri.trim();
  if (iri === "" || iri !== trimmedIri) {
    return false;
  }

  if (/[${}]/.test(iri)) {
    return false;
  }

  // Validate percent-encoding with a linear scan to avoid regex backtracking
  // issues on very long attacker-controlled inputs.
  if (!hasValidPercentEncoding(iri)) {
    return false;
  }

  // Use the dedicated IRI validator for strict RFC 3987 compliance check
  const validateIriResult = validateIri(iri, IriValidationStrategy.Strict);

  // If the IRI validator reports an error, it's invalid.
  if (validateIriResult instanceof Error) {
    return false;
  }

  // Optional: Additional check for common URI schemes (like http/https)
  //    using the built-in URL constructor for stricter URI syntax conformance.
  //    This might catch cases where an IRI is valid per RFC 3987 but not
  //    strictly a valid URI as parsed by the URL constructor (e.g., missing host for http).
  //    Only apply this if the IRI looks like it starts with a scheme like http.
  if (/^https?:/i.test(iri)) {
    // Case-insensitive check for http/https
    try {
      // Attempt to construct a URL object. If it fails, it's likely not a valid URI structure.
      new URL(iri); // Use iri here
    } catch (_error) {
      // If URL construction fails, consider the IRI reference invalid for http-like schemes.
      return false;
    }
  }

  // 8. If all checks pass, the IRI reference is considered valid.
  return true;
}

/**
 * Method to check if a given dependency tree is partial or not.
 *
 * @param {Array} dependencies List of dependencies
 * @param {Number} componentsCount Number of components
 * @returns {Boolean} True if the dependency tree lacks any non-root parents without children. False otherwise.
 */
export function isPartialTree(dependencies, componentsCount = 1) {
  if (componentsCount <= 1) {
    return false;
  }
  if (dependencies?.length <= 1) {
    return true;
  }
  let isCbom = false;
  let parentsWithChildsCount = 0;
  for (const adep of dependencies) {
    if (adep?.dependsOn.length > 0) {
      parentsWithChildsCount++;
    }
    if (!isCbom && adep?.provides?.length > 0) {
      isCbom = true;
    }
  }
  return (
    !isCbom &&
    parentsWithChildsCount <
      Math.min(Math.round(componentsCount / 3), componentsCount)
  );
}

/**
 * Re-compute and set the scope based on the dependency tree
 *
 * @param {Array} pkgList List of components
 * @param {Array} dependencies List of dependencies
 *
 * @returns {Array} Updated list
 */
export function recomputeScope(pkgList, dependencies) {
  const requiredPkgs = {};
  if (!pkgList || !dependencies) {
    return pkgList;
  }
  for (const pkg of pkgList) {
    if (!pkg.scope || !pkg["bom-ref"]) {
      continue;
    }
    if (pkg.scope === "required") {
      requiredPkgs[pkg["bom-ref"]] = true;
    }
  }
  for (const adep of dependencies) {
    if (requiredPkgs[adep.ref]) {
      for (const ado of adep.dependsOn) {
        requiredPkgs[ado] = true;
      }
    }
  }
  // Prevent marking every component as optional
  if (!Object.keys(requiredPkgs).length) {
    return pkgList;
  }
  for (const pkg of pkgList) {
    if (requiredPkgs[pkg["bom-ref"]]) {
      pkg.scope = "required";
    } else if (!pkg.scope) {
      pkg.scope = "optional";
    }
  }
  return pkgList;
}

/**
 * Function to parse a list of environment variables to identify the paths containing executable binaries
 *
 * @param envValues {Array[String]} Environment variables list
 * @returns {Array[String]} Binary Paths identified from the environment variables
 */
export function extractPathEnv(envValues) {
  if (!envValues) {
    return [];
  }
  let binPaths = new Set();
  const shellVariables = {};
  // Let's focus only on linux container images for now
  for (const env of envValues) {
    if (env.startsWith("PATH=")) {
      binPaths = new Set(env.replace("PATH=", "").split(":"));
    } else {
      const tmpA = env.split("=");
      if (tmpA.length === 2) {
        shellVariables[`$${tmpA[0]}`] = tmpA[1];
        shellVariables[`\${${tmpA[0]}}`] = tmpA[1];
      }
    }
  }
  binPaths = Array.from(binPaths);
  const expandedBinPaths = [];
  for (let apath of binPaths) {
    // Filter empty paths
    if (!apath.length) {
      continue;
    }
    if (apath.includes("$")) {
      for (const k of Object.keys(shellVariables)) {
        apath = apath.replace(k, shellVariables[k]);
      }
    }
    // We're here, but not all paths got substituted
    // Let's ignore them for now instead of risking substitution based on host values.
    // Eg: ${GITHUB_TOKEN} could get expanded with the values from the host
    if (apath.length && !apath.includes("$")) {
      expandedBinPaths.push(apath);
    }
  }
  recordObservedActivity("path-resolution", "PATH", {
    metadata: {
      capability: "path-lookup",
      pathCount: expandedBinPaths.length,
    },
    reasonBuilder: (count) =>
      `Expanded PATH into ${expandedBinPaths.length} executable search path(s)${buildReadCountSuffix(count)}.`,
  });
  return expandedBinPaths;
}

/**
 * Collect all executable files from the given list of binary paths
 *
 * @param basePath Base directory
 * @param binPaths {Array[String]} Paths containing potential binaries
 * @param excludePaths {Array[String]} Container-relative paths that should be excluded from the result set
 * @return {Array[String]} List of executables
 */
export function collectExecutables(basePath, binPaths, excludePaths = []) {
  if (!binPaths) {
    return [];
  }
  const executablesByResolvedPath = new Map();
  const excludedPathSet = new Set(
    (excludePaths || []).map((f) => f.replace(/^\/+/, "").replace(/\\/g, "/")),
  );
  const ignoreList = [
    "**/*.{h,c,cpp,hpp,man,txt,md,htm,html,jar,ear,war,zip,tar,egg,keepme,gitignore,json,js,py,pyc}",
    "[",
  ];
  for (const apath of binPaths) {
    try {
      const files = globSync(`**${apath}/*`, {
        cwd: basePath,
        absolute: false,
        nocase: true,
        nodir: true,
        dot: true,
        follow: true,
        ignore: ignoreList,
      });
      for (const file of files) {
        let resolvedFile = file;
        try {
          resolvedFile = relative(basePath, realpathSync(join(basePath, file)));
          if (resolvedFile !== file) {
            recordSymlinkResolution(join(basePath, file), resolvedFile, {
              basePath,
              metadata: {
                resolutionKind: "executable",
              },
              reason: `Resolved executable candidate ${file} to ${resolvedFile}.`,
            });
          }
        } catch (err) {
          recordSymlinkResolution(join(basePath, file), undefined, {
            basePath,
            errorCode: err?.code || err?.name,
            metadata: {
              resolutionKind: "executable",
            },
            reason: `Failed to resolve executable candidate ${file}.`,
            status: "failed",
          });
          // Broken symlinks or permission errors can prevent realpath resolution.
          if (DEBUG_MODE) {
            console.log(`Unable to resolve executable path alias for ${file}`);
          }
        }
        if (
          excludedPathSet.has(file.replace(/^\/+/, "").replace(/\\/g, "/")) ||
          excludedPathSet.has(
            resolvedFile.replace(/^\/+/, "").replace(/\\/g, "/"),
          )
        ) {
          continue;
        }
        const existingFile = executablesByResolvedPath.get(resolvedFile);
        if (shouldPreferUsrMergedExecutablePath(file, existingFile)) {
          executablesByResolvedPath.set(resolvedFile, file);
        }
      }
    } catch (_err) {
      // ignore
    }
  }
  return Array.from(executablesByResolvedPath.values()).sort();
}

function shouldPreferUsrMergedExecutablePath(file, existingFile) {
  if (!existingFile) {
    return true;
  }
  const fileUsesUsrPrefix = file.startsWith("usr/");
  const existingFileUsesUsrPrefix = existingFile.startsWith("usr/");
  if (fileUsesUsrPrefix !== existingFileUsesUsrPrefix) {
    return fileUsesUsrPrefix;
  }
  return file < existingFile;
}

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
export function collectSharedLibs(
  basePath,
  libPaths,
  ldConf,
  ldConfDirPattern,
  excludePaths = [],
) {
  if (!libPaths) {
    return [];
  }
  const sharedLibs = [];
  const excludedPathSet = new Set(
    (excludePaths || []).map((f) => f.replace(/^\/+/, "").replace(/\\/g, "/")),
  );
  const ignoreList = [
    "**/*.{h,c,cpp,hpp,man,txt,md,htm,html,jar,ear,war,zip,tar,egg,keepme,gitignore,json,js,py,pyc}",
  ];
  const allLdConfDirs = ldConfDirPattern ? [ldConfDirPattern] : [];
  collectAllLdConfs(basePath, ldConf, allLdConfDirs, libPaths);
  if (allLdConfDirs.length) {
    for (const aldconfPattern of allLdConfDirs) {
      const confFiles = globSync(aldconfPattern, {
        cwd: basePath,
        absolute: false,
        nocase: true,
        nodir: true,
        dot: true,
        follow: false,
      });
      for (const moreConf of confFiles) {
        collectAllLdConfs(basePath, moreConf, allLdConfDirs, libPaths);
      }
    }
  }
  for (const apath of Array.from(new Set(libPaths))) {
    try {
      const files = globSync(`**${apath}/*.{so,so.*,a,lib,dll}`, {
        cwd: basePath,
        absolute: false,
        nocase: true,
        nodir: true,
        dot: true,
        follow: true,
        ignore: ignoreList,
      });
      for (const file of files) {
        let resolvedFile = file;
        try {
          resolvedFile = relative(basePath, realpathSync(join(basePath, file)));
          recordSymlinkResolution(join(basePath, file), resolvedFile, {
            basePath,
            metadata: {
              resolutionKind: "shared-library",
            },
            reason: `Resolved shared library candidate ${file} to ${resolvedFile}.`,
          });
        } catch (err) {
          recordSymlinkResolution(join(basePath, file), undefined, {
            basePath,
            errorCode: err?.code || err?.name,
            metadata: {
              resolutionKind: "shared-library",
            },
            reason: `Failed to resolve shared library candidate ${file}.`,
            status: "failed",
          });
          // Broken symlinks or permission errors can prevent realpath resolution.
        }
        if (
          excludedPathSet.has(file.replace(/^\/+/, "").replace(/\\/g, "/")) ||
          excludedPathSet.has(
            resolvedFile.replace(/^\/+/, "").replace(/\\/g, "/"),
          )
        ) {
          continue;
        }
        sharedLibs.push(file);
      }
    } catch (_err) {
      // ignore
    }
  }
  return Array.from(new Set(sharedLibs)).sort();
}

function collectAllLdConfs(basePath, ldConf, allLdConfDirs, libPaths) {
  if (ldConf && safeExistsSync(join(basePath, ldConf))) {
    const ldConfData = readFileSync(join(basePath, ldConf), "utf-8");
    for (let line of ldConfData.split("\n")) {
      line = line.replace("\r", "").trim();
      if (!line.length || line.startsWith("#")) {
        continue;
      }
      if (line.startsWith("include ")) {
        let apattern = line.replace("include ", "");
        if (!apattern.includes("*")) {
          apattern = `${apattern}/*.conf`;
        }
        if (!allLdConfDirs.includes(apattern)) {
          allLdConfDirs.push(apattern);
        }
      } else if (line.startsWith("/")) {
        if (!libPaths.includes(line)) {
          libPaths.push(line);
        }
      }
    }
  }
}

/**
 * Get information about the runtime.
 *
 * @returns {Object} Object containing the name and version of the runtime
 */
export function getRuntimeInformation() {
  const runtimeInfo = {};
  if (isDeno) {
    runtimeInfo.runtime = "Deno";
    runtimeInfo.version = globalThis.Deno.version.deno;
  } else if (isBun) {
    runtimeInfo.runtime = "Bun";
    runtimeInfo.version = globalThis.Bun.version;
  } else if (isNode) {
    runtimeInfo.runtime = "Node.js";
    runtimeInfo.version = globalThis.process.versions.node;
    const report = process.report.getReport();
    const nodeSourceUrl = report?.header?.release?.sourceUrl;
    // Collect the bundled components in node.js
    if (report?.header?.componentVersions) {
      const nodeBundledComponents = [];
      for (const [name, version] of Object.entries(
        report.header.componentVersions,
      )) {
        if (name === "node") {
          continue;
        }
        const apkg = {
          name,
          version,
          description: `Bundled with Node.js ${runtimeInfo.version}`,
          type: "library",
          scope: "excluded",
          purl: `pkg:generic/${name}@${version}`,
          "bom-ref": `pkg:generic/${name}@${version}`,
        };
        if (nodeSourceUrl) {
          apkg.externalReferences = [
            {
              url: nodeSourceUrl,
              type: "source-distribution",
              comment: "Node.js release url",
            },
          ];
        }
        nodeBundledComponents.push(apkg);
      }
      if (nodeBundledComponents.length) {
        runtimeInfo.components = nodeBundledComponents;
      }
    }
    if (report.sharedObjects) {
      const osSharedObjects = [];
      for (const aso of report.sharedObjects) {
        const name = basename(aso);
        if (name === "node") {
          continue;
        }
        const apkg = {
          name,
          type: "library",
          scope: "excluded",
          purl: `pkg:generic/${name}#${aso}`,
          "bom-ref": `pkg:generic/${name}`,
        };
        osSharedObjects.push(apkg);
      }
      if (osSharedObjects.length) {
        runtimeInfo.components = osSharedObjects;
      }
    }
  } else {
    runtimeInfo.runtime = "Unknown";
    runtimeInfo.version = "N/A";
  }

  return runtimeInfo;
}

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
export function isValidDriveRoot(root) {
  // Must be at most 3 characters: letter, colon, backslash
  if (root.length > 3) {
    return false;
  }

  // Check each character individually to prevent Unicode lookalikes
  const driveLetter = root.charAt(0);
  const colon = root.charAt(1);
  const backslash = root.charAt(2);

  // Drive letter must be ASCII A-Z or a-z
  const charCode = driveLetter.charCodeAt(0);
  const isAsciiLetter =
    (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122);
  if (!isAsciiLetter) {
    return false;
  }

  // Colon must be exactly ASCII colon (0x3A)
  if (colon.charCodeAt(0) !== 0x3a) {
    return false;
  }

  // Backslash (optional) must be exactly ASCII backslash (0x5C)
  return !(backslash && backslash.charCodeAt(0) !== 0x5c);
}

/**
 * Get version and runtime information
 */
export function retrieveCdxgenVersion() {
  const packageJsonAsString = readFileSync(
    join(dirNameStr, "package.json"),
    "utf-8",
  );
  const packageJson = JSON.parse(packageJsonAsString);

  const runtimeInfo = getRuntimeInformation();

  return `\x1b[1mCycloneDX Generator ${packageJson.version}\x1b[0m\nRuntime: ${runtimeInfo.runtime}, Version: ${runtimeInfo.version}`;
}

/**
 * Retrieve the version of the cdxgen plugins binary package from package.json.
 *
 * Reads the local package.json and searches the `optionalDependencies` for a package
 * whose name starts with `@cdxgen/cdxgen-plugins-bin`, returning its declared version.
 *
 * @returns {string|undefined} Version string of the plugins binary package, or undefined if not found
 */
export function retrieveCdxgenPluginVersion() {
  const packageJsonAsString = readFileSync(
    join(dirNameStr, "package.json"),
    "utf-8",
  );
  const packageJson = JSON.parse(packageJsonAsString);
  for (const adepName of Object.keys(packageJson.optionalDependencies || {})) {
    if (adepName.startsWith("@cdxgen/cdxgen-plugins-bin")) {
      return packageJson.optionalDependencies[adepName];
    }
  }
  return undefined;
}

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
export function toCamel(str) {
  return str.replace(/-([a-z])/g, (_, g) => g.toUpperCase());
}
