<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCategories, getLevels } from '@/api/quiz'
import { createDuel } from '@/api/duel'
import { validateName } from '@/utils/name'
import { getSavedName, normalizeCode, saveDuelAuth, saveName } from '@/utils/duelAuth'
import type { Category, LevelInfo } from '@/types/api'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const { t, locale } = useI18n()

const categories = ref<Category[]>([])
const levels = ref<LevelInfo[]>([])
const slug = ref<string | null>(null)
const level = ref<number | null>(null)
const name = ref(getSavedName())
const joinCode = ref('')
const loading = ref(true)
const creating = ref(false)
const error = ref('')
const loadError = ref('')

const nameCheck = computed(() => validateName(name.value))
const canCreate = computed(() => !!slug.value && !!level.value && nameCheck.value.ok && !creating.value)
const codeOk = computed(() => normalizeCode(joinCode.value).length === 6)

async function loadCategories() {
  loading.value = true
  loadError.value = ''
  try {
    categories.value = await getCategories(locale.value)
  } catch {
    loadError.value = t('categories.loadError')
  } finally {
    loading.value = false
  }
}

async function loadLevels(s: string) {
  levels.value = []
  level.value = null
  try {
    const info = await getLevels(s)
    levels.value = [...info.levels].sort((a, b) => a.level - b.level)
    // Yarışta seviye kilidi aranmaz: sorusu olan ilk seviye seçili gelir.
    level.value = levels.value.find((l) => l.question_count > 0)?.level ?? null
  } catch {
    loadError.value = t('levels.loadError')
  }
}

function pickCategory(s: string) {
  slug.value = s
}

async function create() {
  if (!canCreate.value || !slug.value || !level.value) return
  creating.value = true
  error.value = ''
  try {
    const clean = nameCheck.value.value
    const res = await createDuel({
      category: slug.value,
      level: level.value,
      language: locale.value,
      player_name: clean,
    })
    saveName(clean)
    saveDuelAuth(res.code, { token: res.token, role: res.role, name: clean })
    await router.push({ name: 'duel-room', params: { code: res.code } })
  } catch (e) {
    const code = axios.isAxiosError(e)
      ? (e.response?.data as { code?: string } | undefined)?.code
      : undefined
    error.value =
      code === 'level_empty'
        ? t('duel.levelEmpty')
        : code === 'invalid_name'
          ? t('name.rejected')
          : t('duel.createError')
  } finally {
    creating.value = false
  }
}

function join() {
  if (!codeOk.value) return
  router.push({ name: 'duel-room', params: { code: normalizeCode(joinCode.value) } })
}

watch(slug, (s) => {
  if (s) loadLevels(s)
})
watch(locale, loadCategories)
onMounted(loadCategories)
</script>

<template>
  <section class="space-y-5">
    <div>
      <RouterLink to="/" class="text-sm font-bold text-muted">{{ t('categories.back') }}</RouterLink>
      <h1 class="mt-2 text-3xl font-black text-primary">{{ t('duel.title') }}</h1>
      <p class="mt-1 text-sm font-semibold text-muted">{{ t('duel.intro') }}</p>
    </div>

    <p v-if="loadError" class="font-bold text-danger" role="alert">{{ loadError }}</p>
    <p v-if="loading" class="text-center font-bold text-muted">{{ t('common.loading') }}</p>

    <div v-else class="card space-y-4 p-4">
      <div>
        <h2 class="mb-2 text-sm font-extrabold text-muted">{{ t('duel.pickCategory') }}</h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in categories"
            :key="c.slug"
            type="button"
            class="rounded-full px-4 py-2 text-sm font-extrabold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            :class="slug === c.slug ? 'text-white' : 'bg-bg text-muted'"
            :style="slug === c.slug ? { backgroundColor: c.color } : {}"
            :data-category="c.slug"
            @click="pickCategory(c.slug)"
          >
            {{ c.name }}
          </button>
        </div>
      </div>

      <div v-if="slug && levels.length">
        <h2 class="mb-2 text-sm font-extrabold text-muted">{{ t('duel.pickLevel') }}</h2>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="l in levels"
            :key="l.level"
            type="button"
            class="aspect-square rounded-2xl text-xl font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-40"
            :class="level === l.level ? 'bg-primary text-white shadow-card' : 'bg-bg text-ink'"
            :disabled="l.question_count === 0"
            :aria-label="t('levels.level', { n: l.level })"
            :data-level="l.level"
            @click="level = l.level"
          >
            {{ l.level }}
          </button>
        </div>
      </div>

      <div>
        <label for="duel-name" class="mb-1 block text-sm font-extrabold text-muted">{{ t('duel.yourName') }}</label>
        <input
          id="duel-name"
          v-model="name"
          type="text"
          maxlength="20"
          autocomplete="nickname"
          class="min-h-[52px] w-full rounded-btn border-2 border-primary/20 px-4 text-lg font-bold focus:border-primary focus:outline-none"
        />
      </div>

      <p v-if="error" class="font-bold text-danger" role="alert">{{ error }}</p>
      <AppButton :disabled="!canCreate" @click="create">{{ creating ? t('duel.creating') : t('duel.create') }}</AppButton>
    </div>

    <div class="card space-y-3 p-4">
      <h2 class="text-sm font-extrabold text-muted">{{ t('duel.joinTitle') }}</h2>
      <input
        v-model="joinCode"
        type="text"
        maxlength="8"
        autocapitalize="characters"
        autocomplete="off"
        :placeholder="t('duel.codePlaceholder')"
        :aria-label="t('duel.codePlaceholder')"
        class="min-h-[52px] w-full rounded-btn border-2 border-primary/20 px-4 text-center text-xl font-black uppercase tracking-widest focus:border-primary focus:outline-none"
        @keyup.enter="join"
      />
      <AppButton variant="secondary" :disabled="!codeOk" @click="join">{{ t('duel.join') }}</AppButton>
    </div>
  </section>
</template>
