import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AppProvider } from '../state/AppContext'
import { authApi, historyApi, practiceApi, analyticsApi, getAllHistory } from '../services/liveApi'

vi.mock('../services/liveApi', () => ({
  authApi: {
    login: vi.fn(async () => ({ access_token: 'live-token', user: { name: 'Test User' } })),
    signup: vi.fn(async () => ({ access_token: 'new-token', user: { name: 'New User' } })),
    logout: vi.fn(async () => ({ success: true })),
    profile: vi.fn(),
  },
  practiceApi: {
    getPpdtImage: vi.fn(async () => ({ id: 'ppdt-live-1', url: '/live-ppdt.jpg', difficulty_level: 'medium' })),
    submitPpdt: vi.fn(async () => ({
      session_id: 'ppdt-session',
      feedback: {
        overall_score: 8.1,
        recommendation: 'Keep the interpretation grounded.',
        spot_feedback: { score: 8.0, assessment: 'Clear observation of two volunteers.', characters_identified: 2 },
        action_feedback: { score: 7.8, theme_clarity: 'Focused flood rescue coordination.', relevance: 'high' },
        story_feedback: { score: 8.5, structure: 'Well-structured narrative with beginning, middle, and end.', outcome_assessment: 'positive' },
        red_flags: { aggression: false, hopelessness: false, antisocial: false, dishonesty: false, mental_health_concern: false },
        olq_scores: { LDR: { score: 8.5, evidence: 'Hero organized team' } },
        assessor_confidence: 'high',
        composite_score: 8.2,
      }
    })),
    getWatWords: vi.fn(async () => ({ words: ['Courage', 'Team'], set_code: 'A' })),
    submitWat: vi.fn(async () => ({ session_id: 'wat-session', feedback: { overall_score: 7.8, recommendation: 'Use specific responses.' } })),
    getTatImage: vi.fn(async () => ({ images: [{ id: 'tat-live-1', url: '/live-tat.jpg', difficulty_level: 'medium' }], set_code: 'B' })),
    submitTat: vi.fn(async () => ({ session_id: 'tat-session', feedback: { overall_score: 8.2, recommendation: 'Make the outcome more concrete.' } })),
    getSdtPrompts: vi.fn(async () => ({ prompts: ['How would your parents describe you?', 'How would your teachers describe you?', 'How would your friends describe you?', 'How do you describe yourself?', 'Who do you want to become?'], total_time_seconds: 900, set_code: 'C' })),
    submitSdt: vi.fn(async () => ({ session_id: 'sdt-session', feedback: { overall_score: 7.9, recommendation: 'Add behavioral examples.' } })),
    getSctStems: vi.fn(async () => ({ stems: ['When I face a difficult problem', 'My greatest strength is'], set_code: 'A' })),
    submitSct: vi.fn(async () => ({ session_id: 'sct-session', feedback: { overall_score: 7.7, recommendation: 'Be more personal.' } })),
    getImageResponses: vi.fn(async () => ({ total_responses: 1, responses: [{ response_id: 1, story_text: 'Community candidate story', overall_score: 7.5 }] })),
    getTatImageResponses: vi.fn(async () => ({ total_responses: 1, responses: [{ response_id: 1, story_text: 'Community TAT story', overall_score: 8.0 }] })),
  },
  analyticsApi: {
    getOverallJudge: vi.fn(async () => ({
      overall_readiness_score: 8.4,
      estimated_issb_readiness: 'Recommended',
      confidence_level: 'high',
      personality_profile_summary: 'Displays high initiative, emotional composure, and strong leadership.',
      key_strengths_across_tests: ['Proactive decision making', 'Constructive story framing'],
      areas_needing_improvement: ['Pacing under 15s WAT limit'],
      consistency_analysis: 'High narrative consistency across projective and descriptive tests.',
      final_recommendation: 'Maintain current preparation pace.',
    })),
    getAverages: vi.fn(async () => [
      { test_type: 'ppdt', total_attempts: 24, average_score: 7.2, median_score: 7.0, best_score: 8.9 }
    ]),
    getPercentile: vi.fn(async () => ({
      test_type: 'ppdt', score: 7.5, percentile: 85.0, total_candidates: 120, rank_description: 'Exceptional - Top 15%'
    })),
  },
  historyApi: {
    exportHistory: vi.fn(async () => ({ ppdt: [], wat: [], tat: [], sdt: [], sct: [], exported_at: '2026-09-21' })),
    getSession: vi.fn(),
  },
  getAllHistory: vi.fn(async () => [
    {
      id: 'live-history-1',
      type: 'PPDT',
      date: 'Sep 12, 2026',
      duration: '5 min',
      score: 8.1,
      status: 'Completed',
      feedback: {
        overall_score: 8.1,
        recommendation: 'Keep the interpretation grounded.',
        psychological_analysis: 'Shows high autonomy and ethical duty.',
        spot_feedback: { score: 8.0, assessment: 'Clear observation of two volunteers.' },
        action_feedback: { score: 7.8, theme_clarity: 'Focused flood rescue coordination.' },
        story_feedback: { score: 8.5, structure: 'Well-structured narrative.' },
        red_flags: { aggression: true, flag_details: 'Mild aggressive tone noted in confrontation.' },
        olq_scores: {
          LDR: { score: 8.5, evidence: 'Hero stepped forward', confidence: 'high' }
        },
        emotional_stability: 'Calm under sudden emergencies',
        leadership_potential: 'Initiates community organization'
      },
      storyText: 'A story about a brave rescue team.',
      spotText: 'Two volunteers in uniform.',
      actionText: 'Coordinating emergency relief.'
    }
  ]),
}))

