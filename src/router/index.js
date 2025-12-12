import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
  // 初期表示はスタートページに変更
  { path: '/', redirect: '/start' },
  { path: '/start', name: 'start', component: () => import('../views/Start.vue') },
  // 既存のホームはそのまま利用可能
  { path: '/home', name: 'home', component: () => import('../views/Home.vue') },
  // Airscene専用投票作成ページ
  { path: '/airscene', name: 'airscene', component: () => import('../views/AirsceneVote.vue') },
    {
      path: '/p/:public_token',
      name: 'poll',
      component: () => import('../views/Poll.vue'),
    },
    {
      path: '/p/:public_token/results',
      name: 'results',
      component: () => import('../views/Results.vue'),
    },
    // room-scoped routes (optional). Example: /r/ROOM123/p/3f33d002b304e669
    {
      path: '/r/:room_token/p/:public_token',
      name: 'room-poll',
      component: () => import('../views/Poll.vue'),
    },
    {
      path: '/r/:room_token/p/:public_token/results',
      name: 'room-results',
      component: () => import('../views/Results.vue'),
    },
    {
      path: '/my-rooms',
      name: 'my-rooms',
      component: () => import('../views/MyRooms.vue'),
    },
  ],
})

export default router
