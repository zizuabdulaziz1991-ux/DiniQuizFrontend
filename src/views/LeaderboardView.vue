<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCategories, getLeaderboard } from '@/api/quiz'
import type { Category, LeaderboardEntry } from '@/types/api'
import LeaderboardList from '@/components/LeaderboardList.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const categories = ref<Category[]>([])
const entries = ref<LeaderboardEntry[]>([])
const loading = ref(true)
const error = ref('')

const active = computed(() => (typeof route.query.kategori === 'string' ? route.query.kategori : ''))
const myRank = computed(() => (route.query.sira ? Number(route.query.sira) : null))

async function load() {
  loading.value = true
  error.value = ''
  try {
    entries.value = (await getLeaderboard(active.value || undefined)).entries
  } catch {
    error.value = t('leaderboard.loadError')
  } finally {
    loading.value = false
  }
}

function select(slug: string) {
  router.replace({ query: slug ? { kategori: slug } : {} })
}

watch(active, load)
watch(locale, async () => {
  try {
    categories.value = await getCategories(locale.value)
  } catch {
    /* mevcut adlar kalsın */
  }
})
onMounted(async () => {
  load()
  try {
    categories.value = await getCategories(locale.value)
  } catch {
    /* sekmeler olmadan da çalışır */
  }
})
</script>

<template>
  <section>
    <RouterLink to="/" class="text-sm font-bold text-muted">{{ t('leaderboard.back') }}</RouterLink>
    <h1 class="mb-1 mt-2 text-3xl font-black text-primary">{{ t('leaderboard.title') }}</h1>
    <p class="mb-4 text-sm font-semibold text-muted">{{ t('leaderboard.note') }}</p>

    <div class="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="!active"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-extrabold"
        :class="!active ? 'bg-primary text-white' : 'bg-surface text-muted'"
        @click="select('')"
      >
        {{ t('leaderboard.general') }}
      </button>
      <button
        v-for="c in categories"
        :key="c.slug"
        type="button"
        role="tab"
        :aria-selected="active === c.slug"
        class="shrink-0 rounded-full px-4 py-2 text-sm font-extrabold"
        :class="active === c.slug ? 'text-white' : 'bg-surface text-muted'"
        :style="active === c.slug ? { backgroundColor: c.color } : {}"
        @click="select(c.slug)"
      >
        {{ c.name }}
      </button>
    </div>

    <p v-if="loading" class="text-center font-bold text-muted">{{ t('common.loading') }}</p>
    <p v-else-if="error" class="text-center font-bold text-danger" role="alert">{{ error }}</p>
    <LeaderboardList v-else :entries="entries" :highlight-rank="myRank" />

    <RouterLink to="/kategoriler" class="mt-6 block rounded-btn bg-primary py-4 text-center text-lg font-extrabold text-white">
      {{ t('leaderboard.playAgain') }}
    </RouterLink>
  </section>
</template>
