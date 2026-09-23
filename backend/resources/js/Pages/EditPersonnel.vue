<script setup>
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2'; // SweetAlert2 pour afficher des alertes
import { router } from '@inertiajs/vue3';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue'; // Import du layout

// Props
const props = defineProps({
  directions: Array, // Liste des directions passée depuis le backend
  personnel: Object, // Données du personnel à modifier, passées depuis le backend
});

// Références
const nom = ref('');
const prenom = ref('');
const directionId = ref('');
const service = ref('');
const grade = ref('');
const corp = ref('');
const fonction = ref('');
const IM = ref('');
const email = ref('');
const photo = ref('');
const photoPreview = ref(null); // Aperçu de l'image

// Récupération des données existantes du personnel à modifier
onMounted(() => {
  // On récupère les données du personnel passées par Inertia
  nom.value = props.personnel.nom;
  prenom.value = props.personnel.prenom;
  directionId.value = props.personnel.direction_id;
  service.value = props.personnel.service;
  grade.value = props.personnel.grade;
  corp.value = props.personnel.corp;
  fonction.value = props.personnel.fonction;
  IM.value = props.personnel.IM || '';
  email.value = props.personnel.email;
  photoPreview.value = props.personnel.photo || null; // Utilise l'URL de l'image existante si elle est présente
});

// Gestion du fichier image
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.value = e.target.result; // Affiche l'aperçu de l'image
    };
    reader.readAsDataURL(file);
    photo.value = file; // Stocke le fichier pour l'envoi au serveur
  }
};

const submitForm = () => {
  if (!nom.value || !prenom.value || !directionId.value || !service.value || !grade.value || !corp.value || !fonction.value || !email.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Tous les champs sont obligatoires.',
      text: 'Veuillez remplir tous les champs avant de soumettre.',
    });
    return;
  }

  const formData = new FormData();
  formData.append('_method', 'PUT'); // Indiquer que c'est une mise à jour
  formData.append('nom', nom.value);
  formData.append('prenom', prenom.value);
  formData.append('direction_id', directionId.value);
  formData.append('service', service.value);
  formData.append('grade', grade.value);
  formData.append('corp', corp.value);
  formData.append('fonction', fonction.value);
  formData.append('IM', IM.value);
  formData.append('email', email.value);
  formData.append('photo', photo.value); // Ajoute le fichier image au formulaire

  router.post(route('personnel.update', props.personnel.id), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onSuccess: () => {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Le personnel a été mis à jour avec succès.',
      });
      router.push(route('personnel'));
    },
    onError: (errors) => {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errors.response?.data?.message || 'Une erreur est survenue lors de la mise à jour du personnel.',
      });
    },
  });
};
</script>

<template>
  <AuthenticatedLayout>
    <template #header>
      <h2>Modifier le personnel</h2>
    </template>
    <div class="container">
      <form @submit.prevent="submitForm" enctype="multipart/form-data">
        <img :src="photoPreview" alt=" " class="img-thumbnail rounded-circle" width="100" height="100" />

        <div class="row">
          <div class="col">
            <input type="text" class="form-control" v-model="nom" placeholder="Nom" required />
          </div>
          <div class="col">
            <input type="text" class="form-control" v-model="prenom" placeholder="Prénom" required />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col">
            <select class="form-control" v-model="directionId" required>
              <option value="" disabled selected>Choisir une direction</option>
              <option v-for="direction in props.directions" :key="direction.id" :value="direction.id">
                {{ direction.nom }}
              </option>
            </select>
          </div>
          <div class="col">
            <input type="text" class="form-control" v-model="service" placeholder="Service" required />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col">
            <input type="text" class="form-control" v-model="corp" placeholder="Corp" required />
          </div>
          <div class="col">
            <input type="text" class="form-control" v-model="grade" placeholder="Grade" required />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col">
            <input type="text" class="form-control" v-model="fonction" placeholder="Fonction" required />
          </div>
          <div class="col">
            <input type="text" class="form-control" v-model="IM" placeholder="IM (optionnel)" />
          </div>
        </div>

        <div class="row mt-3">       
          <div class="col">
            <input type="email" class="form-control" v-model="email" placeholder="Email" required />
          </div>
          <div class="col">
            <input type="file" class="form-control" @change="handleFileChange" />
          </div>
        </div>

        <div class="row mt-3">
          <div class="col text-center">
            <div v-if="photoPreview" class="photo-preview-container">
            </div>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col">
            <button type="submit" class="btn btn-primary w-100">Mettre à jour le personnel</button>
          </div>
        </div>
      </form>
    </div>
  </AuthenticatedLayout>
</template>

<style scoped>
.container {
  margin-top: 20px;
}

form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

button {
  font-weight: bold;
}

.photo-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.img-thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 2px solid #ddd;
}

.rounded-circle {
  border-radius: 50%;
}

input[type="file"] {
  display: block;
}

input[type="email"] {
  margin-bottom: 10px;
}
</style>
