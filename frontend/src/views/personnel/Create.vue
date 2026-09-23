<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nouveau personnel</h1>
        <p class="text-gray-600 mt-1">Ajouter un nouvel employé</p>
      </div>
      <router-link to="/personnel" class="btn-secondary">
        <ChevronLeftIcon class="w-5 h-5 mr-2" />
        Retour
      </router-link>
    </div>

    <!-- Form -->
    <Card title="Informations du personnel" icon="UserCircleIcon">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="form.nom"
            id="nom"
            name="nom"
            label="Nom *"
            placeholder="Dupont"
            required
            :error="errors.nom"
          />
          <Input
            v-model="form.prenom"
            id="prenom"
            name="prenom"
            label="Prénom *"
            placeholder="Jean"
            required
            :error="errors.prenom"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            v-model="form.direction_id"
            id="direction_id"
            name="direction_id"
            label="Direction *"
            :options="directionOptions"
            placeholder="Sélectionner une direction"
            required
            :error="errors.direction_id"
          />
          <Input
            v-model="form.service"
            id="service"
            name="service"
            label="Service *"
            placeholder="Service informatique"
            required
            :error="errors.service"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="form.grade"
            id="grade"
            name="grade"
            label="Grade *"
            placeholder="Ingénieur"
            required
            :error="errors.grade"
          />
          <Input
            v-model="form.corp"
            id="corp"
            name="corp"
            label="Corps *"
            placeholder="Corps technique"
            required
            :error="errors.corp"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="form.fonction"
            id="fonction"
            name="fonction"
            label="Fonction *"
            placeholder="Développeur"
            required
            :error="errors.fonction"
          />
          <Input
            v-model="form.IM"
            id="IM"
            name="IM"
            label="IM (Identifiant) *"
            placeholder="IM123456"
            required
            :error="errors.IM"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="form.email"
            id="email"
            name="email"
            type="email"
            label="Email *"
            placeholder="jean.dupont@email.com"
            required
            :error="errors.email"
            prependIcon="MailIcon"
          />
          <Select
            v-model="form.role"
            id="role"
            name="role"
            label="Rôle *"
            :options="roleOptions"
            required
            :error="errors.role"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative">
              <img v-if="preview" :src="preview" alt="Aperçu" class="w-full h-full object-cover" />
              <span v-else class="text-gray-400 text-sm">Aucune photo</span>
            </div>
            <div class="flex-1">
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                @change="handlePhotoChange"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p class="mt-1 text-sm text-gray-500">PNG, JPG, GIF jusqu'à 2MB</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            v-model="form.password"
            id="password"
            name="password"
            type="password"
            label="Mot de passe *"
            placeholder="••••••••"
            required
            :error="errors.password"
            autocomplete="new-password"
          />
          <Input
            v-model="form.password_confirmation"
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            label="Confirmer le mot de passe *"
            placeholder="••••••••"
            required
            :error="errors.password_confirmation"
            autocomplete="new-password"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <router-link to="/personnel" class="btn-secondary">
            Annuler
          </router-link>
          <Button type="submit" variant="primary" :loading="submitting">
            <PlusIcon class="w-5 h-5 mr-2" />
            Créer le personnel
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonnelStore } from '@/stores/personnel'
import { PlusIcon, ChevronLeftIcon, UserCircleIcon, MailIcon } from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Select from '@/components/Select.vue'
import Button from '@/components/Button.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const personnelStore = usePersonnelStore()

const form = ref({
  nom: '',
  prenom: '',
  direction_id: '',
  service: '',
  grade: '',
  corp: '',
  fonction: '',
  IM: '',
  email: '',
  role: 'employee',
  password: '',
  password_confirmation: '',
  photo: null,
})

const preview = ref(null)
const errors = ref({})
const submitting = ref(false)

const directionOptions = ref([])
const roleOptions = ref([
  { value: 'employee', label: 'Employé' },
  { value: 'security', label: 'Personnel de sécurité' },
])

const fetchDirections = async () => {
  try {
    const directions = await personnelStore.fetchDirections()
    directionOptions.value = directions.map(d => ({ value: d.id, label: d.nom }))
  } catch (error) {
    console.error('Failed to fetch directions:', error)
  }
}

const handlePhotoChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('Erreur', 'La photo ne doit pas dépasser 2MB', 'error')
      event.target.value = ''
      return
    }
    form.value.photo = file
    preview.value = URL.createObjectURL(file)
  }
}

const handleSubmit = async () => {
  errors.value = {}
  submitting.value = true

  try {
    const formData = new FormData()
    Object.keys(form.value).forEach(key => {
      if (key !== 'photo' || form.value[key]) {
        formData.append(key, form.value[key])
      }
    })

    await personnelStore.createPersonnel(formData)
    Swal.fire('Succès', 'Personnel créé avec succès', 'success')
    router.push('/personnel')
  } catch (error) {
    if (error.errors) {
      errors.value = error.errors
    } else {
      Swal.fire('Erreur', error.message || 'Impossible de créer le personnel', 'error')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchDirections()
})
</script>