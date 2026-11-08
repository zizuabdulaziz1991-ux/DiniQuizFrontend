<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const route = useRoute()
// Quiz sırasında dil değiştirilmez: sorular oturum başında seçilen dilde gelir.
const showSwitcher = computed(() => route.name !== 'quiz')
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-6">
    <div v-if="showSwitcher" class="mb-2 flex justify-end">
      <LanguageSwitcher />
    </div>
    <RouterView />
  </main>
</template>
