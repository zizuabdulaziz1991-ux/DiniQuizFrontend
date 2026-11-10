import { http } from './client'
import { getPlayerId } from '@/utils/playerId'
import type {
  DuelAnswerResult,
  DuelCreated,
  DuelJoined,
  DuelState,
} from '@/types/api'

const auth = (token: string) => ({ headers: { 'X-Duel-Token': token } })

export const createDuel = (body: {
  category: string
  level: number
  language: string
  player_name: string
}) => http.post<DuelCreated>('/duels/', { ...body, player_id: getPlayerId() }).then((r) => r.data)

export const joinDuel = (code: string, playerName: string, language: string) =>
  http
    .post<DuelJoined>(`/duels/${code}/join/`, {
      player_id: getPlayerId(),
      player_name: playerName,
      language,
    })
    .then((r) => r.data)

/** Yoklama isteği: gizli yeniden deneme yapılmaz (__retry), bir sonraki yoklama zaten gelir. */
export const getDuel = (code: string, token: string) =>
  http.get<DuelState>(`/duels/${code}/`, { ...auth(token), __retry: 99 }).then((r) => r.data)

export const answerDuel = (
  code: string,
  token: string,
  questionId: number,
  choiceId: number | null,
) =>
  http
    .post<DuelAnswerResult>(
      `/duels/${code}/answer/`,
      { question_id: questionId, choice_id: choiceId },
      auth(token),
    )
    .then((r) => r.data)
