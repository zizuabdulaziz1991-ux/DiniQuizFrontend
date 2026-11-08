<script setup lang="ts">
withDefaults(
  defineProps<{ variant?: 'primary' | 'secondary' | 'ghost'; disabled?: boolean; type?: 'button' | 'submit' }>(),
  { variant: 'primary', type: 'button' },
)
const styles = {
  primary: 'bg-primary text-white shadow-card hover:brightness-110',
  secondary: 'bg-secondary text-ink hover:brightness-105',
  ghost: 'bg-transparent text-primary border-2 border-primary/30 hover:bg-primary/5',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="min-h-[56px] w-full rounded-btn px-6 text-lg font-extrabold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
    :class="styles[variant]"
  >
    <slot />
  </button>
</template>
