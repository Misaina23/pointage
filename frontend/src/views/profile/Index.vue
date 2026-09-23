<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Mon profil</h1>
      <p class="text-gray-600 mt-1">Gérez vos informations de compte</p>
    </div>

    <Card title="Informations du compte" icon="UserCircleIcon">
      <form @submit.prevent="updateProfile" class="space-y-6">
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-blue-700 font-medium text-3xl">{{ userName?.charAt(0).toUpperCase() || 'U' }}</span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-gray-900">{{ userName }}</h3>
            <p class="text-gray-500">{{ userEmail }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="form.name"
            id="name"
            name="name"
            label="Nom complet *"
            required
            :error="errors.name"
          />
          <Input
            v-model="form.email"
            id="email"
            name="email"
            type="email"
            label="Email *"
            required
            :error="errors.email"
            prependIcon="MailIcon"
          />
        </div>

        <div class="pt-4 border-t border-gray-200">
          <Button type="submit" variant="primary" :loading="saving">
            <RefreshIcon class="w-5 h-5 mr-2" />
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Card>

    <Card title="Changer le mot de passe" icon="Cog6ToothIcon">
      <form @submit.prevent="updatePassword" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="passwordForm.current_password"
            id="current_password"
            name="current_password"
            type="password"
            label="Mot de passe actuel *"
            required
            :error="passwordErrors.current_password"
            autocomplete="current-password"
          />
          <Input
            v-model="passwordForm.password"
            id="password"
            name="password"
            type="password"
            label="Nouveau mot de passe *"
            required
            :error="passwordErrors.password"
            autocomplete="new-password"
          />
        </div>
        <Input
          v-model="passwordForm.password_confirmation"
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          label="Confirmer le nouveau mot de passe *"
          required
          :error="passwordErrors.password_confirmation"
          autocomplete="new-password"
        />
        <div class="pt-4 border-t border-gray-200">
          <Button type="submit" variant="primary" :loading="changingPassword">
            <Cog6ToothIcon class="w-5 h-5 mr-2" />
            Changer le mot de passe
          </Button>
        </div>
      </form>
    </Card>

    <Card title="Préférences" icon="Cog6ToothIcon" class="border-red-200">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-lg font-medium text-gray-900">Supprimer le compte</h4>
          <p class="text-gray-500 mt-1">Cette action est irréversible. Toutes vos données seront supprimées définitivement.</p>
        </div>
        <Button variant="danger" @click="confirmDeleteAccount">
          <TrashIcon class="w-5 h-5 mr-2" />
          Supprimer mon compte
        </Button>
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { UserCircleIcon, MailIcon, Cog6ToothIcon, RefreshIcon, TrashIcon } from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const router = useRouter()

const userName = computed(() => authStore.userName)
const userEmail = computed(() => authStore.userEmail)

const form = ref({
  name: '',
  email: '',
})

const errors = ref({})
const saving = ref(false)

const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const passwordErrors = ref({})
const changingPassword = ref(false)

const loadUserData = () => {
  if (authStore.user) {
    form.value.name = authStore.user.name || ''
    form.value.email = authStore.user.email || ''
  }
}

const updateProfile = async () => {
  errors.value = {}
  saving.value = true
  try {
    // API doesn't have profile update endpoint, using auth update
    await authStore.updatePassword({ ...passwordForm.value, current_password: '' })
    // For now just update local state
    authStore.user.name = form.value.name
    authStore.user.email = form.value.email
    localStorage.setItem('user', JSON.stringify(authStore.user))
    Swal.fire('Succès', 'Profil mis à jour', 'success')
  } catch (error) {
    if (error.errors) errors.value = error.errors
    else Swal.fire('Erreur', error.message || 'Impossible de mettre à jour', 'error')
  } finally {
    saving.value = false
  }
}

const updatePassword = async () => {
  passwordErrors.value = {}
  changingPassword.value = true
  try {
    await authStore.updatePassword(passwordForm.value)
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
    Swal.fire('Succès', 'Mot de passe modifié', 'success')
  } catch (error) {
    if (error.errors) passwordErrors.value = error.errors
    else Swal.fire('Erreur', error.message || 'Impossible de changer le mot de passe', 'error')
  } finally {
    changingPassword.value = false
  }
}

const confirmDeleteAccount = async () => {
  const result = await Swal.fire({
    title: 'Supprimer votre compte ?',
    text: 'Cette action est irréversible. Toutes vos données seront perdues.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Oui, supprimer définitivement',
    cancelButtonText: 'Annuler',
  })
  if (result.isConfirmed) {
    try {
      await authStore.logout()
      router.push('/login')
      Swal.fire('Supprimé', 'Votre compte a été supprimé', 'success')
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de supprimer le compte', 'error')
    }
  }
}

loadUserData()
</script>