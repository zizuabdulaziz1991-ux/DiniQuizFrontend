<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/AppButton.vue'
import ShareButtons from '@/components/ShareButtons.vue'
const { t } = useI18n()
</script>

<template>
  <section class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
    <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-5xl shadow-card" aria-hidden="true">
      🌙
    </div>
    <h1 class="text-5xl font-black text-primary">DiniQuiz</h1>
    <p class="max-w-xs text-lg font-semibold text-muted">
      {{ t('home.tagline') }}
    </p>
    <div class="w-full space-y-3 pt-4">
      <RouterLink to="/kategoriler" class="block">
        <AppButton>{{ t('home.start') }}</AppButton>
      </RouterLink>
      <RouterLink to="/yaris" class="block">
        <AppButton variant="secondary">{{ t('duel.homeButton') }}</AppButton>
      </RouterLink>
      <RouterLink to="/skor-tablosu" class="block">
        <AppButton variant="ghost">{{ t('home.leaderboard') }}</AppButton>
      </RouterLink>
    </div>
    <ShareButtons invite />
  </section>
</template>
