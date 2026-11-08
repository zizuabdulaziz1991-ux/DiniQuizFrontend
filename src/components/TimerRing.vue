<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ remainingMs: number; totalSeconds: number }>()

const R = 42
const C = 2 * Math.PI * R
const seconds = computed(() => Math.ceil(props.remainingMs / 1000))
const ratio = computed(() => Math.min(1, Math.max(0, props.remainingMs / (props.totalSeconds * 1000))))
const urgent = computed(() => seconds.value <= 5)
const color = computed(() => (urgent.value ? '#FF5A6E' : seconds.value > 10 ? '#22C55E' : '#6C5CE7'))
</script>

<template>
  <div
    class="relative h-24 w-24"
    :class="{ shake: urgent && remainingMs > 0 }"
    role="timer"
    :aria-label="`Kalan süre ${seconds} saniye`"
  >
    <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
      <circle cx="50" cy="50" :r="R" fill="none" stroke="#E7E3FA" stroke-width="9" />
      <circle
        cx="50"
        cy="50"
        :r="R"
        fill="none"
        :stroke="color"
        stroke-width="9"
        stroke-linecap="round"
        :stroke-dasharray="C"
        :stroke-dashoffset="C * (1 - ratio)"
        style="transition: stroke-dashoffset 0.1s linear, stroke 0.3s"
      />
    </svg>
    <span class="absolute inset-0 flex items-center justify-center text-3xl font-black" :style="{ color }">
      {{ seconds }}
    </span>
  </div>
</template>
