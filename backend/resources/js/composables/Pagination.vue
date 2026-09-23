<template>
    <div>
      <ul class="pagination pagination-sm m-0 float-right">
        <!-- Lien vers la page précédente -->
        <li class="page-item" :class="{ disabled: !prev }">
          
        </li>
  
        <!-- Lien pour chaque page -->
        <li 
          v-for="(link, index) in links" 
          :key="index" 
          class="page-item" 
          :class="{ active: link.active }"
        >
          <a 
            class="page-link" 
            :href="link.url || '#'" 
            v-html="link.label"
            :aria-disabled="!link.url"
          ></a>
        </li>
  
        <!-- Lien vers la page suivante -->
        <li class="page-item" :class="{ disabled: !next }">
          
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    links: {
      type: Array,
      required: true,
    },
    prev: {
      type: String,
      default: null,
    },
    next: {
      type: String,
      default: null,
    },
  });
  </script>
  
  <style scoped>
  .pagination .disabled > .page-link {
    pointer-events: none;
    opacity: 0.6;
  }
  </style>
  