import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repeats = Number(process.env.BENCHMARK_REPEATS ?? 5);
const root = process.cwd();

type RunResult = {
  strategy: 'full-suite' | 'tia-rts';
  durationMs: number;
  exitCode: number;
  testsExecuted: number | null;
  testsAvoided: number | null;
};

async function listTestFiles(directory = `${root}/tests`): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await listTestFiles(fullPath)));
    else if (/\.test\.ts$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function isSelectionReport(value: unknown): value is {
  testsExecuted: number;
  testsAvoided: number;
} {
  if (typeof value !== 'object' || value === null) return false;
  const testsExecuted = Reflect.get(value, 'testsExecuted');
  const testsAvoided = Reflect.get(value, 'testsAvoided');
  return typeof testsExecuted === 'number' && typeof testsAvoided === 'number';
}

async function readSelectionCounts(): Promise<{
  testsExecuted: number | null;
  testsAvoided: number | null;
}> {
  try {
    const content = await fs.readFile(
      `${root}/reports/selection-report.json`,
      'utf8',
    );
    const report: unknown = JSON.parse(content);
    if (isSelectionReport(report)) return report;
  } catch {
    // A failed selector must remain visible as a failed benchmark run.
  }
  return { testsExecuted: null, testsAvoided: null };
}

async function run(strategy: RunResult['strategy']): Promise<RunResult> {
  const command = strategy === 'full-suite' ? ['test:ci'] : ['test:affected'];
  const started = performance.now();
  const totalTestFiles = (await listTestFiles()).length;
  try {
    await execFileAsync('npm', ['run', ...command], {
      cwd: root,
      env: process.env,
      maxBuffer: 8 * 1024 * 1024,
    });
    return {
      strategy,
      durationMs: Number((performance.now() - started).toFixed(2)),
      exitCode: 0,
      ...(strategy === 'full-suite'
        ? { testsExecuted: totalTestFiles, testsAvoided: 0 }
        : await readSelectionCounts()),
    };
  } catch (error) {
    const failure = error as { code?: number };
    return {
      strategy,
      durationMs: Number((performance.now() - started).toFixed(2)),
      exitCode: failure.code ?? 1,
      ...(strategy === 'full-suite'
        ? { testsExecuted: totalTestFiles, testsAvoided: 0 }
        : await readSelectionCounts()),
    };
  }
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

const runs: RunResult[] = [];
for (let index = 0; index < repeats; index += 1) {
  const order: RunResult['strategy'][] =
    index % 2 === 0 ? ['full-suite', 'tia-rts'] : ['tia-rts', 'full-suite'];
  for (const strategy of order) runs.push(await run(strategy));
}

const fullTimes = runs
  .filter((run) => run.strategy === 'full-suite' && run.exitCode === 0)
  .map((run) => run.durationMs);
const selectedTimes = runs
  .filter((run) => run.strategy === 'tia-rts' && run.exitCode === 0)
  .map((run) => run.durationMs);
const fullMedianMs = median(fullTimes);
const selectedMedianMs = median(selectedTimes);
const successfulTiaRuns = runs.filter(
  (run) => run.strategy === 'tia-rts' && run.exitCode === 0,
);
const tiaExecutedCounts = successfulTiaRuns
  .map((run) => run.testsExecuted)
  .filter((count): count is number => count !== null);
const tiaAvoidedCounts = successfulTiaRuns
  .map((run) => run.testsAvoided)
  .filter((count): count is number => count !== null);
const tiaExecutedMedian =
  tiaExecutedCounts.length > 0 ? median(tiaExecutedCounts) : null;
const tiaAvoidedMedian =
  tiaAvoidedCounts.length > 0 ? median(tiaAvoidedCounts) : null;
const totalTestFiles = (await listTestFiles()).length;
const report = {
  repeats,
  runs,
  fullMedianMs,
  selectedMedianMs,
  comparison: {
    totalTestFiles,
    fullSuite: {
      testsExecuted: totalTestFiles,
      testsAvoided: 0,
      medianDurationMs: fullMedianMs,
    },
    tiaRts: {
      testsExecuted: tiaExecutedMedian,
      testsAvoided: tiaAvoidedMedian,
      medianDurationMs: selectedMedianMs,
    },
  },
  testsAvoidedPercent:
    tiaAvoidedMedian !== null && totalTestFiles > 0
      ? Number(((tiaAvoidedMedian / totalTestFiles) * 100).toFixed(2))
      : null,
  timeReductionPercent:
    fullMedianMs > 0
      ? Number(
          (((fullMedianMs - selectedMedianMs) / fullMedianMs) * 100).toFixed(2),
        )
      : null,
  note: 'Durations include only the invoked test command; installation, build, and typecheck are not included.',
};
await fs.mkdir(`${root}/reports`, { recursive: true });
await fs.writeFile(
  `${root}/reports/benchmark.json`,
  `${JSON.stringify(report, null, 2)}\n`,
);
await fs.writeFile(
  `${root}/reports/benchmark.md`,
  `# Benchmark\n\n| Metric | Full suite | TIA/RTS |\n|---|---:|---:|\n| Median test duration (ms) | ${fullMedianMs} | ${selectedMedianMs} |\n| Tests executed (median) | ${totalTestFiles} | ${tiaExecutedMedian ?? 'N/A'} |\n| Tests avoided (median) | 0 | ${tiaAvoidedMedian ?? 'N/A'} |\n| Time reduction | reference | ${report.timeReductionPercent ?? 'N/A'}% |\n| Tests avoided | reference | ${report.testsAvoidedPercent ?? 'N/A'}% |\n\nRepetitions: ${repeats}. Raw runs and selection counts are available in benchmark.json.\n`,
);
console.log(JSON.stringify(report, null, 2));
if (runs.some((run) => run.exitCode !== 0)) process.exitCode = 1;
