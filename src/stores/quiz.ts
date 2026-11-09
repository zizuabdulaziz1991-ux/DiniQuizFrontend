import { defineStore } from 'pinia'
import * as api from '@/api/quiz'
import { currentLocale } from '@/i18n'
import { clearSession, loadSession, saveSession } from '@/api/client'
import type { AnswerResult, CurrentQuestion, QuizResult, ReviewItem } from '@/types/api'

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    sessionId: null as string | null,
    totalQuestions: 10,
    timeLimit: Number(import.meta.env.VITE_TIME_LIMIT_SECONDS ?? 30),
    current: null as CurrentQuestion | null,
    lastAnswer: null as AnswerResult | null,
    score: 0,
    submitting: false,
    result: null as QuizResult | null,
    categorySlug: null as string | null,
    level: 1,
    mistakes: [] as ReviewItem[],
  }),
  getters: {
    hasSession: (s) => !!s.sessionId,
  },
  actions: {
    restore() {
      const s = loadSession()
      if (s && !this.sessionId) {
        this.sessionId = s.sessionId
        if (s.category) this.categorySlug = s.category
        if (s.level) this.level = s.level
      }
      return !!this.sessionId
    },
    async start(slug: string, level = 1) {
      const data = await api.startSession(slug, currentLocale(), level)
      const startedLevel = data.level ?? level
      saveSession({
        sessionId: data.session_id,
        token: data.token,
        category: data.category,
        level: startedLevel,
      })
      this.sessionId = data.session_id
      this.totalQuestions = data.total_questions
      this.timeLimit = data.time_limit_seconds
      this.categorySlug = data.category
      this.level = startedLevel
      this.current = null
      this.lastAnswer = null
      this.result = null
      this.score = 0
      this.mistakes = []
      return data.session_id
    },
    async loadCurrent() {
      if (!this.sessionId) throw new Error('no-session')
      this.lastAnswer = null
      this.current = await api.getCurrent(this.sessionId)
      this.score = this.current.score
      if (this.current.level) this.level = this.current.level
      return this.current
    },
    /** Çift gönderimi engeller; ikinci çağrı null döner. */
    async answer(choiceId: number | null) {
      if (this.submitting || !this.sessionId || !this.current) return null
      this.submitting = true
      try {
        const res = await api.sendAnswer(this.sessionId, this.current.question.id, choiceId)
        this.lastAnswer = res
        this.score = res.total_score
        return res
      } finally {
        this.submitting = false
      }
    },
    addMistake(item: ReviewItem) {
      this.mistakes.push(item)
    },
    resolveMistake() {
      this.mistakes.shift()
    },
    async loadResult() {
      if (!this.sessionId) throw new Error('no-session')
      this.result = await api.getResult(this.sessionId)
      return this.result
    },
    reset() {
      clearSession()
      this.$reset()
    },
  },
})
