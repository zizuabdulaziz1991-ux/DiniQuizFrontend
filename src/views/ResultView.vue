<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/stores/quiz'
import { getResult } from '@/api/quiz'
import { apiStatus, loadSession } from '@/api/client'
import type { QuizResult } from '@/types/api'
import AppButton from '@/components/AppButton.vue'
import ShareButtons from '@/components/ShareButtons.vue'

const props = defineProps<{ sessionId: string }>()
const router = useRouter()
const { t } = useI18n()
const store = useQuizStore()
const result = ref<QuizResult | null>(null)
const error = ref('')
const actionError = ref('')
const starting = ref(false)

// Sayfa yenilense bile kategori/seviye oturum kaydından okunur.
const stored = loadSession()
const slug = computed(() => store.categorySlug ?? stored?.category ?? null)
const levelNo = computed(() => result.value?.level ?? store.level ?? stored?.level ?? 1)

const totalQuestions = computed(() => {
  const r = result.value
  return r ? (r.total_questions ?? r.correct_count + r.wrong_count + r.empty_count) : 0
})
const perfect = computed(() => {
  const r = result.value
  if (!r) return false
  return r.perfect ?? (r.correct_count > 0 && r.wrong_count + r.empty_count === 0)
})
const nextLevel = computed(() => (perfect.value ? (result.value?.next_level ?? null) : null))
const top10 = computed(() => !!result.value && result.value.rank_preview <= 10)
const celebrate = computed(() => top10.value || perfect.value)

const confetti = Array.from({ length: 24 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i % 8) * 0.25,
  color: ['#6C5CE7', '#00C2A8', '#FFB020', '#FF5A6E', '#3D8BFF'][i % 5],
}))

async function load() {
  error.value = ''
  try {
    result.value = await getResult(props.sessionId)
  } catch (e) {
    const st = apiStatus(e)
    if (st === 403 || st === 404) router.replace('/kategoriler')
    else error.value = t('result.loadError')
  }
}

async function startLevel(n: number) {
  if (!slug.value || starting.value) return
  starting.value = true
  actionError.value = ''
  try {
    const id = await store.start(slug.value, n)
    await router.push({ name: 'quiz', params: { sessionId: id } })
  } catch (e) {
    const code = axios.isAxiosError(e)
      ? (e.response?.data as { code?: string } | undefined)?.code
      : undefined
    actionError.value = code === 'level_locked' ? t('levels.lockedError') : t('levels.startError')
  } finally {
    starting.value = false
  }
}

function toLevels() {
  const s = slug.value
  store.reset()
  if (s) router.push({ name: 'levels', params: { slug: s } })
  else router.push('/kategoriler')
}

onMounted(() => {
  if (!stored || stored.sessionId !== props.sessionId) {
    router.replace('/kategoriler')
    return
  }
  load()
})
</script>

<template>
  <section class="relative flex flex-1 flex-col items-center justify-center gap-5 text-center">
    <template v-if="celebrate">
      <span
        v-for="(c, i) in confetti"
        :key="i"
        class="pointer-events-none fixed top-0 h-3 w-2 rounded-sm"
        :style="{ left: c.left + '%', background: c.color, animation: `fall 3s ${c.delay}s ease-in forwards` }"
        aria-hidden="true"
      />
    </template>

    <p v-if="error" class="font-bold text-danger" role="alert">{{ error }}</p>
    <p v-else-if="!result" class="font-bold text-muted">{{ t('common.loading') }}</p>

    <template v-else>
      <div>
        <p class="text-xs font-extrabold uppercase tracking-wide text-primary">
          {{ t('quiz.level', { n: levelNo }) }}
        </p>
        <h1 class="text-2xl font-black text-primary">{{ t('result.title') }}</h1>
      </div>
      <div class="card w-full p-6">
        <p class="text-sm font-bold text-muted">{{ t('result.totalScore') }}</p>
        <p class="text-6xl font-black text-accent">{{ result.score }}</p>
        <p class="text-sm font-semibold text-muted">/ {{ result.max_score }}</p>
        <p v-if="top10" class="mt-2 font-extrabold text-success">
          {{ t('result.rankTop', { rank: result.rank_preview }) }}
        </p>
        <p v-else class="mt-2 font-semibold text-muted">{{ t('result.rankPreview', { rank: result.rank_preview }) }}</p>
      </div>

      <div class="grid w-full grid-cols-3 gap-3">
        <div class="card p-3"><p class="text-2xl font-black text-success">{{ result.correct_count }}</p><p class="text-xs font-bold text-muted">{{ t('result.correct') }}</p></div>
        <div class="card p-3"><p class="text-2xl font-black text-danger">{{ result.wrong_count }}</p><p class="text-xs font-bold text-muted">{{ t('result.wrong') }}</p></div>
        <div class="card p-3"><p class="text-2xl font-black text-muted">{{ result.empty_count }}</p><p class="text-xs font-bold text-muted">{{ t('result.empty') }}</p></div>
      </div>

      <p
        v-if="perfect && nextLevel && result.newly_unlocked !== false"
        class="card w-full p-3 font-extrabold text-success"
        role="status"
      >
        {{ t('result.unlocked', { n: nextLevel }) }}
      </p>
      <p v-else-if="perfect && !nextLevel" class="card w-full p-3 font-extrabold text-success" role="status">
        {{ t('result.perfectNoNext') }}
      </p>
      <div v-else-if="!perfect" class="card w-full space-y-1 p-3" role="status">
        <p class="text-sm font-bold text-ink">
          {{ t('result.needPerfect', { correct: result.correct_count, total: totalQuestions }) }}
        </p>
        <p class="text-xs font-semibold text-muted">{{ t('result.needPerfectRule') }}</p>
      </div>

      <ShareButtons :score="result.score" />

      <p v-if="actionError" class="w-full font-bold text-danger" role="alert">{{ actionError }}</p>

      <div class="w-full space-y-3">
        <template v-if="nextLevel">
          <AppButton :disabled="starting" @click="startLevel(nextLevel)">{{ t('result.nextLevel') }}</AppButton>
          <AppButton variant="ghost" @click="router.push(`/isim/${sessionId}`)">{{ t('result.toLeaderboard') }}</AppButton>
          <AppButton variant="ghost" @click="toLevels">{{ t('result.toLevels') }}</AppButton>
        </template>
        <template v-else-if="perfect">
          <AppButton @click="toLevels">{{ t('result.toLevels') }}</AppButton>
          <AppButton variant="ghost" @click="router.push(`/isim/${sessionId}`)">{{ t('result.toLeaderboard') }}</AppButton>
        </template>
        <template v-else>
          <AppButton :disabled="starting" @click="startLevel(levelNo)">{{ t('result.retryLevel') }}</AppButton>
          <AppButton variant="ghost" @click="router.push(`/isim/${sessionId}`)">{{ t('result.toLeaderboard') }}</AppButton>
          <AppButton variant="ghost" @click="toLevels">{{ t('result.toLevels') }}</AppButton>
        </template>
      </div>
    </template>
  </section>
</template>
