import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AppProvider } from '../state/AppContext'
import { practiceApi } from '../services/liveApi'

vi.mock('../services/liveApi', () => ({
  authApi: { login: vi.fn(async () => ({ access_token: 'live-token', user: { name: 'Test User' } })), profile: vi.fn() },
  practiceApi: {
    getPpdtImage: vi.fn(async () => ({ id: 'ppdt-live-1', url: '/live-ppdt.jpg', difficulty_level: 'medium' })),
    submitPpdt: vi.fn(async () => ({ session_id: 'ppdt-session', feedback: { overall_score: 8.1, recommendation: 'Keep the interpretation grounded.' } })),
    getWatWords: vi.fn(async () => ({ words: ['Courage', 'Team'], set_code: 'A' })),
    submitWat: vi.fn(async () => ({ session_id: 'wat-session', feedback: { overall_score: 7.8, recommendation: 'Use specific responses.' } })),
    getTatImage: vi.fn(async () => ({ images: [{ id: 'tat-live-1', url: '/live-tat.jpg', difficulty_level: 'medium' }], set_code: 'B' })),
    submitTat: vi.fn(async () => ({ session_id: 'tat-session', feedback: { overall_score: 8.2, recommendation: 'Make the outcome more concrete.' } })),
    getSdtPrompts: vi.fn(async () => ({ prompts: ['How would your parents describe you?', 'How would your teachers describe you?', 'How would your friends describe you?', 'How do you describe yourself?', 'Who do you want to become?'], total_time_seconds: 900, set_code: 'C' })),
    submitSdt: vi.fn(async () => ({ session_id: 'sdt-session', feedback: { overall_score: 7.9, recommendation: 'Add behavioral examples.' } })),
    getSctStems: vi.fn(async () => ({ stems: ['When I face a difficult problem', 'My greatest strength is'], set_code: 'A' })),
    submitSct: vi.fn(async () => ({ session_id: 'sct-session', feedback: { overall_score: 7.7, recommendation: 'Be more personal.' } })),
  },
  getAllHistory: vi.fn(async () => [{ id: 'live-history-1', type: 'PPDT', date: 'Sep 12, 2026', duration: 'Completed', score: 8.1, status: 'Completed' }]),
}))

function renderAt(path, authenticated = false) {
  if (authenticated) localStorage.setItem('issb-token', 'test-token')
  return render(<MemoryRouter initialEntries={[path]}><AppProvider><App/></AppProvider></MemoryRouter>)
}

afterEach(() => {
  cleanup(); localStorage.clear(); vi.clearAllMocks()
})

describe('application routes', () => {
  it.each([
    ['/', 'Your readiness', false],
    ['/practice', 'Practice', false],
    ['/history', 'Practice history', true],
    ['/profile', 'Profile', false],
    ['/login', 'Sign in to continue', false],
  ])('renders %s', (route, heading, authenticated) => {
    renderAt(route, authenticated)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('protects live tests behind account sign-in', () => {
    renderAt('/practice/ppdt')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })
})

describe('live practice integrations', () => {
  it('loads the PPDT image from the API and opens the four-part editor', async () => {
    const user = userEvent.setup(); renderAt('/practice/ppdt', true)
    await user.click(screen.getByRole('button', { name: /load live test/i }))
    expect(await screen.findByRole('img', { name: /live ppdt/i })).toHaveAttribute('src', '/live-ppdt.jpg')
    expect(practiceApi.getPpdtImage).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: /skip to writing/i }))
    expect(screen.getByRole('heading', { name: 'Who and what do you notice?' })).toBeInTheDocument()
  })

  it('loads WAT words and submits the exact live set for evaluation', async () => {
    const user = userEvent.setup(); renderAt('/practice/wat', true)
    await user.click(screen.getByRole('button', { name: /load live test/i }))
    expect(await screen.findByText('Courage')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'Courage helps a team act.'); await user.click(screen.getByRole('button', { name: /next prompt/i }))
    await user.type(screen.getByRole('textbox'), 'A team succeeds through trust.'); await user.click(screen.getByRole('button', { name: /submit for evaluation/i }))
    expect(await screen.findByText('Session saved')).toBeInTheDocument()
    expect(practiceApi.submitWat).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ word: 'Courage', response: 'Courage helps a team act.' })]), 'A')
  })

  it('loads the TAT image from the API and opens the timed story editor', async () => {
    const user = userEvent.setup(); renderAt('/practice/tat', true)
    await user.click(screen.getByRole('button', { name: /load live test/i }))
    expect(await screen.findByRole('img', { name: /live tat/i })).toHaveAttribute('src', '/live-tat.jpg')
    expect(practiceApi.getTatImage).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: /skip to writing/i }))
    expect(screen.getByRole('heading', { name: /build the complete story/i })).toBeInTheDocument()
  })

  it('loads every SDT perspective from the API', async () => {
    const user = userEvent.setup(); renderAt('/practice/sdt', true)
    await user.click(screen.getByRole('button', { name: /load live test/i }))
    expect(await screen.findByRole('heading', { name: /parents describe/i })).toBeInTheDocument()
    await user.type(screen.getByRole('textbox'), 'They see me as dependable and calm under pressure.')
    expect(screen.getByText('1 of 5 sections drafted')).toBeInTheDocument()
    expect(practiceApi.getSdtPrompts).toHaveBeenCalledOnce()
  })

  it('loads SCT stems from the API', async () => {
    const user = userEvent.setup(); renderAt('/practice/sct', true)
    await user.click(screen.getByRole('button', { name: /load live test/i }))
    expect(await screen.findByText(/When I face a difficult problem/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/finish the sentence/i)).toBeInTheDocument()
    expect(practiceApi.getSctStems).toHaveBeenCalledWith(30)
  })

  it('renders history returned by the live API', async () => {
    renderAt('/history', true)
    await waitFor(() => expect(screen.getByText('Sep 12, 2026')).toBeInTheDocument())
    expect(screen.getByText('Fetched from your live account.')).toBeInTheDocument()
  })
})
