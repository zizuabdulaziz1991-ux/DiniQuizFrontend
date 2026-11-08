export interface Category {
  id: number
  name: string
  slug: string
  description: string
  color: string
  icon: string
  question_count: number
}

export interface SessionStart {
  session_id: string
  token: string
  category: string
  total_questions: number
  time_limit_seconds: number
}

export interface Choice {
  id: number
  text: string
}

export interface Question {
  id: number
  text: string
  arabic_text: string | null
  choices: Choice[]
}

export interface CurrentQuestion {
  index: number
  total: number
  question: Question
  remaining_ms: number
  score: number
}

export interface AnswerResult {
  is_correct: boolean
  correct_choice_id: number
  points: number
  total_score: number
  explanation: string | null
  is_last: boolean
}

export interface QuizResult {
  score: number
  correct_count: number
  wrong_count: number
  empty_count: number
  max_score: number
  rank_preview: number
}

export interface NameResult {
  rank: number
  in_top_10: boolean
}

export interface LeaderboardEntry {
  rank: number
  player_name: string
  /** Sıralamada kullanılan puan (toplam modunda total_score ile aynı). */
  score: number
  total_score?: number
  best_score?: number
  games_played?: number
  finished_at: string
}

export interface Leaderboard {
  category: string | null
  /** 'total': aynı isimli oyuncunun oyunları toplanır. */
  mode?: string
  entries: LeaderboardEntry[]
}
