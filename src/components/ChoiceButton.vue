<script setup lang="ts">
import { computed } from 'vue'

export type ChoiceState = 'normal' | 'selected' | 'correct' | 'wrong'

const props = defineProps<{
  label: string
  text: string
  state?: ChoiceState
  disabled?: boolean
  ariaLabel?: string
}>()
defineEmits<{ pick: [] }>()

const styles: Record<ChoiceState, string> = {
  normal: 'bg-surface border-primary/20 text-ink hover:border-primary',
  selected: 'bg-primary/10 border-primary text-ink',
  correct: 'bg-success border-success text-white',
  wrong: 'bg-danger border-danger text-white',
}
const cls = computed(() => styles[props.state ?? 'normal'])
const mark = computed(() => (props.state === 'correct' ? '✓' : props.state === 'wrong' ? '✕' : ''))
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="ariaLabel ?? `${label}: ${text}`"
    class="flex min-h-[56px] w-full items-center gap-3 rounded-btn border-2 px-4 py-2 text-left text-[17px] font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
    :class="[cls, disabled && state === 'normal' ? 'opacity-70' : '']"
    @click="$emit('pick')"
  >
    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/10 text-sm font-black">
      {{ label }}
    </span>
    <span class="flex-1">{{ text }}</span>
    <span v-if="mark" class="text-xl font-black" aria-hidden="true">{{ mark }}</span>
  </button>
</template>
