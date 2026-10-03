export function benchmarkSampleNote(result) {
  if (!Number.isInteger(result?.sample_size) || !Number.isInteger(result?.sample_attempts)) {
    return 'Sample details are unavailable on this server.'
  }
  return `${result.sample_size} valid scores from the newest ${result.sample_attempts} of ${result.total_attempts} saved attempts. Repeat attempts count separately.`
}

export function benchmarkComparison(result) {
  const value = result?.percentile
  const percentage = typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : null
  const empty = result?.has_benchmark === false || result?.sample_size === 0 ||
    (result?.sample_size == null && result?.total_candidates === 0)
  return { hasData: !empty && percentage !== null, percentage, sampleNote: benchmarkSampleNote(result) }
}

export function benchmarkScore(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '—'
}
