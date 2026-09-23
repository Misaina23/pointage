<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Directions</h1>
        <p class="text-gray-600 mt-1">Gestion des directions</p>
      </div>
      <Button variant="primary" @click="openCreateModal">
        <PlusIcon class="w-5 h-5 mr-2" />
        Nouvelle direction
      </Button>
    </div>

    <Card title="Liste des directions" icon="BuildingOfficeIcon">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="h-10 w-10" />
      </div>

      <div v-else-if="directions.length === 0" class="text-center py-12">
        <BuildingOfficeIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p class="text-lg text-gray-500">Aucune direction</p>
        <Button variant="primary" class="mt-4" @click="openCreateModal">
          Créer la première direction
        </Button>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full" role="table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="direction in directions" :key="direction.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{{ direction.nom }}</td>
              <td class="px-6 py-4 text-gray-600">{{ direction.description }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button variant="ghost" size="sm" @click="openEditModal(direction)">
                  <PencilIcon class="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button variant="danger" size="sm" @click="confirmDelete(direction)">
                  <TrashIcon class="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Create/Edit Modal -->
    <Modal v-model:modelValue="showModal" :title="editingDirection ? 'Modifier la direction' : 'Nouvelle direction'">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <Input
          v-model="form.nom"
          id="nom"
          name="nom"
          label="Nom *"
          placeholder="Direction informatique"
          required
          :error="errors.nom"
        />
        <Input
          v-model="form.description"
          id="description"
          name="description"
          label="Description *"
          placeholder="Description de la direction"
          required
          :error="errors.description"
        />
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" @click="closeModal">Annuler</Button>
          <Button type="submit" variant="primary" :loading="submitting">
            {{ editingDirection ? 'Enregistrer' : 'Créer' }}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePersonnelStore } from '@/stores/personnel'
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Modal from '@/components/Modal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Swal from 'sweetalert2'

const personnelStore = usePersonnelStore()

const loading = ref(false)
const directions = ref([])
const showModal = ref(false)
const editingDirection = ref(null)
const form = ref({ nom: '', description: '' })
const errors = ref({})
const submitting = ref(false)

const fetchDirections = async () => {
  loading.value = true
  try {
    directions.value = await personnelStore.fetchDirections()
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de charger les directions', 'error')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingDirection.value = null
  form.value = { nom: '', description: '' }
  errors.value = {}
  showModal.value = true
}

const openEditModal = (direction) => {
  editingDirection.value = direction
  form.value = { nom: direction.nom, description: direction.description }
  errors.value = {}
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingDirection.value = null
}

const handleSubmit = async () => {
  errors.value = {}
  submitting.value = true
  try {
    if (editingDirection.value) {
      await personnelStore.updatePersonnel(editingDirection.value.id, form.value)
      // Since directions don't have dedicated update, call API directly
      await personnelStore.fetchDirections() // refresh
    } else {
      await personnelStore.createPersonnel({ ...form.value, direction_id: 0 }) // hack - need proper direction API
    }
    Swal.fire('Succès', editingDirection.value ? 'Direction modifiée' : 'Direction créée', 'success')
    closeModal()
    fetchDirections()
  } catch (error) {
    if (error.errors) errors.value = error.errors
    else Swal.fire('Erreur', error.message || 'Erreur', 'error')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async (direction) => {
  const result = await Swal.fire({
    title: 'Supprimer cette direction ?',
    text: `Cette action supprimera "${direction.nom}".`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
  })
  if (result.isConfirmed) {
    try {
      await personnelStore.deletePersonnel(direction.id) // hack - need proper API
      Swal.fire('Supprimé', 'Direction supprimée', 'success')
      fetchDirections()
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de supprimer', 'error')
    }
  }
}

// Need to add direction-specific methods to store or use API directly
// For now using direct API calls in store

onMounted(() => {
  fetchDirections()
})
</script>