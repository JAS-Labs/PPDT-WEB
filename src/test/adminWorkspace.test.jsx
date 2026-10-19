import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '../state/AppContext'
import AdminShell from '../components/admin/AdminShell'
import AdminPage from '../pages/AdminPage'
import AdminResponsesPage from '../pages/AdminResponsesPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import AdminActivityPage from '../pages/AdminActivityPage'
import { adminApi } from '../services/liveApi'

vi.mock('../services/liveApi', () => ({
  adminApi: {
    overview: vi.fn(async () => ({ users_total: 3, admins_total: 1, new_users_30d: 2, attempts_total: 4, attempts_by_test: { ppdt: 1, wat: 2, tat: 1 } })),
    users: vi.fn(async () => ({ users: [{ id: 'candidate-1', name: 'Candidate One', email: 'candidate@example.com', attempts: 2, role: 'candidate', created_at: '2026-10-01T00:00:00Z' }], total: 1, page: 1, pages: 1 })),
    userProfile: vi.fn(async () => ({ id: 'candidate-1', name: 'Candidate One', email: 'candidate@example.com', age: 22, nationality: 'Bangladeshi', role: 'candidate', research_consent: true, research_consent_at: '2026-10-01T00:00:00Z', tests: { wat: { attempts: 2, average_score: 6.5, last_attempt_at: '2026-10-10T00:00:00Z' } } })),
    updateUserProfile: vi.fn(async (_id, value) => ({ ...value, id: 'candidate-1' })),
    setUserRole: vi.fn(async (_id, role) => ({ role })),
    sendPasswordReset: vi.fn(async () => ({ success: true })),
    responses: vi.fn(async () => ({ items: [{ session_id: 'attempt-1', test_type: 'wat', candidate_ref: 'abc123def0', created_at: '2026-10-10T00:00:00Z', score: 0, response_count: 1 }], total: 1, page: 1, pages: 1 })),
    response: vi.fn(async () => ({ session_id: 'attempt-1', test_type: 'wat', candidate_ref: 'abc123def0', candidate_name: 'Saifur Rahman', created_at: '2026-10-10T00:00:00Z', score: 0, payload: { responses: [{ word: 'Teamwork', response: 'I support my team.', response_time_ms: 4500 }] } })),
    activity: vi.fn(async () => ({ items: [{ id: 'event-1', action: 'response_detail_view', actor_name: 'Admin', target_name: null, created_at: '2026-10-10T00:00:00Z', metadata: { test_type: 'wat' } }] })),
  },
}))

function renderAdmin(path, page) {
  return render(<MemoryRouter initialEntries={[path]}><AppProvider><Routes><Route path="/admin" element={<AdminShell />}>
    <Route index element={<AdminPage />} /><Route path="responses" element={<AdminResponsesPage />} /><Route path="users" element={<AdminUsersPage />} /><Route path="activity" element={<AdminActivityPage />} />
  </Route></Routes></AppProvider></MemoryRouter>)
}

afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('renders a separate admin workspace and platform overview', async () => {
  renderAdmin('/admin', <AdminPage />)
  expect(screen.getByRole('navigation', { name: 'Administrator navigation' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Good to see you.' })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText('Registered accounts')).toBeInTheDocument())
  expect(screen.getByText('Review candidate responses')).toBeInTheDocument()
})

it('shows answer text only after opening a pseudonymous test response', async () => {
  renderAdmin('/admin/responses', <AdminResponsesPage />)
  await waitFor(() => expect(screen.getByText('abc123def0')).toBeInTheDocument())
  expect(screen.queryByText('I support my team.')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Review/i }))
  await waitFor(() => expect(screen.getByText('I support my team.')).toBeInTheDocument())
  expect(within(screen.getByRole('dialog')).getByText('0.0 / 10')).toBeInTheDocument()
  expect(within(screen.getByRole('dialog')).getByText(/Candidate: Saifur Rahman/)).toBeInTheDocument()
  expect(adminApi.response).toHaveBeenCalledWith('wat', 'attempt-1')
})

it('filters response attempts by the selected test', async () => {
  renderAdmin('/admin/responses', <AdminResponsesPage />)
  await waitFor(() => expect(screen.getByText('abc123def0')).toBeInTheDocument())

  fireEvent.change(screen.getByRole('combobox', { name: 'Filter responses by test' }), { target: { value: 'ppdt' } })

  await waitFor(() => expect(adminApi.responses).toHaveBeenLastCalledWith(expect.objectContaining({ testType: 'ppdt' })))
})

it('shows the original prompt picture when reviewing an image-based response', async () => {
  adminApi.response.mockResolvedValueOnce({
    test_type: 'ppdt', session_id: 'attempt-1', created_at: '2026-10-10T00:00:00Z', score: 7,
    candidate_ref: 'abc123def0', candidate_name: 'Saifur Rahman', payload: { image_id: 'ppdt-image-1', image_url: 'https://images.example/ppdt-image-1.jpg', story_text: 'A sample story.' },
  })
  renderAdmin('/admin/responses', <AdminResponsesPage />)
  await waitFor(() => expect(screen.getByText('abc123def0')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /Review/i }))

  const prompt = await screen.findByRole('img', { name: 'PPDT prompt image' })
  expect(prompt).toHaveAttribute('src', 'https://images.example/ppdt-image-1.jpg')
  expect(screen.getByText('Original PPDT picture')).toBeInTheDocument()
})

