import { OLQ_DEFINITIONS, getScoreBand } from '../components/OlqScoreSection'

// Test type mapping to core OLQ dimensions they most directly measure in ISSB
const TEST_OLQ_MAP = {
  PPDT: ['LDR', 'DEM', 'POO', 'COM', 'SOR'],
  WAT: ['EMS', 'DEM', 'POO', 'MNT'],
  TAT: ['LDR', 'DEM', 'SOI', 'MOI', 'POO'],
  SDT: ['SOI', 'MOI', 'SOR', 'EMS', 'COM'],
  SCT: ['DEM', 'POO', 'MNT', 'EMS', 'SOR'],
}

/**
 * Normalizes an OLQ key to standard 3-letter uppercase code.
 * Handles exact codes (LDR), full names (Leadership), snake_case (emotional_stability),
 * and kebab-case (social-intelligence).
 */
export function normalizeOlqCode(code) {
  if (!code) return null
  const cleaned = String(code).trim().toUpperCase()
  const normalized = cleaned.replace(/[_\-]+/g, ' ')
  const noSpaces = cleaned.replace(/[\s_\-]+/g, '')
  const found = OLQ_DEFINITIONS.find((def) => {
    const defCode = def.code.toUpperCase()
    const defName = def.name.toUpperCase()
    return (
      defCode === cleaned ||
      defCode === normalized ||
      defName === normalized ||
      defName.replace(/\s+/g, '') === noSpaces
    )
  })
  return found ? found.code : null
}

/**
 * Safely extracts a numeric score from any input type
 */
export function extractScore(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  if (typeof val === 'object') {
    if (val.score !== undefined && val.score !== null && val.score !== '') {
      const num = Number(val.score)
      return isNaN(num) ? null : num
    }
    return null
  }
  const parsed = parseFloat(val)
  return isNaN(parsed) ? null : parsed
}

/**
 * Evaluates the ISSB readiness tier based on readiness score/title and coverage
 */
export function getReadinessTier(scoreOrTitle, coverageBreadth = 5) {
  if (typeof scoreOrTitle === 'string') {
    const lower = scoreOrTitle.toLowerCase().trim()
    if (lower.includes('recommend') && !lower.includes('not')) {
      return {
        tier: 'Tier 1',
        title: 'Recommended',
        badge: 'High Readiness',
        color: '#10b981',
        bg: '#e8f8f2',
        border: '#10b98140',
        summary: 'Demonstrates strong, consistent Officer Like Qualities across psychological batteries with mature leadership presence.',
      }
    }
    if (lower.includes('compet') || lower.includes('board ready')) {
      return {
        tier: 'Tier 2',
        title: 'Competitive',
        badge: 'Board Ready',
        color: '#0d9488',
        bg: '#e0f8f5',
        border: '#0d948840',
        summary: 'Solid officer baseline with positive traits; minor refinement in narrative depth and speed will solidify profile.',
      }
    }
    if (lower.includes('develop') && !lower.includes('needs')) {
      return {
        tier: 'Tier 3',
        title: 'Developing',
        badge: 'Progressing',
        color: '#f59e0b',
        bg: '#fef3c7',
        border: '#f59e0b40',
        summary: 'Shows core potential but exhibits inconsistencies across tests; structured psychometric practice recommended.',
      }
    }
    if (lower.includes('needs development') || lower.includes('foundational') || lower.includes('not recommended')) {
      return {
        tier: 'Tier 4',
        title: 'Needs Development',
        badge: 'Foundational',
        color: '#ef4444',
        bg: '#fee2e2',
        border: '#ef444440',
        summary: 'Requires fundamental focus on constructive framing, proactive action, and emotional composure under pressure.',
      }
    }
  }

  const num = Number(scoreOrTitle) || 0
  if (num >= 8.2 && coverageBreadth >= 3) {
    return {
      tier: 'Tier 1',
      title: 'Recommended',
      badge: 'High Readiness',
      color: '#10b981',
      bg: '#e8f8f2',
      border: '#10b98140',
      summary: 'Demonstrates strong, consistent Officer Like Qualities across psychological batteries with mature leadership presence.',
    }
  }
  if (num >= 7.0) {
    return {
      tier: 'Tier 2',
      title: 'Competitive',
      badge: 'Board Ready',
      color: '#0d9488',
      bg: '#e0f8f5',
      border: '#0d948840',
      summary: 'Solid officer baseline with positive traits; minor refinement in narrative depth and speed will solidify profile.',
    }
  }
  if (num >= 5.5) {
    return {
      tier: 'Tier 3',
      title: 'Developing',
      badge: 'Progressing',
      color: '#f59e0b',
      bg: '#fef3c7',
      border: '#f59e0b40',
      summary: 'Shows core potential but exhibits inconsistencies across tests; structured psychometric practice recommended.',
    }
  }
  return {
    tier: 'Tier 4',
    title: 'Needs Development',
    badge: 'Foundational',
    color: '#ef4444',
    bg: '#fee2e2',
    border: '#ef444440',
    summary: 'Requires fundamental focus on constructive framing, proactive action, and emotional composure under pressure.',
  }
}

