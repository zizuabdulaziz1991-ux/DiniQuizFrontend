<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/stores/quiz'
import { apiStatus } from '@/api/client'
import { useCountdown } from '@/composables/useCountdown'
import TimerRing from '@/components/TimerRing.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ChoiceButton, { type ChoiceState } from '@/components/ChoiceButton.vue'
import ScorePop from '@/components/ScorePop.vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ sessionId: string }>()
const router = useRouter()
const { t } = useI18n()
const store = useQuizStore()

const feedbackDelay = Number(import.meta.env.VITE_FEEDBACK_DELAY_MS ?? 1500)
const labels = ['A', 'B', 'C', 'D']

const loading = ref(true)
const error = ref('')
const selectedId = ref<number | null>(null)
const allowLeave = ref(false)
let nextTimer: ReturnType<typeof setTimeout> | null = null

const { remainingMs, start: startTimer, stop: stopTimer } = useCountdown(() => submit(null))

const current = computed(() => store.current)
const answered = computed(() => store.lastAnswer !== null)

function choiceState(id: number): ChoiceState {
  const a = store.lastAnswer
  if (a) {
    if (id === a.correct_choice_id) return 'correct'
    if (id === selectedId.value) return 'wrong'
    return 'normal'
  }
  return id === selectedId.value ? 'selected' : 'normal'
}

async function leaveTo(path: string) {
  allowLeave.value = true
  await router.replace(path)
}

async function loadQuestion() {
  loading.value = true
  error.value = ''
  selectedId.value = null
  try {
    const c = await store.loadCurrent()
    startTimer(c.remaining_ms)
  } catch (e) {
    const st = apiStatus(e)
    if (st === 409) return leaveTo(`/sonuc/${props.sessionId}`)
    if (st === 403 || st === 404 || st === 410) {
      store.reset()
      return leaveTo('/kategoriler')
    }
    error.value = t('quiz.loadError')
  } finally {
    loading.value = false
  }
}

async function submit(choiceId: number | null) {
  if (store.submitting || answered.value || !current.value) return
  stopTimer()
  selectedId.value = choiceId
  try {
    const res = await store.answer(choiceId)
    if (!res) return
    nextTimer = setTimeout(() => {
      if (res.is_last) leaveTo(`/sonuc/${props.sessionId}`)
      else loadQuestion()
    }, feedbackDelay)
  } catch (e) {
    const st = apiStatus(e)
    if (st === 409) return loadQuestion() // zaten cevaplanmış, sıradakini al
    if (st === 410 || st === 403) {
      store.reset()
      return leaveTo('/kategoriler')
    }
    error.value = t('quiz.answerError')
  }
}

onBeforeRouteLeave(() => {
  if (allowLeave.value) return true
  return window.confirm(t('quiz.leaveConfirm'))
})

function warnUnload(e: BeforeUnloadEvent) {
  e.preventDefault()
}

onMounted(() => {
  if (!store.restore() || store.sessionId !== props.sessionId) {
    allowLeave.value = true
    router.replace('/kategoriler')
    return
  }
  window.addEventListener('beforeunload', warnUnload)
  loadQuestion()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnUnload)
  if (nextTimer) clearTimeout(nextTimer)
})
</script>

<template>
  <section class="flex flex-1 flex-col gap-4">
    <p v-if="loading && !current" class="m-auto font-bold text-muted">{{ t('common.loading') }}</p>

    <div v-if="error" class="card space-y-3 p-4 text-center">
      <p class="font-bold text-danger" role="alert">{{ error }}</p>
      <AppButton @click="current && !answered ? submit(selectedId) : loadQuestion()">{{ t('common.retry') }}</AppButton>
    </div>

    <template v-if="current">
      <p class="text-center text-xs font-extrabold uppercase tracking-wide text-primary">
        {{ t('quiz.level', { n: store.level }) }}
      </p>

      <header class="flex items-center gap-4">
        <div class="flex-1">
          <ProgressBar :index="current.index + 1" :total="current.total" />
        </div>
        <div class="relative text-right">
          <p class="text-xs font-bold text-muted">{{ t('quiz.score') }}</p>
          <p class="text-2xl font-black text-accent">{{ store.score }}</p>
          <ScorePop v-if="store.lastAnswer" :points="store.lastAnswer.points" />
        </div>
      </header>

      <div class="flex justify-center">
        <TimerRing :remaining-ms="remainingMs" :total-seconds="store.timeLimit" />
      </div>

      <div class="card p-5">
        <p v-if="current.question.arabic_text" class="arabic mb-3 text-3xl leading-loose" dir="rtl" lang="ar">
          {{ current.question.arabic_text }}
        </p>
        <h1 class="text-[20px] font-extrabold leading-snug">{{ current.question.text }}</h1>
      </div>

      <div class="space-y-3">
        <ChoiceButton
          v-for="(c, i) in current.question.choices"
          :key="c.id"
          :label="labels[i]"
          :text="c.text"
          :aria-label="t('quiz.choiceAria', { label: labels[i], text: c.text })"
          :state="choiceState(c.id)"
          :disabled="store.submitting || answered || selectedId !== null || remainingMs <= 0"
          @pick="submit(c.id)"
        />
      </div>

      <p v-if="store.lastAnswer" class="card p-4 text-sm font-semibold" role="status">
        <span class="font-black" :class="store.lastAnswer.is_correct ? 'text-success' : 'text-danger'">
          {{ store.lastAnswer.is_correct ? t('quiz.correct') : selectedId === null ? t('quiz.timeout') : t('quiz.wrong') }}
        </span>
        <span v-if="store.lastAnswer.explanation"> {{ store.lastAnswer.explanation }}</span>
      </p>
    </template>
  </section>
</template>
