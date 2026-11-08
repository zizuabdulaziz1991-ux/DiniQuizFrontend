<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/** index: 1 tabanlı soru numarası */
defineProps<{ index: number; total: number }>()
const { t } = useI18n()
</script>

<template>
  <div>
    <p class="mb-1 text-sm font-bold text-muted">{{ t('quiz.progress', { index, total }) }}</p>
    <div
      class="h-2 w-full overflow-hidden rounded-full bg-primary/15"
      role="progressbar"
      :aria-valuenow="index"
      aria-valuemin="1"
      :aria-valuemax="total"
    >
      <div class="h-full rounded-full bg-primary transition-all duration-300" :style="{ width: (index / total) * 100 + '%' }" />
    </div>
  </div>
</template>
