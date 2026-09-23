<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Horaires</h1>
        <p class="text-gray-600 mt-1">Configuration des horaires de travail</p>
      </div>
    </div>

    <Card title="Horaires de travail" icon="ClockIcon">
      <div v-if="loading" class="flex justify-center py-12">
        <LoadingSpinner size="h-10 w-10" />
      </div>

      <div v-else-if="horloges.length === 0" class="text-center py-12">
        <ClockIcon class="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <p class="text-lg text-gray-500">Aucun horaire configuré</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full" role="table">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure d'arrivée</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure de départ</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="horloge in horloges" :key="horloge.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ horloge.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatTime(horloge.heure_arrivee) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatTime(horloge.heure_depart) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button variant="ghost" size="sm" @click="openEditModal(horloge)">
                  <PencilIcon class="w-4 h-4 mr-1" />
                  Modifier
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Edit Modal -->
    <Modal v-model:modelValue="showModal" :title="`Modifier l'horaire #${editingHorloge?.id}`">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="form.heure_arrivee"
            id="heure_arrivee"
            name="heure_arrivee"
            type="time"
            label="Heure d'arrivée *"
            required
            :error="errors.heure_arrivee"
          />
          <Input
            v-model="form.heure_depart"
            id="heure_depart"
            name="heure_depart"
            type="time"
            label="Heure de départ *"
            required
            :error="errors.heure_depart"
          />
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="secondary" @click="closeModal">Annuler</Button>
          <Button type="submit" variant="primary" :loading="submitting">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { ClockIcon, PencilIcon } from '@/components'
import Card from '@/components/Card.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'
import Modal from '@/components/Modal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Swal from 'sweetalert2'

const loading = ref(false)
const horloges = ref([])
const showModal = ref(false)
const editingHorloge = ref(null)
const form = ref({ heure_arrivee: '', heure_depart: '' })
const errors = ref({})
const submitting = ref(false)

const fetchHorloges = async () => {
  loading.value = true
  try {
    horloges.value = await api.get('/horloge').then(r => r.data)
  } catch (error) {
    Swal.fire('Erreur', 'Impossible de charger les horaires', 'error')
  } finally {
    loading.value = false
  }
}

const openEditModal = (horloge) => {
  editingHorloge.value = horloge
  form.value = {
    heure_arrivee: horloge.heure_arrivee?.slice(0, 5) || '',
    heure_depart: horloge.heure_depart?.slice(0, 5) || '',
  }
  errors.value = {}
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingHorloge.value = null
}

const handleSubmit = async () => {
  errors.value = {}
  submitting.value = true
  try {
    await api.put(`/horloge/${editingHorloge.value.id}`, form.value)
    Swal.fire('Succès', 'Horaire modifié', 'success')
    closeModal()
    fetchHorloges()
  } catch (error) {
    errors.value = error.response?.data?.errors || {}
    if (Object.keys(errors.value).length === 0) {
      Swal.fire('Erreur', error.response?.data?.message || error.message || 'Erreur', 'error')
    }
  } finally {
    submitting.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.slice(0, 5)
}

onMounted(() => {
  fetchHorloges()
})
</script>