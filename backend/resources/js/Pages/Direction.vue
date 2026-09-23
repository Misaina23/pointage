<script setup>
import { ref } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import CreateDirection from './CreateDirection.vue';
import EditDirection from './EditDirection.vue';
import { useAlert } from '@/composables/Alert';
import Swal from 'sweetalert2';

const props = defineProps({
  directions: Array,
});

const { message, type, showAlert } = useAlert();
const isModalVisible = ref(false); // Pour la création
const isEditModalVisible = ref(false); // Pour l'édition
const currentDirection = ref(null); // Direction sélectionnée

// Ouvrir la modale de création
const openModal = () => {
  isModalVisible.value = true;
};

// Fermer la modale de création
const closeModal = () => {
  isModalVisible.value = false;
  currentDirection.value = null;
};

// Ouvrir la modale d'édition
const openEditModal = (direction) => {
  currentDirection.value = direction;
  isEditModalVisible.value = true;
};

// Fermer la modale d'édition
const closeEditModal = () => {
  isEditModalVisible.value = false;
  currentDirection.value = null;
};

// Supprimer une direction avec confirmation via SweetAlert
const deleteDirection = (id) => {
  Swal.fire({
    title: 'Êtes-vous sûr?',
    text: 'Cette action est irréversible.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer!',
    cancelButtonText: 'Annuler',
  }).then((result) => {
    if (result.isConfirmed) {
      // Effectuer la requête DELETE vers le backend Laravel
      router.delete(route('direction.destroy', id), {
        onSuccess: () => {
          showAlert('Direction supprimée avec succès.', 'success');
          // Optionally refresh the page or redirect
          router.visit(route('direction'));
        },
        onError: () => {
          showAlert('Une erreur est survenue.', 'danger');
        },
      });
    }
  });
};
</script>


<template>
  <Head title="Dashboard" />
  
  <AuthenticatedLayout>
    <template #header>
      <h2 class="font-semibold text-xl text-gray-800 leading-tight">Liste des directions</h2>
    </template>

    <div class="py-12">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Liste des directions</h3>

            <div class="card-footer clearfix">
              <button class="btn btn-primary" @click="openModal">
                <i class="fa fa-plus"></i> Nouveau
              </button>
                <ul class="pagination pagination-sm m-0 float-right">
                  <li class="page-item"><a class="page-link" href="#">«</a></li>
                  <li class="page-item"><a class="page-link" href="#">1</a></li>
                  <li class="page-item"><a class="page-link" href="#">2</a></li>
                  <li class="page-item"><a class="page-link" href="#">3</a></li>
                  <li class="page-item"><a class="page-link" href="#">»</a></li>
                </ul>
              </div>
          </div>

          <div class="card-footer clearfix">
            <table class="table">
              <thead>
                <tr>
                  <th>Direction</th>
                  <th>Description</th>
                  <th style="width: 100px">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="direction in props.directions" :key="direction.id">
                  <td>{{ direction.nom }}</td>
                  <td>{{ direction.description }}</td>
                  <td>
                    <button
                      class="btn btn-primary btn-sm me-2"
                      @click="openEditModal(direction)"
                    >
                      <i class="fa-solid fa-pencil"></i>
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      @click="deleteDirection(direction.id)"
                    >
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modale pour création -->
    <div v-if="isModalVisible" class="modal-overlay" @click.self="closeModal">
      <CreateDirection @direction-added="closeModal" />
    </div>

    <!-- Modale pour édition -->
    <div v-if="isEditModalVisible" class="modal-overlay" @click.self="closeEditModal">
      <EditDirection :direction="currentDirection" @direction-updated="closeEditModal" />
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  width: 720px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}


.py-12 {
  margin-top:-40px;
  
}
</style>
