import { ArrowLeft, Check, Clock3, Lightbulb, Play, RotateCcw, Send, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TESTS, WAT_WORDS, WRITING_PROMPTS } from '../data/tests'
import { useApp } from '../state/AppContext'

function SessionHeader({ test, step, total }) {
  return <header className="session-header"><Link to="/practice" aria-label="Exit practice"><X/></Link><div><span>{test.name}</span><h1>{test.title}</h1></div>{total && <strong>{step}/{total}</strong>}</header>
}

function Result({ test, score, detail, onAgain }) {
  const navigate = useNavigate()
  return <div className="session-page"><SessionHeader test={test}/><main className="result-panel"><span className="result-check"><Check/></span><p className="eyebrow">Practice complete</p><strong className="big-score">{score}</strong><span className="out-of">/ 10</span><h2>Session saved</h2><p>{detail}</p><div className="result-actions"><button className="secondary-button" onClick={onAgain}><RotateCcw/> Practice again</button><button className="primary-button" onClick={() => navigate('/history')}>View history</button></div></main></div>
}

function WatSession({ test }) {
  const TestIcon = test.icon
  const { addAttempt, settings } = useApp(); const [phase, setPhase] = useState('setup'); const [secondsPerWord, setSecondsPerWord] = useState(15); const [index, setIndex] = useState(0); const [left, setLeft] = useState(secondsPerWord); const [response, setResponse] = useState(''); const [answers, setAnswers] = useState([]); const [score, setScore] = useState(null); const inputRef = useRef(null); const responseRef = useRef('')
  const finish = (finalAnswers) => { const complete = finalAnswers.filter((item) => item.response.trim()).length; const clear = finalAnswers.filter((item) => item.response.trim().split(/\s+/).length >= 3).length; const nextScore = Math.min(9.2, Math.max(3.5, 4.2 + complete * .32 + clear * .18)).toFixed(1); setScore(nextScore); addAttempt({ type: 'WAT', duration: `${Math.ceil(secondsPerWord * WAT_WORDS.length / 60)} min`, score: Number(nextScore) }); setPhase('result') }
  const submitWord = () => { const nextAnswers = [...answers, { word: WAT_WORDS[index], response: responseRef.current }]; setAnswers(nextAnswers); setResponse(''); responseRef.current = ''; if (index === WAT_WORDS.length - 1) finish(nextAnswers); else { setIndex((value) => value + 1); setLeft(secondsPerWord) } }
  useEffect(() => { if (phase !== 'active') return; inputRef.current?.focus(); const timer = setInterval(() => setLeft((value) => { if (value <= 1) { setTimeout(submitWord, 0); return secondsPerWord } return value - 1 }), 1000); return () => clearInterval(timer) }, [phase, index])
  useEffect(() => { if (settings.sounds && phase === 'active' && left === 5) { try { const ctx = new AudioContext(); const osc = ctx.createOscillator(); osc.connect(ctx.destination); osc.frequency.value = 520; osc.start(); osc.stop(ctx.currentTime + .08) } catch {} } }, [left, phase, settings.sounds])
  if (phase === 'result') return <Result test={test} score={score} detail={`You answered ${answers.filter((item) => item.response).length} of ${WAT_WORDS.length} prompts. Keep each response concise, constructive, and action-oriented.`} onAgain={() => { setPhase('setup'); setIndex(0); setAnswers([]); setScore(null) }}/>
  if (phase === 'setup') return <div className="session-page"><SessionHeader test={test}/><main className="setup-panel"><div className="setup-banner teal"><TestIcon/><div><p>Timed practice</p><h2>10 words · {secondsPerWord} seconds each</h2></div></div><section className="setup-section"><h3>Test settings</h3><label className="range-label"><span>Seconds per word</span><output>{secondsPerWord}s</output></label><input type="range" min="10" max="20" value={secondsPerWord} onChange={(e) => setSecondsPerWord(Number(e.target.value))}/><div className="range-ends"><span>10s — hard</span><span>20s — relaxed</span></div></section><section className="instruction-box"><Lightbulb/><div><strong>First constructive thought</strong><p>Write a short phrase or sentence for every word. Do not overthink the response.</p></div></section><button className="primary-button full" onClick={() => { setLeft(secondsPerWord); setPhase('active') }}><Play/> Start test</button></main></div>
  return <div className="session-page"><SessionHeader test={test} step={index + 1} total={WAT_WORDS.length}/><main className="active-test"><div className="session-progress"><i style={{ width: `${index / WAT_WORDS.length * 100}%` }}/></div><span className={`countdown ${left <= 5 ? 'urgent' : ''}`}><Clock3/> {left}s</span><p className="stimulus-word">{WAT_WORDS[index]}</p><textarea ref={inputRef} value={response} onChange={(e) => { setResponse(e.target.value); responseRef.current = e.target.value }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitWord() } }} maxLength="240" placeholder="Write your immediate response…"/><button className="primary-button full" onClick={submitWord}>{index === WAT_WORDS.length - 1 ? 'Finish test' : 'Next word'} <Send/></button></main></div>
}

