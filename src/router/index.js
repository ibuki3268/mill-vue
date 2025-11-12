import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/p' },
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
  ],
})

export default router
