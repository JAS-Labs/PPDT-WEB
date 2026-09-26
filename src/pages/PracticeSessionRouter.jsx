import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import PpdtSession from '../features/practice/PpdtSession'
import SdtSession from '../features/practice/SdtSession'
import TatSession from '../features/practice/TatSession'
import TimedPromptSession from '../features/practice/TimedPromptSession'
import { TESTS } from '../data/tests'

export default function PracticeSessionRouter() {
  const { testId } = useParams()
  const test = TESTS.find((item) => item.id === testId)
  if (!test) return <div className="not-found"><h1>Test not found</h1><Link to="/practice"><ArrowLeft/> Back to practice</Link></div>
  if (testId === 'ppdt') return <PpdtSession test={test}/>
  if (testId === 'wat') return <TimedPromptSession key="wat" test={test} mode="wat"/>
  if (testId === 'tat') return <TatSession test={test}/>
  if (testId === 'sdt') return <SdtSession test={test}/>
  return <TimedPromptSession key="sct" test={test} mode="sct"/>
}
