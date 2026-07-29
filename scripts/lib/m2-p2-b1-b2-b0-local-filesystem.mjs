import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSafeExternalLeaf } from "./m2-p2-b1-b2-b0-external-paths.mjs";

function fileSystemError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function normalizeRepositoryRelative(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.isAbsolute(relativePath)
  ) {
    throw fileSystemError(
      "REPOSITORY_PATH_INVALID",
      "A repository-relative path is required",
    );
  }
  const segments = relativePath.replaceAll("\\", "/").split("/");
  if (
    segments.some(
      (segment) =>
        segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw fileSystemError(
      "REPOSITORY_PATH_INVALID",
      "Repository path traversal is prohibited",
    );
  }
  return segments;
}

function assertNoReparsePoint(targetPath) {
  const resolved = path.resolve(targetPath);
  const parsed = path.parse(resolved);
  const segments = path
    .relative(parsed.root, resolved)
    .split(path.sep)
    .filter(Boolean);
  let current = parsed.root;
  for (const segment of segments) {
    current = path.join(current, segment);
    if (!existsSync(current)) break;
    if (lstatSync(current).isSymbolicLink()) {
      throw fileSystemError(
        "EXTERNAL_PATH_REPARSE_POINT_REJECTED",
        "External path traversal through a link is prohibited",
      );
    }
  }
}

function assertExternalAbsolute(targetPath) {
  if (
    typeof targetPath !== "string" ||
    !path.win32.isAbsolute(targetPath) ||
    targetPath.startsWith("\\\\")
  ) {
    throw fileSystemError(
      "EXTERNAL_PATH_INVALID",
      "A non-UNC absolute external path is required",
    );
  }
  return path.win32.normalize(targetPath);
}

function safeExternalRelative(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.win32.isAbsolute(relativePath)
  ) {
    throw fileSystemError(
      "EXTERNAL_ARTIFACT_PATH_INVALID",
      "An artifact-relative path is required",
    );
  }
  const segments = relativePath.replaceAll("/", "\\").split("\\");
  if (
    segments.some(
      (segment) =>
        segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw fileSystemError(
      "EXTERNAL_ARTIFACT_PATH_INVALID",
      "Artifact path traversal is prohibited",
    );
  }
  return segments;
}

export function repositoryRootForScript(moduleUrl) {
  return path.resolve(path.dirname(fileURLToPath(moduleUrl)), "..");
}

export function createRepositoryFileSystem(moduleUrl) {
  const root = repositoryRootForScript(moduleUrl);
  const absolute = (relativePath) => {
    const target = path.join(
      root,
      ...normalizeRepositoryRelative(relativePath),
    );
    if (
      path.relative(root, target).startsWith("..") ||
      path.isAbsolute(path.relative(root, target))
    ) {
      throw fileSystemError(
        "REPOSITORY_PATH_INVALID",
        "Repository path escaped its root",
      );
    }
    return target;
  };
  return Object.freeze({
    root,
    absolute,
    exists(relativePath) {
      return existsSync(absolute(relativePath));
    },
    readText(relativePath) {
      return readFileSync(absolute(relativePath), "utf8");
    },
    readJson(relativePath) {
      return JSON.parse(readFileSync(absolute(relativePath), "utf8"));
    },
    writeText(relativePath, content) {
      const target = absolute(relativePath);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, content, "utf8");
    },
  });
}

export function defaultLocalAppDataRoot() {
  return path.join(os.homedir(), "AppData", "Local");
}

export function isMainModule(moduleUrl, argvPath) {
  if (typeof argvPath !== "string" || argvPath.length === 0) {
    return false;
  }
  return path.resolve(argvPath) === path.resolve(fileURLToPath(moduleUrl));
}

