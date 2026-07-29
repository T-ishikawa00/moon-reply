import { createGitExecutionGuard } from "./lib/m2-p2-b1-b2-a-execution-guard.mjs";
import { createEnvironmentSecretProvider } from "./lib/m2-p2-b1-b2-a-env-secret-provider.mjs";
import { createOpenAiHttpsExecutor } from "./lib/m2-p2-b1-b2-a-https-executor.mjs";
import {
  buildExternalPaths,
} from "./lib/m2-p2-b1-b2-b0-external-paths.mjs";
import {
  createExternalApprovalLoader,
  createExternalArtifactFileSystem,
  createExternalMarkerStore,
  createRepositoryFileSystem,
  defaultLocalAppDataRoot,
  isMainModule,
} from "./lib/m2-p2-b1-b2-b0-local-filesystem.mjs";
import {
  createPaidArtifactWriter,
  createResponseCapturingExecutor,
  runPaidCalibrationOnce,
} from "./lib/m2-p2-b1-b2-b0-paid-cli.mjs";

export async function runPaidEntryPoint(argv) {
  const repository = createRepositoryFileSystem(import.meta.url);
  const externalPaths = buildExternalPaths(
    defaultLocalAppDataRoot(),
  );
  const approvalLoader = createExternalApprovalLoader({
    expectedPath: externalPaths.approval_file,
  });
  const markerStore = createExternalMarkerStore({
    rootDirectory: externalPaths.authorization_root,
  });
  const responseCapture = [];
  const httpsExecutor = createResponseCapturingExecutor({
    executor: createOpenAiHttpsExecutor(),
    responseCapture,
  });
  const artifactWriter = createPaidArtifactWriter({
    responseCapture,
    fileSystemFactory: ({ approvalId }) =>
      createExternalArtifactFileSystem({
        baseRoot: externalPaths.run_root,
        runId: approvalId,
      }),
  });
  return runPaidCalibrationOnce({
    argv,
    expectedApprovalPath: externalPaths.approval_file,
    approvalLoader,
    executionTime: new Date().toISOString(),
    gitExecutionGuard: createGitExecutionGuard({
      repositoryRoot: repository.root,
    }),
    markerStore,
    secretProvider: createEnvironmentSecretProvider(),
    httpsExecutor,
    artifactWriter,
  });
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const result = await runPaidEntryPoint(process.argv.slice(2));
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "completed_once") process.exitCode = 1;
}
