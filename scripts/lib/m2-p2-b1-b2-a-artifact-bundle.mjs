import {
  assertArtifactSecretSafe,
  serializeArtifactFailClosed,
} from "./m2-p2-b1-b2-a-runtime-redaction.mjs";

const futureArtifactFiles = Object.freeze([
  "run-manifest.json",
  "stage-records.json",
  "gate-results.json",
  "cost-summary.json",
  "calibration-summary.md",
  "outputs/PB-01.json",
  "outputs/PB-02.json",
  "outputs/PB-03.json",
  "outputs/PB-04.json",
  "outputs/PB-05.json",
  "outputs/PB-06.json",
]);

function artifactError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function rejectLocalIdentity(value) {
  const text = JSON.stringify(value);
  if (
    /[A-Za-z]:\\/u.test(text) ||
    /\/(?:Users|home)\//u.test(text) ||
    /"(?:username|hostname|pid)"\s*:/iu.test(text)
  ) {
    throw artifactError(
      "ARTIFACT_LOCAL_IDENTITY_PROHIBITED",
      "Artifact contained local machine identity",
    );
  }
}

export function createInMemoryArtifactFileSystem() {
  const files = new Map();
  return Object.freeze({
    write(relativePath, content) {
      files.set(relativePath, content);
    },
    snapshot() {
      return Object.fromEntries(
        [...files.entries()].sort(([left], [right]) =>
          left.localeCompare(right, "en"),
        ),
      );
    },
  });
}

export function writeSanitizedArtifactBundle({
  fileSystem,
  artifactValues,
}) {
  if (!fileSystem || typeof fileSystem.write !== "function") {
    throw artifactError(
      "ARTIFACT_FILESYSTEM_INVALID",
      "An injected artifact filesystem is required",
    );
  }
  const keys = Object.keys(artifactValues).sort();
  const expected = [...futureArtifactFiles].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw artifactError(
      "ARTIFACT_MANIFEST_MISMATCH",
      "Future artifact file set differs",
    );
  }
  for (const file of futureArtifactFiles) {
    const value = artifactValues[file];
    rejectLocalIdentity(value);
    assertArtifactSecretSafe(value);
  }
  for (const file of futureArtifactFiles) {
    const value = artifactValues[file];
    fileSystem.write(
      file,
      file.endsWith(".md")
        ? `${String(value).trimEnd()}\n`
        : serializeArtifactFailClosed(value),
    );
  }
  return {
    storage_type: "injected_filesystem",
    conceptual_future_location:
      "%LOCALAPPDATA%/moon-reply/calibration-runs/<run_id>/",
    files: futureArtifactFiles,
  };
}

export function artifactBundleContract() {
  return {
    future_files: futureArtifactFiles,
    repository_directory_created: false,
    local_application_data_directory_created: false,
  };
}
