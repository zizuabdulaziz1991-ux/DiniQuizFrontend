import { defineStore } from 'pinia'
import * as api from '@/api/quiz'
import { currentLocale } from '@/i18n'
import { clearSession, loadSession, saveSession } from '@/api/client'
import type { AnswerResult, CurrentQuestion, QuizResult } from '@/types/api'

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    sessionId: null as string | null,
    totalQuestions: 20,
    timeLimit: Number(import.meta.env.VITE_TIME_LIMIT_SECONDS ?? 30),
    current: null as CurrentQuestion | null,
    lastAnswer: null as AnswerResult | null,
    score: 0,
    submitting: false,
    result: null as QuizResult | null,
    categorySlug: null as string | null,
  }),
  getters: {
    hasSession: (s) => !!s.sessionId,
  },
  actions: {
    restore() {
      const s = loadSession()
      if (s && !this.sessionId) this.sessionId = s.sessionId
      return !!this.sessionId
    },
    async start(slug: string) {
      const data = await api.startSession(slug, currentLocale())
      saveSession({ sessionId: data.session_id, token: data.token })
      this.sessionId = data.session_id
      this.totalQuestions = data.total_questions
      this.timeLimit = data.time_limit_seconds
      this.categorySlug = data.category
      this.current = null
      this.lastAnswer = null
      this.result = null
      this.score = 0
      return data.session_id
    },
    async loadCurrent() {
      if (!this.sessionId) throw new Error('no-session')
      this.lastAnswer = null
      this.current = await api.getCurrent(this.sessionId)
      this.score = this.current.score
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
