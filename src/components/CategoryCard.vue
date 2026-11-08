<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Category } from '@/types/api'

defineProps<{ category: Category; disabled?: boolean }>()
defineEmits<{ select: [slug: string] }>()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="card flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-60"
    :aria-label="`${category.name}, ${t('categories.questionCount', { n: category.question_count })}`"
    @click="$emit('select', category.slug)"
  >
    <span
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
      :style="{ backgroundColor: category.color }"
      aria-hidden="true"
    >
      {{ category.name.charAt(0) }}
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-lg font-extrabold">{{ category.name }}</span>
      <span class="block text-sm text-muted">{{ category.description }}</span>
    </span>
    <span class="shrink-0 rounded-full bg-bg px-3 py-1 text-sm font-bold text-muted">
      {{ t('categories.questionCount', { n: category.question_count }) }}
    </span>
  </button>
</template>
