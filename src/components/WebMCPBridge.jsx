import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TESTS } from '../data/tests'
import { useApp } from '../state/AppContext'

export default function WebMCPBridge() {
  const navigate = useNavigate()
  const { stats } = useApp()

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    const register = (tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {})

    register({
      name: 'read_practice_progress',
      title: 'Read practice progress',
      description: 'Read the learner’s current locally stored practice totals and scores.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ sessions: stats.sessions, averageScore: Number(stats.average), bestScore: Number(stats.best) }),
    })
    register({
      name: 'start_practice_session',
      title: 'Start practice session',
      description: 'Open the setup screen for one supported ISSB practice test.',
      inputSchema: { type: 'object', properties: { testId: { type: 'string', enum: TESTS.map((test) => test.id) } }, required: ['testId'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input) => {
        if (!input || !TESTS.some((test) => test.id === input.testId)) throw new Error('A valid testId is required.')
        navigate(`/practice/${input.testId}`)
        return { status: 'ready', testId: input.testId }
      },
    })

    return () => lifecycle.abort()
  }, [navigate, stats.average, stats.best, stats.sessions])

  return null
}
