import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, afterEach } from 'vitest'
import OlqRadarChart from '../components/OlqRadarChart'

const MOCK_SCORES = {
  LDR: 8.5,
  EMS: 7.8,
  SOI: 8.0,
  DEM: 8.2,
  POO: 8.6,
  MNT: 7.9,
  COM: 8.1,
  MOI: 8.8,
  SOR: 8.4,
}

describe('OlqRadarChart', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders radar SVG chart with 9 dimensions and ISSB benchmark ring', () => {
    render(<OlqRadarChart scores={MOCK_SCORES} title="Assessor Radar Profile" />)

    expect(screen.getByRole('heading', { name: 'Assessor Radar Profile' })).toBeInTheDocument()
    expect(screen.getByText(/Evaluated against the official ISSB Board Qualifying Standard/i)).toBeInTheDocument()

    // 9 dimensions should be visible on radar
    expect(screen.getAllByText('LDR').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('EMS').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('SOI').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('DEM').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('POO').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('MNT').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('COM').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('MOI').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('SOR').length).toBeGreaterThanOrEqual(1)

    // Benchmark legend should be present
    expect(screen.getByText(/ISSB Board Standard \(7.0\)/i)).toBeInTheDocument()
  })

  it('displays tactical summary strip with top quality, focus area, and OLQ mean', () => {
    render(<OlqRadarChart scores={MOCK_SCORES} />)

    // Top quality is MOI (8.8)
    expect(screen.getByText('Top Quality')).toBeInTheDocument()
    expect(screen.getByText(/MOI · Moral Integrity/i)).toBeInTheDocument()

    // Developmental focus is EMS (7.8)
    expect(screen.getByText('Developmental Focus')).toBeInTheDocument()
    expect(screen.getByText(/EMS · Emotional Stability/i)).toBeInTheDocument()

    // Composite OLQ index
    expect(screen.getByText('Composite OLQ Index')).toBeInTheDocument()
    expect(screen.getByText('Psychometric Balance')).toBeInTheDocument()
  })

  it('allows toggling between Radar Chart, Dimension Cards, and Dual View modes', async () => {
    const user = userEvent.setup()
    render(<OlqRadarChart scores={MOCK_SCORES} />)

    // Initially in Radar view
    expect(screen.queryByText('Pacing in opening sentences')).not.toBeInTheDocument()

    // Click Dimension Cards tab
    const matrixBtn = screen.getByRole('tab', { name: /Dimension Cards/i })
    await user.click(matrixBtn)

    // Dimension cards should now be rendered with descriptors
    expect(screen.getByText('Ability to lead, inspire, and take initiative.')).toBeInTheDocument()
    expect(screen.getByText('Composure and psychological balance under pressure.')).toBeInTheDocument()

    // Click Dual View tab
    const dualBtn = screen.getByRole('tab', { name: /Dual View/i })
    await user.click(dualBtn)

    // Both SVG and cards are rendered
    expect(screen.getByRole('img', { name: /9-dimensional OLQ radar psychometric chart/i })).toBeInTheDocument()
    expect(screen.getByText('Ability to lead, inspire, and take initiative.')).toBeInTheDocument()
  })

  it('renders inspector card with tactical details and benchmark delta when dimension is selected', async () => {
    const user = userEvent.setup()
    render(
      <OlqRadarChart
        scores={{
          ...MOCK_SCORES,
          LDR: { score: 9.0, evidence: 'Candidate took command of rescue operation' },
        }}
      />
    )

    // Inspector card displays top dimension details
    expect(screen.getByText(/Exceeds ISSB Qualifying Threshold/i)).toBeInTheDocument()

    // Click on LDR axis label
    const ldrLabels = screen.getAllByText('LDR')
    await user.click(ldrLabels[0])

    // Evidence quote should be visible in inspector
    expect(screen.getByText(/Candidate took command of rescue operation/i)).toBeInTheDocument()
  })

  it('returns null gracefully when scores are empty or null', () => {
    const { container: c1 } = render(<OlqRadarChart scores={null} />)
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(<OlqRadarChart scores={{}} />)
    expect(c2).toBeEmptyDOMElement()
  })
})
