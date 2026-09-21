import { describe, it, expect } from 'vitest'
import {
  synthesizePsychologicalReadiness,
  getReadinessTier,
  normalizeOlqCode,
  extractScore,
} from '../utils/psychologicalSynthesis'

describe('psychologicalSynthesis', () => {
  it('returns null for empty or invalid history', () => {
    expect(synthesizePsychologicalReadiness([])).toBeNull()
    expect(synthesizePsychologicalReadiness(null)).toBeNull()
    expect(synthesizePsychologicalReadiness(undefined)).toBeNull()
    expect(synthesizePsychologicalReadiness([null, undefined])).toBeNull()
  })

  it('normalizes various OLQ code formats accurately', () => {
    expect(normalizeOlqCode('LDR')).toBe('LDR')
    expect(normalizeOlqCode('ldr')).toBe('LDR')
    expect(normalizeOlqCode('Leadership')).toBe('LDR')
    expect(normalizeOlqCode('emotional_stability')).toBe('EMS')
    expect(normalizeOlqCode('EMOTIONAL_STABILITY')).toBe('EMS')
    expect(normalizeOlqCode('social-intelligence')).toBe('SOI')
    expect(normalizeOlqCode('decision making')).toBe('DEM')
    expect(normalizeOlqCode('positive_outlook')).toBe('POO')
    expect(normalizeOlqCode('mental-toughness')).toBe('MNT')
    expect(normalizeOlqCode('communication')).toBe('COM')
    expect(normalizeOlqCode('moral_integrity')).toBe('MOI')
    expect(normalizeOlqCode('sense_of_responsibility')).toBe('SOR')
    expect(normalizeOlqCode('unknown_code')).toBeNull()
    expect(normalizeOlqCode(null)).toBeNull()
  })

  it('extracts scores safely across numbers, objects, and strings while rejecting falsy nulls', () => {
    expect(extractScore(8.5)).toBe(8.5)
    expect(extractScore(0)).toBe(0)
    expect(extractScore('7.2')).toBe(7.2)
    expect(extractScore({ score: 9.1 })).toBe(9.1)
    expect(extractScore({ score: null })).toBeNull()
    expect(extractScore({ score: '' })).toBeNull()
    expect(extractScore(null)).toBeNull()
    expect(extractScore(undefined)).toBeNull()
    expect(extractScore('')).toBeNull()
    expect(extractScore('invalid-num')).toBeNull()
  })

  it('synthesizes readiness from a single PPDT attempt', () => {
    const history = [
      {
        id: 'ppdt-1',
        type: 'PPDT',
        score: 8.0,
        feedback: {
          overall_score: 8.0,
          positive_traits: ['Decisive command presence', 'Proactive initiative'],
          areas_of_concern: ['Pacing in opening sentences'],
        },
      },
    ]

    const result = synthesizePsychologicalReadiness(history)
    expect(result).not.toBeNull()
    expect(result.source).toBe('client_synthesis')
    expect(result.overall_readiness_score).toBeGreaterThanOrEqual(7.0)
    expect(result.key_strengths_across_tests).toContain('Decisive command presence')
    expect(result.areas_needing_improvement).toContain('Pacing in opening sentences')
    expect(result.olq_averages).toBeDefined()
    expect(Object.keys(result.olq_averages)).toHaveLength(9)
    expect(result.battery_coverage.completed).toBe(1)
    expect(result.battery_coverage.missing).toContain('WAT')
    expect(result.battery_coverage.missing).toContain('TAT')
  })

  it('correctly maps dynamic missing batteries without mentioning completed ones', () => {
    const history = [
      {
        id: 'wat-only',
        type: 'WAT',
        score: 7.8,
        feedback: {
          overall_score: 7.8,
          positive_traits: ['Rapid situational response'],
        },
      },
    ]

    const result = synthesizePsychologicalReadiness(history)
    expect(result.battery_coverage.completed).toBe(1)
    expect(result.battery_coverage.missing).toEqual(['PPDT', 'TAT', 'SDT', 'SCT'])
    expect(result.consistency_analysis).toContain('PPDT, TAT, SDT, SCT')
    expect(result.consistency_analysis).not.toContain('formats (WAT')
  })

  it('harvests strengths and improvement areas from PPDT and TAT specific schemas', () => {
    const history = [
      {
        id: 'ppdt-test',
        type: 'PPDT',
        score: 8.2,
        feedback: {
          overall_score: 8.2,
          strengths: ['Grounding characters in active duty'],
          areas_of_improvement: ['Elaborate on secondary resolution'],
        },
      },
      {
        id: 'tat-test',
        type: 'TAT',
        score: 8.4,
        feedback: {
          overall_score: 8.4,
          personality_indicators: ['Hero displays high self-reliance'],
          areas_of_improvement: ['Tighten opening sentence'],
        },
      },
    ]

    const result = synthesizePsychologicalReadiness(history)
    expect(result.key_strengths_across_tests).toContain('Grounding characters in active duty')
    expect(result.key_strengths_across_tests).toContain('Hero displays high self-reliance')
    expect(result.areas_needing_improvement).toContain('Elaborate on secondary resolution')
    expect(result.areas_needing_improvement).toContain('Tighten opening sentence')
  })

  it('aggregates explicit OLQ scores from multiple test types correctly', () => {
    const history = [
      {
        id: 'ppdt-1',
        type: 'PPDT',
        score: 8.5,
        feedback: {
          overall_score: 8.5,
          olq_scores: {
            LDR: { score: 9.0, evidence: 'Led team out of flood zone' },
            EMS: { score: 8.0, evidence: 'Remained calm during crisis' },
          },
          positive_traits: ['High initiative'],
        },
      },
      {
        id: 'wat-1',
        type: 'WAT',
        score: 7.5,
        feedback: {
          overall_score: 7.5,
          olq_breakdown: {
            EMS: 8.5,
            MNT: 7.8,
          },
          positive_traits: ['Quick cognitive associations'],
          areas_of_concern: ['Watch negative word associations'],
        },
      },
      {
        id: 'tat-1',
        type: 'TAT',
        score: 8.2,
        feedback: {
          overall_score: 8.2,
          olq_scores: {
            LDR: 8.4,
            SOI: 8.1,
            DEM: 8.6,
          },
        },
      },
      {
        id: 'sdt-1',
        type: 'SDT',
        score: 7.9,
        feedback: {
          overall_score: 7.9,
          olqs: {
            SOI: 8.3,
            MOI: 8.5,
            SOR: 8.4,
          },
        },
      },
      {
        id: 'sct-1',
        type: 'SCT',
        score: 8.0,
        feedback: {
          overall_score: 8.0,
          olq_averages: {
            DEM: 8.2,
            POO: 8.0,
            COM: 8.5,
          },
        },
      },
    ]

    const result = synthesizePsychologicalReadiness(history)
    expect(result).not.toBeNull()
    expect(result.battery_coverage.completed).toBe(5)
    expect(result.battery_coverage.missing).toHaveLength(0)
    expect(result.confidence_level).toBe('high')
    expect(result.estimated_issb_readiness).toBe('Recommended')
    expect(result.readiness_tier.tier).toBe('Tier 1')
    expect(result.consistency_badge).toMatch(/Stability/i)
    // Verify LDR average: (9.0 + 8.4) / 2 = 8.7
    expect(result.olq_averages.LDR).toBeCloseTo(8.7, 1)
    // Verify EMS average: (8.0 + 8.5) / 2 = 8.25 => 8.3 or 8.2
    expect(result.olq_averages.EMS).toBeGreaterThanOrEqual(8.0)
  })

  it('correctly classifies low-scoring profiles into appropriate tier with constructive summary', () => {
    const history = [
      {
        id: 'ppdt-low',
        type: 'PPDT',
        score: 4.2,
        feedback: {
          overall_score: 4.2,
          areas_of_concern: ['Story lacks central hero and direction'],
        },
      },
    ]

    const result = synthesizePsychologicalReadiness(history)
    expect(result.readiness_tier.tier).toBe('Tier 4')
    expect(result.readiness_tier.title).toBe('Needs Development')
    // Profile summary should not say 'anchored by strong balanced potential'
    expect(result.personality_profile_summary).not.toContain('anchored by strong balanced potential')
    expect(result.personality_profile_summary).toContain('foundational psychometric potential')
  })

  it('handles attempts with score 0 without NaN or exceptions', () => {
    const history = [
      {
        id: 'zero-test',
        type: 'PPDT',
        score: 0,
        feedback: {
          overall_score: 0,
        },
      },
    ]

    const result = synthesizePsychologicalReadiness(history)
    expect(result).not.toBeNull()
    expect(isNaN(result.overall_readiness_score)).toBe(false)
    expect(result.overall_readiness_score).toBeGreaterThanOrEqual(2.0)
    expect(result.readiness_tier.title).toBe('Needs Development')
  })

  it('getReadinessTier evaluates tiers properly based on score, title, and coverage', () => {
    // Numeric checks
    expect(getReadinessTier(8.5, 5).title).toBe('Recommended')
    expect(getReadinessTier(8.5, 1).title).toBe('Competitive') // Coverage under 3 drops to Tier 2
    expect(getReadinessTier(7.2, 4).title).toBe('Competitive')
    expect(getReadinessTier(5.8, 3).title).toBe('Developing')
    expect(getReadinessTier(4.0, 5).title).toBe('Needs Development')

    // Title string checks
    expect(getReadinessTier('Recommended').tier).toBe('Tier 1')
    expect(getReadinessTier('Board Ready').tier).toBe('Tier 2')
    expect(getReadinessTier('Competitive').tier).toBe('Tier 2')
    expect(getReadinessTier('Developing').tier).toBe('Tier 3')
    expect(getReadinessTier('Needs Development').tier).toBe('Tier 4')
    expect(getReadinessTier('Foundational').tier).toBe('Tier 4')
  })
})
