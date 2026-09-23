<template>
  <GuestLayout>
    <div class="mb-4 font-medium text-sm text-gray-600">
      {{ status }}
    </div>

    <div v-if="success" class="mb-4 font-medium text-sm text-green-600">
      {{ success }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
        <input
          id="email"
          type="email"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          v-model="form.email"
          required
          autocomplete="email"
        />
        <p v-if="errors.email" class="mt-2 text-sm text-red-600">{{ errors.email }}</p>
      </div>

      <div class="flex items-center justify-end mt-4">
        <router-link
          to="/login"
          class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Retour à la connexion
        </router-link>
        <button
          type="submit"
          :disabled="loading"
          class="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          <span v-if="loading">Envoi...</span>
          <span v-else>Envoyer le lien</span>
        </button>
      </div>
    </form>
  </GuestLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GuestLayout from '@/layouts/GuestLayout.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({ email: '' })
const loading = ref(false)
const errors = ref({})
const success = ref('')
const status = computed(() => route.query.status || '')

const handleSubmit = async () => {
  loading.value = true
  errors.value = {}
  success.value = ''

  try {
    await authStore.forgotPassword(form.value)
    success.value = 'Si l\'email existe, un lien de réinitialisation a été envoyé.'
  } catch (err) {
    errors.value = err.errors || { email: err.message || 'Erreur lors de l\'envoi' }
  } finally {
    loading.value = false
  }
}
</script>
