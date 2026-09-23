<script setup>
import { ref, defineEmits } from 'vue';
import Swal from 'sweetalert2'; // SweetAlert2 pour afficher des alertes
import { router } from '@inertiajs/vue3';

const emit = defineEmits(['direction-added']); // Émission de l'événement pour le parent

// Variables pour le formulaire
const nomDirection = ref("");
const description = ref(""); // Define the description variable
const isModalVisible = ref(true); // Gérer la visibilité de la modale

// Fonction pour fermer la modale
const closeModal = () => {
  isModalVisible.value = false;
};

// Fonction pour ajouter une direction
const ajout = () => {
  const nom = nomDirection.value.trim();
  const desc = description.value.trim();

  if (!nom || !desc) {
    // Afficher une alerte d'avertissement si l'un des champs est vide
    Swal.fire({
      icon: 'warning',
      title: 'Attention',
      text: 'Veuillez saisir un nom et une description pour la direction.',
    }).then(() => {
      // Rouvrir la modale si nécessaire
      isModalVisible.value = true;
    });
    return;
  }

  // Effectuer la requête POST vers le backend Laravel
  router.post(route("direction.store"), { nom, description: desc }, {
    onSuccess: () => {
      closeModal(); // Fermer la modale
      // Afficher une alerte de succès après l'ajout réussi
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'La direction a été ajoutée avec succès.',
      }).then(() => {
        // Rediriger vers la page des directions après l'ajout réussi
        router.push(route('direction'));  // Remplacez 'direction.index' par la route correcte
      });
      // Émettre l'événement pour informer le parent que la direction a été ajoutée
      emit('direction-added');
    },
    onError: (errors) => {
      closeModal(); // Fermer la modale
      // Afficher une alerte d'erreur si l'ajout échoue
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errors.nom || "Une erreur s'est produite.",
      }).then(() => {
        // Rouvrir la modale si nécessaire
        isModalVisible.value = true;
      });
    },
  });
};
</script>


<template>
  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Créer une Direction</h5>
        <button type="button" class="btn-close" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="ajout">
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
            <button type="submit" class="btn btn-primary">Ajouter</button>
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
