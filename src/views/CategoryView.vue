<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getCategories } from '@/api/quiz'
import { useQuizStore } from '@/stores/quiz'
import type { Category } from '@/types/api'
import CategoryCard from '@/components/CategoryCard.vue'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const { t, locale } = useI18n()
const store = useQuizStore()
const categories = ref<Category[]>([])
const loading = ref(true)
const starting = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    categories.value = await getCategories(locale.value)
  } catch {
    error.value = t('categories.loadError')
  } finally {
    loading.value = false
  }
}

async function choose(slug: string) {
  if (starting.value) return
  starting.value = true
  error.value = ''
  try {
    const id = await store.start(slug)
    await router.push({ name: 'quiz', params: { sessionId: id } })
  } catch {
    error.value = t('categories.startError')
  } finally {
    starting.value = false
  }
}

watch(locale, load)
onMounted(load)
</script>

<template>
  <section>
    <RouterLink to="/" class="text-sm font-bold text-muted">{{ t('categories.back') }}</RouterLink>
    <h1 class="mb-4 mt-2 text-3xl font-black text-primary">{{ t('categories.title') }}</h1>

    <p v-if="loading" class="text-center font-bold text-muted">{{ t('common.loading') }}</p>
    <div v-else-if="error" class="card space-y-3 p-4 text-center">
      <p class="font-bold text-danger" role="alert">{{ error }}</p>
      <AppButton @click="load">{{ t('common.retry') }}</AppButton>
    </div>
    <div v-else class="space-y-3">
      <CategoryCard
        v-for="c in categories"
        :key="c.id"
        :category="c"
        :disabled="starting"
        @select="choose"
      />
    </div>
  </section>
</template>
