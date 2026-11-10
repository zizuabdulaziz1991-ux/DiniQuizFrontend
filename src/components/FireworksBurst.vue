<script setup lang="ts">
/** Kutlama: ekranda art arda patlayan havai fişekler (kütüphane yok, yalnızca CSS animasyonu). */
const COLORS = ['#FFB020', '#6C5CE7', '#00C2A8', '#FF5A6E', '#3D8BFF', '#22C55E']
const PER_BURST = 16

const bursts = [
  { x: 20, y: 28, delay: 0 },
  { x: 78, y: 22, delay: 0.4 },
  { x: 50, y: 42, delay: 0.8 },
  { x: 14, y: 55, delay: 1.2 },
  { x: 86, y: 50, delay: 1.6 },
  { x: 50, y: 18, delay: 2.0 },
  { x: 32, y: 66, delay: 2.4 },
  { x: 68, y: 62, delay: 2.8 },
]

function offset(i: number, ring: number): { dx: number; dy: number } {
  const angle = (i / PER_BURST) * Math.PI * 2
  const dist = 70 + ((i * 37) % 5) * 14 + ring * 10
  return { dx: Math.round(Math.cos(angle) * dist), dy: Math.round(Math.sin(angle) * dist) }
}
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true" data-testid="fireworks">
    <template v-for="(b, bi) in bursts" :key="bi">
      <span
        v-for="p in PER_BURST"
        :key="p"
        class="firework-particle"
        :data-burst="bi"
        :style="{
          left: b.x + '%',
          top: b.y + '%',
          '--dx': offset(p, bi % 3).dx + 'px',
          '--dy': offset(p, bi % 3).dy + 'px',
          background: COLORS[(p + bi) % COLORS.length],
          animationDelay: b.delay + 's',
        }"
      />
    </template>
  </div>
</template>