it('renders assessment feedback clearly and keeps the original JSON downloadable', async () => {
  const feedback = {
    overall_score: 7.8,
    composite_score: 7.4,
    assessor_confidence: 'high',
    personality_assessment: 'Shows a constructive and steady approach to the prompt.',
    positive_traits: ['Team orientation', 'Calm under pressure'],
    areas_of_concern: ['Add more detail to the next step'],
    recommendation: 'Make the outcome more specific and measurable.',
    emotional_stability: 'Maintains a composed tone.',
    olq_scores: { LDR: { score: 8.1, evidence: 'Organized others around the task.', confidence: 'high' } },
  }
  adminApi.response.mockResolvedValueOnce({
    test_type: 'wat', session_id: 'attempt-1', created_at: '2026-10-10T00:00:00Z', score: 7.8,
    candidate_ref: 'abc123def0', payload: { responses: [], feedback },
  })
  const createObjectURL = vi.fn(() => 'blob:feedback')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

  renderAdmin('/admin/responses', <AdminResponsesPage />)
  await waitFor(() => expect(screen.getByText('abc123def0')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /Review/i }))

  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByRole('heading', { name: 'Assessment feedback' })).toBeInTheDocument()
  expect(within(dialog).getByText('Shows a constructive and steady approach to the prompt.')).toBeInTheDocument()
  expect(within(dialog).getByText('Team orientation')).toBeInTheDocument()
  expect(within(dialog).getByText('Leadership')).toBeInTheDocument()
  expect(within(dialog).getByText('Make the outcome more specific and measurable.')).toBeInTheDocument()

  fireEvent.click(within(dialog).getByRole('button', { name: 'Download JSON' }))
  expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
  expect(click).toHaveBeenCalledOnce()
  const downloadedBlob = createObjectURL.mock.calls[0][0]
  expect(await downloadedBlob.text()).toContain('"overall_score": 7.8')
})

it('shows consent status read-only while presenting profile and per-test progress', async () => {
  renderAdmin('/admin/users', <AdminUsersPage />)
  await waitFor(() => expect(screen.getByText('Candidate One')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /View profile/i }))
  await waitFor(() => expect(screen.getByText('Research consent')).toBeInTheDocument())
  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByText('Granted')).toBeInTheDocument()
  expect(within(dialog).getByText('6.5 avg score')).toBeInTheDocument()
  expect(within(dialog).getByText(/Consent must never be changed/)).toBeInTheDocument()
})

it('confirms and requests a password reset email without exposing a new password', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  renderAdmin('/admin/users', <AdminUsersPage />)
  await waitFor(() => expect(screen.getByText('Candidate One')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: /View profile/i }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Send reset email' })).toBeInTheDocument())

  fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }))

  await waitFor(() => expect(adminApi.sendPasswordReset).toHaveBeenCalledWith('candidate-1'))
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining('candidate@example.com'))
  expect(screen.getByRole('status')).toHaveTextContent('Password reset email requested')
  confirm.mockRestore()
})

it('renders administrator access history', async () => {
  renderAdmin('/admin/activity', <AdminActivityPage />)
  await waitFor(() => expect(screen.getByText('response detail view')).toBeInTheDocument())
  expect(screen.getByText('Test: WAT')).toBeInTheDocument()
})
