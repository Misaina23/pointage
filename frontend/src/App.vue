<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
// Global components can be registered here if needed
</script>

<style scoped>
#app {
  min-height: 100vh;
}
</style>