export const EXTERNAL_PATH_POLICY = Object.freeze({
  conceptual_local_app_data_root: "%LOCALAPPDATA%",
  approval_directory: "moon-reply\\calibration-approvals",
  approval_file_name:
    "m2-p2-b1-b2-b1-one-time-approval.json",
  authorization_directory:
    "moon-reply\\calibration-authorizations",
  run_directory: "moon-reply\\calibration-runs",
});

function pathError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function normalizeWindowsAbsolutePath(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw pathError(
      "EXTERNAL_PATH_INVALID",
      "An absolute Windows path is required",
    );
  }
  const replaced = value.replaceAll("/", "\\");
  if (
    replaced.startsWith("\\\\") ||
    replaced.startsWith("\\?\\") ||
    !/^[A-Za-z]:\\/u.test(replaced)
  ) {
    throw pathError(
      "EXTERNAL_PATH_INVALID",
      "UNC, device, and relative paths are prohibited",
    );
  }
  const segments = replaced.slice(3).split("\\");
  if (
    segments.some(
      (segment) =>
        segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw pathError(
      "EXTERNAL_PATH_TRAVERSAL_REJECTED",
      "External paths may not contain empty or traversal segments",
    );
  }
  return `${replaced[0].toUpperCase()}:\\${segments.join("\\")}`;
}

function joinWindows(root, ...segments) {
  return normalizeWindowsAbsolutePath(
    `${normalizeWindowsAbsolutePath(root)}\\${segments.join("\\")}`,
  );
}

export function buildExternalPaths(localAppDataRoot) {
  const root = normalizeWindowsAbsolutePath(localAppDataRoot);
  const approvalRoot = joinWindows(
    root,
    "moon-reply",
    "calibration-approvals",
  );
  const authorizationRoot = joinWindows(
    root,
    "moon-reply",
    "calibration-authorizations",
  );
  const runRoot = joinWindows(
    root,
    "moon-reply",
    "calibration-runs",
  );
  return Object.freeze({
    local_app_data_root: root,
    approval_root: approvalRoot,
    approval_file: joinWindows(
      approvalRoot,
      EXTERNAL_PATH_POLICY.approval_file_name,
    ),
    authorization_root: authorizationRoot,
    run_root: runRoot,
  });
}

export function assertFixedApprovalPath({
  candidate,
  expectedApprovalPath,
}) {
  let normalizedCandidate;
  let normalizedExpected;
  try {
    normalizedCandidate = normalizeWindowsAbsolutePath(candidate);
    normalizedExpected =
      normalizeWindowsAbsolutePath(expectedApprovalPath);
  } catch {
    throw pathError(
      "APPROVAL_PATH_OUTSIDE_FIXED_ROOT",
      "The approval path is not the fixed external approval file",
    );
  }
  if (
    normalizedCandidate.toLowerCase() !==
    normalizedExpected.toLowerCase()
  ) {
    throw pathError(
      "APPROVAL_PATH_OUTSIDE_FIXED_ROOT",
      "The approval path is not the fixed external approval file",
    );
  }
  return normalizedExpected;
}

export function assertSafeExternalLeaf(value, label = "external id") {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 96 ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/u.test(value)
  ) {
    throw pathError(
      "EXTERNAL_PATH_LEAF_INVALID",
      `${label} is not a safe fixed-root leaf`,
    );
  }
  return value;
}

export function conceptualExternalPaths() {
  return {
    approval:
      "%LOCALAPPDATA%\\moon-reply\\calibration-approvals\\m2-p2-b1-b2-b1-one-time-approval.json",
    one_time_marker:
      "%LOCALAPPDATA%\\moon-reply\\calibration-authorizations\\<approval_id>.consumed.json",
    run_artifacts:
      "%LOCALAPPDATA%\\moon-reply\\calibration-runs\\<approval_id>\\",
  };
}
