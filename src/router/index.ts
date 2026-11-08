import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/kategoriler', name: 'categories', component: () => import('@/views/CategoryView.vue') },
    { path: '/quiz/:sessionId', name: 'quiz', component: () => import('@/views/QuizView.vue'), props: true },
    { path: '/sonuc/:sessionId', name: 'result', component: () => import('@/views/ResultView.vue'), props: true },
    { path: '/isim/:sessionId', name: 'name', component: () => import('@/views/NameEntryView.vue'), props: true },
    { path: '/skor-tablosu', name: 'leaderboard', component: () => import('@/views/LeaderboardView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
