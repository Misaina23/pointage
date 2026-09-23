<script setup>
import { ref } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import EditHorloge from './EditHorloge.vue';
import Swal from 'sweetalert2';

const props = defineProps({
  horloges: Array,
});

const isEditModalVisible = ref(false); // Pour l'édition
const currentHorloge = ref(null); // Horloge sélectionnée

// Ouvrir la modale d'édition
const openEditModal = (horloge) => {
  currentHorloge.value = horloge;
  isEditModalVisible.value = true;
};

// Fermer la modale d'édition
const closeEditModal = () => {
  isEditModalVisible.value = false;
  currentHorloge.value = null;
};

// Supprimer une horloge avec confirmation via SweetAlert
const deleteHorloge = (id) => {
  Swal.fire({
    title: 'Êtes-vous sûr?',
    text: 'Cette action est irréversible.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer!',
    cancelButtonText: 'Annuler',
  }).then((result) => {
    if (result.isConfirmed) {
      router.delete(route('horloge.destroy', id), {
        onSuccess: () => {
          Swal.fire('Supprimée!', 'L\'horloge a été supprimée.', 'success');
          router.reload();
        },
        onError: () => {
          Swal.fire('Erreur!', 'Une erreur est survenue.', 'error');
        },
      });
    }
  });
};
</script>

<template>
  <Head title="Liste des Horloges" />

  <AuthenticatedLayout>
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">Liste des Horloges</h2>
    </template>

    <div class="py-8">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Liste des Horloges</h3>
        </div>
        <div class="card-body">
          <table class="table">
            <thead>
              <tr>
                <th>Heure d'arrivée</th>
                <th>Heure de départ</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="horloge in props.horloges" :key="horloge.id">
                <td>{{ horloge.heure_arrivee }}</td>
                <td>{{ horloge.heure_depart }}</td>
                <td>
                  <button
                   class="btn btn-danger btn-sm me-2"
                    
                    @click="openEditModal(horloge)"
                  >
                  <i class="fa-solid fa-pencil"></i>
                  </button>
                  
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modale pour édition -->
    <div v-if="isEditModalVisible" class="modal-overlay" @click.self="closeEditModal">
      <EditHorloge :horloge="currentHorloge" @horloge-updated="closeEditModal" />
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
</style>
