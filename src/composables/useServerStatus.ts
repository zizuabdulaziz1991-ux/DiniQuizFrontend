import { computed, ref } from 'vue'

/** Yanıtı uzun süredir gelmeyen (ya da yeniden denenen) istek sayısı. */
export const slowRequests = ref(0)

/** Sunucu uyuyorsa (Render ücretsiz plan) ilk istekler 30–60 sn sürebilir; arayüz bunu gösterir. */
export const serverWaking = computed(() => slowRequests.value > 0)
