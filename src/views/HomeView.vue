<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppButton from '@/components/AppButton.vue'
</script>

<template>
  <section class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
    <div class="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-5xl shadow-card" aria-hidden="true">
      🌙
    </div>
    <h1 class="text-5xl font-black text-primary">DiniQuiz</h1>
    <p class="max-w-xs text-lg font-semibold text-muted">
      Hızlı, eğlenceli dini bilgi yarışması. Kayıt yok, hemen oyna!
    </p>
    <div class="w-full space-y-3 pt-4">
      <RouterLink to="/kategoriler" class="block">
        <AppButton>Başla</AppButton>
      </RouterLink>
      <RouterLink to="/skor-tablosu" class="block">
        <AppButton variant="ghost">Skor Tablosu</AppButton>
      </RouterLink>
    </div>
  </section>
</template>
