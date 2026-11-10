export interface Category {
  id: number
  name: string
  slug: string
  description: string
  color: string
  icon: string
  question_count: number
  /** Kategorideki seviye sayısı (10). */
  level_count?: number
}

export type LevelStatus = 'unlocked' | 'completed' | 'locked' | 'empty'

export interface LevelInfo {
  level: number
  status: LevelStatus
  question_count: number
  best_correct?: number
  attempts?: number
}

export interface LevelsResponse {
  category: string
  level_count: number
  questions_per_level: number
  levels: LevelInfo[]
}

export interface LanguageInfo {
  code: string
  name: string
}

export interface LanguagesResponse {
  default: string
  detected: string
  languages: LanguageInfo[]
}

export interface SessionStart {
  session_id: string
  token: string
  category: string
  language?: string
  level?: number
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
  level?: number
  index: number
  total: number
  question: Question
  remaining_ms: number
  score: number
}

/** Yanlış/boş bırakılan soru: test sonunda doğrusu bulunana kadar tekrar sorulur. */
export interface ReviewItem {
  question: Question
  correctChoiceId: number
  explanation: string | null
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
  total_questions?: number
  level?: number
  /** Tüm sorular doğru (%100). */
  perfect?: boolean
  level_passed?: boolean
  /** perfect ise sonraki seviye numarası; yoksa null. */
  next_level?: number | null
  /** Bu oyunla sonraki seviye YENİ açıldıysa true. */
  newly_unlocked?: boolean
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

// ---- 2 kişilik yarış (düello)
export type DuelPhase = 'waiting' | 'countdown' | 'question' | 'reveal' | 'finished'

export interface DuelPlayerView {
  role?: 'host' | 'guest'
  name: string | null
  answered: boolean
  correct: number
  points: number
  /** Rakip son 10 sn içinde yoklama yaptı mı. */
  connected?: boolean
}

export interface DuelReveal {
  index: number
  correct_choice_id: number
  explanation: string | null
  my_choice_id: number | null
  opponent_choice_id: number | null
  my_correct: boolean
  opponent_correct: boolean
  my_points: number
  opponent_points: number
}

export interface DuelResult {
  winner: 'me' | 'opponent' | 'draw'
  me: { correct: number; points: number }
  opponent: { correct: number; points: number }
}

export interface DuelState {
  code: string
  status: 'waiting' | 'active' | 'finished' | 'expired'
  phase: DuelPhase
  category: string
  level: number
  total_questions: number
  time_limit_seconds: number
  starts_in_ms: number | null
  index: number
  question: Question | null
  remaining_ms: number | null
  me: DuelPlayerView
  opponent: DuelPlayerView
  reveal: DuelReveal | null
  result: DuelResult | null
}

export interface DuelCreated {
  code: string
  role: 'host' | 'guest'
  token: string
  status: string
  category: string
  level: number
  total_questions: number
  time_limit_seconds: number
  expires_in_seconds: number
}

export interface DuelJoined {
  code: string
  role: 'host' | 'guest'
  token: string
  status: string
}

export interface DuelAnswerResult {
  is_correct: boolean
  correct_choice_id: number
  points: number
  explanation: string | null
}
