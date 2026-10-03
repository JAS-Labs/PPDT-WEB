import { describe, expect, it } from 'vitest'
import { benchmarkComparison, benchmarkSampleNote, benchmarkScore } from '../utils/benchmarkPresentation'

describe('honest benchmark presentation', () => {
  it('does not label empty comparisons as the bottom of a ranking', () => {
    expect(benchmarkComparison({ percentile: 0, has_benchmark: false, sample_size: 0 }).hasData).toBe(false)
    expect(benchmarkComparison({ percentile: 0, total_candidates: 0 }).hasData).toBe(false)
  })
  it('supports genuine zero and 100 percentages without Top 0% claims', () => {
    expect(benchmarkComparison({ percentile: 0, sample_size: 3 }).hasData).toBe(true)
    expect(benchmarkComparison({ percentile: 100, sample_size: 3 }).percentage).toBe(100)
  })
  it('does not mistake distinct candidates for the number of compared attempts', () => {
    const result = { percentile: 75, total_candidates: 2, sample_size: 10, sample_attempts: 12, total_attempts: 100 }
    expect(benchmarkComparison(result).sampleNote).toContain('10 valid scores')
    expect(benchmarkComparison(result).sampleNote).toContain('newest 12 of 100 saved attempts')
  })
  it('discloses unavailable sample metadata from older backend responses', () => {
    expect(benchmarkSampleNote({ percentile: 85, total_candidates: 120 })).toContain('unavailable')
  })
  it('does not turn missing averages into zero scores', () => {
    expect(benchmarkScore(null)).toBe('—')
    expect(benchmarkScore(undefined)).toBe('—')
    expect(benchmarkScore(0)).toBe('0.0')
    expect(benchmarkComparison({ percentile: NaN }).hasData).toBe(false)
  })
})
