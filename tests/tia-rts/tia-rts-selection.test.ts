import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { calculateTestSelectionCounts } from '../../scripts/tia-rts-report.js';

const execFileAsync = promisify(execFile);
const childEnvironment = {
  PATH: process.env.PATH ?? '',
  CI: 'true',
};

describe('TIA/RTS selection', () => {
  it('selects only tests related to a changed pricing module', async () => {
    const reportDirectory = await mkdtemp(join(tmpdir(), 'tia-rts-test-'));
    const reportPath = join(reportDirectory, 'related.json');
    let output = '';
    try {
      await execFileAsync(
        './node_modules/.bin/vitest',
        [
          'related',
          '--run',
          'src/modules/pricing/calculate-discount.ts',
          '--reporter=json',
          `--outputFile=${reportPath}`,
        ],
        { cwd: process.cwd(), env: childEnvironment },
      );
      output = await readFile(reportPath, 'utf8');
    } finally {
      await rm(reportDirectory, { recursive: true, force: true });
    }
    const selectedTests = [
      'tests/pricing/pricing.test.ts',
      'tests/checkout/checkout.test.ts',
      'tests/integration/api.test.ts',
      'tests/cart/cart.test.ts',
      'tests/products/products.test.ts',
    ].filter((file) => output.includes(file));

    expect(selectedTests).toHaveLength(3);
    expect(output).toContain('tests/pricing/pricing.test.ts');
    expect(output).toContain('tests/checkout/checkout.test.ts');
    expect(output).toContain('tests/integration/api.test.ts');
    expect(output).not.toContain('tests/cart/cart.test.ts');
    expect(output).not.toContain('tests/products/products.test.ts');
  }, 30_000);

  it('reports avoided tests when the related set is smaller than the suite', () => {
    expect(
      calculateTestSelectionCounts(
        5,
        [
          'tests/pricing/pricing.test.ts',
          'tests/checkout/checkout.test.ts',
          'tests/integration/api.test.ts',
        ],
        false,
      ),
    ).toEqual({ testsExecuted: 3, testsAvoided: 2 });
  });

  it('uses the full suite when no correlation can be proven', () => {
    expect(calculateTestSelectionCounts(5, [], true)).toEqual({
      testsExecuted: 5,
      testsAvoided: 0,
    });
  });
});
