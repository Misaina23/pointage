<template>
  <GuestLayout>
    <form @submit.prevent="handleRegister">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
        <input
          id="name"
          type="text"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          v-model="form.name"
          required
          autofocus
          autocomplete="name"
        />
        <p v-if="errors.name" class="mt-2 text-sm text-red-600">{{ errors.name }}</p>
      </div>

      <div class="mt-4">
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
        <input
          id="email"
          type="email"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          v-model="form.email"
          required
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
          autocomplete="new-password"
        />
        <p v-if="errors.password" class="mt-2 text-sm text-red-600">{{ errors.password }}</p>
      </div>

      <div class="mt-4">
        <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
        <input
          id="password_confirmation"
          type="password"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          v-model="form.password_confirmation"
          required
          autocomplete="new-password"
        />
      </div>

      <div class="flex items-center justify-end mt-4">
        <router-link
          to="/login"
          class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Déjà un compte ?
        </router-link>

        <button
          type="submit"
          :disabled="loading"
          class="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          <span v-if="loading">Création...</span>
          <span v-else>Créer un compte</span>
        </button>
      </div>
    </form>
  </GuestLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GuestLayout from '@/layouts/GuestLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const loading = ref(false)
const errors = ref({})

const handleRegister = async () => {
  loading.value = true
  errors.value = {}

  try {
    await authStore.register({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
    router.push('/dashboard')
  } catch (err) {
    errors.value = err.errors || { email: err.message || 'Erreur lors de la création' }
  } finally {
    loading.value = false
  }
}
</script>
