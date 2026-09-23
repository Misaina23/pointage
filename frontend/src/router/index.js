import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { guest: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPassword.vue'),
    meta: { guest: true },
  },
  {
    path: '/reset-password/:token',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPassword.vue'),
    meta: { guest: true },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('@/views/auth/VerifyEmail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/personnel',
    name: 'personnel',
    component: () => import('@/views/personnel/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/personnel/create',
    name: 'personnel.create',
    component: () => import('@/views/personnel/Create.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/personnel/:id/edit',
    name: 'personnel.edit',
    component: () => import('@/views/personnel/Edit.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/directions',
    name: 'directions',
    component: () => import('@/views/directions/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/horloge',
    name: 'horloge',
    component: () => import('@/views/horloge/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pointages',
    name: 'pointages',
    component: () => import('@/views/pointages/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/absences',
    name: 'absences',
    component: () => import('@/views/absences/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/badges',
    name: 'badges',
    component: () => import('@/views/badges/Index.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/profile/Index.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth if not done
  if (!authStore.token && localStorage.getItem('auth_token')) {
    authStore.initializeAuth()
  }

  // Fetch user if authenticated but user not loaded
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      authStore.clearAuth()
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const guestOnly = to.matched.some(record => record.meta.guest)

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router