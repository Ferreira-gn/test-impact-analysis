import { execFile, execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const reportDir = `${root}/reports`;

type ChangedFile = { status: string; path: string };
type SelectionReport = {
  changedFiles: ChangedFile[];
  productionFiles: string[];
  selectedTestFiles: string[];
  totalTestFiles: number;
  fallback: boolean;
  reason: string;
  analysisDurationMs: number;
  testDurationMs: number;
  exitCode: number;
};

async function run(
  command: string,
  args: readonly string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const result = await execFileAsync(command, [...args], {
      cwd: root,
      maxBuffer: 4 * 1024 * 1024,
      env: process.env,
    });
    return { stdout: result.stdout, stderr: result.stderr, code: 0 };
  } catch (error) {
    const failure = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
      code: failure.code ?? 1,
    };
  }
}

async function listTestFiles(directory = `${root}/tests`): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await listTestFiles(fullPath)));
    else if (/\.test\.ts$/.test(entry.name))
      files.push(fullPath.slice(root.length + 1));
  }
  return files.sort();
}

function resolveBase(): string | undefined {
  if (process.env.TIA_BASE) return process.env.TIA_BASE;
  const result = requireBase('git', [
    'rev-parse',
    '--verify',
    'baseline/full-suite',
  ]);
  return result;
}

function requireBase(
  command: string,
  args: readonly string[],
): string | undefined {
  try {
    const result = execFileSync(command, [...args], {
      cwd: root,
      encoding: 'utf8',
    });
    return result.trim();
  } catch {
    return undefined;
  }
}

function classify(
  path: string,
): 'production' | 'test' | 'config' | 'ignored' | 'unsupported' {
  if (/^src\/.+\.ts$/.test(path)) return 'production';
  if (/^tests\/.+\.test\.ts$/.test(path)) return 'test';
  if (
    /^(package\.json|package-lock\.json|tsconfig[^/]*\.json|vitest\.config\.ts|eslint\.config\.js|\.node-version)$/.test(
      path,
    )
  )
    return 'config';
  if (/^(scripts\/|\.github\/|\.agents\/)/.test(path)) return 'config';
  if (/^(README\.md|docs\/|experiments\/|\.gitignore|\.prettierrc)/.test(path))
    return 'ignored';
  return 'unsupported';
}

function extractTestFiles(
  output: string,
  knownFiles: readonly string[],
): string[] {
  return knownFiles.filter((file) => output.includes(file));
}

async function main(): Promise<void> {
  const analysisStarted = performance.now();
  const base = resolveBase();
  let changedFiles: ChangedFile[] = [];
  let productionFiles: string[] = [];
  let fallback = false;
  let reason = '';

  if (!base) {
    fallback = true;
    reason =
      'base revision could not be resolved; set TIA_BASE or create baseline/full-suite';
  } else {
    const diff = await run('git', [
      'diff',
      '--name-status',
      '-M',
      `${base}...HEAD`,
    ]);
    if (diff.code !== 0) {
      fallback = true;
      reason = 'Git diff failed';
    } else {
      changedFiles = diff.stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [status, ...parts] = line.split('\t');
          return { status, path: parts.at(-1) ?? '' };
        });
      const classifications = changedFiles.map((file) => classify(file.path));
      productionFiles = changedFiles
        .filter((file, index) => classifications[index] === 'production')
        .map((file) => file.path);
      if (
        changedFiles.some((file, index) =>
          ['test', 'config', 'unsupported'].includes(classifications[index]),
        )
      ) {
        fallback = true;
        reason =
          'tests, configuration, infrastructure, or unsupported paths changed';
      } else if (
        changedFiles.some(
          (file) => file.status.startsWith('D') || file.status.startsWith('R'),
        )
      ) {
        fallback = true;
        reason = 'deleted or renamed files require conservative fallback';
      } else if (productionFiles.length === 0) {
        fallback = true;
        reason = 'no supported production files changed';
      }
    }
  }

  const analysisDurationMs = performance.now() - analysisStarted;
  const testStarted = performance.now();
  const testFiles = await listTestFiles();
  let selectedTestFiles: string[] = [];
  let exitCode = 0;
  let output = '';
  if (fallback) {
    console.log(`[TIA/RTS] fallback: ${reason}`);
    const result = await run('npm', ['run', 'test:ci']);
    output = `${result.stdout}\n${result.stderr}`;
    exitCode = result.code;
  } else {
    console.log(
      `[TIA/RTS] related source files: ${productionFiles.join(', ')}`,
    );
    const result = await run('npm', [
      'exec',
      '--',
      'vitest',
      'related',
      '--run',
      ...productionFiles,
    ]);
    output = `${result.stdout}\n${result.stderr}`;
    exitCode = result.code;
    selectedTestFiles = extractTestFiles(output, testFiles);
    if (exitCode === 0 && selectedTestFiles.length === 0) {
      fallback = true;
      reason = 'related selection returned no identifiable tests';
      console.log(`[TIA/RTS] fallback: ${reason}`);
      const fallbackResult = await run('npm', ['run', 'test:ci']);
      output = `${fallbackResult.stdout}\n${fallbackResult.stderr}`;
      exitCode = fallbackResult.code;
    }
  }
  process.stdout.write(output);

  const report: SelectionReport = {
    changedFiles,
    productionFiles,
    selectedTestFiles: fallback ? testFiles : selectedTestFiles,
    totalTestFiles: testFiles.length,
    fallback,
    reason: fallback ? reason : 'static import graph via Vitest related',
    analysisDurationMs: Number(analysisDurationMs.toFixed(2)),
    testDurationMs: Number((performance.now() - testStarted).toFixed(2)),
    exitCode,
  };
  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(
    `${reportDir}/selection-report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await fs.writeFile(
    `${reportDir}/selection-report.md`,
    `# TIA/RTS selection report\n\n- Fallback: **${report.fallback}**\n- Reason: ${report.reason}\n- Changed files: ${report.changedFiles.map((file) => file.path).join(', ') || 'none'}\n- Production files: ${report.productionFiles.join(', ') || 'none'}\n- Tests executed: ${report.selectedTestFiles.length}/${report.totalTestFiles} test files\n- Analysis: ${report.analysisDurationMs} ms\n- Tests: ${report.testDurationMs} ms\n- Exit code: ${report.exitCode}\n`,
  );
  process.exitCode = exitCode;
}

await main();
