import { BadgeCheck, BookOpenText, Image, MessageSquareText, ScanText } from 'lucide-react'

export const TESTS = [
  { id: 'ppdt', name: 'PPDT', title: 'Picture Perception & Description', description: 'Observe a scene, then write a complete story with a central character, action, and positive outcome.', icon: Image, color: 'navy', duration: '5 min' },
  { id: 'wat', name: 'WAT', title: 'Word Association Test', description: 'Respond to stimulus words against the clock and practice clear, constructive thinking.', icon: MessageSquareText, color: 'teal', duration: '3 min' },
  { id: 'tat', name: 'TAT', title: 'Thematic Apperception Test', description: 'Create purposeful stories from ambiguous situations to exercise judgment and initiative.', icon: BookOpenText, color: 'green', duration: '6 min' },
  { id: 'sdt', name: 'SDT', title: 'Self Description Test', description: 'Describe yourself from several perspectives and examine consistency and self-awareness.', icon: BadgeCheck, color: 'blue', duration: '8 min' },
  { id: 'sct', name: 'SCT', title: 'Sentence Completion Test', description: 'Complete unfinished sentences quickly with honest, constructive thoughts.', icon: ScanText, color: 'violet', duration: '4 min' },
]

export const WRITING_PROMPTS = {
  ppdt: 'Study the scene, identify the people and situation, then build a coherent story around the action you perceive.',
  tat: 'Write the story you imagine from the scene, including what led to this moment, what the central character does, and what happens next.',
  sdt: 'Describe how your parents, teachers, friends, and you see your strengths and areas for growth.',
  sct: 'Complete this thought: When a difficult responsibility is given to me, I…',
}