function WritingSession({ test }) {
  const TestIcon = test.icon
  const { addAttempt } = useApp(); const [phase, setPhase] = useState('setup'); const [response, setResponse] = useState(''); const [seconds, setSeconds] = useState(test.id === 'sct' ? 60 : 240); const [score, setScore] = useState(null)
  const wordCount = useMemo(() => response.trim() ? response.trim().split(/\s+/).length : 0, [response])
  useEffect(() => { if (phase !== 'active') return; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer) }, [phase])
  const complete = () => { if (wordCount < 8) return; const next = Math.min(9, 4.8 + Math.min(wordCount / 22, 4.2)).toFixed(1); setScore(next); addAttempt({ type: test.name, duration: `${Math.ceil((test.id === 'sct' ? 60 : 240) - seconds)} sec`, score: Number(next) }); setPhase('result') }
  if (phase === 'result') return <Result test={test} score={score} detail={`Your ${wordCount}-word response shows a clear starting point. Review it for initiative, practical action, and a believable positive outcome.`} onAgain={() => { setPhase('setup'); setResponse(''); setSeconds(test.id === 'sct' ? 60 : 240) }}/>
  if (phase === 'setup') return <div className="session-page"><SessionHeader test={test}/><main className="setup-panel"><div className={`setup-banner ${test.color}`}><TestIcon/><div><p>Focused writing</p><h2>{test.duration} guided practice</h2></div></div><section className="setup-section"><h3>What to practice</h3><p>{test.description}</p></section><section className="instruction-box"><Lightbulb/><div><strong>Keep it practical</strong><p>Show observable action, sound judgment, and a clear conclusion rather than abstract claims.</p></div></section><button className="primary-button full" onClick={() => setPhase('active')}><Play/> Begin practice</button></main></div>
  return <div className="session-page"><SessionHeader test={test}/><main className="active-test writing-test"><div className="session-progress"><i style={{ width: `${Math.max(2, 100 - seconds / (test.id === 'sct' ? 60 : 240) * 100)}%` }}/></div><span className={`countdown ${seconds <= 15 ? 'urgent' : ''}`}><Clock3/> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span><div className="prompt-card"><span>Prompt</span><p>{WRITING_PROMPTS[test.id]}</p></div><textarea autoFocus value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Begin your response…"/><div className="writing-meta"><span>{wordCount} words</span>{wordCount < 8 && <span>Add at least {8 - wordCount} more</span>}</div><button className="primary-button full" disabled={wordCount < 8} onClick={complete}>Complete practice <Check/></button></main></div>
}

export default function PracticeSessionPage() {
  const { testId } = useParams(); const test = TESTS.find((item) => item.id === testId)
  if (!test) return <div className="not-found"><h1>Test not found</h1><Link to="/practice"><ArrowLeft/> Back to practice</Link></div>
  return test.id === 'wat' ? <WatSession test={test}/> : <WritingSession test={test}/>
}
