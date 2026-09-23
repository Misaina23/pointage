<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import Swal from 'sweetalert2'; // SweetAlert2 pour les alertes
import { router } from '@inertiajs/vue3';

const props = defineProps({
  direction: Object, // La direction à modifier
});

const emit = defineEmits(['direction-updated']); // Événement pour informer le parent

// Variables du formulaire
const nomDirection = ref(props.direction.nom || "");
const description = ref(props.direction.description || ""); // Add the description variable
const isModalVisible = ref(true);

// Fonction pour fermer la modale
const closeModal = () => {
  isModalVisible.value = false;
};

// Fonction réutilisable pour afficher les alertes
const showAlert = (type, title, text) => {
  Swal.fire({
    icon: type,
    title: title,
    text: text,
  });
};

// Fonction pour mettre à jour la direction
const modifier = () => {
  const nom = nomDirection.value.trim();
  const desc = description.value.trim(); // Get the description value

  if (!nom || !desc) {
    showAlert('warning', 'Attention', 'Veuillez saisir un nom et une description pour la direction.');
    return;
  }

  router.put(route('direction.update', props.direction.id), { nom, description: desc }, {
    onSuccess: () => {
      closeModal();
      showAlert('success', 'Succès', 'La direction a été mise à jour avec succès.');
      emit('direction-updated');
      router.reload(); // Recharge la page pour afficher les changements
    },
    onError: (errors) => {
      closeModal();
      showAlert('error', 'Erreur', errors.nom || "Une erreur s'est produite.");
    },
  });
};
</script>
<template>
  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modifier la Direction</h5>
        <button type="button" class="btn-close" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="modifier">
          <div class="form-group">
            <label for="directionName">Nom de la direction</label>
            <input
              type="text"
              id="directionName"
              class="form-control"
              v-model="nomDirection"
              placeholder="Entrez le nom de la direction"
            />
          </div>
          <!-- Add description input field -->
          <div class="form-group mt-3">
            <label for="description">Description</label>
            <input
              type="text"
              id="description"
              class="form-control"
              v-model="description"
              placeholder="Entrez la description de la direction"
            />
          </div>
          <div class="form-group mt-3">
            <button type="submit" class="btn btn-primary">Modifier</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles pour la modale */
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
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header .btn-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}
</style>
