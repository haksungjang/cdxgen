import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { chmodSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { platform, tmpdir } from "node:os";
import {
  delimiter as _delimiter,
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
import { parse as _load } from "yaml";

import { getTreeWithPlugin } from "../managers/piptree.js";
import { IriValidationStrategy, validateIri } from "../parsers/iri.js";
import { buildAtomCommandEnv } from "./atomUtils.js";
import { DEFAULT_HBOM_AUDIT_CATEGORIES } from "./auditCategories.js";
import { parseWorkflowFile } from "./ciParsers/githubActions.js";
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
  temporaryFiles,
} from "./core-fs.js";
import {
  collectJarNS,
  collectMvnDependencies,
  componentSorter,
  convertJarNSToPackages,
  flattenDeps,
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
import { get_python_command_from_env, getVenvMetadata } from "./pythonutils.js";
import {
  addLicenseText,
  adjustLicenseInformation,
  findLicenseId,
  getKnownLicense,
  getLicenses,
  guessLicenseId,
  isSpdxLicenseExpression,
  readLicenseText,
  spdxLicenses,
} from "./spdx.js";
import {
  CDXGEN_VERSION,
  CPP_STD_MODULES,
  frameworksList,
  mesonWrapDB,
  PYPI_MODULE_PACKAGE_MAPPING,
  PYTHON_STD_MODULES,
} from "./state.js";

export {
  addLicenseText,
  adjustLicenseInformation,
  BLOCKED_HOST_ERROR_CODE,
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
  DEBUG_MODE,
  DOTNET_CMD,
  DRY_RUN_ERROR_CODE,
  derivePythonLockMetadataFileName,
  dirNameStr,
  encodeForPurl,
  extractJarArchive,
  extractLicenseCommentFromPomXml,
  FETCH_LICENSE,
  fetchPomXml,
  fetchPomXmlAsJson,
  findLicenseId,
  findLocalMvnArtifact,
  findPnpmPackagePath,
  frameworksList,
  GCC_CMD,
  GO_CMD,
  generatePixiLockFile,
  getAllFiles,
  getAllFilesWithIgnore,
  getCratesMetadata,
  getDartMetadata,
  getGithubUrlParts,
  getGoPkgComponent,
  getGoPkgLicense,
  getJarClasses,
  getJavaCommand,
  getKnownLicense,
  getLicenses,
  getMvnMetadata,
  getNpmMetadata,
  getNugetMetadata,
  getPomPropertiesFromMavenDir,
  getPropertyGroupTextNodes,
  getPyMetadata,
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
  parseBowerJson,
  parseCargoAuditableData,
  parseCargoData,
  parseCargoDependencyData,
  parseCargoManifestDependencyData,
  parseCargoTomlData,
  parseCljDep,
  parseCsPkgData,
  parseCsPkgLockData,
  parseCsProjAssetsData,
  parseCsProjData,
  parseEdnData,
  parseGoListDep,
  parseGoModData,
  parseGoModGraph,
  parseGoModulesTxt,
  parseGoModWhy,
  parseGopkgData,
  parseGosumData,
  parseGoVersionData,
  parseJarManifest,
  parseKVDep,
  parseLeinDep,
  parseLeiningenData,
  parseLeinMap,
  parseLicenseEntryOrArrayFromPomXml,
  parseMavenArgs,
  parseMavenTree,
  parseMavenTreeJson,
  parseMillDependency,
  parseMinJs,
  parseNodeShrinkwrap,
  parseNupkg,
  parseNuspecData,
  parsePackageJsonName,
  parsePaketLockData,
  parsePiplockData,
  parsePixiLockFile,
  parsePixiTomlFile,
  parsePkgJson,
  parsePkgLock,
  parsePnpmLock,
  parsePnpmWorkspace,
  parsePom,
  parsePomProperties,
  parsePomXml,
  parsePyLockData,
  parsePyProjectTomlFile,
  parsePyRequiresDist,
  parseReqEnvMarkers,
  parseReqFile,
  parseSetupPyFile,
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
export async function getPyModules(src, epkgList, options) {
  const allImports = {};
  const dependenciesList = [];
  let modList = [];
  const slicesFile = resolve(
    options.depsSlicesFile || options.usagesSlicesFile,
  );
  // Issue: 615 fix. Reuse existing slices file
  if (slicesFile && safeExistsSync(slicesFile)) {
    const slicesData = JSON.parse(readFileSync(slicesFile, "utf-8"));
    if (slicesData && Object.keys(slicesData) && slicesData.modules) {
      modList = slicesData.modules;
    } else {
      modList = slicesData;
    }
  } else {
    modList = findAppModules(src, "python", "parsedeps", slicesFile, options);
  }
  const pyDefaultModules = new Set(PYTHON_STD_MODULES);
  modList = modList.filter(
    (x) =>
      !pyDefaultModules.has(x.name.toLowerCase()) &&
      !x.name.startsWith("_") &&
      !x.name.startsWith("."),
  );
  let pkgList = modList.map((p) => {
    const apkg = {
      name:
        PYPI_MODULE_PACKAGE_MAPPING[p.name.toLowerCase()] ||
        PYPI_MODULE_PACKAGE_MAPPING[p.name.replace(/_/g, "-").toLowerCase()] ||
        p.name.replace(/_/g, "-").toLowerCase(),
      version: p.version?.trim().length ? p.version : undefined,
      scope: "required",
      properties: [
        {
          name: "cdx:pypi:versionSpecifiers",
          value: p.versionSpecifiers,
        },
      ],
    };
    if (p.importedSymbols) {
      apkg.properties.push({
        name: "ImportedModules",
        value: p.importedSymbols,
      });
    }
    return apkg;
  });
  pkgList = pkgList.filter(
    (obj, index) => pkgList.findIndex((i) => i.name === obj.name) === index,
  );
  if (epkgList?.length) {
    const pkgMaps = epkgList.map((p) => p.name);
    pkgList = pkgList.filter((p) => !pkgMaps.includes(p.name));
  }
  pkgList = await getPyMetadata(pkgList, true);
  // Populate the imports list after dealiasing
  if (pkgList?.length) {
    pkgList.forEach((p) => {
      allImports[p.name] = true;
    });
  }
  for (const p of pkgList) {
    if (p.version) {
      dependenciesList.push({
        ref: `pkg:pypi/${p.name.replace(/_/g, "-")}@${p.version}`.toLowerCase(),
        dependsOn: [],
      });
    }
  }
  return { allImports, pkgList, dependenciesList, modList };
}

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
export async function parsePubLockData(pubLockData, lockFile) {
  if (!pubLockData) {
    return [];
  }
  let pkgList = [];
  const rootList = [];
  const data = _load(pubLockData);
  const packages = data.packages;
  for (const [packageName, packageData] of Object.entries(packages)) {
    const pkg = {
      name: packageName,
      version: packageData.version,
      properties: [],
    };
    // older dart versions don't have sha256
    if (packageData.description?.sha256) {
      pkg._integrity = `sha256-${packageData.description?.sha256}`;
    }
    if (
      packageData.description?.url &&
      packageData.description?.url !== "https://pub.dev"
    ) {
      pkg.properties.push({
        name: "cdx:pub:registry",
        value: packageData.description.url,
      });
    }
    const purlString = new PackageURL("pub", "", pkg.name, pkg.version)
      .toString()
      .replace(/%2F/g, "/");
    pkg["bom-ref"] = decodeURIComponent(purlString);
    if (packageData.dependency === "direct main") {
      pkg.scope = "required";
      rootList.push(pkg);
    } else if (packageData.dependency === "transitive") {
      pkg.scope = "required";
    } else if (packageData.dependency === "direct dev") {
      pkg.scope = "optional";
    }
    if (lockFile) {
      pkg.properties.push({
        name: "SrcFile",
        value: lockFile,
      });
      pkg.evidence = {
        identity: {
          field: "purl",
          confidence: 1,
          methods: [
            {
              technique: "manifest-analysis",
              confidence: 1,
              value: lockFile,
            },
          ],
        },
      };
    }
    pkgList.push(pkg);
  }
  if (shouldFetchLicense()) {
    pkgList = await getDartMetadata(pkgList);
  }
  return { rootList, pkgList };
}

/**
 * Parses a Dart pub package's pubspec.yaml content and returns a list containing
 * a single component object with name, description, version, homepage, and purl.
 *
 * @param {string} pubYamlData Raw YAML string contents of a pubspec.yaml file
 * @returns {Object[]} List containing a single Dart package component object
 */
export function parsePubYamlData(pubYamlData) {
  const pkgList = [];
  let yamlObj;
  try {
    yamlObj = _load(pubYamlData);
  } catch (_err) {
    // continue regardless of error
  }
  if (!yamlObj) {
    return pkgList;
  }
  const pkg = {
    name: yamlObj.name,
    description: yamlObj.description,
    version: yamlObj.version,
    homepage: { url: yamlObj.homepage },
  };
  const purlString = new PackageURL("pub", "", pkg.name, pkg.version)
    .toString()
    .replace(/%2F/g, "/");
  pkg.purl = purlString;
  pkg["bom-ref"] = decodeURIComponent(purlString);
  pkgList.push(pkg);
  return pkgList;
}

/**
 * Parses Helm chart YAML data (Chart.yaml or repository index.yaml) and returns
 * a list of Helm chart component objects including the chart itself and any
 * declared dependencies or index entries.
 *
 * @param {string} helmData Raw YAML string contents of a Helm Chart.yaml or index.yaml file
 * @returns {Object[]} List of Helm chart component objects with name, version, and optional homepage/repository
 */
export function parseHelmYamlData(helmData) {
  const pkgList = [];
  let yamlObj;
  try {
    yamlObj = _load(helmData);
  } catch (_err) {
    // continue regardless of error
  }
  if (!yamlObj) {
    return pkgList;
  }
  if (yamlObj.name && yamlObj.version) {
    const pkg = {
      name: yamlObj.name,
      description: yamlObj.description || "",
      version: yamlObj.version,
    };
    if (yamlObj.home) {
      pkg["homepage"] = { url: yamlObj.home };
    }
    pkgList.push(pkg);
  }
  if (yamlObj.dependencies) {
    for (const hd of yamlObj.dependencies) {
      const pkg = {
        name: hd.name,
        version: hd.version, // This could have * so not precise
      };
      if (hd.repository) {
        pkg["repository"] = { url: hd.repository };
      }
      pkgList.push(pkg);
    }
  }
  if (yamlObj.entries) {
    for (const he of Object.keys(yamlObj.entries)) {
      for (const key of Object.keys(yamlObj.entries[he])) {
        const hd = yamlObj.entries[he][key];
        if (hd.name && hd.version) {
          const pkg = {
            name: hd.name,
            version: hd.version,
            description: hd.description || "",
          };
          if (hd.sources && Array.isArray(hd.sources) && hd.sources.length) {
            pkg["repository"] = { url: hd.sources[0] };
            if (hd.home && hd.home !== hd.sources[0]) {
              pkg["homepage"] = { url: hd.home };
            }
          }
          if (hd.home && !pkg["homepage"]) {
            pkg["homepage"] = { url: hd.home };
          }
          if (hd.digest) {
            pkg._integrity = `sha256-${hd.digest}`;
          }

          pkgList.push(pkg);
        }
      }
    }
  }
  return pkgList;
}

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
export function recurseImageNameLookup(keyValueObj, pkgList, imgList) {
  if (typeof keyValueObj === "string" || keyValueObj instanceof String) {
    return imgList;
  }
  if (Array.isArray(keyValueObj)) {
    for (const ele of keyValueObj) {
      if (typeof ele !== "string") {
        recurseImageNameLookup(ele, pkgList, imgList);
      }
    }
  } else if (Object.keys(keyValueObj).length) {
    let imageLike =
      keyValueObj.image ||
      keyValueObj.repository ||
      keyValueObj.dockerImage ||
      keyValueObj.mavenImage ||
      keyValueObj.gradleImage ||
      keyValueObj.packImage ||
      keyValueObj.koImage ||
      keyValueObj.kanikoImage;
    if (
      !imageLike &&
      keyValueObj.name &&
      typeof keyValueObj.name === "string" &&
      keyValueObj.name.includes("/")
    ) {
      imageLike = keyValueObj.name;
    }
    if (
      imageLike &&
      typeof imageLike === "string" &&
      !imgList.includes(imageLike)
    ) {
      if (imageLike.includes("VERSION")) {
        imageLike = imageLike
          .replace(":${VERSION:-", ":")
          .replace(":${VERSION:", ":")
          .replace(":%VERSION%", ":latest")
          .replace("}", "");
      }
      pkgList.push({ image: imageLike });
      pkgList.push({ service: keyValueObj.name || imageLike });
      imgList.push(imageLike);
    }
    for (const key of Object.keys(keyValueObj)) {
      // Skip unwanted blocks to improve performance
      if (["schema", "openAPIV3Schema", "names", "status"].includes(key)) {
        continue;
      }
      const valueObj = keyValueObj[key];
      if (!valueObj) {
        continue;
      }
      if (Object.keys(valueObj).length && typeof valueObj !== "string") {
        recurseImageNameLookup(valueObj, pkgList, imgList);
      }
      if (Array.isArray(valueObj)) {
        for (const ele of valueObj) {
          if (typeof ele !== "string") {
            recurseImageNameLookup(ele, pkgList, imgList);
          }
        }
      }
    }
  }
  return imgList;
}

function substituteBuildArgs(statement, buildArgs) {
  for (const argMatch of [
    ...statement.matchAll(/\${?([^:\/\\}]+)}?/g),
  ].reverse()) {
    const fullArgName = argMatch[0];
    const argName = argMatch[1];
    const argIndex = argMatch.index;
    if (buildArgs.has(argName)) {
      statement =
        statement.slice(0, argIndex) +
        buildArgs.get(argName) +
        statement.slice(argIndex + fullArgName.length);
    }
  }
  return statement;
}

/**
 * Parses the contents of a Dockerfile or Containerfile and returns a list of
 * base image objects referenced by FROM instructions, substituting ARG default
 * values where possible and skipping multi-stage build alias references.
 *
 * @param {string} fileContents Raw string contents of the Dockerfile/Containerfile
 * @returns {Object[]} Array of objects with an image property for each unique base image
 */
export function parseContainerFile(fileContents) {
  const buildArgs = new Map();
  const imagesSet = new Set();
  const buildStageNames = [];
  for (let line of fileContents.split("\n")) {
    line = line.trim();

    if (line.startsWith("#")) {
      continue; // skip commented out lines
    }

    if (line.startsWith("ARG")) {
      const argStatement = line.split("ARG ")[1].split("=");

      if (argStatement.length < 2) {
        continue; // skip ARG statements without default value
      }

      const argName = argStatement[0].trim();
      let argValue = argStatement[1].trim().replace(/['"]+/g, "");
      if (argValue.includes("$")) {
        argValue = substituteBuildArgs(argValue, buildArgs);
      }
      buildArgs.set(argName, argValue);
    }

    if (line.startsWith("FROM")) {
      // The alias could be called AS or as
      const fromStatement = line.split("FROM ")[1].split(/\s(as|AS)\s/);

      let imageStatement = fromStatement[0].trim();
      const buildStageName =
        fromStatement.length > 1
          ? fromStatement[fromStatement.length - 1].trim()
          : undefined;
      if (buildStageNames.includes(imageStatement)) {
        if (DEBUG_MODE) {
          console.log(
            `Skipping image ${imageStatement} which uses previously seen build stage name.`,
          );
        }
        continue;
      }
      if (imageStatement.includes("$")) {
        imageStatement = substituteBuildArgs(imageStatement, buildArgs);
        if (imageStatement.includes("$")) {
          if (DEBUG_MODE) {
            console.log(
              `Unable to substitute build arguments in '${line}' statement.`,
            );
          }
          continue;
        }
      }
      imagesSet.add(imageStatement);

      if (buildStageName) {
        buildStageNames.push(buildStageName);
      }
    }
  }

  return Array.from(imagesSet).map((i) => {
    return { image: i };
  });
}

/**
 * Parses a Bitbucket Pipelines YAML file and extracts all Docker image references
 * used as build environments and pipe references (docker:// pipes are normalized).
 *
 * @param {string} fileContents Raw string contents of the bitbucket-pipelines.yml file
 * @returns {Object[]} Array of objects with an image property for each referenced image or pipe
 */
export function parseBitbucketPipelinesFile(fileContents) {
  const imgList = [];

  let privateImageBlockFound = false;

  for (let line of fileContents.split("\n")) {
    line = line.trim();
    if (line.startsWith("#")) {
      continue; // skip commented out lines
    }

    // Assume this is a private build image object
    if (line.startsWith("name:") && privateImageBlockFound) {
      const imageName = line.split("name:").pop().trim();

      imgList.push({
        image: imageName,
      });

      privateImageBlockFound = false;
    }

    // Docker image usage
    if (line.startsWith("image:")) {
      const imageName = line.split("image:").pop().trim();

      /**
       * Assume this is a private build image object
       * See: https://support.atlassian.com/bitbucket-cloud/docs/use-docker-images-as-build-environments/#Using-private-build-images
       */
      if (imageName === "") {
        privateImageBlockFound = true;
        continue;
      }
      /**
       * Assume this is a public build image
       * See: https://support.atlassian.com/bitbucket-cloud/docs/use-docker-images-as-build-environments/#Using-public-build-images
       */

      imgList.push({
        image: imageName,
      });
    }

    // Pipe usage
    if (line.startsWith("- pipe:")) {
      let pipeName = line.split("- pipe:").pop().trim();

      if (pipeName.startsWith("docker://")) {
        pipeName = pipeName.replace("docker://", "");
      }

      imgList.push({
        image: pipeName,
      });
    }
  }

  return imgList;
}

/**
 * Parses container specification data such as Docker Compose files, Kubernetes
 * manifests, Tekton tasks, Skaffold configs, or Kustomize overlays (YAML, possibly
 * multi-document) and returns a list of image, service, and OCI spec entries.
 *
 * @param {string} dcData Raw YAML string contents of the container spec file
 * @returns {Object[]} Array of objects with image, service, or ociSpec properties
 */
export function parseContainerSpecData(dcData) {
  const pkgList = [];
  const imgList = [];
  if (!dcData.includes("image") && !dcData.includes("kind")) {
    return pkgList;
  }
  let dcDataList = [dcData];
  if (dcData.includes("---")) {
    dcDataList = dcData.split("---");
  }
  for (const dcData of dcDataList) {
    let yamlObj;
    try {
      yamlObj = _load(dcData);
    } catch (_err) {
      // ignore errors
    }
    if (!yamlObj) {
      continue;
    }
    if (yamlObj.services) {
      for (const serv of Object.keys(yamlObj.services)) {
        pkgList.push({
          service: serv,
        });
        const aservice = yamlObj.services[serv];
        // Track locally built images
        if (aservice.build) {
          if (Object.keys(aservice.build).length && aservice.build.dockerfile) {
            pkgList.push({
              ociSpec: aservice.build.dockerfile,
            });
          } else {
            if (aservice.build === "." || aservice.build === "./") {
              pkgList.push({
                ociSpec: "Dockerfile",
              });
            } else {
              pkgList.push({
                ociSpec: aservice.build,
              });
            }
          }
        } else if (aservice.image && !imgList.includes(aservice.image)) {
          let imgFullName = aservice.image;
          if (imgFullName.includes(":${VERSION:")) {
            imgFullName = imgFullName
              .replace(":${VERSION:-", ":")
              .replace(":${VERSION:", ":")
              .replace("}", "");
          }
          pkgList.push({
            image: imgFullName,
          });
          imgList.push(imgFullName);
        }
      }
    }
    // Tekton tasks and kustomize have spec. Skaffold has build
    const recurseBlock = yamlObj.spec || yamlObj.build || yamlObj.images;
    if (recurseBlock) {
      recurseImageNameLookup(recurseBlock, pkgList, imgList);
    }
  }
  return pkgList;
}

/**
 * Identifies the data flow direction of a Privado processing object based on its
 * sinkId value: "write" sinks map to "inbound", "read" sinks to "outbound", and
 * HTTP/gRPC sinks to "bi-directional".
 *
 * @param {Object} processingObj Privado processing object, expected to have a sinkId property
 * @returns {string} Flow direction string: "inbound", "outbound", "bi-directional", or "unknown"
 */
export function identifyFlow(processingObj) {
  let flow = "unknown";
  if (processingObj.sinkId) {
    const sinkId = processingObj.sinkId.toLowerCase();
    if (sinkId.endsWith("write")) {
      flow = "inbound";
    } else if (sinkId.endsWith("read")) {
      flow = "outbound";
    } else if (sinkId.includes("http") || sinkId.includes("grpc")) {
      flow = "bi-directional";
    }
  }
  return flow;
}

function convertProcessing(processing_list) {
  const data_list = [];
  for (const p of processing_list) {
    data_list.push({
      classification: p.sourceId || p.sinkId,
      flow: identifyFlow(p),
    });
  }
  return data_list;
}

/**
 * Parses a Privado data flow JSON file and returns a list of service objects
 * enriched with data classifications, endpoints, trust-boundary flag, violations,
 * and git metadata properties extracted from the scan result.
 *
 * @param {string} f Path to the Privado scan result JSON file
 * @returns {Object[]} List of service component objects suitable for a SaaSBOM
 */
export function parsePrivadoFile(f) {
  const pData = readFileSync(f, { encoding: "utf-8" });
  const servlist = [];
  if (!pData) {
    return servlist;
  }
  const jsonData = JSON.parse(pData);
  const aservice = {
    "x-trust-boundary": false,
    properties: [],
    data: [],
    endpoints: [],
  };
  if (jsonData.repoName) {
    aservice.name = jsonData.repoName;
    aservice.properties = [
      {
        name: "SrcFile",
        value: f,
      },
    ];
    // Capture git metadata info
    if (jsonData.gitMetadata) {
      aservice.version = jsonData.gitMetadata.commitId || "";
      aservice.properties.push({
        name: "privadoCoreVersion",
        value: jsonData.privadoCoreVersion || "",
      });
      aservice.properties.push({
        name: "privadoCLIVersion",
        value: jsonData.privadoCLIVersion || "",
      });
      aservice.properties.push({
        name: "localScanPath",
        value: jsonData.localScanPath || "",
      });
    }
    // Capture processing
    if (jsonData.processing?.length) {
      aservice.data = aservice.data.concat(
        convertProcessing(jsonData.processing),
      );
    }
    // Capture sink processing
    if (jsonData.sinkProcessing?.length) {
      aservice.data = aservice.data.concat(
        convertProcessing(jsonData.sinkProcessing),
      );
    }
    // Find endpoints
    if (jsonData.collections) {
      const endpoints = [];
      for (const c of jsonData.collections) {
        for (const occ of c.collections) {
          for (const e of occ.occurrences) {
            if (e.endPoint) {
              endpoints.push(e.endPoint);
            }
          }
        }
      }
      aservice.endpoints = endpoints;
    }
    // Capture violations
    if (jsonData.violations) {
      for (const v of jsonData.violations) {
        aservice.properties.push({
          name: "privado_violations",
          value: v.policyId,
        });
      }
    }
    // If there are third party libraries detected, then there are cross boundary calls happening
    if (jsonData.dataFlow?.third_parties?.length) {
      aservice["x-trust-boundary"] = true;
    }
    servlist.push(aservice);
  }
  return servlist;
}

/**
 * Parses an OpenAPI specification (JSON or YAML string) and returns a list
 * containing a single service object with name, version, endpoints, and
 * authentication flag derived from the spec's info, servers, paths, and
 * securitySchemes sections.
 *
 * @param {string} oaData Raw JSON or YAML string contents of an OpenAPI specification
 * @returns {Object[]} List containing a single service component object
 */
export function parseOpenapiSpecData(oaData) {
  const servlist = [];
  if (!oaData) {
    return servlist;
  }
  try {
    if (oaData.startsWith("openapi:")) {
      oaData = _load(oaData);
    } else {
      oaData = JSON.parse(oaData);
    }
  } catch (_e) {
    return servlist;
  }

  const name = oaData.info?.title
    ? oaData.info.title.replace(/ /g, "-")
    : "default-name";
  const version = oaData.info?.version ? oaData.info.version : "latest";
  const aservice = {
    "bom-ref": `urn:service:${name}:${version}`,
    name,
    description: oaData.description || "",
    version,
  };
  let serverName = [];
  if (oaData.servers?.length && oaData.servers[0].url) {
    serverName = oaData.servers[0].url;
    if (!serverName.startsWith("http") || !serverName.includes("//")) {
      serverName = `http://${serverName}`;
    }
  }
  if (oaData.paths) {
    const endpoints = [];
    for (const route of Object.keys(oaData.paths)) {
      let sep = "";
      if (!route.startsWith("/")) {
        sep = "/";
      }
      endpoints.push(`${serverName}${sep}${route}`);
    }
    aservice.endpoints = endpoints;
  }
  let authenticated = false;
  if (oaData.components?.securitySchemes) {
    authenticated = true;
  }
  aservice.authenticated = authenticated;
  servlist.push(aservice);
  return servlist;
}

/**
 * Parses Haskell Cabal freeze file content and extracts package name and version
 * pairs from constraint lines (lines containing " ==").
 *
 * @param {string} cabalData Raw string contents of a Cabal freeze file
 * @returns {Object[]} List of package objects with name and version fields
 */
export function parseCabalData(cabalData) {
  const pkgList = [];
  if (!cabalData) {
    return pkgList;
  }
  cabalData.split("\n").forEach((l) => {
    if (!l.includes(" ==")) {
      return;
    }
    l = l.replace("\r", "");
    if (l.includes(" ==")) {
      const tmpA = l.split(" ==");
      const name = tmpA[0]
        .replace("constraints: ", "")
        .replace("any.", "")
        .trim();
      const version = tmpA[1].replace(",", "").trim();
      if (name && version) {
        pkgList.push({
          name,
          version,
        });
      }
    }
  });
  return pkgList;
}

/**
 * Parses an Elixir mix.lock file and extracts Hex package name and version pairs
 * from lines containing ":hex".
 *
 * @param {string} mixData Raw string contents of a mix.lock file
 * @returns {Object[]} List of package objects with name and version fields
 */
export function parseMixLockData(mixData) {
  const pkgList = [];
  if (!mixData) {
    return pkgList;
  }
  mixData.split("\n").forEach((l) => {
    if (!l.includes(":hex")) {
      return;
    }
    l = l.replace("\r", "");
    if (l.includes(":hex")) {
      const tmpA = l.split(",");
      if (tmpA.length > 3) {
        const name = tmpA[1].replace(":", "").trim();
        const version = tmpA[2].trim().replace(/"/g, "");
        if (name && version) {
          pkgList.push({
            name,
            version,
          });
        }
      }
    }
  });
  return pkgList;
}

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
export function parseGitHubWorkflowData(f) {
  const { components } = parseWorkflowFile(f);
  return components.filter(
    (component) =>
      component.scope === "required" ||
      component.properties?.some(
        (property) =>
          property?.name === "cdx:github:step:usesCargo" &&
          property?.value === "true",
      ),
  );
}

/**
 * Parse Google Cloud Build YAML data and extract container image steps as packages.
 *
 * @param {string} cbwData Raw YAML string of a Cloud Build configuration file
 * @returns {Object[]} Array of package objects parsed from the build steps
 */
export function parseCloudBuildData(cbwData) {
  const pkgList = [];
  const keys_cache = {};
  if (!cbwData) {
    return pkgList;
  }
  const yamlObj = _load(cbwData);
  if (!yamlObj) {
    return pkgList;
  }
  if (yamlObj.steps) {
    for (const step of yamlObj.steps) {
      if (step.name) {
        const tmpA = step.name.split(":");
        if (tmpA.length === 2) {
          let group = dirname(tmpA[0]);
          const name = basename(tmpA[0]);
          if (group === ".") {
            group = "";
          }
          const version = tmpA[1];
          const key = `${group}-${name}-${version}`;
          if (!keys_cache[key] && name && version) {
            keys_cache[key] = key;
            pkgList.push({
              group,
              name,
              version,
            });
          }
        }
      }
    }
  }
  return pkgList;
}

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
export function parseConanLockData(conanLockData) {
  const pkgList = [];
  const dependencies = {};
  const parentComponentDependencies = [];

  if (!conanLockData) {
    return { pkgList, dependencies, parentComponentDependencies };
  }

  const lockFile = JSON.parse(conanLockData);
  if (!lockFile?.graph_lock?.nodes && !lockFile.requires) {
    return { pkgList, dependencies, parentComponentDependencies };
  }

  if (lockFile.graph_lock?.nodes) {
    const depends = lockFile.graph_lock.nodes;
    const nodeKeyToBomRefMap = {};

    for (const nk of Object.keys(depends)) {
      if (!depends[nk].ref) continue;

      const [purl, name, version] = mapConanPkgRefToPurlStringAndNameAndVersion(
        depends[nk].ref,
      );
      if (purl === null) continue;

      const bomRef = decodeURIComponent(purl);
      pkgList.push({
        name,
        version,
        purl,
        "bom-ref": bomRef,
      });

      nodeKeyToBomRefMap[nk] = bomRef;
    }

    for (const nk of Object.keys(depends)) {
      let requirementNodeKeys = [];
      if (Array.isArray(depends[nk].requires))
        requirementNodeKeys = requirementNodeKeys.concat(depends[nk].requires);
      if (Array.isArray(depends[nk].build_requires))
        requirementNodeKeys = requirementNodeKeys.concat(
          depends[nk].build_requires,
        );

      for (const dependencyNodeKey of requirementNodeKeys) {
        const dependencyBomRef = nodeKeyToBomRefMap[dependencyNodeKey];
        if (!dependencyBomRef) continue;

        const dependentBomRef = nodeKeyToBomRefMap[nk];
        if (dependentBomRef) {
          if (!(dependentBomRef in dependencies))
            dependencies[dependentBomRef] = [];
          if (!dependencies[dependentBomRef].includes(dependencyBomRef))
            dependencies[dependentBomRef].push(dependencyBomRef);
        } else if (nk === "0") {
          // parent component for which the conan.lock was generated
          if (!parentComponentDependencies.includes(dependencyBomRef))
            parentComponentDependencies.push(dependencyBomRef);
        }
      }
    }
  } else if (lockFile.requires) {
    const depends = lockFile.requires;
    for (const nk of Object.keys(depends)) {
      depends[nk] = depends[nk].split("%").shift();
      const [purl, name, version] = mapConanPkgRefToPurlStringAndNameAndVersion(
        depends[nk],
      );
      if (purl !== null) {
        pkgList.push({
          name,
          version,
          purl,
          "bom-ref": decodeURIComponent(purl),
        });
      }
    }
  }
  return { pkgList, dependencies, parentComponentDependencies };
}

/**
 * Parse a Conan conanfile.txt and extract required and optional packages.
 *
 * @param {string} conanData Raw text contents of a conanfile.txt
 * @returns {Object[]} Array of package objects with purl, name, version, and scope
 */
export function parseConanData(conanData) {
  const pkgList = [];
  if (!conanData) {
    return pkgList;
  }
  let scope = "required";
  conanData.split("\n").forEach((l) => {
    l = l.replace("\r", "");
    if (l.includes("[build_requires]")) {
      scope = "optional";
    }
    if (l.includes("[requires]")) {
      scope = "required";
    }

    // The line must start with sequence non-whitespace characters, followed by a slash,
    // followed by at least one more non-whitespace character.
    // Provides a heuristic for locating Conan package references inside conanfile.txt files.
    if (l.match(/^[^\s\/]+\/\S+/)) {
      const [purl, name, version] =
        mapConanPkgRefToPurlStringAndNameAndVersion(l);
      if (purl !== null) {
        pkgList.push({
          name,
          version,
          purl,
          "bom-ref": decodeURIComponent(purl),
          scope,
        });
      }
    }
  });
  return pkgList;
}

/**
 * Construct a generic package component object for collider-managed packages.
 *
 * @param {string} name Package name
 * @param {Object} pkgData Locked package entry from collider.lock
 * @param {string} lockFile Source lock file path
 * @param {string} dependencyKind Whether the package is direct or transitive
 * @returns {Object|undefined} Package component
 */
function buildColliderComponent(name, pkgData, lockFile, dependencyKind) {
  if (!name) {
    return undefined;
  }
  pkgData = pkgData || {};
  dependencyKind = dependencyKind || "transitive";
  const version = pkgData?.version || "";
  const purl = new PackageURL(
    "generic",
    "",
    name,
    version || undefined,
    null,
    null,
  ).toString();
  const properties = [
    {
      name: "cdx:collider:dependencyKind",
      value: dependencyKind,
    },
  ];
  if (lockFile) {
    properties.unshift({
      name: "SrcFile",
      value: lockFile,
    });
  }
  const wrapHash =
    typeof pkgData?.wrap_hash === "string" ? pkgData.wrap_hash.trim() : "";
  const wrapHashMatch = wrapHash.match(/^sha256:([0-9A-Fa-f]{64})$/);
  if (wrapHash) {
    properties.push({
      name: "cdx:collider:wrapHash",
      value: wrapHash,
    });
  }
  properties.push({
    name: "cdx:collider:hasWrapHash",
    value: wrapHashMatch ? "true" : "false",
  });
  if (wrapHash && !wrapHashMatch) {
    properties.push({
      name: "cdx:collider:wrapHashInvalid",
      value: "true",
    });
  }
  let originReference;
  if (typeof pkgData?.origin === "string" && pkgData.origin.trim()) {
    try {
      const originUrl = new URL(pkgData.origin.trim());
      const originHadSensitiveParts = Boolean(
        originUrl.username ||
          originUrl.password ||
          originUrl.search ||
          originUrl.hash,
      );
      originUrl.username = "";
      originUrl.password = "";
      originUrl.search = "";
      originUrl.hash = "";
      originReference = originUrl.toString();
      properties.push({
        name: "cdx:collider:origin",
        value: originReference,
      });
      properties.push({
        name: "cdx:collider:originScheme",
        value: originUrl.protocol.replace(":", ""),
      });
      if (originUrl.host) {
        properties.push({
          name: "cdx:collider:originHost",
          value: originUrl.host,
        });
      }
      if (originHadSensitiveParts) {
        properties.push({
          name: "cdx:collider:originSanitized",
          value: "true",
        });
      }
    } catch {
      thoughtLog("Ignoring invalid Collider origin URL");
    }
  }
  const component = {
    name,
    version,
    purl,
    "bom-ref": decodeURIComponent(purl),
    properties,
  };
  if (dependencyKind === "direct") {
    component.scope = "required";
  }
  if (wrapHashMatch) {
    component.hashes = [
      {
        alg: "SHA-256",
        content: wrapHashMatch[1].toLowerCase(),
      },
    ];
  }
  if (originReference) {
    component.externalReferences = [
      {
        type: "distribution",
        url: originReference,
      },
    ];
  }
  return component;
}

/**
 * Parse Collider lock file data (collider.lock) and return the package list and
 * parent component dependencies.
 *
 * @param {string} colliderLockData Raw JSON string of the Collider lock file
 * @param {string} lockFile Source lock file path
 * @returns {{ pkgList: Object[], dependencies: Object, parentComponentDependencies: string[] }}
 */
export function parseColliderLockData(colliderLockData, lockFile) {
  const pkgList = [];
  const dependencies = {};
  const parentComponentDependencies = [];
  if (!colliderLockData) {
    return { pkgList, dependencies, parentComponentDependencies };
  }
  let parsedLockFile;
  try {
    parsedLockFile = JSON.parse(colliderLockData);
  } catch {
    return { pkgList, dependencies, parentComponentDependencies };
  }
  const addedBomRefs = new Set();
  const directDependencies = parsedLockFile.dependencies || {};
  const packages = parsedLockFile.packages || {};
  for (const [name, pkgData] of Object.entries(directDependencies)) {
    const component = buildColliderComponent(name, pkgData, lockFile, "direct");
    if (!component) {
      continue;
    }
    if (!addedBomRefs.has(component["bom-ref"])) {
      pkgList.push(component);
      addedBomRefs.add(component["bom-ref"]);
    }
    if (!parentComponentDependencies.includes(component["bom-ref"])) {
      parentComponentDependencies.push(component["bom-ref"]);
    }
    if (!(component["bom-ref"] in dependencies)) {
      dependencies[component["bom-ref"]] = [];
    }
  }
  for (const [name, pkgData] of Object.entries(packages)) {
    const component = buildColliderComponent(
      name,
      pkgData,
      lockFile,
      "transitive",
    );
    if (!component || addedBomRefs.has(component["bom-ref"])) {
      continue;
    }
    pkgList.push(component);
    addedBomRefs.add(component["bom-ref"]);
    if (!(component["bom-ref"] in dependencies)) {
      dependencies[component["bom-ref"]] = [];
    }
  }
  return { pkgList, dependencies, parentComponentDependencies };
}

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
export function parseFlakeNix(flakeNixFile) {
  const pkgList = [];
  const dependencies = [];

  if (!safeExistsSync(flakeNixFile)) {
    return { pkgList, dependencies };
  }

  try {
    const flakeContent = readFileSync(flakeNixFile, "utf-8");

    // Extract inputs from flake.nix using regex
    const inputsRegex = /inputs\s*=\s*\{[^}]*}/g;
    let match;
    while ((match = inputsRegex.exec(flakeContent)) !== null) {
      const inputBlock = match[0];

      // Match different input patterns including nested inputs
      const inputPatterns = [
        /([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*)\.url\s*=\s*"([^"]+)"/g,
        /([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*)\s*=\s*\{\s*url\s*=\s*"([^"]+)"[^}]*}/gs,
      ];

      const addedPackages = new Set();

      for (const pattern of inputPatterns) {
        let subMatch;
        pattern.lastIndex = 0;
        while ((subMatch = pattern.exec(inputBlock)) !== null) {
          const name = subMatch[1];
          const url = subMatch[2] || subMatch[3];

          if (name && url && !addedPackages.has(name)) {
            addedPackages.add(name);
            const pkg = {
              name: name,
              version: "latest",
              description: `Nix flake input: ${name}`,
              scope: "required",
              properties: [
                {
                  name: "SrcFile",
                  value: flakeNixFile,
                },
                {
                  name: "cdx:nix:input_url",
                  value: url,
                },
              ],
              evidence: {
                identity: {
                  field: "purl",
                  confidence: 0.8,
                  methods: [
                    {
                      technique: "manifest-analysis",
                      confidence: 0.8,
                      value: flakeNixFile,
                    },
                  ],
                },
              },
            };

            pkg.purl = generateNixPurl(name, "latest");
            pkg["bom-ref"] = pkg.purl;

            pkgList.push(pkg);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to parse ${flakeNixFile}: ${error.message}`);
  }

  return { pkgList, dependencies };
}

/**
 * Method to parse flake.lock files
 *
 * @param {String} flakeLockFile flake.lock file to parse
 * @returns {Object} Object containing locked dependency information
 */
export function parseFlakeLock(flakeLockFile) {
  const pkgList = [];
  const dependencies = [];

  if (!safeExistsSync(flakeLockFile)) {
    return { pkgList, dependencies };
  }

  try {
    const lockContent = readFileSync(flakeLockFile, "utf-8");
    const lockData = JSON.parse(lockContent);

    if (lockData.nodes) {
      for (const [nodeName, nodeData] of Object.entries(lockData.nodes)) {
        if (nodeName === "root" || !nodeData.locked) continue;

        const locked = nodeData.locked;

        let version = "latest";
        if (locked.rev) {
          version = locked.rev.substring(0, 7);
        } else if (locked.ref) {
          version = locked.ref;
        }

        const pkg = {
          name: nodeName,
          version: version,
          description: `Nix flake dependency: ${nodeName}`,
          scope: "required",
          properties: [
            {
              name: "SrcFile",
              value: flakeLockFile,
            },
          ],
          evidence: {
            identity: {
              field: "purl",
              confidence: 1.0,
              methods: [
                {
                  technique: "manifest-analysis",
                  confidence: 1.0,
                  value: flakeLockFile,
                },
              ],
            },
          },
        };

        if (locked.narHash) {
          pkg.properties.push({
            name: "cdx:nix:nar_hash",
            value: locked.narHash,
          });
        }

        if (locked.lastModified) {
          pkg.properties.push({
            name: "cdx:nix:last_modified",
            value: locked.lastModified.toString(),
          });
        }

        if (locked.rev) {
          pkg.properties.push({
            name: "cdx:nix:revision",
            value: locked.rev,
          });
        }

        if (locked.ref) {
          pkg.properties.push({
            name: "cdx:nix:ref",
            value: locked.ref,
          });
        }

        pkg.purl = generateNixPurl(nodeName, version);
        pkg["bom-ref"] = pkg.purl;

        pkgList.push(pkg);
      }

      // Generate dependency relationships from root inputs
      if (lockData.nodes?.root?.inputs) {
        const rootInputs = Object.keys(lockData.nodes.root.inputs);
        if (rootInputs.length > 0) {
          dependencies.push({
            ref: "pkg:nix/flake@latest",
            dependsOn: rootInputs
              .map(
                (input) =>
                  pkgList.find((pkg) => pkg.name === input)?.["bom-ref"],
              )
              .filter(Boolean),
          });
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to parse ${flakeLockFile}: ${error.message}`);
  }

  return { pkgList, dependencies };
}

/**
 * Generate a Nix PURL from input information
 *
 * @param {String} name Package name
 * @param {String} version Package version
 * @returns {String} PURL string
 */
function generateNixPurl(name, version) {
  // For now, use a generic nix PURL type
  // In the future, this could be more sophisticated based on the source type
  return `pkg:nix/${name}@${version}`;
}

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
export function parseComposerJson(composerJsonFile) {
  const moduleParent = {};
  const composerData = JSON.parse(
    readFileSync(composerJsonFile, { encoding: "utf-8" }),
  );
  const rootRequires = {
    ...composerData.require,
    ...composerData["require-dev"],
  };
  const pkgName = composerData.name;
  if (pkgName) {
    moduleParent.group = dirname(pkgName);
    if (moduleParent.group === ".") {
      moduleParent.group = "";
    }
    moduleParent.name = basename(pkgName);
    moduleParent.type = "application";
    moduleParent.version = composerData.version;
    if (composerData.description) {
      moduleParent.description = composerData.description;
    }
    if (composerData.license) {
      moduleParent.licenses = getLicenses({
        expression: composerData.license,
      });
    }
    moduleParent.purl = new PackageURL(
      "composer",
      moduleParent.group,
      moduleParent.name,
      moduleParent.version,
      null,
      null,
    ).toString();
    moduleParent["bom-ref"] = decodeURIComponent(moduleParent.purl);
  }
  return { rootRequires, moduleParent };
}

/**
 * Parse composer lock file
 *
 * @param {string} pkgLockFile composer.lock file
 * @param {array} rootRequires require section from composer.json
 */
export function parseComposerLock(pkgLockFile, rootRequires) {
  const pkgList = [];
  const dependenciesList = [];
  const dependenciesMap = {};
  const pkgNamePurlMap = {};
  const rootList = [];
  const rootRequiresMap = {};
  if (rootRequires) {
    for (const rr of Object.keys(rootRequires)) {
      // Skip platform requirements (php, hhvm, ext-*, lib-*) — they are never
      // Composer package names and must not be used to identify root packages.
      if (
        rr === "php" ||
        rr === "hhvm" ||
        rr.startsWith("ext-") ||
        rr.startsWith("lib-")
      ) {
        continue;
      }
      rootRequiresMap[rr] = true;
    }
  }
  if (safeExistsSync(pkgLockFile)) {
    let lockData = {};
    try {
      lockData = JSON.parse(readFileSync(pkgLockFile, { encoding: "utf-8" }));
    } catch (_e) {
      console.error("Invalid composer.lock file:", pkgLockFile);
      return [];
    }
    if (lockData) {
      const packages = {};
      if (lockData["packages"]) {
        packages["required"] = lockData["packages"];
      }
      if (lockData["packages-dev"]) {
        packages["optional"] = lockData["packages-dev"];
      }
      // Pass 1: Collect all packages
      for (const compScope in packages) {
        for (const i in packages[compScope]) {
          const pkg = packages[compScope][i];
          // Be extra cautious. Potential fix for #236
          if (!pkg?.name || !pkg.version) {
            continue;
          }

          let group = dirname(pkg.name);
          if (group === ".") {
            group = "";
          }
          const name = basename(pkg.name);
          const purl = new PackageURL(
            "composer",
            group,
            name,
            pkg.version?.toString(),
            null,
            null,
          ).toString();
          const apkg = {
            group: group,
            name: name,
            purl,
            "bom-ref": decodeURIComponent(purl),
            version: pkg.version?.toString(),
            repository: pkg.source,
            license: pkg.license,
            description: pkg.description,
            scope: compScope,
            properties: [
              {
                name: "SrcFile",
                value: pkgLockFile,
              },
            ],
            evidence: {
              identity: {
                field: "purl",
                confidence: 1,
                methods: [
                  {
                    technique: "manifest-analysis",
                    confidence: 1,
                    value: pkgLockFile,
                  },
                ],
              },
            },
          };
          if (pkg?.dist?.url) {
            // Replace placeholders like %prettyVersion% with actual version
            let distUrl = pkg.dist.url;
            if (
              distUrl.includes("%prettyVersion%") ||
              distUrl.includes("%version%")
            ) {
              const version = pkg.version || "unknown";
              distUrl = distUrl
                .replace(/%prettyVersion%/g, version)
                .replace(/%version%/g, version);
            }
            apkg.distribution = { url: distUrl };
          }
          if (pkg?.authors?.length) {
            apkg.authors = pkg.authors.map((a) => {
              return { name: a.name, email: a.email };
            });
          }
          if (pkg?.keywords?.length) {
            apkg.tags = pkg.keywords;
          }
          if (pkg.autoload && Object.keys(pkg.autoload).length) {
            const namespaces = [];
            for (const aaload of Object.keys(pkg.autoload)) {
              if (aaload.startsWith("psr")) {
                for (const ans of Object.keys(pkg.autoload[aaload])) {
                  namespaces.push(ans.trim());
                }
              }
            }
            if (namespaces.length) {
              apkg.properties.push({
                name: "Namespaces",
                value: namespaces.join(", "),
              });
            }
          }
          pkgList.push(apkg);
          dependenciesMap[purl] = new Set();
          pkgNamePurlMap[pkg.name] = purl;
          // Add this package to the root list if needed
          if (rootRequiresMap[pkg.name]) {
            rootList.push(apkg);
          }
        }
      }
      // Pass 2: Construct dependency tree
      for (const compScope in packages) {
        for (const i in packages[compScope]) {
          const pkg = packages[compScope][i];
          if (!pkg?.name || !pkg.version) {
            continue;
          }
          if (!pkg.require || !Object.keys(pkg.require).length) {
            continue;
          }
          const purl = pkgNamePurlMap[pkg.name];
          for (const adepName of Object.keys(pkg.require)) {
            if (pkgNamePurlMap[adepName]) {
              dependenciesMap[purl].add(pkgNamePurlMap[adepName]);
            }
          }
        }
      }
    }
  }
  for (const ref in dependenciesMap) {
    dependenciesList.push({
      ref: ref,
      dependsOn: Array.from(dependenciesMap[ref]).sort(),
    });
  }
  return {
    pkgList,
    dependenciesList,
    rootList,
  };
}

function convertStdoutToList(result) {
  if (result.status !== 0 || result.error) {
    return undefined;
  }
  const stdout = result.stdout;
  if (stdout) {
    const cmdOutput = Buffer.from(stdout).toString();
    return cmdOutput
      .trim()
      .toLowerCase()
      .split("\n")
      .filter((p) => p.length > 2 && p.includes("."))
      .sort();
  }
  return undefined;
}

/**
 * Method to execute dpkg --listfiles to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
export function executeDpkgList(pkgName) {
  const result = safeSpawnSync("dpkg", ["--listfiles", "--no-pager", pkgName]);
  return convertStdoutToList(result);
}

/**
 * Method to execute dnf repoquery to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
export function executeRpmList(pkgName) {
  let result = safeSpawnSync("dnf", ["repoquery", "-l", pkgName]);
  // Fallback to rpm
  if (result.status !== 0 || result.error) {
    result = safeSpawnSync("rpm", ["-ql", pkgName]);
  }
  return convertStdoutToList(result);
}

/**
 * Method to execute apk -L info to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
export function executeApkList(pkgName) {
  const result = safeSpawnSync("apk", ["-L", "info", pkgName]);
  return convertStdoutToList(result);
}

/**
 * Method to execute alpm -Ql to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
export function executeAlpmList(pkgName) {
  const result = safeSpawnSync("pacman", ["-Ql", pkgName]);
  return convertStdoutToList(result);
}

/**
 * Method to execute equery files to determine the files provided by a given package
 *
 * @param {string} pkgName deb package name
 * @returns
 */
export function executeEqueryList(pkgName) {
  const result = safeSpawnSync("equery", ["files", pkgName]);
  return convertStdoutToList(result);
}

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
export function parseSwiftJsonTreeObject(
  pkgList,
  dependenciesList,
  jsonObject,
  pkgFile,
) {
  let purl;
  const urlOrPath = jsonObject.url || jsonObject.path;
  if (jsonObject?.url?.startsWith("http")) {
    const version = jsonObject.version;
    purl = purlFromUrlString("swift", urlOrPath, version);
  } else {
    purl = new PackageURL(
      "swift",
      "",
      jsonObject.name,
      jsonObject.version,
      null,
      null,
    );
  }
  const purlString = decodeURIComponent(purl.toString());
  const rootPkg = {
    name: purl.name,
    group: purl.namespace,
    version: purl.version,
    purl: purlString,
    "bom-ref": purlString,
  };
  const properties = [];
  if (jsonObject.name && jsonObject.name !== rootPkg.name) {
    properties.push({
      name: "cdx:swift:packageName",
      value: jsonObject.name,
    });
  }
  if (jsonObject?.path?.includes("checkouts")) {
    const relativeCheckoutPath = relative(dirname(pkgFile), jsonObject.path);
    if (!relativeCheckoutPath.startsWith("..")) {
      properties.push({
        name: "cdx:swift:localCheckoutPath",
        value: relativeCheckoutPath,
      });
    }
  }
  if (urlOrPath) {
    if (urlOrPath.startsWith("http")) {
      rootPkg.repository = { url: urlOrPath };
    } else {
      rootPkg.type = "application";
      properties.push({
        name: "SrcPath",
        value: urlOrPath,
      });
      if (pkgFile) {
        properties.push({
          name: "SrcFile",
          value: pkgFile,
        });
      }
    }
  }
  if (properties.length) {
    rootPkg.properties = properties;
  }
  pkgList.push(rootPkg);
  const depList = new Set();
  if (jsonObject.dependencies) {
    for (const dependency of jsonObject.dependencies) {
      const res = parseSwiftJsonTreeObject(
        pkgList,
        dependenciesList,
        dependency,
        pkgFile,
      );
      depList.add(res);
    }
  }
  dependenciesList.push({
    ref: purlString,
    dependsOn: [...depList].sort(),
  });
  return purlString;
}

/**
 * Parse swift dependency tree output
 * @param {string} rawOutput Swift dependencies json output
 * @param {string} pkgFile Package.swift file
 */
export function parseSwiftJsonTree(rawOutput, pkgFile) {
  if (!rawOutput) {
    return {};
  }
  const pkgList = [];
  const dependenciesList = [];
  try {
    const jsonData = JSON.parse(rawOutput);
    parseSwiftJsonTreeObject(pkgList, dependenciesList, jsonData, pkgFile);
  } catch (e) {
    if (DEBUG_MODE) {
      console.log(e);
    }
    return {};
  }
  const rootList = pkgList.filter((p) => p.type === "application");
  return {
    rootList,
    pkgList,
    dependenciesList,
  };
}

/**
 * Parse swift package resolved file
 * @param {string} resolvedFile Package.resolved file
 */
export function parseSwiftResolved(resolvedFile) {
  const pkgList = [];
  if (safeExistsSync(resolvedFile)) {
    try {
      const pkgData = JSON.parse(
        readFileSync(resolvedFile, { encoding: "utf-8" }),
      );
      let resolvedList = [];
      if (pkgData.pins) {
        resolvedList = pkgData.pins;
      } else if (pkgData.object?.pins) {
        resolvedList = pkgData.object.pins;
      }
      for (const adep of resolvedList) {
        const locationOrUrl = adep.location || adep.repositoryURL;
        const version = adep.state.version || adep.state.revision;
        const purl = purlFromUrlString("swift", locationOrUrl, version);
        const purlString = decodeURIComponent(purl.toString());
        const rootPkg = {
          name: purl.name,
          group: purl.namespace,
          version: purl.version,
          purl: purlString,
          "bom-ref": purlString,
          properties: [
            {
              name: "SrcFile",
              value: resolvedFile,
            },
          ],
          evidence: {
            identity: {
              field: "purl",
              confidence: 1,
              methods: [
                {
                  technique: "manifest-analysis",
                  confidence: 1,
                  value: resolvedFile,
                },
              ],
            },
          },
        };
        if (locationOrUrl) {
          rootPkg.repository = { url: locationOrUrl };
        }
        pkgList.push(rootPkg);
      }
    } catch (_err) {
      // continue regardless of error
    }
  }
  return pkgList;
}

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
export function getMillCommand(srcPath) {
  let millCmd = `mill${platform() === "win32" ? ".bat" : ""}`;
  if (safeExistsSync(join(srcPath, millCmd))) {
    // Use local mill wrapper if available
    // Enable execute permission
    try {
      chmodSync(join(srcPath, millCmd), 0o775);
    } catch (_e) {
      // continue regardless of error
    }
    millCmd = resolve(join(srcPath, millCmd));
  }
  return millCmd;
}

/**
 * Parse the contents of a 'Podfile.lock'
 *
 * @param {Object} podfileLock The content of the podfile.lock as an Object
 * @param {String} projectPath The path to the project root
 * @returns {Map} Map of all dependencies with their direct dependencies
 */
export async function parsePodfileLock(podfileLock, projectPath) {
  const dependencies = new Map();
  for (const pod of podfileLock["PODS"]) {
    const dependency = {};
    if (pod.constructor === Object) {
      for (const key in pod) {
        dependency.metadata = parseCocoaDependency(key);
        const subDependencies = new Set();
        for (const subPod of pod[key]) {
          subDependencies.add(parseCocoaDependency(subPod, false));
        }
        dependency.dependencies = Array.from(subDependencies);
      }
    } else {
      dependency.metadata = parseCocoaDependency(pod);
    }
    const podName = dependency.metadata.name.includes("/")
      ? dependency.metadata.name.substring(
          0,
          dependency.metadata.name.indexOf("/"),
        )
      : dependency.metadata.name;
    if (podfileLock["EXTERNAL SOURCES"]?.[podName]) {
      const externalPod = podfileLock["EXTERNAL SOURCES"][podName];
      if (externalPod[":git"]) {
        let projectRepo = externalPod[":git"];
        if (projectRepo.includes("github.com")) {
          projectRepo = projectRepo.replace(
            "github.com",
            "raw.githubusercontent.com",
          );
        }
        if (projectRepo.endsWith(".git")) {
          projectRepo = projectRepo.substring(0, projectRepo.length - 4);
        }
        const projectRepoBranchOrTag = externalPod[":tag"]
          ? `tags/${externalPod[":tag"]}`
          : `heads/${externalPod[":branch"] ? externalPod[":branch"] : "<DEFAULT>"}`;
        dependency.metadata.properties = [
          {
            name: "cdx:pods:podspecLocation",
            value: `${projectRepo}/refs/${projectRepoBranchOrTag}/${podName}.podspec`,
          },
        ];
      } else if (externalPod[":path"]) {
        const projectLocation = resolve(projectPath, externalPod[":path"]);
        dependency.metadata.properties = [
          {
            name: "cdx:pods:projectDir",
            value: projectLocation,
          },
        ];
        let podspec = join(projectLocation, `${podName}.podspec`);
        if (!safeExistsSync(podspec)) {
          podspec = `${podspec}.json`;
        }
        if (safeExistsSync(podspec)) {
          dependency.metadata.properties.push({
            name: "cdx:pods:podspecLocation",
            value: podspec,
          });
        }
      } else if (externalPod[":podspec"]) {
        const podspecLocation = resolve(projectPath, externalPod[":podspec"]);
        dependency.metadata.properties = [
          {
            name: "cdx:pods:projectDir",
            value: dirname(podspecLocation),
          },
          {
            name: "cdx:pods:podspecLocation",
            value: podspecLocation,
          },
        ];
      }
    }
    dependencies.set(dependency.metadata.name, dependency);
  }
  if (!["false", "0"].includes(process.env.COCOA_MERGE_SUBSPECS)) {
    for (const subspecComponentName of [...dependencies.keys()].filter((name) =>
      name.includes("/"),
    )) {
      const subspecComponent = dependencies.get(subspecComponentName);
      const mainComponentName = subspecComponentName.split("/")[0];
      let mainComponent = dependencies.get(mainComponentName);
      if (!mainComponent) {
        mainComponent = {
          metadata: {
            name: mainComponentName,
            version: subspecComponent.metadata.version,
          },
        };
        dependencies.set(mainComponentName, mainComponent);
      }
      if (subspecComponent.dependencies) {
        if (mainComponent.dependencies) {
          mainComponent.dependencies = [
            ...mainComponent.dependencies,
            ...subspecComponent.dependencies,
          ];
        } else {
          mainComponent.dependencies = subspecComponent.dependencies;
        }
      }
      mainComponent.metadata.properties = [
        ...(mainComponent.metadata.properties
          ? mainComponent.metadata.properties
          : []),
        {
          name: "cdx:pods:Subspec",
          value: subspecComponentName.substring(
            subspecComponentName.indexOf("/") + 1,
          ),
        },
        ...(subspecComponent.metadata.propertie
          ? subspecComponent.metadata.properties
          : []),
      ];
      dependencies.delete(subspecComponentName);
    }
    for (const [dependencyName, dependency] of dependencies) {
      if (dependency.dependencies) {
        dependency.dependencies.forEach((dep) => {
          dep.name = dep.name.split("/")[0];
        });
        dependency.dependencies = [
          ...new Map(
            dependency.dependencies
              .filter((dep) => dep.name !== dependencyName)
              .map((dep) => [dep.name, dep]),
          ).values(),
        ];
        if (dependency.dependencies.length === 0) {
          delete dependency.dependencies;
        }
      }
    }
  }
  return dependencies;
}

/**
 * Parse all targets and their direct dependencies from the 'Podfile'
 *
 * @param {Object} target A JSON-object representing a target
 * @param {Map} allDependencies The map containing all parsed direct dependencies for a target
 * @param {String} [prefix=undefined] Prefix to add to the targets name
 */
export function parsePodfileTargets(
  target,
  allDependencies,
  prefix = undefined,
) {
  const targetName = (prefix ? `${prefix}/` : "") + target.name;
  const targetDependencies = new Set(
    prefix && allDependencies.has(prefix)
      ? allDependencies.get(prefix)
      : targetName !== "Pods"
        ? allDependencies.get("Pods")
        : [],
  );
  if (target["dependencies"]) {
    for (const targetDependency of target["dependencies"]) {
      if (targetDependency.constructor === Object) {
        targetDependencies.add(Object.keys(targetDependency)[0]);
      } else {
        targetDependencies.add(targetDependency);
      }
    }
  }
  allDependencies.set(targetName, Array.from(targetDependencies));
  if (target.children) {
    const childPrefix = targetName === "Pods" ? undefined : targetName;
    for (const childTarget of target.children) {
      parsePodfileTargets(childTarget, allDependencies, childPrefix);
    }
  }
}

/**
 * Parse a single line representing a dependency
 *
 * @param {String} dependencyLine The line that should be parsed as a dependency
 * @param {boolean} [parseVersion=true] Include parsing the version of the dependency
 * @returns {Object} Object representing a dependency
 */
export function parseCocoaDependency(dependencyLine, parseVersion = true) {
  const dependencyData = dependencyLine.split(" (");
  const dependency = { name: dependencyData[0] };
  if (parseVersion) {
    dependency.version = dependencyData[1].substring(
      0,
      dependencyData[1].length - 1,
    );
  }
  return dependency;
}

/**
 * Execute the 'pod'-command with parameters
 *
 * @param {String[]} parameters The parameters for the command
 * @param {String} path The path where the command should be executed
 * @param {Object} options CLI options
 * @returns {Object} The result of running the command
 */
export function executePodCommand(parameters, path, options) {
  if (DEBUG_MODE) {
    if (path) {
      console.log("Executing pod", parameters.join(" "), "in", path);
    } else {
      console.log("Executing pod", parameters.join(" "));
    }
  }
  const result = safeSpawnSync(process.env.POD_CMD || "pod", parameters, {
    cwd: path,
    shell: isWin,
  });
  if (result.status !== 0 || result.error) {
    if (result?.stderr?.includes("Unable to find a pod")) {
      console.log(
        "Try again by running 'pod install' before invoking 'cdxgen'.",
      );
    }
    if (process.env?.CDXGEN_IN_CONTAINER !== "true") {
      console.log(
        "Consider using the cdxgen container image (`ghcr.io/cyclonedx/cdxgen`), which includes cocoapods and additional build tools.",
      );
    } else if (!DEBUG_MODE) {
      console.log(
        "Something went wrong when trying to execute cocoapods -- Set the environment variable 'CDXGEN_DEBUG_MODE=debug' to troubleshoot cocoapods related errors",
      );
    }
    if (options.failOnError || DEBUG_MODE) {
      if (result.stdout) {
        console.log(result.stdout);
      }
      if (result.stderr) {
        console.log(result.stderr);
      }
      options.failOnError && process.exit(1);
    }
  }
  return result;
}

/**
 * Method that handles object creation for cocoa pods.
 *
 * @param {Object} dependency The dependency that is to be transformed into an SBOM object
 * @param {Object} options CLI options
 * @param {String} [type="library"] The type of Object to create
 * @returns {Object} An object representing the pod in SBOM-format
 */
export async function buildObjectForCocoaPod(
  dependency,
  options,
  type = "library",
) {
  let component;
  if (
    !["false", "0"].includes(process.env.COCOA_RESOLVE_FROM_NODE) &&
    dependency.properties?.find(({ name }) => name === "cdx:pods:projectDir")
  ) {
    let tmpDir = dependency.properties.find(
      ({ name }) => name === "cdx:pods:projectDir",
    ).value;
    const exclusionDirs = process.env.COCOA_RESOLVE_FROM_NODE_EXCLUSION_DIRS
      ? process.env.COCOA_RESOLVE_FROM_NODE_EXCLUSION_DIRS.split(",")
      : [];
    if (
      tmpDir &&
      !exclusionDirs.some((dir) =>
        `${tmpDir.replaceAll("\\", "/")}/`.includes(
          `/${dir.replaceAll("\\", "/")}/`.replaceAll("//", "/"),
        ),
      ) &&
      tmpDir.indexOf("node_modules") !== -1
    ) {
      do {
        const npmPackages = await parsePkgJson(join(tmpDir, "package.json"));
        if (npmPackages.length === 1) {
          component = npmPackages[0];
          component.type = "library";
          component.properties = component.properties.concat(
            {
              name: "cdx:pods:PodName",
              value: dependency.name,
            },
            dependency.properties,
          );
          tmpDir = undefined;
        } else {
          tmpDir = dirname(tmpDir);
        }
      } while (tmpDir && tmpDir.indexOf("node_modules") !== -1);
    }
  }
  if (!component) {
    let name = dependency.name;
    let subspec = null;
    const locationOfSubspec = dependency.name.indexOf("/");
    if (locationOfSubspec !== -1) {
      name = dependency.name.substring(0, locationOfSubspec);
      subspec = dependency.name.substring(locationOfSubspec + 1);
    }
    component = {
      ...dependency,
      type,
    };
    if (subspec) {
      if (!component.properties) {
        component.properties = [];
      }
      component.properties.push({
        name: "cdx:pods:Subspec",
        value: subspec,
      });
    }
    const purl = new PackageURL(
      "cocoapods",
      "",
      name,
      component.version,
      null,
      subspec,
    ).toString();
    component["purl"] = purl;
    component["bom-ref"] = decodeURIComponent(purl);
    if (options && !["false", "0"].includes(process.env.COCOA_FULL_SCAN)) {
      await fullScanCocoaPod(dependency, component, options);
    }
  }
  return component;
}

async function fullScanCocoaPod(dependency, component, options) {
  let result;
  if (
    component.properties?.find(
      ({ name }) => name === "cdx:pods:podspecLocation",
    )
  ) {
    let podspecLocation = component.properties.find(
      ({ name }) => name === "cdx:pods:podspecLocation",
    ).value;
    if (
      component.properties.find(({ name }) => name === "cdx:pods:projectDir")
    ) {
      component.properties.push({
        name: "SrcFile",
        value: podspecLocation,
      });
    }
    let replacements = [];
    if (
      podspecLocation.endsWith(".podspec") &&
      process.env.COCOA_PODSPEC_REPLACEMENTS
    ) {
      replacements = process.env.COCOA_PODSPEC_REPLACEMENTS.split(";");
    } else if (
      podspecLocation.endsWith(".json") &&
      process.env.COCOA_PODSPEC_JSON_REPLACEMENTS
    ) {
      replacements = process.env.COCOA_PODSPEC_JSON_REPLACEMENTS.split(";");
    }
    if (replacements || podspecLocation.startsWith("http")) {
      let podspecContent;
      if (podspecLocation.startsWith("http")) {
        let httpResult;
        for (const branchName of ["main", "master"]) {
          try {
            httpResult = await cdxgenAgent.get(
              podspecLocation.replace("<DEFAULT>", branchName),
            );
            podspecLocation = podspecLocation.replace("<DEFAULT>", branchName);
          } catch (_err) {
            try {
              httpResult = await cdxgenAgent.get(
                `${podspecLocation.replace("<DEFAULT>", branchName)}.json`,
              );
              podspecLocation = `${podspecLocation.replace("<DEFAULT>", branchName)}.json`;
            } catch (_err) {
              continue;
            }
          }
          component.properties.find(
            ({ name }) => name === "cdx:pods:podspecLocation",
          ).value = podspecLocation;
          podspecLocation = `${randomUUID()}.${podspecLocation.substring(podspecLocation.lastIndexOf(".") + 1)}`;
          podspecContent = httpResult.body;
          break;
        }
      } else {
        podspecContent = readFileSync(podspecLocation, "utf-8");
      }
      for (const replacement of replacements) {
        const replacementPair = replacement.split("=");
        let match = replacementPair[0].replaceAll("<NEWLINE>", "\n");
        if (match.startsWith("/") && match.endsWith("/")) {
          match = new RegExp(match.substring(1, match.length - 1), "g");
        }
        const repl = replacementPair[1].replaceAll("<NEWLINE>", "\n");
        podspecContent = podspecContent.replaceAll(match, repl);
      }
      podspecLocation = join(
        dirname(podspecLocation),
        `${randomUUID()}.${podspecLocation.substring(podspecLocation.lastIndexOf(".") + 1)}`,
      );
      safeWriteSync(podspecLocation, podspecContent);
      temporaryFiles.add(podspecLocation);
    }
    result = executePodCommand(
      ["ipc", "spec", "--silent", podspecLocation],
      undefined,
      options,
    );
  } else {
    let dependencyName = dependency.name;
    if (dependencyName.includes("/")) {
      dependencyName = dependencyName.substring(0, dependencyName.indexOf("/"));
    }
    // `pod` may not be installed at all, in which case spawn returns a result
    // with no stdout. Calling .trim() on that threw and aborted the whole
    // CocoaPods scan, so any machine without CocoaPods could not generate a
    // BOM from a Podfile.lock it had already parsed successfully.
    const srcFileResult = executePodCommand(
      [
        "spec",
        "which",
        `^${dependencyName}$`,
        "--regex",
        `--version=${dependency.version}`,
      ],
      undefined,
      options,
    );
    if (srcFileResult?.stdout) {
      const srcFileProperty = {
        name: "SrcFile",
        value: srcFileResult.stdout.trim(),
      };
      if (component.properties) {
        component.properties.push(srcFileProperty);
      } else {
        component.properties = [srcFileProperty];
      }
    }
    result = executePodCommand(
      [
        "spec",
        "cat",
        `^${dependencyName}$`,
        "--regex",
        `--version=${dependency.version}`,
      ],
      undefined,
      options,
    );
  }
  // Same reason as above: no `pod` binary means no result to parse.
  const podspecText = result?.stdout;
  if (!podspecText) {
    return;
  }
  let podspec;
  try {
    podspec = JSON.parse(
      podspecText.substring(
        podspecText.indexOf("{"),
        podspecText.lastIndexOf("}") + 1,
      ),
    );
  } catch (_e) {
    return;
  }
  const externalRefs = [];
  if (podspec.authors) {
    component.authors = [];
    if (podspec.authors.constructor === Object) {
      Object.entries(podspec.authors).forEach(([name, email]) => {
        email.includes("@")
          ? component.authors.push({ name, email })
          : component.authors.push({ name });
      });
    } else if (podspec.authors.constructor === Array) {
      podspec.authors.forEach((name) => {
        component.authors.push({ name });
      });
    } else {
      component.authors.push({ name: podspec.authors });
    }
  }
  if (podspec.description) {
    component.description = podspec.description;
  } else if (podspec.summary) {
    component.description = podspec.summary;
  }
  if (podspec.documentation_url) {
    externalRefs.push({
      type: "documentation",
      url: podspec.documentation_url,
    });
  } else if (podspec.readme) {
    externalRefs.push({
      type: "documentation",
      url: podspec.readme,
    });
  }
  if (podspec.homepage) {
    externalRefs.push({
      type: "website",
      url: podspec.homepage,
    });
  }
  if (podspec.license) {
    if (podspec.license.constructor === Object) {
      if (podspec.license.type === "Copyright") {
        component.copyright = podspec.license.text;
      } else {
        component.licenses = [{ license: {} }];
        if (spdxLicenses.includes(podspec.license.type)) {
          component.licenses[0].license.id = podspec.license.type;
        } else {
          component.licenses[0].license.name = podspec.license.type;
        }
        const licenseText = [];
        if (podspec.license.text) {
          if (podspec.license.text.startsWith("http")) {
            component.licenses[0].license.url = podspec.license.text;
          } else {
            licenseText.push(podspec.license.text);
          }
        }
        if (podspec.license.file) {
          if (podspec.license.file.startsWith("http")) {
            if (component.licenses[0].license.url) {
              if (licenseText.length !== 0) {
                licenseText.push("");
              }
              licenseText.push(
                `See also: ${component.licenses[0].license.url}`,
              );
            }
            component.licenses[0].license.url = podspec.license.file;
          } else {
            if (licenseText.length !== 0) {
              licenseText.push("");
            }
            licenseText.push(`See license in file '${podspec.license.file}'`);
          }
        }
        if (licenseText.length !== 0) {
          component.licenses[0].license.text = {
            content: licenseText.join("\n"),
          };
        }
      }
    } else {
      if (spdxLicenses.includes(podspec.license)) {
        component.licenses = [{ license: { id: podspec.license } }];
      } else {
        component.licenses = [{ license: { name: podspec.license } }];
      }
    }
  }
  if (podspec.social_media_url) {
    externalRefs.push({
      type: "social",
      url: podspec.social_media_url,
    });
  }
  if (podspec.source) {
    const comment = [];
    if (podspec.source.http) {
      const sourceDistro = {
        type: "source-distribution",
        url: podspec.source.http,
      };
      const hashes = [];
      if (podspec.source.http.sha1) {
        hashes.push({
          alg: "SHA-1",
          content: podspec.source.http.sha1,
        });
      }
      if (podspec.source.http.sha256) {
        hashes.push({
          alg: "SHA-256",
          content: podspec.source.http.sha256,
        });
      }
      if (hashes.length !== 0) {
        sourceDistro.hashes = hashes;
      }
      if (podspec.source.flatten) {
        comment.push(`Flatten: ${podspec.source.flatten}`);
      }
      if (podspec.source.type) {
        comment.push(`Type: ${podspec.source.type}`);
      }
      if (podspec.source.headers) {
        comment.push(`Headers: ${podspec.source.headers}`);
      }
      if (comment.length !== 0) {
        sourceDistro.comment = comment.join("\n");
      }
      externalRefs.push(sourceDistro);
    } else {
      let url;
      if (podspec.source.git) {
        url = podspec.source.git;
        comment.push("Type: git");
        if (podspec.source.branch) {
          comment.push(`Branch: ${podspec.source.branch}`);
        }
        if (podspec.source.commit) {
          comment.push(`Commit: ${podspec.source.commit}`);
        }
        if (podspec.source.tag) {
          comment.push(`Tag: ${podspec.source.tag}`);
        }
        if (podspec.source.submodules) {
          comment.push(`Submodules: ${podspec.source.submodules}`);
        }
      } else if (podspec.source.hg) {
        url = podspec.source.hg;
        comment.push("Type: hg");
        if (podspec.source.revision) {
          comment.push(`Revision: ${podspec.source.revision}`);
        }
      } else if (podspec.source.svn) {
        url = podspec.source.svn;
        comment.push("Type: svn");
        if (podspec.source.folder) {
          comment.push(`Folder: ${podspec.source.folder}`);
        }
        if (podspec.source.revision) {
          comment.push(`Revision: ${podspec.source.revision}`);
        }
        if (podspec.source.tag) {
          comment.push(`Tag: ${podspec.source.tag}`);
        }
      }
      if (url) {
        externalRefs.push({
          type: "vcs",
          url: url,
          comment: comment.join("\n"),
        });
      } else {
        console.warn(
          `${dependency.name} has property 'source' defined, but it does not contain a URL -- ignoring...`,
        );
      }
    }
  }
  if (externalRefs.length !== 0) {
    component.externalReferences = externalRefs;
  }
}

/**
 * Method to return the maven command to use.
 *
 * @param {string} srcPath Path to look for maven wrapper
 * @param {string} rootPath Root directory to look for maven wrapper
 */
export function getMavenCommand(srcPath, rootPath) {
  let mavenCmd = "mvn";
  // Check if the wrapper script is both available and functional
  let isWrapperReady = false;
  let isWrapperFound = false;
  let findMavenFile = "mvnw";
  let mavenWrapperCmd = null;
  if (platform() === "win32") {
    findMavenFile = "mvnw.bat";
    if (
      !safeExistsSync(join(srcPath, findMavenFile)) &&
      safeExistsSync(join(srcPath, "mvnw.cmd"))
    ) {
      findMavenFile = "mvnw.cmd";
    }
  }

  if (safeExistsSync(join(srcPath, findMavenFile))) {
    // Use local maven wrapper if available
    // Enable execute permission
    try {
      chmodSync(join(srcPath, findMavenFile), 0o775);
    } catch (_e) {
      // continue regardless of error
    }
    mavenWrapperCmd = resolve(join(srcPath, findMavenFile));
    isWrapperFound = true;
    recordDecisionActivity(mavenWrapperCmd, {
      metadata: {
        decisionType: "path-resolution",
        selectedSource: "project-wrapper-candidate",
        tool: "maven",
      },
      reason: `Found Maven wrapper candidate ${mavenWrapperCmd}.`,
    });
  } else if (rootPath && safeExistsSync(join(rootPath, findMavenFile))) {
    // Check if the root directory has a wrapper script
    try {
      chmodSync(join(rootPath, findMavenFile), 0o775);
    } catch (_e) {
      // continue regardless of error
    }
    mavenWrapperCmd = resolve(join(rootPath, findMavenFile));
    isWrapperFound = true;
    recordDecisionActivity(mavenWrapperCmd, {
      metadata: {
        decisionType: "path-resolution",
        selectedSource: "root-wrapper-candidate",
        tool: "maven",
      },
      reason: `Found root-level Maven wrapper candidate ${mavenWrapperCmd}.`,
    });
  }
  if (isWrapperFound) {
    if (DEBUG_MODE) {
      console.log("Testing the wrapper script by invoking --version");
    }
    const result = safeSpawnSync(mavenWrapperCmd, ["--version"], {
      cdxgenActivity: {
        kind: "probe",
        metadata: {
          tool: "maven",
        },
        probeType: "wrapper-readiness",
      },
      cwd: rootPath,
      shell: isWin,
    });
    if (!result.error && !result.status) {
      isWrapperReady = true;
      mavenCmd = mavenWrapperCmd;
      recordDecisionActivity(mavenCmd, {
        metadata: {
          decisionType: "path-resolution",
          selectedSource: "wrapper",
          tool: "maven",
        },
        reason: `Selected Maven wrapper ${mavenCmd} after readiness probe.`,
      });
    } else {
      if (DEBUG_MODE) {
        console.log(
          "Maven wrapper script test has failed. Will use the installed version of maven.",
        );
      }
      recordDecisionActivity(mavenWrapperCmd, {
        metadata: {
          decisionType: "fallback",
          selectedSource: "PATH",
          skippedSource: "wrapper",
          tool: "maven",
        },
        reason: `Maven wrapper readiness probe failed for ${mavenWrapperCmd}; falling back to installed Maven.`,
      });
    }
  }
  if (!isWrapperFound || !isWrapperReady) {
    if (process.env.MVN_CMD || process.env.MAVEN_CMD) {
      mavenCmd = process.env.MVN_CMD || process.env.MAVEN_CMD;
      recordDecisionActivity(mavenCmd, {
        metadata: {
          decisionType: "path-resolution",
          selectedSource: process.env.MVN_CMD ? "MVN_CMD" : "MAVEN_CMD",
          tool: "maven",
        },
        reason: `Selected Maven command from environment (${mavenCmd}).`,
      });
    } else if (process.env.MAVEN_HOME) {
      mavenCmd = join(process.env.MAVEN_HOME, "bin", "mvn");
      recordDecisionActivity(mavenCmd, {
        metadata: {
          decisionType: "path-resolution",
          selectedSource: "MAVEN_HOME",
          tool: "maven",
        },
        reason: `Selected Maven command from MAVEN_HOME (${mavenCmd}).`,
      });
    } else {
      recordDecisionActivity(mavenCmd, {
        metadata: {
          decisionType: "path-resolution",
          selectedSource: "PATH",
          tool: "maven",
        },
        reason: "Falling back to Maven from PATH.",
      });
    }
  }
  return mavenCmd;
}

/**
 * Retrieves the atom command by referring to various environment variables
 */
export function getAtomCommand() {
  if (process.env.ATOM_CMD) {
    return process.env.ATOM_CMD;
  }
  if (process.env.ATOM_HOME) {
    return join(process.env.ATOM_HOME, "bin", "atom");
  }
  const NODE_CMD = process.env.NODE_CMD || "node";
  const localAtom = join(
    dirNameStr,
    "node_modules",
    "@appthreat",
    "atom",
    "index.js",
  );
  if (safeExistsSync(localAtom)) {
    return `${NODE_CMD} ${localAtom}`;
  }
  return "atom";
}

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
export function executeAtom(src, args, extra_env = {}) {
  const cwd =
    safeExistsSync(src) && lstatSync(src).isDirectory() ? src : dirname(src);
  let ATOM_BIN = getAtomCommand();
  let isSupported = true;
  if (ATOM_BIN.includes(" ")) {
    const tmpA = ATOM_BIN.split(" ");
    if (tmpA && tmpA.length > 1) {
      ATOM_BIN = tmpA[0];
      args.unshift(tmpA[1]);
    }
  }
  if (DEBUG_MODE) {
    console.log("Executing", ATOM_BIN);
  }
  const env = {
    ...process.env,
    ...extra_env,
  };
  // Atom requires Java >= 21
  if (process.env?.ATOM_JAVA_HOME) {
    env.JAVA_HOME = process.env.ATOM_JAVA_HOME;
  }
  if (isWin) {
    env.PATH = `${env.PATH || env.Path}${_delimiter}${join(
      dirNameStr,
      "node_modules",
      ".bin",
    )}`;
  } else {
    env.PATH = `${env.PATH}${_delimiter}${join(
      dirNameStr,
      "node_modules",
      ".bin",
    )}`;
  }
  const result = safeSpawnSync(ATOM_BIN, args, {
    cwd,
    shell: isWin,
    killSignal: "SIGKILL",
    env,
  });
  if (result.stderr) {
    if (
      result.stderr?.includes(
        "has been compiled by a more recent version of the Java Runtime",
      ) ||
      result.stderr?.includes(
        "Error: Could not create the Java Virtual Machine",
      )
    ) {
      console.log(
        "Atom requires Java 21 or above. To improve the SBOM accuracy, please install a suitable version, set the JAVA_HOME environment variable, and re-run cdxgen.\nAlternatively, use the cdxgen container image.",
      );
      console.log(`Current JAVA_HOME: ${env["JAVA_HOME"] || ""}`);
    } else if (result.stderr?.includes("astgen")) {
      console.warn(
        "WARN: Unable to locate astgen command. Install atom globally using sudo npm install -g @appthreat/atom-parsetools to resolve this issue.",
      );
    } else if (
      result.stderr?.includes(
        "The crash happened outside the Java Virtual Machine in native code",
      )
    ) {
      console.warn(
        "WARN: The binary plugin used by atom has crashed. Please try an alternative container image and file an issue with steps to reproduce at: https://github.com/AppThreat/atom/issues",
      );
    } else if (
      result.stderr?.includes("Could not parse command line options")
    ) {
      console.warn(
        "Invalid command-line options passed to atom. Please file a bug in the cdxgen repository.",
      );
    }
  }
  if (result.stdout) {
    if (result.stdout.includes("No language frontend supported for language")) {
      console.log("This language is not yet supported by atom.");
      isSupported = false;
    } else if (
      result.stdout.includes(
        "The crash happened outside the Java Virtual Machine in native code",
      ) ||
      result.stdout.includes(
        "A fatal error has been detected by the Java Runtime Environment",
      )
    ) {
      console.warn(
        "WARN: The binary plugin used by atom has crashed. Please try an alternative container image and file an issue with steps to reproduce at: https://github.com/AppThreat/atom/issues",
      );
    }
  }
  if (DEBUG_MODE) {
    if (result.stdout) {
      console.log(result.stdout);
    }
    if (result.stderr) {
      console.log(result.stderr);
    }
  }
  return isSupported && !result.error;
}

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
export function findAppModules(
  src,
  language,
  methodology = "usages",
  slicesFile = undefined,
  options = {},
) {
  const tempDir = safeMkdtempSync(join(tmpdir(), "atom-deps-"));
  const atomFile = join(tempDir, `${language}-app.atom`);
  if (!slicesFile) {
    slicesFile = join(tempDir, "slices.json");
  }
  let retList = [];
  const args = [
    methodology,
    "-l",
    language,
    "-o",
    resolve(atomFile),
    "--slice-outfile",
    resolve(slicesFile),
    resolve(src),
  ];
  executeAtom(src, args, buildAtomCommandEnv(options, language));
  if (safeExistsSync(slicesFile)) {
    const slicesData = JSON.parse(readFileSync(slicesFile, "utf-8"), {
      encoding: "utf-8",
    });
    if (slicesData && Object.keys(slicesData) && slicesData.modules) {
      retList = slicesData.modules;
    } else {
      retList = slicesData;
    }
  } else {
    console.log(
      "Slicing was not successful. For large projects (> 1 million lines of code), try running atom cli externally in Java mode. Please refer to the instructions in https://github.com/cdxgen/cdxgen/blob/master/ADVANCED.md.",
    );
  }
  // Clean up
  if (tempDir?.startsWith(tmpdir())) {
    safeRmSync(tempDir, { recursive: true, force: true });
  }
  return retList;
}

/**
 * Create uv.lock file with uv sync command.
 *
 * @param {string} basePath Path
 * @param {Object} options CLI options
 */
export function createUVLock(basePath, options) {
  const python_cmd = get_python_command_from_env(process.env);
  let uvSyncArgs = ["-m", "uv", "sync"];
  // Do not update the lock file in pre-build mode
  if (options?.lifecycle?.includes("pre-build")) {
    uvSyncArgs.push("--frozen");
  } else if (options?.recurse) {
    uvSyncArgs = uvSyncArgs.concat(["--all-groups", "--all-packages"]);
  }
  // Install everything and do not remove anything extraneous
  if (options?.deep) {
    uvSyncArgs = uvSyncArgs.concat(["--all-extras", "--inexact"]);
  }
  if (process?.env?.UV_INSTALL_ARGS) {
    const addArgs = process.env.UV_INSTALL_ARGS.split(" ");
    uvSyncArgs = uvSyncArgs.concat(addArgs);
  }
  if (DEBUG_MODE) {
    console.log(
      `Executing ${python_cmd} ${uvSyncArgs.join(" ")} in ${basePath}`,
    );
  }
  let result = safeSpawnSync(python_cmd, uvSyncArgs, {
    shell: isWin,
    cwd: basePath,
  });
  if (result.status !== 0 || result.error) {
    if (result?.stderr?.includes("No module named uv")) {
      if (DEBUG_MODE) {
        console.log(`Executing uv sync in ${basePath}`);
      }
      result = safeSpawnSync("uv", ["sync"], {
        shell: isWin,
        cwd: basePath,
      });
      if (result.status !== 0 || result.error) {
        console.log("Check if uv is installed and available in PATH.");
        if (process.env?.CDXGEN_IN_CONTAINER !== "true") {
          console.log(
            "Use the cdxgen container image which comes with uv installed.",
          );
        }
        console.log(result.stderr);
      }
    } else {
      console.log(result.stderr);
    }
  }
}

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
export async function getPipFrozenTree(
  basePath,
  reqOrSetupFile,
  tempVenvDir,
  parentComponent,
  projectRoot,
) {
  const pkgList = [];
  const formulationList = [];
  const rootList = [];
  const dependenciesList = [];
  let result;
  let frozen = true;
  const env = {
    ...process.env,
  };
  if (!env.CFLAGS) {
    env.CFLAGS = "-fcommon";
  } else if (!env.CFLAGS.includes("-fcommon")) {
    env.CFLAGS = `${env.CFLAGS} -fcommon`;
  }

  const explicitDeps = new Set();
  if (reqOrSetupFile?.endsWith(".txt") && safeExistsSync(reqOrSetupFile)) {
    // We only need the package names, so we pass `false` to avoid fetching full metadata.
    const tempPkgList = await parseReqFile(reqOrSetupFile, null, false);
    for (const pkg of tempPkgList) {
      if (pkg.name) {
        explicitDeps.add(pkg.name.replace(/_/g, "-").toLowerCase());
      }
    }
  }

  /**
   * Let's start with an attempt to create a new temporary virtual environment in case we aren't in one
   *
   * By checking the environment variable "VIRTUAL_ENV" we decide whether to create an env or not
   */
  if (
    !process.env.VIRTUAL_ENV &&
    !process.env.CONDA_PREFIX &&
    reqOrSetupFile &&
    !reqOrSetupFile.endsWith("poetry.lock")
  ) {
    thoughtLog(
      "Let me create a new virtual environment for installing the packages with pip.",
    );
    const venvCreationArgs = ["-m", "venv", tempVenvDir];
    if (isSecureMode) {
      venvCreationArgs.unshift("-S");
    }
    result = safeSpawnSync(PYTHON_CMD, venvCreationArgs, {
      shell: isWin,
    });
    if (result.status !== 0 || result.error) {
      frozen = false;
      if (DEBUG_MODE) {
        console.log("Virtual env creation has failed");
        if (result.stderr?.includes("safeSpawnSync python ENOENT")) {
          console.log(
            "Install suitable version of python or set the environment variable PYTHON_CMD.",
          );
        }
      }
    } else {
      if (DEBUG_MODE) {
        console.log("Using the virtual environment", tempVenvDir);
      }
      env.VIRTUAL_ENV = tempVenvDir;
      env.PATH = `${join(
        tempVenvDir,
        platform() === "win32" ? "Scripts" : "bin",
      )}${_delimiter}${process.env.PATH || ""}`;
      // When cdxgen is invoked with the container image, we seem to be including unnecessary packages from the image.
      // This workaround, unsets PYTHONPATH to suppress the pre-installed packages
      if (
        env?.PYTHONPATH === "/opt/pypi" &&
        env?.CDXGEN_IN_CONTAINER === "true"
      ) {
        env.PYTHONPATH = undefined;
      }
    }
  }
  const venvMeta = getVenvMetadata(env);
  const python_cmd_for_tree = get_python_command_from_env(env);
  // Check if pyproject.toml is actually a uv-configured workspace
  let hasToolUv = false;
  let hasToolPoetry = false;
  if (
    reqOrSetupFile?.endsWith("pyproject.toml") &&
    safeExistsSync(reqOrSetupFile)
  ) {
    try {
      const content = readFileSync(reqOrSetupFile, "utf-8");
      hasToolUv = content.includes("[tool.uv]");
      hasToolPoetry = content.includes('build-backend = "poetry.core');
    } catch (_err) {
      // Ignore read error
    }
  }
  if (reqOrSetupFile) {
    // We have a poetry.lock file
    if (reqOrSetupFile.endsWith("poetry.lock") || hasToolPoetry) {
      const poetryConfigArgs = [
        "-m",
        "poetry",
        "config",
        "virtualenvs.options.no-setuptools",
        "true",
        "--local",
      ];
      if (isSecureMode) {
        poetryConfigArgs.unshift("-S");
      }
      result = safeSpawnSync(PYTHON_CMD, poetryConfigArgs, {
        cwd: basePath,
        shell: isWin,
      });
      thoughtLog("Performing poetry install");
      let poetryInstallArgs = ["-m", "poetry", "install", "-n", "--no-root"];
      if (isSecureMode) {
        poetryInstallArgs.unshift("-S");
      }
      // Attempt to perform poetry install
      result = safeSpawnSync(PYTHON_CMD, poetryInstallArgs, {
        cwd: basePath,
        shell: isWin,
      });
      if (result.status !== 0 || result.error) {
        if (result.stderr?.includes("No module named poetry")) {
          thoughtLog(
            "Hmm, poetry doesn't seem to be available as a module. Perhaps it was installed directly 🤔?",
          );
          poetryInstallArgs = ["install", "-n", "--no-root"];
          // Attempt to perform poetry install
          result = safeSpawnSync("poetry", poetryInstallArgs, {
            cwd: basePath,
            shell: isWin,
            env,
          });
          if (result.status !== 0 || result.error) {
            frozen = false;
            if (DEBUG_MODE && result.stderr) {
              console.log(result.stderr);
            }
            thoughtLog(
              "poetry install has failed. Let me suggest some troubleshooting ideas.",
            );
            console.log("poetry install has failed.");
            console.log(
              "1. Install the poetry command using python -m pip install poetry.",
            );
            console.log(
              "2. Check the version of python supported by the project. Poetry is strict about the version used.",
            );
            console.log(
              "3. Setup and activate the poetry virtual environment and re-run cdxgen.",
            );
          }
        } else {
          frozen = false;
          console.log(
            "Poetry install has failed. Setup and activate the poetry virtual environment and re-run cdxgen.",
          );
          if (DEBUG_MODE) {
            if (result.error) {
              console.log(result.error);
            }
            if (result.stderr) {
              console.log(result.stderr);
            }
          }
        }
      } else {
        const poetryEnvArgs = ["env info", "--path"];
        result = safeSpawnSync("poetry", poetryEnvArgs, {
          cwd: basePath,
          shell: isWin,
          env,
        });
        tempVenvDir = result.stdout?.replaceAll(/[\r\n]+/g, "");
        if (tempVenvDir?.length) {
          env.VIRTUAL_ENV = tempVenvDir;
          env.PATH = `${join(
            tempVenvDir,
            platform() === "win32" ? "Scripts" : "bin",
          )}${_delimiter}${process.env.PATH || ""}`;
        }
      }
    } else if (reqOrSetupFile.endsWith("pdm.lock") || venvMeta.type === "pdm") {
      thoughtLog("Performing pdm install");
      result = safeSpawnSync("pdm", ["install"], {
        cwd: basePath,
        shell: isWin,
        env,
      });
      if (result.status !== 0 || result.error) {
        frozen = false;
      }
    } else if (
      reqOrSetupFile.endsWith("pixi.lock") ||
      venvMeta.type === "pixi"
    ) {
      thoughtLog("Performing pixi install");
      result = safeSpawnSync("pixi", ["install"], {
        cwd: basePath,
        shell: isWin,
        env,
      });
      if (result.status !== 0 || result.error) {
        frozen = false;
      }
    } else if (
      reqOrSetupFile.endsWith("uv.lock") ||
      (venvMeta.type === "uv" && hasToolUv)
    ) {
      thoughtLog("Performing uv sync");
      result = safeSpawnSync("uv", ["sync"], {
        cwd: basePath,
        shell: isWin,
        env,
      });
      if (result.status !== 0 || result.error) {
        frozen = false;
      }
    } else if (
      venvMeta.type === "rye" ||
      reqOrSetupFile.endsWith("requirements.lock")
    ) {
      thoughtLog("Performing rye sync");
      result = safeSpawnSync("rye", ["sync"], {
        cwd: basePath,
        shell: isWin,
        env,
      });
      if (result.status !== 0 || result.error) {
        frozen = false;
      }
    } else {
      // General package installation (Handling pip, or uv pip)
      let installCmd = python_cmd_for_tree;
      let pipInstallArgs = [];
      if (venvMeta.type === "uv") {
        installCmd = "uv";
        pipInstallArgs = ["pip", "install"];
        if (isSecureMode) {
          pipInstallArgs.push("--only-binary");
          pipInstallArgs.push(":all:");
        }
      } else {
        pipInstallArgs = [
          "-m",
          "pip",
          "install",
          "--disable-pip-version-check",
        ];
        if (isSecureMode) {
          pipInstallArgs.push("--only-binary=:all:");
          pipInstallArgs.unshift("-S");
        }
      }
      if (
        !reqOrSetupFile.endsWith("setup.py") &&
        !reqOrSetupFile.endsWith("pyproject.toml")
      ) {
        pipInstallArgs.push("-r");
        pipInstallArgs.push(resolve(reqOrSetupFile));
        if (reqOrSetupFile.includes("test")) {
          thoughtLog(
            `${reqOrSetupFile} appears to be related to tests. Should I suggest the "--exclude" argument?`,
          );
        }
      } else {
        pipInstallArgs.push(resolve(basePath));
      }
      if (process?.env?.PIP_INSTALL_ARGS) {
        const addArgs = process.env.PIP_INSTALL_ARGS.split(" ");
        pipInstallArgs = pipInstallArgs.concat(addArgs);
      }
      thoughtLog(
        `**INSTALL**: Trying package install using the arguments: ${installCmd} ${pipInstallArgs.join(" ")}`,
      );
      if (DEBUG_MODE) {
        console.log("Executing", installCmd);
      }
      result = safeSpawnSync(installCmd, pipInstallArgs, {
        cwd: projectRoot || basePath,
        shell: isWin,
        env,
      });
      if (result.status !== 0 || result.error) {
        frozen = false;
        let versionRelatedError = false;
        if (
          result.stderr?.includes(
            "Could not find a version that satisfies the requirement",
          ) ||
          result.stderr?.includes("No matching distribution found for")
        ) {
          versionRelatedError = true;
          if (process.env.PIP_INSTALL_ARGS) {
            console.log(
              "1. Try invoking cdxgen with a different python type. Example: `-t python`, `-t python310`, or `-t python39`\n",
            );
          } else {
            console.log(
              "The version or the version specifiers used for a dependency is invalid. Try with a different python type such as -t python310 or -t python39.\nOriginal error from pip:\n",
            );
          }
          console.log(result.stderr);
        } else if (result?.stderr?.includes("No module named pip")) {
          console.log(
            "Using uv? Ensure 'uv' is in your PATH to allow cdxgen to use `uv pip install` automatically.",
          );
        } else if (
          process.env.PIP_INSTALL_ARGS &&
          result.stderr?.includes("Cannot set --home and --prefix together")
        ) {
          versionRelatedError = true;
          thoughtLog(`Got the error: ${result.stderr.split("\n").slice(0, 5)}`);
          if (DEBUG_MODE) {
            console.log(result.stderr);
          } else {
            console.log(
              "Possible build errors detected with 'pip install'. Set the environment variable CDXGEN_DEBUG_MODE=debug to troubleshoot.",
            );
            if (result?.stderr?.includes("No module named pip")) {
              console.log(
                "Using uv? Run uv pip install command prior to running cdxgen.",
              );
            } else {
              console.log(result.stderr.split("\n").slice(0, 5));
            }
          }
          console.warn(
            "This project does not support python with version types. Use an appropriate container image such as `ghcr.io/appthreat/cdxgen-python39:v12` or `ghcr.io/appthreat/cdxgen-python311:v12` and invoke cdxgen with `-t python` instead.\n",
          );
        } else if (
          result?.stderr?.includes(
            "pip subprocess to install build dependencies",
          )
        ) {
          console.log(
            "Installing build dependencies has failed. Use an appropriate container image such as `ghcr.io/appthreat/cdxgen-python39:v12` or `ghcr.io/appthreat/cdxgen-python311:v12` and invoke cdxgen with `-t python` instead.",
          );
          if (
            result?.stderr?.includes(
              "Failed to build installable wheels for some pyproject.toml based projects",
            )
          ) {
            console.log(
              "Try upgrading setuptools with `python -m pip install setuptools --upgrade`",
            );
          }
          if (process.env?.CDXGEN_IN_CONTAINER !== "true") {
            thoughtLog(
              "Installation of build dependencies failed. I told you we must use container images for python.",
            );
          } else {
            thoughtLog(
              "Installation of build dependencies failed. Perhaps the user is using the wrong container image?",
            );
          }
        }
        if (!versionRelatedError) {
          if (DEBUG_MODE) {
            console.info(
              "\nEXPERIMENTAL: Invoke cdxgen with '--feature-flags safe-pip-install' to recover a partial dependency tree for projects with build errors.\n",
            );
            if (result.stderr) {
              console.log(result.stderr);
            }
            console.log(
              "Possible build errors detected. The resulting list in the SBOM would therefore be incomplete.\nTry installing any missing build tools or development libraries to improve the accuracy.",
            );
            thoughtLog(
              "Possible build errors detected. We have an incomplete list of pypi components and dependencies.",
            );
            if (platform() === "win32") {
              console.log(
                "- Install the appropriate compilers and build tools on Windows by following this documentation - https://wiki.python.org/moin/WindowsCompilers",
              );
            } else {
              console.log(
                "- For example, you may have to install gcc, gcc-c++ compiler, postgresql or mysql devel packages and additional development libraries using apt-get or yum package manager.",
              );
            }
            console.log(
              "- Certain projects would only build with specific versions of Python. Data science and ML related projects might require a conda/anaconda distribution.",
            );
            console.log(
              "- Check if any git submodules have to be initialized.\n- If the application has its own Dockerfile, look for any clues for build dependencies.",
            );
            if (
              process.env?.CDXGEN_IN_CONTAINER !== "true" &&
              !process.env.PIP_INSTALL_ARGS
            ) {
              console.log(
                "1. Try invoking cdxgen with a specific python version type. Example: `-t python36` or `-t python39`",
              );
              console.log(
                "2. Alternatively, try using the custom container images `ghcr.io/cyclonedx/cdxgen-python39:v12` or `ghcr.io/cyclonedx/cdxgen-python311:v12`, which bundles a range of build tools and development libraries.",
              );
            } else if (
              process.env?.PIP_INSTALL_ARGS?.includes("--python-version")
            ) {
              console.log(
                "1. Try invoking cdxgen with a different python version type. Example: `-t python`, `-t python39`, or `-t python311`",
              );
              console.log(
                "2. Try with the experimental flag '--feature-flags safe-pip-install'",
              );
            }
          } else {
            if (process.env?.CDXGEN_IN_CONTAINER !== "true") {
              thoughtLog(
                "**PIP**: Installation of build dependencies failed. If in doubt, use the cdxgen container images for python.",
              );
            } else {
              thoughtLog(
                "Installation of build dependencies failed. Perhaps the user is using the wrong cdxgen container image? Should I recommend raising a GitHub issue?",
              );
            }
            // Bug #1640. result.stderr is null here despite the process erroring with a non-zero value.
            // How do we reproduce this with repo tests?
            if (result?.stderr) {
              if (result?.stderr?.includes("No module named pip")) {
                console.log(
                  "Using uv? Run uv pip install command prior to running cdxgen.",
                );
              } else {
                console.log(
                  "Possible build errors detected. Set the environment variable CDXGEN_DEBUG_MODE=debug to troubleshoot.",
                );
                console.log(result.stderr?.split("\n")?.slice(0, 5));
              }
            }
          }
        }
      }
    }
  }
  // Bug #375. Attempt pip freeze on existing and new virtual environments
  if (env.VIRTUAL_ENV?.length || env.CONDA_PREFIX?.length) {
    const venvRoot = env.VIRTUAL_ENV || env.CONDA_PREFIX;
    const binDir = platform() === "win32" ? "Scripts" : "bin";
    const pipExe = join(
      venvRoot,
      binDir,
      platform() === "win32" ? "pip.exe" : "pip",
    );
    if (!safeExistsSync(pipExe)) {
      thoughtLog(
        "The 'pip' module is missing in this environment. Bootstrapping it to support piptree extraction.",
      );
      if (venvMeta.type === "uv") {
        safeSpawnSync("uv", ["pip", "install", "pip"], {
          cwd: basePath,
          shell: isWin,
          env,
        });
      } else if (venvMeta.type === "rye") {
        safeSpawnSync("rye", ["run", "pip", "install", "pip"], {
          cwd: basePath,
          shell: isWin,
          env,
        });
      } else {
        safeSpawnSync(python_cmd_for_tree, ["-m", "ensurepip", "--upgrade"], {
          cwd: basePath,
          shell: isWin,
          env,
        });
      }
    }
    if (DEBUG_MODE && reqOrSetupFile) {
      console.log(
        `About to construct the dependency tree based on ${reqOrSetupFile}. Please wait ...`,
      );
    }
    // This is a slow step that ideally needs to be invoked only once per venv
    const tree = getTreeWithPlugin(env, python_cmd_for_tree, basePath);
    if (DEBUG_MODE && !tree.length) {
      console.log(
        "Dependency tree generation has failed. Please check for any errors or version incompatibilities reported in the logs.",
      );
    }
    const dependenciesMap = {};
    for (const t of tree) {
      const name = t.name.replace(/_/g, "-").toLowerCase();
      // Bug #1232 - the root package might lack a version resulting in duplicate tree
      // So we make use of the existing parent component to try and patch the version
      if (
        parentComponent &&
        parentComponent.name === t.name &&
        parentComponent.version &&
        parentComponent?.version !== "latest" &&
        t.version === "latest"
      ) {
        t.version = parentComponent.version;
      }
      const version = t.version;
      const scope = PYTHON_EXCLUDED_COMPONENTS.includes(name)
        ? "excluded"
        : undefined;
      if (!scope && !t.version.length) {
        // Don't leave out any local dependencies
        if (t.dependencies.length) {
          flattenDeps(dependenciesMap, pkgList, reqOrSetupFile, t);
        }
        continue;
      }
      const purlString = new PackageURL(
        "pypi",
        "",
        name,
        version,
        null,
        null,
      ).toString();
      const apkg = {
        name,
        version,
        purl: purlString,
        type: "library",
        "bom-ref": decodeURIComponent(purlString),
        scope,
        evidence: {
          identity: {
            field: "purl",
            confidence: 1,
            methods: [
              {
                technique: "instrumentation",
                confidence: 1,
                value: env.VIRTUAL_ENV || env.CONDA_PREFIX,
              },
            ],
          },
        },
        properties: [
          {
            name: "SrcFile",
            value: reqOrSetupFile,
          },
        ],
      };
      if (scope !== "excluded") {
        pkgList.push(apkg);
        if (explicitDeps.size === 0 || explicitDeps.has(name)) {
          rootList.push({
            name,
            version,
            purl: purlString,
            "bom-ref": decodeURIComponent(purlString),
          });
        }
        flattenDeps(dependenciesMap, pkgList, reqOrSetupFile, t);
      } else {
        formulationList.push(apkg);
      }
    } // end for
    for (const k of Object.keys(dependenciesMap)) {
      dependenciesList.push({
        ref: k,
        dependsOn: [...new Set(dependenciesMap[k])].sort(),
      });
    }
  }
  return {
    pkgList,
    formulationList,
    rootList,
    dependenciesList,
    frozen,
  };
}

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
export function getPipTreeForPackages(
  basePath,
  pkgList,
  tempVenvDir,
  parentComponent,
) {
  const failedPkgList = [];
  const rootList = [];
  const dependenciesList = [];
  let result;
  const env = {
    ...process.env,
  };
  if (!env.CFLAGS) {
    env.CFLAGS = "-fcommon";
  } else if (!env.CFLAGS.includes("-fcommon")) {
    env.CFLAGS = `${env.CFLAGS} -fcommon`;
  }
  if (!process.env.VIRTUAL_ENV && !process.env.CONDA_PREFIX) {
    // Create a virtual environment
    const venvCreationArgs = ["-m", "venv", tempVenvDir];
    if (isSecureMode) {
      venvCreationArgs.unshift("-S");
    }
    result = safeSpawnSync(PYTHON_CMD, venvCreationArgs, {
      shell: isWin,
    });
    if (result.status !== 0 || result.error) {
      console.log("Virtual env creation has failed. Unable to continue.");
      return {};
    }
    env.VIRTUAL_ENV = tempVenvDir;
    env.PATH = `${join(
      tempVenvDir,
      platform() === "win32" ? "Scripts" : "bin",
    )}${_delimiter}${process.env.PATH || ""}`;
    // When cdxgen is invoked with the container image, we seem to be including unnecessary packages from the image.
    // This workaround, unsets PYTHONPATH to suppress the pre-installed packages
    if (
      env?.PYTHONPATH === "/opt/pypi" &&
      env?.CDXGEN_IN_CONTAINER === "true"
    ) {
      env.PYTHONPATH = undefined;
    }
  }
  const venvMeta = getVenvMetadata(env);
  const python_cmd_for_tree = get_python_command_from_env(env);
  let installCmd = python_cmd_for_tree;
  let pipInstallArgs = [];
  if (venvMeta.type === "uv") {
    installCmd = "uv";
    pipInstallArgs = ["pip", "install"];
    if (isSecureMode) {
      pipInstallArgs.push("--only-binary");
      pipInstallArgs.push(":all:");
    }
  } else {
    pipInstallArgs = ["-m", "pip", "install", "--disable-pip-version-check"];
    if (isSecureMode) {
      pipInstallArgs.push("--only-binary=:all:");
      pipInstallArgs.unshift("-S");
    }
  }
  // Support for passing additional arguments to pip
  // Eg: --python-version 3.10 --ignore-requires-python --no-warn-conflicts
  if (process?.env?.PIP_INSTALL_ARGS) {
    const addArgs = process.env.PIP_INSTALL_ARGS.split(" ");
    pipInstallArgs = pipInstallArgs.concat(addArgs);
  } else {
    if (venvMeta.type !== "uv") {
      pipInstallArgs = pipInstallArgs.concat([
        "--ignore-requires-python",
        "--no-compile",
        "--no-warn-script-location",
        "--no-warn-conflicts",
      ]);
    } else {
      pipInstallArgs.push("--no-compile");
    }
  }
  if (DEBUG_MODE) {
    console.log(
      "Installing",
      pkgList.length,
      "packages using the command",
      installCmd,
      pipInstallArgs.join(" "),
    );
  }
  for (const apkg of pkgList) {
    let pkgSpecifier = apkg.name;
    if (apkg.version && apkg.version !== "latest") {
      pkgSpecifier = `${apkg.name}==${apkg.version}`;
    } else if (apkg.properties) {
      let versionSpecifierFound = false;
      for (const aprop of apkg.properties) {
        if (aprop.name === "cdx:pypi:versionSpecifiers") {
          pkgSpecifier = `${apkg.name}${aprop.value}`;
          versionSpecifierFound = true;
          break;
        }
      }
      if (!versionSpecifierFound) {
        failedPkgList.push(apkg);
        continue;
      }
    } else {
      failedPkgList.push(apkg);
      continue;
    }
    if (DEBUG_MODE) {
      console.log("Installing", pkgSpecifier);
    }
    const result = safeSpawnSync(
      installCmd,
      [...pipInstallArgs, pkgSpecifier],
      {
        cwd: basePath,
        shell: isWin,
        env,
      },
    );
    if (result.status !== 0 || result.error) {
      failedPkgList.push(apkg);
      if (DEBUG_MODE) {
        console.log(apkg.name, "failed to install.");
      }
    }
  }
  // Did any package get installed successfully?
  if (failedPkgList.length < pkgList.length) {
    const venvRoot = env.VIRTUAL_ENV || env.CONDA_PREFIX;
    if (venvRoot) {
      const binDir = platform() === "win32" ? "Scripts" : "bin";
      const pipExe = join(
        venvRoot,
        binDir,
        platform() === "win32" ? "pip.exe" : "pip",
      );
      if (!safeExistsSync(pipExe)) {
        if (venvMeta.type === "uv") {
          safeSpawnSync("uv", ["pip", "install", "pip"], {
            cwd: basePath,
            shell: isWin,
            env,
          });
        } else {
          safeSpawnSync(python_cmd_for_tree, ["-m", "ensurepip", "--upgrade"], {
            cwd: basePath,
            shell: isWin,
            env,
          });
        }
      }
    }
    const dependenciesMap = {};
    const tree = getTreeWithPlugin(env, python_cmd_for_tree, basePath);
    for (const t of tree) {
      const name = t.name.replace(/_/g, "-").toLowerCase();
      // We can ignore excluded components such as build tools
      if (PYTHON_EXCLUDED_COMPONENTS.includes(name)) {
        continue;
      }
      if (parentComponent && parentComponent.name === t.name) {
        t.version = parentComponent.version;
      } else if (t.version && t.version === "latest") {
        continue;
      }
      const version = t.version;
      const purlString = new PackageURL(
        "pypi",
        "",
        name,
        version,
        null,
        null,
      ).toString();
      const apkg = {
        name,
        version,
        purl: purlString,
        type: "library",
        "bom-ref": decodeURIComponent(purlString),
        evidence: {
          identity: {
            field: "purl",
            confidence: 0.5,
            methods: [
              {
                technique: "instrumentation",
                confidence: 0.5,
                value: env.VIRTUAL_ENV,
              },
            ],
          },
        },
      };
      // These packages have lower confidence
      pkgList.push(apkg);
      rootList.push({
        name,
        version,
        purl: purlString,
        "bom-ref": decodeURIComponent(purlString),
      });
      flattenDeps(dependenciesMap, pkgList, undefined, t);
    } // end for
    for (const k of Object.keys(dependenciesMap)) {
      dependenciesList.push({
        ref: k,
        dependsOn: [...new Set(dependenciesMap[k])].sort(),
      });
    }
  } // end if
  return {
    failedPkgList,
    rootList,
    dependenciesList,
  };
}

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
export function parseCmakeDotFile(dotFile, pkgType, options = {}) {
  const dotGraphData = readFileSync(dotFile, { encoding: "utf-8" });
  const pkgList = [];
  const dependenciesMap = {};
  const pkgBomRefMap = {};
  let parentComponent = {};
  dotGraphData.split("\n").forEach((l) => {
    l = l.replace("\r", "").trim();
    if (l === "\n" || l.startsWith("#")) {
      return;
    }
    let name = "";
    const group = "";
    const version = "";
    let path;
    if (l.startsWith("digraph")) {
      const tmpA = l.split(" ");
      if (tmpA && tmpA.length > 1) {
        name = tmpA[1].replace(/"/g, "");
      }
    } else if (l.startsWith('"node')) {
      // Direct dependencies are represented as nodes
      if (l.includes("label =")) {
        const tmpA = l.split('label = "');
        if (tmpA && tmpA.length > 1) {
          name = tmpA[1].split('"')[0];
        }
        if (name.includes("\\n")) {
          name = name.split("\\n")[0];
        } else if (name.includes(_sep)) {
          path = name;
          name = basename(name);
        }
      } else if (l.includes("// ")) {
        // Indirect dependencies are represented with comments
        const tmpA = l.split("// ");
        if (tmpA?.length) {
          const relationship = tmpA[1];
          if (relationship.includes("->")) {
            const tmpB = relationship.split(" -> ");
            if (tmpB && tmpB.length === 2) {
              if (tmpB[0].includes(_sep)) {
                tmpB[0] = basename(tmpB[0]);
              }
              if (tmpB[1].includes(_sep)) {
                tmpB[1] = basename(tmpB[1]);
              }
              const ref = pkgBomRefMap[tmpB[0]];
              const depends = pkgBomRefMap[tmpB[1]];
              if (ref && depends) {
                if (!dependenciesMap[ref]) {
                  dependenciesMap[ref] = new Set();
                }
                dependenciesMap[ref].add(depends);
              }
            }
          }
        }
      }
    }
    if (!Object.keys(parentComponent).length) {
      parentComponent = {
        group: options.projectGroup || "",
        name: "project-name" in options ? options.projectName : name,
        version: options.projectVersion || "",
        type: "application",
      };
      parentComponent["purl"] = new PackageURL(
        pkgType,
        parentComponent.group,
        parentComponent.name,
        parentComponent.version,
        null,
        path,
      ).toString();
      parentComponent["bom-ref"] = decodeURIComponent(parentComponent["purl"]);
    } else if (name) {
      const apkg = {
        name: name,
        type: pkgType,
        purl: new PackageURL(
          pkgType,
          group,
          name,
          version,
          null,
          path,
        ).toString(),
      };
      apkg["bom-ref"] = decodeURIComponent(apkg["purl"]);
      pkgList.push(apkg);
      pkgBomRefMap[name] = apkg["bom-ref"];
    }
  });
  const dependenciesList = [];
  for (const pk of Object.keys(dependenciesMap)) {
    const dependsOn = Array.from(dependenciesMap[pk] || []).sort();
    dependenciesList.push({
      ref: pk,
      dependsOn,
    });
  }
  return {
    parentComponent,
    pkgList,
    dependenciesList,
  };
}

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
export function parseCmakeLikeFile(cmakeListFile, pkgType, options = {}) {
  let cmakeListData = readFileSync(cmakeListFile, { encoding: "utf-8" });
  const pkgList = [];
  const pkgAddedMap = {};
  const versionSpecifiersMap = {};
  const versionsMap = {};
  let parentComponent = {};
  const templateValues = {};
  cmakeListData = cmakeListData
    .replace(/^ {2}/g, "")
    .replace(/\(\r\n/g, "(")
    .replace(/\(\n/g, "(")
    .replace(/,\r\n/g, ",")
    .replace(/,\n/g, ",");
  cmakeListData.split("\n").forEach((l) => {
    l = l.replace("\r", "").trim();
    if (l === "\n" || l.startsWith("#")) {
      return;
    }
    const group = "";
    const path = undefined;
    const name_list = [];
    if (l.startsWith("set")) {
      const tmpA = l.replace("set(", "").replace(")", "").trim().split(" ");
      if (tmpA && tmpA.length === 2) {
        templateValues[tmpA[0]] = tmpA[1];
      }
    } else if (
      l.startsWith("project") &&
      !Object.keys(parentComponent).length
    ) {
      if (l.includes("${")) {
        for (const tmplKey of Object.keys(templateValues)) {
          l = l.replace(`\${${tmplKey}}`, templateValues[tmplKey] || "");
        }
      }
      const tmpA = l.replace("project (", "project(").split("project(");
      if (tmpA && tmpA.length > 1) {
        const tmpB = (tmpA[1] || "")
          .trim()
          .replace(/["']/g, "")
          .replace(/ /g, ",")
          .split(")")[0]
          .split(",")
          .filter((v) => v.length > 1);
        const parentName =
          tmpB.length > 0 ? tmpB[0].replace(":", "").trim() : "";
        let parentVersion;
        // In case of meson.build we can find the version number after the word version
        // thanks to our replaces and splits
        const versionIndex = tmpB.findIndex(
          (v) => v?.toLowerCase() === "version",
        );
        if (versionIndex > -1 && tmpB.length > versionIndex) {
          parentVersion = tmpB[versionIndex + 1];
        }
        if (parentName?.length && !parentName.includes("$")) {
          parentComponent = {
            group: options.projectGroup || "",
            name: parentName,
            version: parentVersion || options.projectVersion || "",
            type: "application",
          };
          parentComponent["purl"] = new PackageURL(
            pkgType,
            parentComponent.group,
            parentComponent.name,
            parentComponent.version,
            null,
            path,
          ).toString();
          parentComponent["bom-ref"] = decodeURIComponent(
            parentComponent["purl"],
          );
        }
      }
    } else if (l.startsWith("find_")) {
      let tmpA = [];
      for (const fm of [
        "find_package(",
        "find_library(",
        "find_dependency(",
        "find_file(",
        "FetchContent_MakeAvailable(",
      ]) {
        if (l.startsWith(fm)) {
          tmpA = l.split(fm);
          break;
        }
      }
      if (tmpA && tmpA.length > 1) {
        let tmpB = tmpA[1].split(")")[0].split(" ");
        tmpB = tmpB.filter(
          (v) =>
            ![
              "REQUIRED",
              "COMPONENTS",
              "QUIET",
              "NAMES",
              "PATHS",
              "ENV",
              "NO_MODULE",
              "NO_DEFAULT_PATH",
            ].includes(v) &&
            !v.includes("$") &&
            !v.includes("LIB") &&
            !v.startsWith("CMAKE_") &&
            v.length,
        );
        // find_package(Catch2)
        // find_package(GTest REQUIRED)
        // find_package(Boost 1.79 COMPONENTS date_time)
        // find_library(PTHREADPOOL_LIB pthreadpool REQUIRED)
        if (tmpB) {
          let working_name;
          if (l.startsWith("find_library")) {
            name_list.push(tmpB[1]);
            working_name = tmpB[1];
          } else {
            name_list.push(tmpB[0]);
            working_name = tmpB[0];
          }
          if (l.startsWith("find_package") && tmpB.length > 1) {
            if (
              /^\d+/.test(tmpB[1]) &&
              !tmpB[1].includes("${") &&
              !tmpB[1].startsWith("@")
            ) {
              versionsMap[working_name] = tmpB[1];
            }
          } else {
            for (const n of tmpB) {
              if (n.match(/^\d/)) {
                continue;
              }
              if (n.includes(_sep)) {
                if (
                  n.includes(".so") ||
                  n.includes(".a") ||
                  n.includes(".dll")
                ) {
                  name_list.push(basename(n));
                }
              } else {
                name_list.push(n);
              }
            }
          }
        }
      }
    } else if (l.includes("dependency(")) {
      if (!l.includes("_dependency") && !l.includes(".dependency")) {
        const depMatch = l.match(/dependency\(\s*['"]?([^'",)\s]+)['"]?/);
        const depName = depMatch?.[1]?.trim();
        if (depName) {
          name_list.push(depName);
          const versionMatch = l.match(/version\s*:\s*['"]?([^'",)\s]+)['"]?/);
          const depVersion = versionMatch?.[1]?.trim();
          if (depVersion) {
            if (depVersion.includes(">") || depVersion.includes("<")) {
              // We have a version specifier
              versionSpecifiersMap[depName] = depVersion;
            } else if (
              /^\d+/.test(depVersion) &&
              !depVersion.includes("${") &&
              !depVersion.startsWith("@")
            ) {
              // We have a valid version
              versionsMap[depName] = depVersion;
            }
          }
        }
      }
    }
    for (let n of name_list) {
      const props = [];
      let confidence = 0;
      if (
        n &&
        n.length > 1 &&
        !pkgAddedMap[n] &&
        !n.startsWith(_sep) &&
        !n.startsWith("@")
      ) {
        n = n.replace(/"/g, "");
        // Can this be replaced with a db lookup?
        for (const wrapkey of Object.keys(mesonWrapDB)) {
          const awrap = mesonWrapDB[wrapkey];
          if (
            awrap.PkgProvides.includes(n) ||
            awrap.PkgProvides.includes(n.toLowerCase())
          ) {
            // Use the new name
            n = wrapkey;
            for (const eprop of Object.keys(awrap)) {
              props.push({
                name: eprop,
                value: Array.isArray(awrap[eprop])
                  ? awrap[eprop].join("|")
                  : awrap[eprop],
              });
            }
            // Our confidence has improved from 0 since there is a matching wrap so we know the correct name
            // and url. We lack the version details.
            confidence = 0.5;
            break;
          }
        }
        if (versionSpecifiersMap[n]) {
          props.push({
            name: "cdx:build:versionSpecifiers",
            value: versionSpecifiersMap[n],
          });
        }
        const apkg = {
          name: n,
          version: versionsMap[n] || "",
          type: pkgType,
          purl: new PackageURL(
            pkgType,
            group,
            n,
            versionsMap[n] || "",
            null,
            path,
          ).toString(),
          evidence: {
            identity: {
              field: "purl",
              confidence,
              methods: [
                {
                  technique: "source-code-analysis",
                  confidence: 0.5,
                  value: `Filename ${cmakeListFile}`,
                },
              ],
            },
          },
          properties: props,
        };
        apkg["bom-ref"] = decodeURIComponent(apkg["purl"]);
        pkgList.push(apkg);
        pkgAddedMap[n] = true;
      }
    }
  });
  return {
    parentComponent,
    pkgList,
  };
}

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
export function parseCUsageSlice(sliceData) {
  if (!sliceData) {
    return undefined;
  }
  const usageData = {};
  try {
    const objectSlices = sliceData.objectSlices || [];
    for (const slice of objectSlices) {
      if (
        (!slice.fileName && !slice.code.startsWith("#include")) ||
        slice.fileName.startsWith("<includes") ||
        slice.fileName.startsWith("<global") ||
        slice.fileName.includes("__")
      ) {
        continue;
      }
      const slFileName = slice.fileName;
      const allLines = usageData[slFileName] || new Set();
      if (slice.fullName && slice.fullName.length > 3) {
        if (slice.code?.startsWith("#include")) {
          usageData[slice.fullName] = new Set();
        } else {
          allLines.add(slice.fullName);
        }
      }
      for (const ausage of slice.usages) {
        let calls = ausage?.invokedCalls || [];
        calls = calls.concat(ausage?.argToCalls || []);
        for (const acall of calls) {
          if (!acall.resolvedMethod.includes("->")) {
            allLines.add(acall.resolvedMethod);
          }
        }
      }
      if (Array.from(allLines).length) {
        usageData[slFileName] = allLines;
      }
    }
  } catch (_err) {
    // ignore
  }
  return usageData;
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
export function parseMakeDFile(dfile) {
  const pkgFilesMap = {};
  const dData = readFileSync(dfile, { encoding: "utf-8" });
  const pkgName = basename(dfile).split("-").shift();
  const filesList = new Set();
  dData.split("\n").forEach((l) => {
    l = l.replace("\r", "");
    if (!l.endsWith(".rs:")) {
      return;
    }
    const fileName = `.cargo/${l.split(".cargo/").pop()}`.replace(
      ".rs:",
      ".rs",
    );
    filesList.add(fileName);
  });
  pkgFilesMap[pkgName] = Array.from(filesList);
  return pkgFilesMap;
}

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