export function createExternalApprovalLoader({ expectedPath }) {
  const fixedPath = assertExternalAbsolute(expectedPath);
  return Object.freeze({
    load(candidatePath) {
      const candidate = assertExternalAbsolute(candidatePath);
      if (candidate.toLowerCase() !== fixedPath.toLowerCase()) {
        throw fileSystemError(
          "APPROVAL_PATH_OUTSIDE_FIXED_ROOT",
          "Approval loader received a non-fixed path",
        );
      }
      if (!existsSync(candidate)) return null;
      assertNoReparsePoint(candidate);
      try {
        return JSON.parse(readFileSync(candidate, "utf8"));
      } catch {
        throw fileSystemError(
          "APPROVAL_FILE_INVALID",
          "The external approval file is not valid JSON",
        );
      }
    },
  });
}

export function createExternalMarkerStore({ rootDirectory }) {
  const root = assertExternalAbsolute(rootDirectory);
  const markerPath = (approvalId) =>
    path.win32.join(
      root,
      `${assertSafeExternalLeaf(approvalId, "approval id")}.consumed.json`,
    );
  return Object.freeze({
    exists({ approvalId }) {
      const target = markerPath(approvalId);
      assertNoReparsePoint(target);
      return existsSync(target);
    },
    consume(marker) {
      const target = markerPath(marker.approval_id);
      assertNoReparsePoint(root);
      mkdirSync(root, { recursive: true });
      assertNoReparsePoint(root);
      let descriptor;
      try {
        descriptor = openSync(target, "wx");
        writeFileSync(
          descriptor,
          `${JSON.stringify(marker, null, 2)}\n`,
          "utf8",
        );
        fsyncSync(descriptor);
      } catch (error) {
        if (error?.code === "EEXIST") {
          throw fileSystemError(
            "AUTHORIZATION_ALREADY_CONSUMED",
            "The one-time authorization marker already exists",
          );
        }
        throw fileSystemError(
          "AUTHORIZATION_MARKER_WRITE_FAILED",
          "The one-time authorization marker could not be written",
        );
      } finally {
        if (descriptor !== undefined) closeSync(descriptor);
      }
      return {
        approval_id: marker.approval_id,
        status: marker.status,
        marker_path_type: "fixed_external_root",
      };
    },
  });
}

export function createInMemoryMarkerStore({
  consumedApprovalIds = [],
} = {}) {
  const markers = new Map(
    consumedApprovalIds.map((approvalId) => [
      approvalId,
      { approval_id: approvalId },
    ]),
  );
  return Object.freeze({
    exists({ approvalId }) {
      return markers.has(approvalId);
    },
    consume(marker) {
      if (markers.has(marker.approval_id)) {
        throw fileSystemError(
          "AUTHORIZATION_ALREADY_CONSUMED",
          "The one-time authorization marker already exists",
        );
      }
      markers.set(marker.approval_id, structuredClone(marker));
      return {
        approval_id: marker.approval_id,
        status: marker.status,
        marker_path_type: "in_memory_fixture",
      };
    },
    snapshot() {
      return [...markers.values()].map((marker) =>
        structuredClone(marker),
      );
    },
  });
}

export function createExternalArtifactFileSystem({
  baseRoot,
  runId,
}) {
  const root = path.win32.join(
    assertExternalAbsolute(baseRoot),
    assertSafeExternalLeaf(runId, "run id"),
  );
  return Object.freeze({
    write(relativePath, content) {
      const target = path.win32.join(
        root,
        ...safeExternalRelative(relativePath),
      );
      const relative = path.win32.relative(root, target);
      if (
        relative.startsWith("..") ||
        path.win32.isAbsolute(relative)
      ) {
        throw fileSystemError(
          "EXTERNAL_ARTIFACT_PATH_INVALID",
          "Artifact path escaped the fixed run root",
        );
      }
      assertNoReparsePoint(root);
      mkdirSync(path.win32.dirname(target), { recursive: true });
      assertNoReparsePoint(path.win32.dirname(target));
      try {
        writeFileSync(target, content, {
          encoding: "utf8",
          flag: "wx",
        });
      } catch (error) {
        if (error?.code === "EEXIST") {
          throw fileSystemError(
            "ARTIFACT_ALREADY_EXISTS",
            "Paid-run artifacts are immutable",
          );
        }
        throw fileSystemError(
          "ARTIFACT_WRITE_FAILED",
          "A paid-run artifact could not be written",
        );
      }
    },
  });
}
