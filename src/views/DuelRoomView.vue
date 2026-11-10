<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { answerDuel, joinDuel } from '@/api/duel'
import { useDuelPolling } from '@/composables/useDuelPolling'
import { validateName } from '@/utils/name'
import { siteUrl } from '@/utils/share'
import { getSavedName, loadDuelAuth, normalizeCode, saveDuelAuth, saveName, type DuelAuth } from '@/utils/duelAuth'
import type { DuelAnswerResult, DuelState } from '@/types/api'
import AppButton from '@/components/AppButton.vue'
import ChoiceButton, { type ChoiceState } from '@/components/ChoiceButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import ShareButtons from '@/components/ShareButtons.vue'
import TimerRing from '@/components/TimerRing.vue'
import FireworksBurst from '@/components/FireworksBurst.vue'

const props = defineProps<{ code: string }>()
const router = useRouter()
const { t, locale } = useI18n()

const code = computed(() => normalizeCode(props.code))
const labels = ['A', 'B', 'C', 'D']

const auth = ref<DuelAuth | null>(loadDuelAuth(code.value))
const state = ref<DuelState | null>(null)
const error = ref('')
const fatal = ref('')
const joinName = ref(getSavedName())
const joining = ref(false)

// Cevap durumu (soru değişince sıfırlanır)
const myPick = ref<number | null>(null)
const myResult = ref<DuelAnswerResult | null>(null)
const answering = ref(false)

// Yerel sayaç: sunucudan gelen süreyi 100 ms'de bir eksilterek akıcı gösterir
const now = ref(Date.now())
const syncedAt = ref(Date.now())
let ticker: ReturnType<typeof setInterval> | null = null

const polling = useDuelPolling({
  code: () => code.value,
  token: () => auth.value?.token ?? null,
  onState: (s) => {
    state.value = s
    syncedAt.value = Date.now()
  },
  onFatal: (status) => {
    fatal.value = status === 410 ? t('duel.expired') : t('duel.notFound')
  },
})

const phase = computed(() => state.value?.phase ?? 'waiting')
const elapsed = computed(() => now.value - syncedAt.value)
const startsInMs = computed(() => Math.max(0, (state.value?.starts_in_ms ?? 0) - elapsed.value))
const remainingMs = computed(() => Math.max(0, (state.value?.remaining_ms ?? 0) - elapsed.value))
const shareUrl = computed(() => `${siteUrl()}/duello/${code.value}`)
const locked = computed(
  () => phase.value !== 'question' || myPick.value !== null || !!state.value?.me.answered || answering.value,
)

watch(
  () => state.value?.question?.id,
  () => {
    myPick.value = null
    myResult.value = null
  },
)

function choiceState(id: number): ChoiceState {
  const s = state.value
  if (!s) return 'normal'
  if (s.phase === 'reveal' && s.reveal) {
    if (id === s.reveal.correct_choice_id) return 'correct'
    if (id === s.reveal.my_choice_id) return 'wrong'
    return 'normal'
  }
  if (myResult.value) {
    if (id === myResult.value.correct_choice_id) return 'correct'
    if (id === myPick.value) return 'wrong'
    return 'normal'
  }
  return id === myPick.value ? 'selected' : 'normal'
}

function choiceText(id: number | null | undefined): string {
  if (id == null) return t('duel.noAnswer')
  return state.value?.question?.choices.find((c) => c.id === id)?.text ?? t('duel.noAnswer')
}

async function pick(choiceId: number) {
  const s = state.value
  if (!s?.question || !auth.value || locked.value) return
  myPick.value = choiceId
  answering.value = true
  error.value = ''
  try {
    myResult.value = await answerDuel(code.value, auth.value.token, s.question.id, choiceId)
    polling.pollNow()
  } catch (e) {
    const apiCode = axios.isAxiosError(e)
      ? (e.response?.data as { code?: string } | undefined)?.code
      : undefined
    if (
      apiCode === 'already_answered' ||
      apiCode === 'round_over' ||
      apiCode === 'not_active' ||
      apiCode === 'wrong_question'
    ) {
      polling.pollNow() // durum zaten ilerlemiş
    } else {
      myPick.value = null
      error.value = t('duel.answerError')
    }
  } finally {
    answering.value = false
  }
}

async function join() {
  const v = validateName(joinName.value)
  if (!v.ok) {
    error.value = v.error ? t(`name.${v.error}`) : ''
    return
  }
  joining.value = true
  error.value = ''
  try {
    const res = await joinDuel(code.value, v.value, locale.value)
    const saved: DuelAuth = { token: res.token, role: res.role, name: v.value }
    saveName(v.value)
    saveDuelAuth(code.value, saved)
    auth.value = saved
    polling.start()
  } catch (e) {
    const apiCode = axios.isAxiosError(e)
      ? (e.response?.data as { code?: string } | undefined)?.code
      : undefined
    const messages: Record<string, string> = {
      duel_not_found: t('duel.notFound'),
      duel_full: t('duel.full'),
      duel_finished: t('duel.finishedErr'),
      duel_expired: t('duel.expired'),
      same_player: t('duel.samePlayer'),
      invalid_name: t('name.rejected'),
    }
    error.value = (apiCode && messages[apiCode]) || t('duel.joinError')
  } finally {
    joining.value = false
  }
}

