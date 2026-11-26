import { promises as fs } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repeats = Number(process.env.BENCHMARK_REPEATS ?? 5);
const root = process.cwd();
const packageManager = {
  command: process.env.npm_execpath ?? 'npm',
  prefix: [] as string[],
};

type RunResult = {
  strategy: 'full-suite' | 'tia-rts';
  durationMs: number;
  exitCode: number;
};

async function run(strategy: RunResult['strategy']): Promise<RunResult> {
  const command = strategy === 'full-suite' ? ['test:ci'] : ['test:affected'];
  const started = performance.now();
  try {
    await execFileAsync(
      packageManager.command,
      [...packageManager.prefix, ...command],
      {
        cwd: root,
        env: process.env,
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    return {
      strategy,
      durationMs: Number((performance.now() - started).toFixed(2)),
      exitCode: 0,
    };
  } catch (error) {
    const failure = error as { code?: number };
    return {
      strategy,
      durationMs: Number((performance.now() - started).toFixed(2)),
      exitCode: failure.code ?? 1,
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
const report = {
  repeats,
  runs,
  fullMedianMs,
  selectedMedianMs,
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
  `# Benchmark\n\n| Metric | Full suite | TIA/RTS |\n|---|---:|---:|\n| Median test duration (ms) | ${fullMedianMs} | ${selectedMedianMs} |\n| Time reduction | reference | ${report.timeReductionPercent ?? 'N/A'}% |\n\nRepetitions: ${repeats}. Raw runs are available in benchmark.json.\n`,
);
console.log(JSON.stringify(report, null, 2));
if (runs.some((run) => run.exitCode !== 0)) process.exitCode = 1;
