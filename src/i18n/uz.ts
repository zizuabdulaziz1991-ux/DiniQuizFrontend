import type tr from './tr'

// O‘zbekcha (lotin yozuvi). Kalitlar tr.ts bilan bir xil bo‘lishi shart (tip tekshiruvi buni ta’minlaydi).
const uz: typeof tr = {
  app: { language: 'Til' },
  common: { loading: 'Yuklanmoqda…', retry: 'Qayta urinish' },
  home: {
    tagline: 'Tez va qiziqarli diniy bilimlar musobaqasi. Ro‘yxatdan o‘tish shart emas, hoziroq o‘ynang!',
    start: 'Boshlash',
    leaderboard: 'Natijalar jadvali',
  },
  categories: {
    back: '← Bosh sahifa',
    title: 'Toifani tanlang',
    loadError: 'Toifalarni yuklab bo‘lmadi. Internetni tekshiring.',
    startError: 'Viktorinani boshlab bo‘lmadi. Qayta urinib ko‘ring.',
    questionCount: '{n} ta savol',
  },
  quiz: {
    progress: 'Savol {index} / {total}',
    score: 'Ball',
    correct: 'To‘g‘ri!',
    wrong: 'Noto‘g‘ri!',
    timeout: 'Vaqt tugadi!',
    leaveConfirm: 'Viktorinadan chiqmoqchimisiz? Natijangiz yo‘qolishi mumkin.',
    loadError: 'Savolni yuklab bo‘lmadi. Internetni tekshiring.',
    answerError: 'Javobni yuborib bo‘lmadi. Qayta urinib ko‘ring.',
    choiceAria: 'Variant {label}: {text}',
    timerAria: 'Qolgan vaqt {seconds} soniya',
  },
  result: {
    title: 'Viktorina tugadi!',
    totalScore: 'Umumiy ball',
    rankTop: 'Hozir {rank}-o‘rindasiz! 🎉',
    rankPreview: 'Taxminiy o‘rningiz: {rank}',
    correct: 'To‘g‘ri',
    wrong: 'Noto‘g‘ri',
    empty: 'Bo‘sh',
    toLeaderboard: 'Natijalar jadvaliga kirish',
    playAgain: 'Qayta o‘ynash',
    loadError: 'Natijani yuklab bo‘lmadi.',
  },
  name: {
    title: 'Ismingiz nima?',
    label: 'Ism (2–20 belgi)',
    save: 'Saqlash',
    saving: 'Saqlanmoqda…',
    skip: 'O‘tkazib yuborish',
    tooShort: 'Ism kamida 2 belgidan iborat bo‘lishi kerak.',
    tooLong: 'Ism ko‘pi bilan 20 belgidan iborat bo‘lishi mumkin.',
    rejected: 'Bu ism qabul qilinmadi. Boshqa ism sinab ko‘ring.',
    alreadySaved: 'Bu viktorina uchun ism allaqachon saqlangan.',
    saveError: 'Ismni saqlab bo‘lmadi. Qayta urinib ko‘ring.',
  },
  leaderboard: {
    back: '← Bosh sahifa',
    title: 'Natijalar jadvali',
    note: 'Bir xil ism bilan o‘ynalgan o‘yinlarning ballari qo‘shiladi.',
    general: 'Umumiy',
    empty: 'Hozircha hech kim yo‘q. Birinchi bo‘ling!',
    detail: '{games} ta o‘yin · eng yaxshisi {best}',
    totalPoints: 'jami ball',
    loadError: 'Natijalar jadvalini yuklab bo‘lmadi.',
    playAgain: 'Qayta o‘ynash',
  },
}

export default uz
