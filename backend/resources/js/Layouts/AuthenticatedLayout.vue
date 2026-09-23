<template>
    <div class="flex h-screen bg-gray-100">
      <!-- Sidebar -->
      <nav class="w-64 bg-white border-r border-gray-200 flex flex-col">
        <!-- Logo -->
        <div class="py-1 flex items-center justify-center border-b border-gray-200">
          <Link :href="route('dashboard')">
            <!-- Remplacer ApplicationLogo par une balise <img> pour afficher votre logo -->
            <img src="/logo.jpg" alt="" class="block h-9 w-auto" style="width: 4px; height: 80px;" />
          </Link>
        </div>
        <!-- Navigation Links -->
        <div class="flex-1 px-4 py-4 space-y-2">
          <template v-for="item in navItems" :key="item.route">
            <NavLink
              :href="route(item.route)"
              :active="route().current(item.route)"
              class="block w-full py-2 px-4 text-gray-600 rounded hover:bg-gray-100 hover:text-gray-900 text-left"
            >
              <i :class="`bi ${item.icon} mr-2`"></i>
              {{ item.label }}
            </NavLink>
          </template>
        </div>
      </nav>
  
      <!-- Main Content -->
      <div class="flex-1 flex flex-col">
        <!-- Top Navbar -->
        <header class="bg-white shadow flex justify-end items-center px-4 py-4">
          <Dropdown align="right" width="48">
            <template #trigger>
              <span class="inline-flex rounded-md">
                <button
                  type="button"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                >
                  {{ $page.props.auth.user.name }}
                  <i class="fas fa-user-circle ml-2"></i>
                </button>
              </span>
            </template>
            <template #content>
              <DropdownLink :href="route('profile.edit')">Profile</DropdownLink>
              <DropdownLink :href="route('logout')" method="post" as="button">
                Log Out
              </DropdownLink>
            </template>
          </Dropdown>
        </header>
  
        <!-- Page Content -->
        <main class="flex-1 p-6">
          <slot />
        </main>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import ApplicationLogo from '@/Components/ApplicationLogo.vue';
  import Dropdown from '@/Components/Dropdown.vue';
  import DropdownLink from '@/Components/DropdownLink.vue';
  import NavLink from '@/Components/NavLink.vue';
  import { Link } from '@inertiajs/vue3';
  
  // Mise à jour des éléments de la barre de navigation avec les icônes Bootstrap
  const navItems = [
    { label: 'Dashboard', route: 'dashboard', icon: 'house-door' },
    { label: 'Personnel', route: 'personnel', icon: 'person-lines-fill' },
    { label: 'Direction', route: 'direction', icon: 'briefcase-fill' },
    { label: 'Pointage', route: 'pointage', icon: 'clock' },
    { label: 'Absence', route: 'absence', icon: 'exclamation-triangle' },
    { label: 'Horloge', route: 'horloge', icon: 'clock-history' },
    { label: 'Badge', route: 'badge', icon: 'card-list' },
  ];
  </script>
  
  <style scoped>
  /* Uniform padding and font styles for all links */
  nav a {
    display: flex;
    align-items: center;
    text-decoration: none;
    font-size: 1rem;
  }
  
  /* Hover and active states */
  nav a:hover {
    background-color: #f1f5f9;
  }
  
  nav a.active {
    font-weight: bold;
    background-color: #e5e7eb;
  }
  </style>
  