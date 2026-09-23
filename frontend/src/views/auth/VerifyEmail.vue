<template>
  <GuestLayout>
    <div class="text-center py-8">
      <div v-if="loading" class="space-y-4">
        <LoadingSpinner size="h-10 w-10" />
        <p class="text-gray-600">Vérification en cours...</p>
      </div>

      <div v-else-if="verified" class="space-y-4">
        <CheckBadgeIcon class="mx-auto h-16 w-16 text-green-600" />
        <h3 class="text-lg font-medium text-green-800">Email vérifié avec succès !</h3>
        <p class="text-gray-600">Vous pouvez maintenant vous connecter.</p>
        <button
          @click="$router.push('/login')"
          class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          Se connecter
        </button>
      </div>

      <div v-else-if="error" class="space-y-4">
        <XCircleIcon class="mx-auto h-16 w-16 text-red-600" />
        <h3 class="text-lg font-medium text-red-800">Erreur de vérification</h3>
        <p class="text-gray-600">{{ error }}</p>
        <button
          @click="resendVerification"
          class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
        >
          Renvoyer le lien
        </button>
      </div>
    </div>
  </GuestLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CheckBadgeIcon, XCircleIcon } from '@/components'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import GuestLayout from '@/layouts/GuestLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(true)
const verified = ref(false)
const error = ref('')

onMounted(async () => {
  const { id, hash } = route.params

  if (id && hash) {
    try {
      await authStore.verifyEmail({ id, hash })
      verified.value = true
    } catch (err) {
      error.value = err.message || 'Lien de vérification invalide ou expiré'
    }
  } else {
    error.value = 'Lien de vérification invalide'
  }

  loading.value = false
})

const resendVerification = async () => {
  loading.value = true
  try {
    await authStore.sendEmailVerification()
    alert('Lien de vérification renvoyé')
  } catch (err) {
    error.value = err.message || 'Erreur lors de l\'envoi'
  } finally {
    loading.value = false
  }
}
</script>