const outcome = computed(() => state.value?.result?.winner ?? null)

// Kazanınca ~5 sn havai fişek ve kısa titreşim (destekleyen cihazlarda)
const showFireworks = ref(false)
let fireworksTimer: ReturnType<typeof setTimeout> | null = null
watch(outcome, (w) => {
  if (w !== 'me') return
  showFireworks.value = true
  try {
    navigator.vibrate?.([120, 60, 120, 60, 240])
  } catch {
    /* titreşim desteklenmiyor */
  }
  if (fireworksTimer) clearTimeout(fireworksTimer)
  fireworksTimer = setTimeout(() => (showFireworks.value = false), 5500)
})

onMounted(() => {
  ticker = setInterval(() => (now.value = Date.now()), 100)
  if (auth.value) polling.start()
})
onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
  if (fireworksTimer) clearTimeout(fireworksTimer)
})
</script>

<template>
  <section class="flex flex-1 flex-col gap-4">
    <FireworksBurst v-if="showFireworks" />
    <p v-if="fatal" class="card space-y-3 p-4 text-center font-bold text-danger" role="alert">
      {{ fatal }}
      <RouterLink to="/yaris" class="mt-3 block text-primary">{{ t('duel.newDuel') }}</RouterLink>
    </p>

    <!-- Henüz katılmadıysak: isim iste -->
    <form v-else-if="!auth" class="card space-y-4 p-5" novalidate @submit.prevent="join">
      <h1 class="text-center text-2xl font-black text-primary">{{ t('duel.joinTitle') }}</h1>
      <p class="text-center text-2xl font-black tracking-widest" data-testid="code">{{ code }}</p>
      <label for="join-name" class="block text-sm font-bold text-muted">{{ t('duel.yourName') }}</label>
      <input
        id="join-name"
        v-model="joinName"
        type="text"
        maxlength="20"
        autocomplete="nickname"
        class="min-h-[56px] w-full rounded-btn border-2 border-primary/20 px-4 text-lg font-bold focus:border-primary focus:outline-none"
      />
      <p class="min-h-[1.25rem] text-sm font-bold text-danger" role="alert">{{ error }}</p>
      <AppButton type="submit" :disabled="joining">{{ t('duel.join') }}</AppButton>
    </form>

    <p v-else-if="!state" class="m-auto font-bold text-muted">{{ t('common.loading') }}</p>

    <template v-else>
      <p
        v-if="polling.connectionLost.value"
        class="rounded-btn bg-accent/20 px-4 py-2 text-center text-sm font-bold"
        role="status"
      >
        {{ t('duel.connectionLost') }}
      </p>

      <!-- Süresi dolmuş yarış (sonuç yok) -->
      <div v-if="state.status === 'expired'" class="flex flex-1 flex-col items-center justify-center gap-5 text-center" data-testid="expired">
        <p class="text-xl font-extrabold text-danger">{{ t('duel.expired') }}</p>
        <div class="w-full space-y-3">
          <AppButton @click="router.push('/yaris')">{{ t('duel.newDuel') }}</AppButton>
          <AppButton variant="ghost" @click="router.push('/')">{{ t('duel.toHome') }}</AppButton>
        </div>
      </div>

      <!-- Rakip bekleniyor -->
      <div v-else-if="phase === 'waiting'" class="flex flex-1 flex-col justify-center gap-4 text-center">
        <h1 class="text-2xl font-black text-primary">{{ t('duel.waitingTitle') }}</h1>
        <p class="text-sm font-semibold text-muted">{{ t('duel.waitingHint') }}</p>
        <div class="card p-5">
          <p class="text-xs font-extrabold text-muted">{{ t('duel.code') }}</p>
          <p class="text-5xl font-black tracking-widest text-primary" data-testid="code">{{ code }}</p>
        </div>
        <ShareButtons
          :custom-title="t('duel.inviteTitle')"
          :custom-text="t('duel.inviteText', { code })"
          :custom-url="shareUrl"
        />
      </div>

      <!-- Geri sayım -->
      <div v-else-if="phase === 'countdown'" class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p class="font-extrabold text-muted">{{ t('duel.countdown') }}</p>
        <p class="text-8xl font-black text-primary" data-testid="countdown">{{ Math.max(1, Math.ceil(startsInMs / 1000)) }}</p>
        <p class="font-bold">{{ state.me.name }} 🆚 {{ state.opponent.name }}</p>
      </div>

      <!-- Yarış -->
      <template v-else-if="(phase === 'question' || phase === 'reveal') && state.question">
        <div class="grid grid-cols-2 gap-3" data-testid="scoreboard">
          <div class="card p-3 text-center">
            <p class="truncate text-xs font-extrabold text-muted">{{ t('duel.you') }} · {{ state.me.name }}</p>
            <p class="text-2xl font-black text-primary">{{ state.me.correct }}</p>
            <p class="text-[11px] font-bold text-muted">{{ t('duel.points', { n: state.me.points }) }}</p>
          </div>
          <div class="card p-3 text-center">
            <p class="truncate text-xs font-extrabold text-muted">{{ state.opponent.name }}</p>
            <p class="text-2xl font-black text-secondary">{{ state.opponent.correct }}</p>
            <p class="text-[11px] font-bold text-muted">
              {{ state.opponent.connected === false ? t('duel.disconnected') : t('duel.points', { n: state.opponent.points }) }}
            </p>
          </div>
        </div>

        <ProgressBar :index="state.index + 1" :total="state.total_questions" />

        <div v-if="phase === 'question'" class="flex justify-center">
          <TimerRing :remaining-ms="remainingMs" :total-seconds="state.time_limit_seconds" />
        </div>

        <div class="card p-5">
          <p v-if="state.question.arabic_text" class="arabic mb-3 text-3xl leading-loose" dir="rtl" lang="ar">
            {{ state.question.arabic_text }}
          </p>
          <h1 class="text-[20px] font-extrabold leading-snug">{{ state.question.text }}</h1>
        </div>

        <div class="space-y-3">
          <ChoiceButton
            v-for="(c, i) in state.question.choices"
            :key="c.id"
            :label="labels[i]"
            :text="c.text"
            :aria-label="t('quiz.choiceAria', { label: labels[i], text: c.text })"
            :state="choiceState(c.id)"
            :disabled="locked"
            @pick="pick(c.id)"
          />
        </div>

        <p v-if="error" class="font-bold text-danger" role="alert">{{ error }}</p>

        <p
          v-if="phase === 'question' && (state.me.answered || myPick !== null)"
          class="card p-3 text-center text-sm font-bold text-muted"
          role="status"
        >
          {{ state.opponent.answered ? t('duel.waitingNext') : t('duel.waitingOpponent') }}
        </p>
        <p
          v-else-if="phase === 'question' && state.opponent.answered"
          class="card p-3 text-center text-sm font-bold text-secondary"
          role="status"
        >
          {{ t('duel.opponentAnswered') }}
        </p>

        <div v-if="phase === 'reveal' && state.reveal" class="card space-y-2 p-4 text-sm font-bold" data-testid="reveal">
          <p :class="state.reveal.my_correct ? 'text-success' : 'text-danger'">
            {{ t('duel.you') }}: {{ choiceText(state.reveal.my_choice_id) }}
            {{ state.reveal.my_correct ? '✓' : '✕' }} · {{ t('duel.points', { n: state.reveal.my_points }) }}
          </p>
          <p :class="state.reveal.opponent_correct ? 'text-success' : 'text-danger'">
            {{ state.opponent.name }}: {{ choiceText(state.reveal.opponent_choice_id) }}
            {{ state.reveal.opponent_correct ? '✓' : '✕' }} · {{ t('duel.points', { n: state.reveal.opponent_points }) }}
          </p>
          <p v-if="state.reveal.explanation" class="font-semibold text-ink">{{ state.reveal.explanation }}</p>
        </div>
      </template>

      <!-- Sonuç -->
      <div v-else-if="phase === 'finished'" class="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <h1 class="text-4xl font-black" :class="outcome === 'me' ? 'text-success' : outcome === 'draw' ? 'text-accent' : 'text-primary'" data-testid="outcome">
          {{ outcome === 'me' ? t('duel.win') : outcome === 'draw' ? t('duel.draw') : t('duel.lose') }}
        </h1>
        <div v-if="state.result" class="grid w-full grid-cols-2 gap-3">
          <div class="card p-4">
            <p class="truncate text-xs font-extrabold text-muted">{{ t('duel.you') }} · {{ state.me.name }}</p>
            <p class="text-4xl font-black text-primary">{{ state.result.me.correct }}</p>
            <p class="text-xs font-bold text-muted">{{ t('duel.correctCount', { n: state.result.me.correct }) }} · {{ t('duel.points', { n: state.result.me.points }) }}</p>
          </div>
          <div class="card p-4">
            <p class="truncate text-xs font-extrabold text-muted">{{ state.opponent.name }}</p>
            <p class="text-4xl font-black text-secondary">{{ state.result.opponent.correct }}</p>
            <p class="text-xs font-bold text-muted">{{ t('duel.correctCount', { n: state.result.opponent.correct }) }} · {{ t('duel.points', { n: state.result.opponent.points }) }}</p>
          </div>
        </div>
        <div class="w-full space-y-3">
          <AppButton @click="router.push('/yaris')">{{ t('duel.newDuel') }}</AppButton>
          <AppButton variant="ghost" @click="router.push('/')">{{ t('duel.toHome') }}</AppButton>
        </div>
      </div>
    </template>
  </section>
</template>
