import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
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
  ],
})

export default router
