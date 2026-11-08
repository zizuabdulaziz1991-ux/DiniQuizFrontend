<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { serverWaking } from '@/composables/useServerStatus'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const route = useRoute()
const { t } = useI18n()
// Quiz sırasında dil değiştirilmez: sorular oturum başında seçilen dilde gelir.
const showSwitcher = computed(() => route.name !== 'quiz')

// Android'de uygulama durum/gezinme çubuğunun altına uzanır; Capacitor güvenli alanı
// --safe-area-inset-* değişkenleriyle verir (web'de env() ya da 0).
const safeArea = {
  paddingTop: 'max(1.5rem, var(--safe-area-inset-top, env(safe-area-inset-top, 0px)))',
  paddingBottom: 'max(1.5rem, var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)))',
}
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-md flex-col px-4" :style="safeArea">
    <div
      v-if="serverWaking"
      role="status"
      aria-live="polite"
      class="mb-3 rounded-btn bg-accent/20 px-4 py-3 text-center text-sm font-bold text-ink"
    >
      ⏳ {{ t('app.waking') }}
    </div>
    <div v-if="showSwitcher" class="mb-2 flex justify-end">
      <LanguageSwitcher />
    </div>
    <RouterView />
  </main>
</template>
