function authorizationError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

export function createInMemoryAuthorizationFileSystem() {
  const files = new Map();
  return Object.freeze({
    createExclusive(relativeMarkerPath, content) {
      if (files.has(relativeMarkerPath)) {
        const error = new Error("marker exists");
        error.code = "EEXIST";
        throw error;
      }
      files.set(relativeMarkerPath, content);
    },
    entries() {
      return [...files.entries()].map(([path, content]) => ({
        path,
        content,
      }));
    },
  });
}

export function createOneTimeAuthorization({ fileSystem }) {
  if (!fileSystem || typeof fileSystem.createExclusive !== "function") {
    throw authorizationError(
      "AUTHORIZATION_FILESYSTEM_INVALID",
      "An injected exclusive-create filesystem is required",
    );
  }
  return Object.freeze({
    consume({
      approvalId,
      approvalHash,
      runnerCommitSha,
      confirmationHash,
    }) {
      if (
        ![approvalId, approvalHash, runnerCommitSha, confirmationHash].every(
          (value) => typeof value === "string" && value.length > 0,
        )
      ) {
        throw authorizationError(
          "AUTHORIZATION_MARKER_INPUT_INVALID",
          "One-time authorization marker inputs are incomplete",
        );
      }
      const markerPath = `${approvalId}.consumed.json`;
      const marker = {
        approval_id: approvalId,
        approval_hash: approvalHash,
        runner_commit_sha: runnerCommitSha,
        confirmation_hash: confirmationHash,
        status: "consumed_before_first_https_request",
      };
      try {
        fileSystem.createExclusive(
          markerPath,
          `${JSON.stringify(marker, null, 2)}\n`,
        );
      } catch (error) {
        if (error?.code === "EEXIST") {
          throw authorizationError(
            "AUTHORIZATION_ALREADY_CONSUMED",
            "The one-time approval was already consumed",
          );
        }
        throw authorizationError(
          "AUTHORIZATION_MARKER_WRITE_FAILED",
          "The one-time authorization marker could not be created",
        );
      }
      return {
        approval_id: approvalId,
        marker_path_type: "outside_repository_future_location",
        status: "consumed",
      };
    },
  });
}
