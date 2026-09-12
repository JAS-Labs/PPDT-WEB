import { BadgeCheck, BookOpenText, Image, MessageSquareText, ScanText } from 'lucide-react'

export const TESTS = [
  { id: 'ppdt', name: 'PPDT', title: 'Picture Perception & Description', description: 'Observe a scene, then write a complete story with a central character, action, and positive outcome.', icon: Image, color: 'navy', duration: '5 min' },
  { id: 'wat', name: 'WAT', title: 'Word Association Test', description: 'Respond to stimulus words against the clock and practice clear, constructive thinking.', icon: MessageSquareText, color: 'teal', duration: '3 min' },
  { id: 'tat', name: 'TAT', title: 'Thematic Apperception Test', description: 'Create purposeful stories from ambiguous situations to exercise judgment and initiative.', icon: BookOpenText, color: 'green', duration: '6 min' },
  { id: 'sdt', name: 'SDT', title: 'Self Description Test', description: 'Describe yourself from several perspectives and examine consistency and self-awareness.', icon: BadgeCheck, color: 'blue', duration: '8 min' },
  { id: 'sct', name: 'SCT', title: 'Sentence Completion Test', description: 'Complete unfinished sentences quickly with honest, constructive thoughts.', icon: ScanText, color: 'violet', duration: '4 min' },
]

export const WAT_WORDS = ['Courage', 'Team', 'Failure', 'Duty', 'Change', 'Pressure', 'Leader', 'Risk', 'Service', 'Future']

export const WRITING_PROMPTS = {
  ppdt: 'A group discovers that their planned route has become unsafe shortly before an important journey. Write a story that explains the situation, the central character’s decision, and the outcome.',
  tat: 'A young person stands outside a community hall after a difficult meeting. Write the story you imagine, including what led to this moment and what happens next.',
  sdt: 'Describe how your parents, teachers, friends, and you see your strengths and areas for growth.',
  sct: 'Complete this thought: When a difficult responsibility is given to me, I…',
}

export const INITIAL_HISTORY = [
  { id: 'seed-1', type: 'PPDT', date: 'Today', duration: '04:30', score: 8.3, status: 'Completed' },
  { id: 'seed-2', type: 'PPDT', date: '2 days ago', duration: '05:10', score: 1.1, status: 'Completed' },
]
