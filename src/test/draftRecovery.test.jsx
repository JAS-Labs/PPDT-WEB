import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'
import useSessionDraft, { draftKey } from '../features/practice/useSessionDraft'
import PpdtSession from '../features/practice/PpdtSession'
import TatSession from '../features/practice/TatSession'
import SdtSession from '../features/practice/SdtSession'
import TimedPromptSession from '../features/practice/TimedPromptSession'
import { practiceApi } from '../services/liveApi'
import { TESTS } from '../data/tests'

vi.mock('../state/AppContext', () => ({ useApp: () => ({ addAttempt: vi.fn() }) }))
vi.mock('../services/liveApi', () => ({
  practiceApi: {
    getWatWords: vi.fn(async () => ({ words: ['Courage'], set_code: 'A' })),
    submitWat: vi.fn(),
    getImageResponses: vi.fn(),
  },
}))
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); vi.clearAllMocks() })

function Harness() {
  const [phase, setPhase] = useState('setup')
  const [answer, setAnswer] = useState('')
  useSessionDraft('ppdt', phase, { answer, phase }, saved => { setAnswer(saved.answer); setPhase(saved.phase) })
  return <><input aria-label="Answer" value={answer} onChange={e => { setAnswer(e.target.value); setPhase('write') }} /><button onClick={() => setPhase('result')}>Complete</button><a href="/practice">Leave</a></>
}

it('restores a draft on remount and clears it after success', () => {
  const first = render(<Harness />)
  fireEvent.change(screen.getByLabelText('Answer'), { target: { value: 'My unfinished response' } })
  first.unmount()
  render(<Harness />)
  expect(screen.getByLabelText('Answer')).toHaveValue('My unfinished response')
  fireEvent.click(screen.getByText('Complete'))
  expect(sessionStorage.getItem(draftKey('ppdt'))).toBeNull()
})

it('does not restore another account’s draft', () => {
  localStorage.setItem('issb-profile', JSON.stringify({ email: 'first@example.com' }))
  const first = render(<Harness />)
  fireEvent.change(screen.getByLabelText('Answer'), { target: { value: 'Private response' } })
  first.unmount()
  localStorage.setItem('issb-profile', JSON.stringify({ email: 'second@example.com' }))
  render(<Harness />)
  expect(screen.getByLabelText('Answer')).toHaveValue('')
})

it('warns before browser unload and cancels link navigation when requested', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  render(<Harness />)
  fireEvent.change(screen.getByLabelText('Answer'), { target: { value: 'Work in progress' } })
  const unload = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(unload)
  expect(unload.defaultPrevented).toBe(true)
  expect(fireEvent.click(screen.getByText('Leave'))).toBe(false)
  expect(confirm).toHaveBeenCalledOnce()
})

const image = { id: 'image-1', url: '/image.png' }
it.each([
  ['ppdt', PpdtSession, { phase: 'write', image, observeLeft: 0, writeLeft: 150, activeField: 2, answers: { spot: 'A person', action: 'Helping', story: 'Recovered PPDT story', logic: '' } }, 'Recovered PPDT story'],
  ['tat', TatSession, { phase: 'write', image, observeLeft: 0, writeLeft: 150, story: 'Recovered TAT story' }, 'Recovered TAT story'],
  ['sdt', SdtSession, { phase: 'write', prompts: ['Describe yourself'], answers: ['Recovered SDT answer'], index: 0, left: 800, duration: 900, setCode: 'A' }, 'Recovered SDT answer'],
  ['wat', TimedPromptSession, { phase: 'active', prompts: ['Courage'], answers: [], response: 'Recovered WAT answer', index: 0, secondsPerItem: 15, left: 15, setCode: 'A', startedAt: Date.now(), itemStartedAt: Date.now() }, 'Recovered WAT answer'],
  ['sct', TimedPromptSession, { phase: 'active', prompts: ['My goal'], answers: [], response: 'Recovered SCT answer', index: 0, secondsPerItem: 30, left: 30, setCode: 'B', startedAt: Date.now(), itemStartedAt: Date.now() }, 'Recovered SCT answer'],
])('restores the %s editor and its response', (id, Component, snapshot, answer) => {
  sessionStorage.setItem(draftKey(id), JSON.stringify({ version: 1, savedAt: Date.now(), snapshot }))
  render(<MemoryRouter><Component test={TESTS.find(test => test.id === id)} mode={id} /></MemoryRouter>)
  expect(screen.getByRole('textbox')).toHaveValue(answer)
})

it('retries a failed WAT submission with identical responses and clears the draft on success', async () => {
  practiceApi.submitWat.mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValueOnce({ session_id: 'saved-1', feedback: { overall_score: 7, recommendation: 'Keep practicing.' } })
  render(<MemoryRouter><TimedPromptSession test={TESTS.find(test => test.id === 'wat')} mode="wat" /></MemoryRouter>)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Load live test/ })) })
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Courage helps us act.' } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Submit for evaluation/ })) })
  expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable')
  expect(sessionStorage.getItem(draftKey('wat'))).not.toBeNull()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Retry submission/ })) })
  expect(practiceApi.submitWat.mock.calls[1]).toEqual(practiceApi.submitWat.mock.calls[0])
  expect(screen.getByText('Session saved')).toBeInTheDocument()
  expect(sessionStorage.getItem(draftKey('wat'))).toBeNull()
})
