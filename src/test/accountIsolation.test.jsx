import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AppProvider, useApp } from '../state/AppContext'
import { getAllHistory } from '../services/liveApi'

vi.mock('../services/liveApi', () => ({ getAllHistory: vi.fn() }))

function HistoryProbe() {
  const { history, refreshHistory } = useApp()
  return <><output>{history.map((item) => item.id).join(',') || 'empty'}</output><button onClick={refreshHistory}>Refresh</button></>
}

afterEach(() => { cleanup(); localStorage.clear(); vi.resetAllMocks() })

it('does not restore old account history after another tab signs out', async () => {
  localStorage.setItem('issb-token', 'old-account')
  let resolveHistory
  getAllHistory.mockImplementationOnce(() => new Promise((resolve) => { resolveHistory = resolve }))
  render(<AppProvider><HistoryProbe /></AppProvider>)
  await waitFor(() => expect(getAllHistory).toHaveBeenCalledOnce())
  act(() => {
    localStorage.removeItem('issb-token')
    window.dispatchEvent(new StorageEvent('storage', { key: 'issb-token' }))
  })
  await act(async () => { resolveHistory([{ id: 'private-old-attempt' }]) })
  expect(screen.getByRole('status')).toHaveTextContent('empty')
})

it('keeps the most recent history refresh when responses finish out of order', async () => {
  localStorage.setItem('issb-token', 'account')
  let resolveOld
  getAllHistory.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
  getAllHistory.mockResolvedValueOnce([{ id: 'new-attempt' }])
  render(<AppProvider><HistoryProbe /></AppProvider>)
  await act(async () => { screen.getByRole('button', { name: 'Refresh' }).click() })
  await act(async () => { resolveOld([{ id: 'old-attempt' }]) })
  expect(screen.getByRole('status')).toHaveTextContent('new-attempt')
})
