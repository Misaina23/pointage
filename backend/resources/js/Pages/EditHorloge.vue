<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import Swal from 'sweetalert2';
import { router } from '@inertiajs/vue3';

const props = defineProps({
  horloge: Object,
});

const emit = defineEmits(['horloge-updated']);

const heureArrivee = ref(props.horloge.heure_arrivee || "");
const heureDepart = ref(props.horloge.heure_depart || "");
const isModalVisible = ref(true);

const closeModal = () => {
  isModalVisible.value = false;
};

const showAlert = (type, title, text) => {
  Swal.fire({
    icon: type,
    title,
    text,
  });
};
const modifierHorloge = () => {
  const arrivee = heureArrivee.value.trim();
  const depart = heureDepart.value.trim();

  if (!arrivee || !depart) {
    showAlert('warning', 'Attention', 'Veuillez saisir les deux horaires.');
    return;
  }

  router.put(route('horloge.update', props.horloge.id), { heure_arrivee: arrivee, heure_depart: depart }, {
    onSuccess: () => {
      closeModal();
      showAlert('success', 'Succès', 'Les horaires ont été mis à jour.');
      emit('horloge-updated');
      router.reload();
    },
    onError: (errors) => {
      closeModal();
      const errorMessage = errors?.response?.data?.message || "Une erreur s'est produite.";
      showAlert('error', 'Erreur', errorMessage);
    },
  });
};


</script>

<template>
  <div v-if="isModalVisible" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modifier les Horaires</h5>
        <button type="button" class="btn-close" @click="closeModal"></button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="modifierHorloge">
          <div class="form-group">
            <label for="heureArrivee">Heure d'arrivée</label>
            <input type="time" id="heureArrivee" class="form-control" v-model="heureArrivee" />
          </div>
          <div class="form-group mt-3">
            <label for="heureDepart">Heure de départ</label>
            <input type="time" id="heureDepart" class="form-control" v-model="heureDepart" />
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 450px; /* Ajuste la largeur du modal */
  max-width: 100%; /* Assure que le modal ne dépasse pas l'écran */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top:-160px;
}
</style>
