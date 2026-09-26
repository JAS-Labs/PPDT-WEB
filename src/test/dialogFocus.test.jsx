import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { useState } from 'react'
import useDialogFocus from '../components/useDialogFocus'

function Dialog({ close }) {
  const ref = useDialogFocus(close)
  return <div ref={ref} tabIndex={-1} role="dialog" aria-label="Review"><button onClick={close}>Close</button><button>Last action</button></div>
}
function Harness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Review attempt</button>{open && <Dialog close={() => setOpen(false)} />}</>
}
afterEach(cleanup)

it('keeps Tab inside the dialog and returns focus after Escape', () => {
  render(<Harness />)
  const opener = screen.getByText('Review attempt')
  opener.focus()
  fireEvent.click(opener)
  expect(screen.getByText('Close')).toHaveFocus()
  fireEvent.keyDown(screen.getByText('Close'), { key: 'Tab', shiftKey: true })
  expect(screen.getByText('Last action')).toHaveFocus()
  fireEvent.keyDown(screen.getByText('Last action'), { key: 'Tab' })
  expect(screen.getByText('Close')).toHaveFocus()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener).toHaveFocus()
})
