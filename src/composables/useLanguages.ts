import { ref } from 'vue'
import { getLanguages } from '@/api/quiz'
import type { LanguageInfo } from '@/types/api'

/** Sunucu yanıt vermezse kullanılacak yedek liste. */
const FALLBACK: LanguageInfo[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'uz', name: 'Oʻzbekcha' },
]

const languages = ref<LanguageInfo[]>(FALLBACK)
let loaded = false

export function useLanguages() {
  async function load() {
    if (loaded) return
    loaded = true
    try {
      const res = await getLanguages()
      if (res.languages?.length) languages.value = res.languages
    } catch {
      loaded = false // bir sonraki sefer tekrar dene; yedek liste çalışmaya devam eder
    }
  }
  return { languages, load }
}
