<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <nav class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <!-- Logo -->
      <div class="py-1 flex items-center justify-center border-b border-gray-200">
        <router-link to="/dashboard">
          <img src="/logo.jpg" alt="Logo" class="block h-20 w-auto" />
        </router-link>
      </div>
      <!-- Navigation Links -->
      <div class="flex-1 px-4 py-4 space-y-2">
        <template v-for="item in navigation" :key="item.path">
          <router-link
            :to="item.path"
            :class="linkClass(item.path)"
          >
            <component :is="item.icon" class="w-5 h-5 mr-2" />
            {{ item.label }}
          </router-link>
        </template>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Top Navbar -->
      <header class="bg-white shadow flex justify-end items-center px-4 py-4">
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-700 font-medium text-sm">
                {{ userName?.charAt(0).toUpperCase() || 'U' }}
              </span>
            </div>
            <span class="hidden sm:block font-medium">{{ userName }}</span>
          </button>

          <div
            v-if="showUserMenu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          >
            <router-link
              to="/profile"
              class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Profil
            </router-link>
            <hr class="my-1 border-gray-200" />
            <button
              @click="logout"
              class="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-6" role="main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  QrCodeIcon,
} from '@/components'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showUserMenu = ref(false)

const navigation = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { path: '/personnel', label: 'Personnel', icon: UsersIcon },
  { path: '/directions', label: 'Direction', icon: BuildingOfficeIcon },
  { path: '/horloge', label: 'Horloge', icon: ClockIcon },
  { path: '/pointages', label: 'Pointage', icon: CheckCircleIcon },
  { path: '/absences', label: 'Absence', icon: CalendarDaysIcon },
  { path: '/badges', label: 'Badge', icon: QrCodeIcon },
]

const linkClass = (path) => {
  const baseClass = 'block w-full py-2 px-4 text-gray-600 rounded hover:bg-gray-100 hover:text-gray-900 text-left flex items-center'
  const activeClass = route.path === path || route.path.startsWith(path + '/') ? 'font-bold bg-gray-100' : ''
  return `${baseClass} ${activeClass}`
}

const userName = computed(() => authStore.userName)

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
nav a {
  display: flex;
  align-items: center;
  text-decoration: none;
  font-size: 1rem;
}

nav a:hover {
  background-color: #f1f5f9;
}

nav a.active {
  font-weight: bold;
  background-color: #e5e7eb;
}
</style>
