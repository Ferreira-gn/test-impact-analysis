export type TestSelectionCounts = {
  testsExecuted: number;
  testsAvoided: number;
};

export function calculateTestSelectionCounts(
  totalTestFiles: number,
  selectedTestFiles: readonly string[],
  fallback: boolean,
): TestSelectionCounts {
  const testsExecuted = fallback
    ? totalTestFiles
    : Math.min(selectedTestFiles.length, totalTestFiles);

  return {
    testsExecuted,
    testsAvoided: totalTestFiles - testsExecuted,
  };
}
