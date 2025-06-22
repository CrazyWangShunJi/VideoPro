import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/images',
      name: 'images',
      component: () => import('../views/Images.vue')
    },
    {
      path: '/images/:category',
      name: 'images-category',
      component: () => import('../views/Images.vue'),
      props: true
    },
    {
      path: '/videos',
      name: 'videos',
      component: () => import('../views/VideoCategories.vue')
    },
    {
      path: '/videos/:category',
      name: 'videos-category',
      component: () => import('../views/Videos.vue'),
      props: true
    }
  ]
})

export default router 