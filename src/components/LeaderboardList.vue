<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { LeaderboardEntry } from '@/types/api'

defineProps<{ entries: LeaderboardEntry[]; highlightRank?: number | null }>()
const medals = ['🥇', '🥈', '🥉']
const { t } = useI18n()

function detail(e: LeaderboardEntry): string {
  const games = e.games_played ?? 1
  const best = e.best_score ?? e.score
  return t('leaderboard.detail', { games, best })
}
</script>

<template>
  <p v-if="!entries.length" class="card p-6 text-center font-bold text-muted">
    {{ t('leaderboard.empty') }}
  </p>
  <ol v-else class="space-y-2">
    <li
      v-for="e in entries"
      :key="e.rank"
      class="card flex items-center gap-3 px-4 py-3"
      :class="highlightRank === e.rank ? 'ring-4 ring-accent' : ''"
    >
      <span class="w-9 text-center text-xl font-black">{{ medals[e.rank - 1] ?? e.rank }}</span>
      <span class="min-w-0 flex-1">
        <span class="block truncate font-extrabold">{{ e.player_name }}</span>
        <span class="block text-xs font-semibold text-muted">{{ detail(e) }}</span>
      </span>
      <span class="text-right">
        <span class="block font-black leading-none text-primary">{{ e.total_score ?? e.score }}</span>
        <span class="text-[11px] font-bold text-muted">{{ t('leaderboard.totalPoints') }}</span>
      </span>
    </li>
  </ol>
</template>
