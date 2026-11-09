<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/stores/quiz'
import ChoiceButton, { type ChoiceState } from '@/components/ChoiceButton.vue'

const props = defineProps<{ sessionId: string }>()
const router = useRouter()
const store = useQuizStore()
const { t } = useI18n()

const labels = ['A', 'B', 'C', 'D']
const feedbackDelay = Number(import.meta.env.VITE_FEEDBACK_DELAY_MS ?? 1500)

const item = computed(() => store.mistakes[0] ?? null)
const wrongPicks = ref<number[]>([])
const solved = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function finish() {
  router.replace(`/sonuc/${props.sessionId}`)
}

function stateOf(id: number): ChoiceState {
  if (solved.value && id === item.value?.correctChoiceId) return 'correct'
  if (wrongPicks.value.includes(id)) return 'wrong'
  return 'normal'
}

/** Doğru şıkkı bulana kadar aynı soru kalır; doğrusu bulununca sıradaki yanlışa geçilir. */
function pick(id: number) {
  const it = item.value
  if (!it || solved.value || wrongPicks.value.includes(id)) return
  if (id === it.correctChoiceId) {
    solved.value = true
    timer = setTimeout(() => {
      store.resolveMistake()
      solved.value = false
      wrongPicks.value = []
      if (!store.mistakes.length) finish()
    }, feedbackDelay)
  } else {
    wrongPicks.value = [...wrongPicks.value, id]
  }
}

onMounted(() => {
  if (!store.mistakes.length) finish() // sayfa yenilendiyse sonuca geç
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <section class="flex flex-1 flex-col gap-4">
    <template v-if="item">
      <header class="space-y-1 text-center">
        <h1 class="text-2xl font-black text-primary">{{ t('review.title') }}</h1>
        <p class="text-sm font-semibold text-muted">{{ t('review.subtitle') }}</p>
        <p class="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
          {{ t('review.remaining', { n: store.mistakes.length }) }}
        </p>
      </header>

      <div class="card p-5">
        <p v-if="item.question.arabic_text" class="arabic mb-3 text-3xl leading-loose" dir="rtl" lang="ar">
          {{ item.question.arabic_text }}
        </p>
        <h2 class="text-[20px] font-extrabold leading-snug">{{ item.question.text }}</h2>
      </div>

      <div class="space-y-3">
        <ChoiceButton
          v-for="(c, i) in item.question.choices"
          :key="c.id"
          :label="labels[i]"
          :text="c.text"
          :aria-label="t('quiz.choiceAria', { label: labels[i], text: c.text })"
          :state="stateOf(c.id)"
          :disabled="solved || wrongPicks.includes(c.id)"
          @pick="pick(c.id)"
        />
      </div>

      <p v-if="wrongPicks.length && !solved" class="card p-3 text-center text-sm font-bold text-danger" role="status">
        {{ t('review.wrong') }}
      </p>
      <div v-if="solved" class="card space-y-1 p-4" role="status">
        <p class="font-extrabold text-success">{{ t('review.correct') }}</p>
        <p v-if="item.explanation" class="text-sm font-semibold">{{ item.explanation }}</p>
      </div>
    </template>
  </section>
</template>