function renderAt(path, authenticated = false) {
  if (authenticated) localStorage.setItem('issb-token', 'test-token')
  return render(<MemoryRouter initialEntries={[path]}><AppProvider><App/></AppProvider></MemoryRouter>)
}

afterEach(() => {
  cleanup(); localStorage.clear(); sessionStorage.clear(); vi.clearAllMocks()
})

describe('application routes', () => {
  it.each([
    ['/', 'Your readiness', true],
    ['/landing', 'Prepare with focus.Progress with clarity.', false],
    ['/practice', 'Practice', true],
    ['/analytics', 'Psychological analytics', true],
    ['/history', 'Practice history', true],
    ['/guide', 'AI evaluation guide', true],
    ['/profile', 'Profile', true],
    ['/login', 'Sign in to continue', false],
  ])('renders %s', (route, heading, authenticated) => {
    renderAt(route, authenticated)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('renders landing page at root for unauthenticated visitors when guest mode is disabled', () => {
    renderAt('/', false)
    expect(screen.getByRole('heading', { name: /Prepare with focus.Progress with clarity./i })).toBeInTheDocument()
  })

  it('protects live tests behind account sign-in', () => {
    renderAt('/practice/ppdt')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })

  it('protects practice route behind account sign-in', () => {
    renderAt('/practice')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })

  it('protects guide route behind account sign-in', () => {
    renderAt('/guide')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })

  it('protects profile route behind account sign-in', () => {
    renderAt('/profile')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })

  it('protects analytics route behind account sign-in', () => {
    renderAt('/analytics')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })

  it('protects history route behind account sign-in', () => {
    renderAt('/history')
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })
})

describe('live practice integrations', () => {
  it('loads the PPDT image from the API, supports multi-step navigation, and renders section scores on finish', async () => {
    const user = userEvent.setup(); renderAt('/practice/ppdt', true)
    await user.click(screen.getByRole('button', { name: /load live test/i }))
    expect(await screen.findByRole('img', { name: /live ppdt/i })).toHaveAttribute('src', '/live-ppdt.jpg')
    expect(practiceApi.getPpdtImage).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: /skip to writing/i }))
    expect(screen.getByRole('heading', { name: 'Who and what do you notice?' })).toBeInTheDocument()

    // Test toggle of reference picture
    await user.click(screen.getByRole('button', { name: /view picture/i }))
    expect(screen.getByAltText('Reference assessment scene')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /hide picture/i }))
    expect(screen.queryByAltText('Reference assessment scene')).not.toBeInTheDocument()

    // Fill Spot section
    await user.type(screen.getByPlaceholderText(/write your spot response/i), 'Two relief workers evaluating a flood scene.')

    // Click Next section to navigate to Action (verifying ArrowLeft renders on step 2)
    await user.click(screen.getByRole('button', { name: /next section/i }))
    expect(screen.getByRole('heading', { name: 'What is the central action or theme?' })).toBeInTheDocument()

    // Click Previous to verify backward navigation with ArrowLeft icon
    await user.click(screen.getByRole('button', { name: /previous/i }))
    expect(screen.getByRole('heading', { name: 'Who and what do you notice?' })).toBeInTheDocument()

    // Go back to Action and fill it
    await user.click(screen.getByRole('button', { name: /next section/i }))
    await user.type(screen.getByPlaceholderText(/write your action response/i), 'Coordinating flood relief and evacuation.')

    // Navigate to Story and fill it
    await user.click(screen.getByRole('button', { name: /next section/i }))
    expect(screen.getByRole('heading', { name: 'Write the complete narrative' })).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText(/write your story response/i), 'A dedicated team organized safety shelters and led the community with calm resolve.')

    // All 3 required sections filled -> Finish PPDT is available
    const finishBtn = screen.getByRole('button', { name: /finish ppdt/i })
    expect(finishBtn).toBeInTheDocument()
    await user.click(finishBtn)

    // Result screen verification: Section scores, rubrics, and OLQs
    expect(await screen.findByText('Session saved')).toBeInTheDocument()
    expect(screen.getByText('Spot Characters')).toBeInTheDocument()
    expect(screen.getByText('Theme & Action')).toBeInTheDocument()
    expect(screen.getByText('Story Structure')).toBeInTheDocument()
    expect(screen.getByText(/Clear observation of two volunteers/)).toBeInTheDocument()
    expect(screen.getByText(/Focused flood rescue coordination/)).toBeInTheDocument()
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

  it('renders history returned by the live API and opens attempt review modal with red flags and deep insights', async () => {
    const user = userEvent.setup(); renderAt('/history', true)
    await waitFor(() => expect(screen.getByText('Sep 12, 2026')).toBeInTheDocument())
    expect(screen.getByText('Fetched from your live account.')).toBeInTheDocument()

    // Clicking the row opens the AttemptDetailModal
    await user.click(screen.getByText('Sep 12, 2026'))
    expect(await screen.findByText('Attempt Review')).toBeInTheDocument()
    expect(screen.getByText('A story about a brave rescue team.')).toBeInTheDocument()
    expect(screen.getByText(/Shows high autonomy and ethical duty/)).toBeInTheDocument()

    // Verify Red Flag Warning notice
    expect(screen.getByText('Psychometric Red Flag Warning')).toBeInTheDocument()
    expect(screen.getByText(/Mild aggressive tone noted in confrontation/)).toBeInTheDocument()

    // Verify Section rubrics
    expect(screen.getByText(/Clear observation of two volunteers/)).toBeInTheDocument()

    // Verify Test-Specific Deep Insights
    expect(screen.getByText('Emotional Stability')).toBeInTheDocument()
    expect(screen.getByText('Calm under sudden emergencies')).toBeInTheDocument()
  })
})

