<template>
  <GuestLayout>
    <Head title="Connexion" />

    <div v-if="status" class="mb-4 font-medium text-sm text-green-600">
      {{ status }}
    </div>

    <form @submit.prevent="handleLogin">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
        <input
          id="email"
          type="email"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          v-model="form.email"
          required
          autofocus
          autocomplete="username"
        />
        <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
      </div>

      <div class="mt-4">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          id="password"
          type="password"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          v-model="form.password"
          required
          autocomplete="current-password"
        />
        <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
      </div>

      <div class="block mt-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            v-model="form.remember"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span class="ml-2 text-sm text-gray-900">Se souvenir de moi</span>
        </label>
      </div>

      <div class="flex items-center justify-between mt-4">
        <router-link
          to="/forgot-password"
          class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Mot de passe oublié ?
        </router-link>

        <button
          type="submit"
          :disabled="loading"
          class="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          <span v-if="loading">Connexion...</span>
          <span v-else>Connexion</span>
        </button>
      </div>

      <p class="mt-6 text-center text-sm text-gray-600">
        Pas encore de compte ?
        <router-link to="/register" class="font-medium text-blue-600 hover:text-blue-500 ml-1">
          Créer un compte
        </router-link>
      </p>
    </form>
  </GuestLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GuestLayout from '@/layouts/GuestLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const loading = ref(false)
const errors = ref({})
const status = ref(route.query.status || '')

const handleLogin = async () => {
  loading.value = true
  errors.value = {}

  try {
    await authStore.login({
      email: form.value.email,
      password: form.value.password,
      remember: form.value.remember,
    })
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (err) {
    errors.value = err.errors || { email: err.message || 'Identifiants invalides' }
  } finally {
    loading.value = false
  }
}
</script>
