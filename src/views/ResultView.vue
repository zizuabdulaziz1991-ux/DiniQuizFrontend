<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/stores/quiz'
import { getResult } from '@/api/quiz'
import { apiStatus, loadSession } from '@/api/client'
import type { QuizResult } from '@/types/api'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ sessionId: string }>()
const router = useRouter()
const { t } = useI18n()
const store = useQuizStore()
const result = ref<QuizResult | null>(null)
const error = ref('')

const top10 = computed(() => !!result.value && result.value.rank_preview <= 10)
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

function again(path: string) {
  store.reset()
  router.push(path)
}

onMounted(() => {
  const s = loadSession()
  if (!s || s.sessionId !== props.sessionId) {
    router.replace('/kategoriler')
    return
  }
  load()
})
</script>

<template>
  <section class="relative flex flex-1 flex-col items-center justify-center gap-5 text-center">
    <template v-if="top10">
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
      <h1 class="text-2xl font-black text-primary">{{ t('result.title') }}</h1>
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

      <div class="w-full space-y-3">
        <AppButton @click="router.push(`/isim/${sessionId}`)">{{ t('result.toLeaderboard') }}</AppButton>
        <AppButton variant="ghost" @click="again('/kategoriler')">{{ t('result.playAgain') }}</AppButton>
      </div>
    </template>
  </section>
</template>