describe('analytics and evaluation guide features', () => {
  it('loads overall judge psychological report and benchmarks on /analytics', async () => {
    renderAt('/analytics', true)
    expect(screen.getByRole('heading', { name: 'Candidate Assessment & Progress' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Recommended/i)).toBeInTheDocument())
    expect(screen.getByText(/Displays high initiative, emotional composure/)).toBeInTheDocument()
    expect(analyticsApi.getOverallJudge).toHaveBeenCalled()
    expect(analyticsApi.getAverages).toHaveBeenCalled()
  })

  it('gracefully falls back to client psychometric synthesis when overall judge endpoint fails with error', async () => {
    analyticsApi.getOverallJudge.mockRejectedValueOnce(new Error('Failed to fetch'))
    renderAt('/analytics', true)
    expect(screen.getByRole('heading', { name: 'Candidate Assessment & Progress' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Local Psychometric Engine/i)).toBeInTheDocument())
    expect(screen.getByText(/Cumulative Officer Like Qualities/i)).toBeInTheDocument()
    expect(screen.getByText(/Cross-Test Battery Alignment/i)).toBeInTheDocument()
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument()
    expect(screen.getByText(/Remote AI Judge is currently unreachable/i)).toBeInTheDocument()
  })

  it('prevents race conditions: delayed remote AI failure does not wipe out local synthesis', async () => {
    // Simulate slow network failure where getOverallJudge rejects after history has loaded
    analyticsApi.getOverallJudge.mockImplementationOnce(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network timeout')), 25)
    }))

    renderAt('/analytics', true)
    await waitFor(() => expect(screen.getByText(/Local Psychometric Engine/i)).toBeInTheDocument())
    expect(screen.queryByText('Psychological Readiness Profile Locked')).not.toBeInTheDocument()
    expect(screen.getByText(/Cumulative Officer Like Qualities/i)).toBeInTheDocument()
  })

  it('renders interactive radar chart with view controls on /analytics', async () => {
    const user = userEvent.setup()
    renderAt('/analytics', true)
    await waitFor(() => expect(screen.getByText(/Cumulative Officer Like Qualities/i)).toBeInTheDocument())

    // Radar chart should be present
    expect(screen.getByRole('img', { name: /9-dimensional OLQ radar psychometric chart/i })).toBeInTheDocument()

    // Can toggle to dimension cards
    const cardsTab = screen.getByRole('tab', { name: /Dimension Cards/i })
    await user.click(cardsTab)
    expect(screen.getByText('Ability to lead, inspire, and take initiative.')).toBeInTheDocument()
  })

  it('displays locked dossier empty state without error banner when candidate has 0 test history and remote judge fails', async () => {
    analyticsApi.getOverallJudge.mockRejectedValueOnce(new Error('Failed to fetch'))
    getAllHistory.mockResolvedValueOnce([])
    renderAt('/analytics', true)
    await waitFor(() => expect(screen.getByText('Psychological Readiness Profile Locked')).toBeInTheDocument())
    expect(screen.getByText(/Begin First Psychological Test/i)).toBeInTheDocument()
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument()
    expect(screen.queryByText(/Complete practice attempts in PPDT/i)).not.toBeInTheDocument()
  })

  it('triggers re-evaluation when re-evaluate with AI button is clicked', async () => {
    const user = userEvent.setup()
    renderAt('/analytics', true)
    await waitFor(() => expect(screen.getByText(/Recommended/i)).toBeInTheDocument())
    const reEvalBtn = screen.getByRole('button', { name: /Re-evaluate with AI/i })
    await user.click(reEvalBtn)
    expect(analyticsApi.getOverallJudge).toHaveBeenCalledWith(true)
  })

  it('renders 9 Officer Like Qualities and test format criteria on /guide', async () => {
    const user = userEvent.setup(); renderAt('/guide', true)
    expect(screen.getByRole('heading', { name: 'AI Psychological Evaluation Guide' })).toBeInTheDocument()
    expect(screen.getByText('Official 10-Point Scoring Scale')).toBeInTheDocument()
    expect(screen.getByText('The 9 Officer Like Qualities')).toBeInTheDocument()

    // Switch to Test Formats tab
    await user.click(screen.getByRole('button', { name: /Test Formats & Criteria/i }))
    expect(screen.getByText(/Picture Perception & Description Test/)).toBeInTheDocument()
    expect(screen.getByText(/Word Association Test/)).toBeInTheDocument()
  })

  it('renders per-test breakdown cards and demographic info on /profile', async () => {
    renderAt('/profile', true)
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByText('Test Performance Breakdown')).toBeInTheDocument()
    expect(screen.getByText('PPDT')).toBeInTheDocument()
    expect(screen.getByText('WAT')).toBeInTheDocument()
    expect(screen.getByText('TAT')).toBeInTheDocument()
    expect(screen.getByText('SDT')).toBeInTheDocument()
    expect(screen.getByText('SCT')).toBeInTheDocument()
  })

  it('switches to create account mode on login page and defaults nationality to Bangladeshi', async () => {
    const user = userEvent.setup(); renderAt('/login', false)
    expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()

    // Click Create account
    await user.click(screen.getByRole('button', { name: /Create account/i }))
    expect(screen.getByRole('heading', { name: 'Create candidate account' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Ali Khan')).toBeInTheDocument()
    expect(screen.getByLabelText(/I agree that my anonymized responses/i)).toBeChecked()

    // Verify nationality defaults to Bangladeshi
    const nationalityInput = screen.getByLabelText(/Nationality/i)
    expect(nationalityInput).toHaveValue('Bangladeshi')
    expect(screen.getByPlaceholderText('e.g. Bangladeshi')).toBeInTheDocument()
  })

  it('successfully registers candidate with age, nationality, consent and navigates to dashboard', async () => {
    const user = userEvent.setup()
    renderAt('/login', false)

    await user.click(screen.getByRole('button', { name: /Create account/i }))

    await user.type(screen.getByPlaceholderText('e.g. Ali Khan'), 'Tariq Rahman')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'tariq@example.com')
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123!')

    const submitBtn = screen.getByRole('button', { name: /Create account & start/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(authApi.signup).toHaveBeenCalledWith({
        name: 'Tariq Rahman',
        email: 'tariq@example.com',
        password: 'Password123!',
        age: 21,
        nationality: 'Bangladeshi',
        research_consent: true,
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Your readiness')).toBeInTheDocument()
    })
  })

  it('validates password length and age constraints before sending signup request', async () => {
    const user = userEvent.setup()
    renderAt('/login', false)

    await user.click(screen.getByRole('button', { name: /Create account/i }))
    await user.type(screen.getByPlaceholderText('e.g. Ali Khan'), 'Tariq Rahman')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'tariq@example.com')
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), '1234')

    await user.click(screen.getByRole('button', { name: /Create account & start/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/Password must be at least 8 characters long/i)
    expect(authApi.signup).not.toHaveBeenCalled()
  })

  it('displays actionable diagnostic and retry button on registration network failure without raw Failed to fetch', async () => {
    authApi.signup.mockRejectedValueOnce(new Error('Failed to fetch'))
    const user = userEvent.setup()
    renderAt('/login', false)

    await user.click(screen.getByRole('button', { name: /Create account/i }))
    await user.type(screen.getByPlaceholderText('e.g. Ali Khan'), 'Tariq Rahman')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'tariq@example.com')
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123!')

    await user.click(screen.getByRole('button', { name: /Create account & start/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument()
    expect(screen.getByText(/Unable to connect to the authentication server/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()
  })

  it('renders registration form directly when navigating to /signup', async () => {
    renderAt('/signup', false)
    expect(screen.getByRole('button', { name: /Create account & start/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Ali Khan')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Bangladeshi')).toBeInTheDocument()
  })

  it('validates maximum length bounds on candidate registration inputs', async () => {
    const user = userEvent.setup()
    renderAt('/signup', false)

    const nameInput = screen.getByPlaceholderText('e.g. Ali Khan')
    expect(nameInput).toHaveAttribute('maxlength', '100')
    expect(screen.getByPlaceholderText('Min. 8 characters')).toHaveAttribute('maxlength', '128')
    expect(screen.getByPlaceholderText('e.g. Bangladeshi')).toHaveAttribute('maxlength', '100')

    fireEvent.change(nameInput, { target: { value: 'A'.repeat(101) } })
    await user.type(screen.getByPlaceholderText('you@example.com'), 'valid@example.com')
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123!')

    await user.click(screen.getByRole('button', { name: /Create account & start/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/Full name must be 100 characters or fewer/i)
    expect(authApi.signup).not.toHaveBeenCalled()
  })

  it('preserves specific offline error message without overwriting with waking up text', async () => {
    const offlineError = new Error('You are currently offline. Please check your internet connection and try again.')
    offlineError.isNetworkError = true
    authApi.signup.mockRejectedValueOnce(offlineError)

    const user = userEvent.setup()
    renderAt('/signup', false)

    await user.type(screen.getByPlaceholderText('e.g. Ali Khan'), 'Tariq Rahman')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'tariq@example.com')
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123!')

    await user.click(screen.getByRole('button', { name: /Create account & start/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/You are currently offline/i)
    })
    expect(screen.queryByText(/waking up from idle/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument()
  })

  it('switches to signin mode with informative notice if signup returns no access_token', async () => {
    authApi.signup.mockResolvedValueOnce({
      success: true,
      user: { name: 'Tariq Rahman', email: 'tariq@example.com' },
      access_token: null,
    })

    const user = userEvent.setup()
    renderAt('/signup', false)

    await user.type(screen.getByPlaceholderText('e.g. Ali Khan'), 'Tariq Rahman')
    await user.type(screen.getByPlaceholderText('you@example.com'), 'tariq@example.com')
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123!')

    await user.click(screen.getByRole('button', { name: /Create account & start/i }))

    await waitFor(() => {
      expect(screen.getByText(/Account created successfully! Please sign in/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Sign in to live practice/i })).toBeInTheDocument()
  })

  it('renders landing page with 5 core tests, OLQ rubrics, and action links', () => {
    renderAt('/landing', false)
    expect(screen.getByRole('heading', { name: /Prepare with focus.Progress with clarity./i })).toBeInTheDocument()
    expect(screen.getByText('Picture Perception & Description')).toBeInTheDocument()
    expect(screen.getByText('Word Association Test')).toBeInTheDocument()
    expect(screen.getByText('Thematic Apperception Test')).toBeInTheDocument()
    expect(screen.getByText('Self Description Test')).toBeInTheDocument()
    expect(screen.getByText('Sentence Completion Test')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A simple rhythm for better practice.' })).toBeInTheDocument()
    expect(screen.getByText('Example')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Start practicing|Create an account/i })[0]).toBeInTheDocument()
  })

  it('does not mention deepseek anywhere in dashboard or analytics pages', async () => {
    const { container: dashContainer } = renderAt('/', true)
    expect(dashContainer.textContent).not.toMatch(/deepseek/i)

    const { container: analyticsContainer } = renderAt('/analytics', true)
    await waitFor(() => expect(screen.getByText(/Recommended/i)).toBeInTheDocument())
    expect(analyticsContainer.textContent).not.toMatch(/deepseek/i)
    expect(screen.getByText(/Comprehensive AI Assessment/i)).toBeInTheDocument()
  })

  it('renders compact Build your streak section with header in sidebar without overlapping profile', () => {
    renderAt('/', true)
    expect(screen.getByText('Build your streak')).toBeInTheDocument()
    expect(screen.getByText('10 mins today keeps progress moving.')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Profile' })[0]).toBeInTheDocument()
  })

  it('sanitizes legacy guest profile from localStorage to default Candidate with Bangladeshi nationality', () => {
    localStorage.setItem('issb-profile', JSON.stringify({ name: 'Guest', email: '', verified: false, mode: 'guest' }))
    renderAt('/profile', true)
    expect(screen.queryByText(/Guest learner/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByText('Candidate Account')).toBeInTheDocument()
  })

  it('redirects authenticated visitors away from /login to dashboard', () => {
    renderAt('/login', true)
    // Should be redirected to Dashboard ('Your readiness')
    expect(screen.getByRole('heading', { name: 'Your readiness' })).toBeInTheDocument()
  })

  it('adapts landing page CTA buttons and test links when user is authenticated', () => {
    renderAt('/landing', true)
    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Open Practice Workspace/i })[0]).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Practice PPDT/i })).toHaveAttribute('href', '/practice/ppdt')
  })

  it('rejects corrupt or literal null/undefined/blank tokens and keeps routes protected', () => {
    for (const corrupt of ['null', 'undefined', '   ', '']) {
      localStorage.setItem('issb-token', corrupt)
      const { unmount } = renderAt('/practice', false)
      expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
      unmount()

      const { unmount: unmountProfile } = renderAt('/profile', false)
      expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
      unmountProfile()

      const { unmount: unmountGuide } = renderAt('/guide', false)
      expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
      unmountGuide()

      const { unmount: unmountRoot } = renderAt('/', false)
      expect(screen.getByRole('heading', { name: /Prepare with focus.Progress with clarity./i })).toBeInTheDocument()
      unmountRoot()
    }
  })

  it('allows authenticated user to sign out from profile page and redirects to login', async () => {
    const user = userEvent.setup()
    renderAt('/profile', true)
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    const signOutBtn = screen.getByRole('button', { name: /Sign out/i })
    expect(signOutBtn).toBeInTheDocument()

    await user.click(signOutBtn)
    expect(authApi.logout).toHaveBeenCalled()
    expect(localStorage.getItem('issb-token')).toBeNull()
    expect(await screen.findByRole('heading', { name: 'Sign in to continue' })).toBeInTheDocument()
  })

  it('directs unauthenticated visitors from landing page guide and practice links to login preserving state', () => {
    renderAt('/landing', false)
    const guideLinks = screen.getAllByRole('link', { name: /Evaluation Guide|Read OLQ Guide/i })
    expect(guideLinks[0]).toHaveAttribute('href', '/login')

    const practiceBtns = screen.getAllByRole('link', { name: /Start practicing|Create an account/i })
    expect(practiceBtns[0]).toHaveAttribute('href', '/signup')
  })
})
