import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n, currentLocale, setLocale } from './i18n'
import { warmUp } from './api/quiz'
import './assets/styles/main.css'

setLocale(currentLocale())
createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
void warmUp() // sayfa okunurken sunucu uyansın
