import { spawnSync } from "node:child_process";

const exactGitCommands = Object.freeze([
  ["branch", "--show-current"],
  ["rev-parse", "HEAD"],
  ["rev-parse", "origin/main"],
  ["status", "--porcelain=v1"],
]);
let actualChildProcessCalls = 0;

function guardError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function validateGitReceipt(receipt, expectedRunnerSha) {
  if (receipt.branch !== "main") {
    throw guardError(
      "GIT_BRANCH_MISMATCH",
      "Paid execution requires branch main",
    );
  }
  if (
    receipt.head !== expectedRunnerSha ||
    receipt.origin_main !== expectedRunnerSha
  ) {
    throw guardError(
      "GIT_HEAD_MISMATCH",
      "HEAD and origin/main must equal the approved runner SHA",
    );
  }
  if (receipt.porcelain_status !== "") {
    throw guardError(
      "GIT_WORKTREE_DIRTY",
      "Paid execution requires an entirely clean worktree",
    );
  }
  return {
    contract_verified: true,
    branch: receipt.branch,
    head: receipt.head,
    origin_main: receipt.origin_main,
    working_tree_clean: true,
  };
}

export function createFixtureGitExecutionGuard(receiptFixture) {
  return Object.freeze({
    mode: "fixture_command_results",
    inspect() {
      return structuredClone(receiptFixture);
    },
    verify({ expectedRunnerSha, receipt = receiptFixture }) {
      return validateGitReceipt(receipt, expectedRunnerSha);
    },
    metrics() {
      return { actual_child_process_calls: 0 };
    },
  });
}

export function createGitExecutionGuard({ repositoryRoot }) {
  const inspect = () => {
    const outputs = exactGitCommands.map((args) => {
      actualChildProcessCalls += 1;
      const result = spawnSync("git", args, {
        cwd: repositoryRoot,
        encoding: "utf8",
        shell: false,
      });
      if (result.status !== 0) {
        throw guardError(
          "GIT_EXECUTION_GUARD_FAILED",
          "An exact Git guard command failed",
        );
      }
      return result.stdout.trim();
    });
    return {
      branch: outputs[0],
      head: outputs[1],
      origin_main: outputs[2],
      porcelain_status: outputs[3],
    };
  };
  return Object.freeze({
    mode: "future_exact_git_commands",
    inspect,
    verify({ expectedRunnerSha, receipt = inspect() }) {
      return validateGitReceipt(receipt, expectedRunnerSha);
    },
    metrics() {
      return {
        actual_child_process_calls: actualChildProcessCalls,
      };
    },
  });
}

export function gitExecutionGuardContract() {
  return {
    shell: false,
    user_controlled_arguments: false,
    exact_commands: exactGitCommands.map((args) => [
      "git",
      ...args,
    ]),
  };
}

export function actualExecutionGuardMetrics() {
  return { actual_child_process_calls: actualChildProcessCalls };
}
