import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import TimedPromptSession from '../features/practice/TimedPromptSession'
import { TESTS } from '../data/tests'
import { practiceApi } from '../services/liveApi'

vi.mock('../state/AppContext', () => ({ useApp: () => ({ addAttempt: vi.fn() }) }))
vi.mock('../services/liveApi', () => ({
  practiceApi: {
    getWatWords: vi.fn(async () => ({ words: ['Courage', 'Team'], set_code: 'A' })),
    submitWat: vi.fn(async () => ({ session_id: '1', feedback: { overall_score: 7 } })),
  },
}))
afterEach(() => { cleanup(); sessionStorage.clear(); vi.useRealTimers(); vi.clearAllMocks() })

it('advances on time even when a candidate types continuously', async () => {
  vi.useFakeTimers()
  render(<MemoryRouter><TimedPromptSession test={TESTS.find(test => test.id === 'wat')} mode="wat" /></MemoryRouter>)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Load live test/i })) })
  for (let i = 0; i < 30; i++) {
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My response ' + i } })
    await act(async () => { vi.advanceTimersByTime(500) })
  }
  expect(screen.getByText('Team')).toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'We work together.' } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Submit for evaluation/i })) })
  expect(practiceApi.submitWat).toHaveBeenCalledTimes(1)
  expect(practiceApi.submitWat.mock.calls[0][0][0]).toMatchObject({ word: 'Courage', response: 'My response 29', response_time_ms: 15000 })
})
