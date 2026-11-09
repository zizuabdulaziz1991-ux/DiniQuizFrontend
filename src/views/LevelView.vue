<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCategories, getLevels } from '@/api/quiz'
import { apiStatus } from '@/api/client'
import { useQuizStore } from '@/stores/quiz'
import type { Category, LevelInfo } from '@/types/api'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ slug: string }>()
const router = useRouter()
const store = useQuizStore()
const { t, locale } = useI18n()

const category = ref<Category | null>(null)
const levels = ref<LevelInfo[]>([])
const perLevel = ref(10)
const loading = ref(true)
const error = ref('')
const hint = ref('')
const starting = ref<number | null>(null)

const color = computed(() => category.value?.color ?? '#6C5CE7')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [lv, cats] = await Promise.all([
      getLevels(props.slug),
      getCategories(locale.value).catch(() => [] as Category[]),
    ])
    levels.value = [...lv.levels].sort((a, b) => a.level - b.level)
    perLevel.value = lv.questions_per_level ?? 10
    category.value = cats.find((c) => c.slug === props.slug) ?? null
  } catch (e) {
    if (apiStatus(e) === 404) {
      router.replace('/kategoriler')
      return
    }
    error.value = t('levels.loadError')
  } finally {
    loading.value = false
  }
}

async function open(l: LevelInfo) {
  if (starting.value !== null) return
  hint.value = ''
  if (l.status === 'locked') {
    hint.value = t('levels.lockedHint')
    return
  }
  if (l.status === 'empty') {
    hint.value = t('levels.emptyError')
    return
  }
  starting.value = l.level
  try {
    const id = await store.start(props.slug, l.level)
    await router.push({ name: 'quiz', params: { sessionId: id } })
  } catch (e) {
    const code = axios.isAxiosError(e) ? (e.response?.data as { code?: string } | undefined)?.code : undefined
    if (code === 'level_locked') {
      hint.value = t('levels.lockedError')
      load() // kilit durumu değişmiş olabilir
    } else if (code === 'level_empty') {
      hint.value = t('levels.emptyError')
    } else {
      hint.value = t('levels.startError')
    }
  } finally {
    starting.value = null
  }
}

function tileClass(l: LevelInfo): string {
  switch (l.status) {
    case 'completed':
      return 'bg-success text-white shadow-card'
    case 'unlocked':
      return 'text-white shadow-card'
    case 'locked':
      return 'bg-primary/10 text-muted'
    default:
      return 'border-2 border-dashed border-primary/30 text-muted'
  }
}

function tileIcon(l: LevelInfo): string {
  if (l.status === 'completed') return '✓'
  if (l.status === 'locked') return '🔒'
  if (l.status === 'empty') return '⏳'
  return l.attempts ? `${l.best_correct ?? 0}/${perLevel.value}` : '▶'
}

function tileAria(l: LevelInfo): string {
  const name = t('levels.level', { n: l.level })
  if (l.status === 'completed') return `${name}, ${t('levels.done')}`
  if (l.status === 'locked') return `${name}, ${t('levels.lockedHint')}`
  if (l.status === 'empty') return `${name}, ${t('levels.soon')}`
  return name
}

watch(locale, load)
onMounted(load)
</script>

<template>
  <section>
    <RouterLink to="/kategoriler" class="text-sm font-bold text-muted">{{ t('levels.back') }}</RouterLink>
    <div class="mb-1 mt-2 flex items-center gap-3">
      <span class="h-4 w-4 shrink-0 rounded-full" :style="{ backgroundColor: color }" aria-hidden="true" />
      <h1 class="text-3xl font-black text-primary">{{ category?.name ?? t('levels.title') }}</h1>
    </div>
    <p class="mb-5 text-sm font-semibold text-muted">{{ t('levels.hint') }}</p>

    <p v-if="loading" class="text-center font-bold text-muted">{{ t('common.loading') }}</p>
    <div v-else-if="error" class="card space-y-3 p-4 text-center">
      <p class="font-bold text-danger" role="alert">{{ error }}</p>
      <AppButton @click="load">{{ t('common.retry') }}</AppButton>
    </div>
    <template v-else>
      <div class="grid grid-cols-5 gap-3">
        <button
          v-for="l in levels"
          :key="l.level"
          type="button"
          class="relative flex aspect-square flex-col items-center justify-center rounded-2xl transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          :class="[tileClass(l), starting === l.level ? 'animate-pulse' : '']"
          :style="l.status === 'unlocked' ? { backgroundColor: color } : {}"
          :aria-label="tileAria(l)"
          :aria-disabled="l.status === 'locked' || l.status === 'empty'"
          :data-status="l.status"
          @click="open(l)"
        >
          <span class="text-2xl font-black leading-none">{{ l.level }}</span>
          <span class="mt-1 text-[11px] font-extrabold leading-none" aria-hidden="true">{{ tileIcon(l) }}</span>
        </button>
      </div>
      <p v-if="hint" class="card mt-5 p-3 text-center text-sm font-bold text-ink" role="status">
        {{ hint }}
      </p>
    </template>
  </section>
</template>