/**
 * Intelligently synthesizes a comprehensive psychological readiness report
 * directly from the candidate's test history when cloud AI is unavailable.
 */
export function synthesizePsychologicalReadiness(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return null
  }

  // Filter valid attempts
  const attempts = history.filter((item) => item && (item.type || item.feedback))
  if (attempts.length === 0) return null

  // 1. Group attempts by test format
  const byType = {
    PPDT: [],
    WAT: [],
    TAT: [],
    SDT: [],
    SCT: [],
  }

  attempts.forEach((item) => {
    const typeUpper = String(item.type || 'PPDT').toUpperCase()
    if (byType[typeUpper]) {
      byType[typeUpper].push(item)
    } else {
      // generic or unrecognized type defaults to PPDT
      byType.PPDT.push(item)
    }
  })

  // 2. Score metrics per test
  const testBreakdown = {}
  let totalScoreSum = 0
  let totalScoredCount = 0
  const formatAverages = []

  Object.entries(byType).forEach(([type, list]) => {
    const scores = list
      .map((item) => {
        const s = extractScore(item.score ?? item.feedback?.overall_score)
        return s !== null && s >= 0 && s <= 10 ? s : null
      })
      .filter((s) => s !== null)

    const count = list.length
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    const best = scores.length > 0 ? Math.max(...scores) : null

    testBreakdown[`${type.toLowerCase()}_attempts`] = count
    testBreakdown[`${type.toLowerCase()}_average`] = avg !== null ? Number(avg.toFixed(1)) : 0
    testBreakdown[`${type.toLowerCase()}_best`] = best !== null ? Number(best.toFixed(1)) : 0

    if (avg !== null) {
      formatAverages.push({ type, avg, count })
      totalScoreSum += scores.reduce((a, b) => a + b, 0)
      totalScoredCount += scores.length
    }
  })

  testBreakdown.total_attempts = attempts.length
  const rawAverage = totalScoredCount > 0 ? totalScoreSum / totalScoredCount : 6.5
  testBreakdown.overall_average = Number(rawAverage.toFixed(1))

  // 3. Compute 9-dimensional OLQ profile
  const olqTotals = {}
  OLQ_DEFINITIONS.forEach((def) => {
    olqTotals[def.code] = []
  })

  // Harvest explicit OLQ scores from attempt feedback
  attempts.forEach((item) => {
    const fb = item.feedback || {}
    const type = String(item.type || 'PPDT').toUpperCase()
    const attemptScore = extractScore(item.score ?? fb.overall_score) ?? rawAverage

    let hasExplicitOlq = false
    const candidates = [
      fb.olq_scores,
      fb.olq_breakdown,
      fb.olqs,
      fb.olq_averages,
      fb.scores,
    ]

    candidates.forEach((cand) => {
      if (cand && typeof cand === 'object' && !Array.isArray(cand)) {
        Object.entries(cand).forEach(([key, val]) => {
          const code = normalizeOlqCode(key)
          const num = extractScore(val)
          if (code && num !== null && num >= 1 && num <= 10) {
            olqTotals[code].push(num)
            hasExplicitOlq = true
          }
        })
      }
    })

    // If this attempt didn't have explicit OLQ breakdown, extrapolate
    // to the test format's primary OLQs with slight realistic variance
    if (!hasExplicitOlq && TEST_OLQ_MAP[type]) {
      TEST_OLQ_MAP[type].forEach((code) => {
        // baseline around attempt score, bounded between 3.0 and 9.5
        const bounded = Math.min(9.5, Math.max(3.0, attemptScore))
        olqTotals[code].push(bounded)
      })
    }
  })

  // Calculate final OLQ averages (fill any remaining missing OLQ with rawAverage baseline)
  const olqAverages = {}
  let olqSum = 0
  OLQ_DEFINITIONS.forEach((def) => {
    const list = olqTotals[def.code]
    if (list && list.length > 0) {
      const avg = list.reduce((a, b) => a + b, 0) / list.length
      olqAverages[def.code] = Number(avg.toFixed(1))
    } else {
      olqAverages[def.code] = Number(rawAverage.toFixed(1))
    }
    olqSum += olqAverages[def.code]
  })
  const olqMean = olqSum / 9

  // 4. Synthesize overall readiness score
  // Blended score factoring raw session scores, OLQ mean, and battery breadth
  const completedBatteries = Object.values(byType).filter((l) => l.length > 0).length
  const breadthCalibration = (completedBatteries / 5) * 0.3
  const blendedScore = Math.min(
    9.8,
    Math.max(2.0, rawAverage * 0.65 + olqMean * 0.35 + (completedBatteries >= 4 ? 0.2 : breadthCalibration * 0.5))
  )
  const readinessScore = Number(blendedScore.toFixed(1))

  // 5. Readiness Tier & Confidence
  const readinessTier = getReadinessTier(readinessScore, completedBatteries)

  let confidenceLevel = 'low'
  if ((completedBatteries >= 4 && attempts.length >= 5) || attempts.length >= 8) {
    confidenceLevel = 'high'
  } else if (completedBatteries >= 2 || attempts.length >= 3) {
    confidenceLevel = 'medium'
  } else {
    confidenceLevel = 'standard'
  }

  // 6. Strengths aggregation across all test batteries
  const strengthsSet = new Set()
  const areasSet = new Set()

  attempts.forEach((item) => {
    const fb = item.feedback || {}
    const posSources = [
      fb.strengths,
      fb.positive_traits,
      fb.key_strengths,
      fb.personality_indicators,
      fb.key_strengths_across_tests,
    ]
    posSources.forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((t) => {
          if (typeof t === 'string' && t.trim().length > 3) strengthsSet.add(t.trim())
        })
      }
    })

    const negSources = [
      fb.areas_of_improvement,
      fb.areas_needing_improvement,
      fb.areas_of_concern,
      fb.areas_for_improvement,
    ]
    negSources.forEach((list) => {
      if (Array.isArray(list)) {
        list.forEach((t) => {
          if (typeof t === 'string' && t.trim().length > 3) areasSet.add(t.trim())
        })
      }
    })

    if (fb.recommendation && typeof fb.recommendation === 'string' && fb.recommendation.trim().length > 5) {
      // If actionable recommendation exists, also consider adding to development areas if not already long
      if (areasSet.size < 3) {
        areasSet.add(fb.recommendation.trim())
      }
    }
  })

  // Add trait inferences from high/low OLQs
  const sortedOlqs = [...OLQ_DEFINITIONS]
    .map((def) => ({ ...def, score: olqAverages[def.code] }))
    .sort((a, b) => b.score - a.score)

  const topOlqs = sortedOlqs.filter((o) => o.score >= 7.0)
  const bottomOlqs = [...sortedOlqs].reverse().filter((o) => o.score < 7.0)

  // Use top scoring OLQs to enrich strengths
  const dominantOlqs = topOlqs.length > 0 ? topOlqs : sortedOlqs.slice(0, 2)
  dominantOlqs.slice(0, 3).forEach((o) => {
    if (o.code === 'LDR') strengthsSet.add('Proactive leadership initiative and command composure')
    if (o.code === 'EMS') strengthsSet.add('Resilient emotional stability and calm composure under time limits')
    if (o.code === 'DEM') strengthsSet.add('Decisive situational judgment and timely problem resolution')
    if (o.code === 'POO') strengthsSet.add('Constructive story framing and positive outcome orientation')
    if (o.code === 'SOI') strengthsSet.add('Collaborative social intelligence and cooperative team empathy')
    if (o.code === 'MNT') strengthsSet.add('High mental toughness, perseverance, and grit in adversity')
    if (o.code === 'COM') strengthsSet.add('Articulate narrative communication and coherent thought expression')
    if (o.code === 'MOI') strengthsSet.add('Strong moral integrity, ethical consciousness, and duty dedication')
    if (o.code === 'SOR') strengthsSet.add('Keen sense of responsibility and spontaneous accountability')
  })

  // Use lowest scoring OLQs to enrich areas needing improvement
  const developmentalOlqs = bottomOlqs.length > 0 ? bottomOlqs : [...sortedOlqs].reverse().slice(0, 2)
  developmentalOlqs.slice(0, 3).forEach((o) => {
    if (o.code === 'LDR') areasSet.add('Strengthen personal initiative and lead actions directly rather than passively')
    if (o.code === 'EMS') areasSet.add('Cultivate emotional composure and reduce hesitation under strict stimulus timing')
    if (o.code === 'DEM') areasSet.add('Accelerate decision velocity and commit to decisive, practical solutions')
    if (o.code === 'POO') areasSet.add('Ensure all endings clearly resolve conflicts with hopeful, constructive resolutions')
    if (o.code === 'SOI') areasSet.add('Emphasize teamwork, mutual trust, and collective group success in narratives')
    if (o.code === 'MNT') areasSet.add('Highlight tenacity and sustained endurance through difficult obstacles')
    if (o.code === 'COM') areasSet.add('Tighten narrative conciseness and avoid redundant exposition')
    if (o.code === 'MOI') areasSet.add('Reinforce selfless service, ethical duty, and military discipline in stories')
    if (o.code === 'SOR') areasSet.add('Deepen individual ownership and proactive responsibility in all scenarios')
  })

  // Default fallbacks if empty
  if (strengthsSet.size === 0) {
    strengthsSet.add('Active participation across psychometric evaluation batteries')
    strengthsSet.add('Constructive narrative focus with practical situational problem-solving')
    strengthsSet.add('Readiness to confront challenging stimulus prompts directly')
  }
  if (areasSet.size === 0) {
    areasSet.add('Expand practice across all five ISSB psychological formats (PPDT, WAT, TAT, SDT, SCT)')
    areasSet.add('Maintain steady pacing under the 15-second WAT and 30-second SCT time constraints')
    areasSet.add('Ensure stories consistently highlight proactive character leadership and clear outcomes')
  }

  const keyStrengths = Array.from(strengthsSet).slice(0, 5)
  const areasNeedingImprovement = Array.from(areasSet).slice(0, 4)

  // 7. Dynamic Missing Batteries & Consistency Analysis
  const missingBatteries = ['PPDT', 'WAT', 'TAT', 'SDT', 'SCT'].filter((t) => byType[t].length === 0)
  const validAvgs = formatAverages.map((f) => f.avg)
  let consistencyText = ''
  let consistencyBadge = 'Balanced'

  if (validAvgs.length <= 1) {
    consistencyBadge = 'Initial Baseline'
    const missingNotice = missingBatteries.length > 0 ? ` (${missingBatteries.join(', ')})` : ''
    consistencyText = `Evaluated across ${attempts.length} session${attempts.length > 1 ? 's' : ''} in ${completedBatteries} test format. Complete tests in additional formats${missingNotice} to enable multi-battery cross-correlation.`
  } else {
    const maxAvg = Math.max(...validAvgs)
    const minAvg = Math.min(...validAvgs)
    const spread = maxAvg - minAvg

    if (spread <= 1.2) {
      consistencyBadge = 'High Cross-Battery Stability'
      consistencyText = `High narrative and psychometric consistency across ${completedBatteries} completed test batteries (score delta of ${spread.toFixed(1)} pts). Your projective stories (PPDT/TAT) strongly align with your spontaneous associative responses.`
    } else if (spread <= 2.2) {
      consistencyBadge = 'Moderate Stability'
      consistencyText = `Solid core alignment with minor variance between test formats (${spread.toFixed(1)} pt spread). Narrative tests demonstrate slightly different confidence levels compared to rapid-fire associative drills.`
    } else {
      consistencyBadge = 'Format Variance Observed'
      consistencyText = `Noticeable variance observed across test batteries (${spread.toFixed(1)} pt difference). Focus on aligning rapid, spontaneous instincts (WAT/SCT) with the structured leadership themes demonstrated in longer stories (PPDT/TAT).`
    }
  }

  // 8. Calibrated Personality Profile Summary
  const topTraitNames = sortedOlqs.slice(0, 2).map((o) => o.name).join(' and ') || 'balanced potential'
  let profileSummary = ''
  if (readinessScore >= 7.0) {
    profileSummary = `Candidate displays a ${readinessTier.title.toLowerCase()} psychometric profile anchored by strong ${topTraitNames}. Across ${attempts.length} evaluated attempt${attempts.length > 1 ? 's' : ''}, responses demonstrate constructive psychological orientation, logical narrative progression, and genuine motivation for defence service. Continued structured practice on high-tempo associations will reinforce psychological maturity and ensure peak performance at the ISSB testing board.`
  } else {
    profileSummary = `Candidate demonstrates foundational psychometric potential with emerging aptitudes in ${topTraitNames}. Across ${attempts.length} evaluated attempt${attempts.length > 1 ? 's' : ''}, responses show an active commitment to preparation, with key opportunities to sharpen decision velocity and story resolution. Focused, repetitive practice under timed testing conditions will elevate consistency to the ISSB Board standard.`
  }

  // 9. Assessor's Final Strategic Recommendation
  let recommendation = ''
  if (missingBatteries.length > 0) {
    recommendation = `Complete attempts in missing battery formats (${missingBatteries.join(', ')}) to solidify your psychometric profile. Maintain a daily 15-second WAT drill and ensure PPDT/TAT narratives feature proactive, solution-oriented protagonists.`
  } else {
    recommendation = `Maintain your current preparation rhythm across all 5 test formats. Focus on sharpening reaction speed during WAT/SCT and review your SDT self-appraisal to ensure seamless harmony with your projective stories.`
  }

  return {
    source: 'client_synthesis',
    generated_at: new Date().toISOString(),
    overall_readiness_score: readinessScore,
    estimated_issb_readiness: readinessTier.title,
    readiness_tier: readinessTier,
    confidence_level: confidenceLevel,
    consistency_analysis: consistencyText,
    consistency_badge: consistencyBadge,
    personality_profile_summary: profileSummary,
    key_strengths_across_tests: keyStrengths,
    areas_needing_improvement: areasNeedingImprovement,
    olq_averages: olqAverages,
    test_breakdown: testBreakdown,
    final_recommendation: recommendation,
    battery_coverage: {
      completed: completedBatteries,
      total: 5,
      missing: missingBatteries,
      breakdown: {
        ppdt: byType.PPDT.length,
        wat: byType.WAT.length,
        tat: byType.TAT.length,
        sdt: byType.SDT.length,
        sct: byType.SCT.length,
      },
    },
  }
}
