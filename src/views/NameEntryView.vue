<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { saveName } from '@/api/quiz'
import { apiStatus } from '@/api/client'
import { useQuizStore } from '@/stores/quiz'
import { validateName } from '@/utils/name'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ sessionId: string }>()
const router = useRouter()
const store = useQuizStore()
const name = ref('')
const error = ref('')
const saving = ref(false)

async function submit() {
  if (saving.value) return
  const v = validateName(name.value)
  if (!v.ok) {
    error.value = v.error ?? ''
    return
  }
  saving.value = true
  error.value = ''
  try {
    const res = await saveName(props.sessionId, v.value)
    const category = store.categorySlug
    store.reset()
    router.replace({
      name: 'leaderboard',
      query: { ...(category ? { kategori: category } : {}), sira: String(res.rank) },
    })
  } catch (e) {
    const st = apiStatus(e)
    if (st === 400) error.value = 'Bu isim kabul edilmedi. Başka bir isim dene.'
    else if (st === 409) error.value = 'Bu quiz için isim zaten kaydedilmiş.'
    else error.value = 'İsim kaydedilemedi. Tekrar dene.'
  } finally {
    saving.value = false
  }
}

function skip() {
  store.reset()
  router.replace('/skor-tablosu')
}
</script>

<template>
  <section class="flex flex-1 flex-col justify-center gap-5">
    <h1 class="text-center text-3xl font-black text-primary">Adın ne?</h1>
    <form class="card space-y-4 p-5" novalidate @submit.prevent="submit">
      <label for="player-name" class="block text-sm font-bold text-muted">İsim (2–20 karakter)</label>
      <input
        id="player-name"
        v-model="name"
        type="text"
        maxlength="20"
        autocomplete="nickname"
        class="min-h-[56px] w-full rounded-btn border-2 border-primary/20 px-4 text-lg font-bold focus:border-primary focus:outline-none"
        :aria-invalid="!!error"
        aria-describedby="name-error"
      />
      <p id="name-error" class="min-h-[1.25rem] text-sm font-bold text-danger" role="alert">{{ error }}</p>
      <AppButton type="submit" :disabled="saving">{{ saving ? 'Kaydediliyor…' : 'Kaydet' }}</AppButton>
      <AppButton variant="ghost" :disabled="saving" @click="skip">Geç</AppButton>
    </form>
  </section>
</template>
