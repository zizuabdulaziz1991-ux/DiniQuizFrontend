<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { siteUrl, telegramUrl, whatsappUrl } from '@/utils/share'

const props = withDefaults(
  defineProps<{
    score?: number
    invite?: boolean
    customTitle?: string
    customText?: string
    customUrl?: string
  }>(),
  { score: 0, invite: false, customTitle: undefined, customText: undefined, customUrl: undefined },
)
const { t } = useI18n()

const url = computed(() => props.customUrl ?? siteUrl())
const text = computed(
  () => props.customText ?? (props.invite ? t('share.inviteText') : t('share.text', { score: props.score })),
)
const title = computed(
  () => props.customTitle ?? (props.invite ? t('share.inviteTitle') : t('share.title')),
)
const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function nativeShare() {
  try {
    await navigator.share({ title: 'DiniQuiz', text: text.value, url: url.value })
  } catch {
    /* kullanıcı paylaşımı iptal etti */
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(`${text.value} ${url.value}`)
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* pano izni yoksa sessizce geç */
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

const linkClass =
  'flex min-h-[48px] items-center justify-center rounded-btn border-2 border-primary/20 bg-surface px-2 text-sm font-extrabold text-primary transition hover:border-primary focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40'
</script>

<template>
  <section class="card w-full space-y-3 p-4" :aria-label="title">
    <h2 class="text-sm font-extrabold text-muted">{{ title }}</h2>
    <button
      v-if="canNativeShare"
      type="button"
      class="min-h-[52px] w-full rounded-btn bg-secondary px-4 text-base font-extrabold text-ink transition hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
      @click="nativeShare"
    >
      {{ t('share.native') }}
    </button>
    <div class="grid grid-cols-3 gap-2">
      <a :href="whatsappUrl(text, url)" target="_blank" rel="noopener noreferrer" :class="linkClass">
        WhatsApp
      </a>
      <a :href="telegramUrl(text, url)" target="_blank" rel="noopener noreferrer" :class="linkClass">
        Telegram
      </a>
      <button type="button" :class="linkClass" @click="copyLink">
        {{ copied ? t('share.copied') : t('share.copy') }}
      </button>
    </div>
  </section>
</template>
