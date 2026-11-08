<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLanguages } from '@/composables/useLanguages'
import { normalizeLocale, setLocale } from '@/i18n'

const { t, locale } = useI18n()
const { languages, load } = useLanguages()

const selected = computed({
  get: () => normalizeLocale(locale.value) ?? locale.value,
  set: (code: string) => setLocale(code),
})

onMounted(load)
</script>

<template>
  <label class="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-sm font-bold text-primary shadow-card">
    <span aria-hidden="true">🌐</span>
    <span class="sr-only">{{ t('app.language') }}</span>
    <select
      v-model="selected"
      class="cursor-pointer bg-transparent font-extrabold focus:outline-none"
      :aria-label="t('app.language')"
    >
      <option v-for="l in languages" :key="l.code" :value="l.code">{{ l.name }}</option>
    </select>
  </label>
</template>
