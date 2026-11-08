import { Capacitor } from '@capacitor/core'
import { http } from './client'
import type {
  AnswerResult,
  Category,
  CurrentQuestion,
  Leaderboard,
  LanguagesResponse,
  NameResult,
  QuizResult,
  SessionStart,
} from '@/types/api'

/** Backend'e hangi platformdan oynandığını bildirir: web | android | ios. */
function platform(): 'web' | 'android' | 'ios' {
  const p = Capacitor.getPlatform()
  return p === 'android' || p === 'ios' ? p : 'web'
}

/** Sunucu uyuyorsa uyandırmak için; sonucu önemsemeyiz. */
export const warmUp = () =>
  http
    .get('/health/')
    .then(() => true)
    .catch(() => false)

export const getLanguages = () =>
  http.get<LanguagesResponse>('/languages/').then((r) => r.data)

export const getCategories = (lang?: string) =>
  http.get<Category[]>('/categories/', { params: { lang } }).then((r) => r.data)

export const startSession = (category: string, language: string) =>
  http
    .post<SessionStart>('/sessions/', { category, platform: platform(), language })
    .then((r) => r.data)

export const getCurrent = (id: string) =>
  http.get<CurrentQuestion>(`/sessions/${id}/current/`).then((r) => r.data)

export const sendAnswer = (id: string, questionId: number, choiceId: number | null) =>
  http
    .post<AnswerResult>(`/sessions/${id}/answer/`, {
      question_id: questionId,
      choice_id: choiceId,
    })
    .then((r) => r.data)

export const getResult = (id: string) =>
  http.get<QuizResult>(`/sessions/${id}/result/`).then((r) => r.data)

export const saveName = (id: string, playerName: string) =>
  http.post<NameResult>(`/sessions/${id}/name/`, { player_name: playerName }).then((r) => r.data)

export const getLeaderboard = (category?: string) =>
  http
    .get<Leaderboard>('/leaderboard/', { params: { category, limit: 10 } })
    .then((r) => r.data)
