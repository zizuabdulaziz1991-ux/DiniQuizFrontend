<script setup lang="ts">
defineProps<{ points: number }>()
</script>

<template>
  <span
    v-if="points > 0"
    class="score-pop pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-3xl font-black text-accent"
    aria-live="polite"
  >
    +{{ points }}
  </span>
</template>
