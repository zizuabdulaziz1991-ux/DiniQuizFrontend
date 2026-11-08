<script setup lang="ts">
import type { LeaderboardEntry } from '@/types/api'

defineProps<{ entries: LeaderboardEntry[]; highlightRank?: number | null }>()
const medals = ['🥇', '🥈', '🥉']
</script>

<template>
  <p v-if="!entries.length" class="card p-6 text-center font-bold text-muted">
    Henüz kimse yok. İlk sen ol!
  </p>
  <ol v-else class="space-y-2">
    <li
      v-for="e in entries"
      :key="e.rank"
      class="card flex items-center gap-3 px-4 py-3"
      :class="highlightRank === e.rank ? 'ring-4 ring-accent' : ''"
    >
      <span class="w-9 text-center text-xl font-black">{{ medals[e.rank - 1] ?? e.rank }}</span>
      <span class="flex-1 truncate font-extrabold">{{ e.player_name }}</span>
      <span class="font-black text-primary">{{ e.score }}</span>
    </li>
  </ol>
</template>
