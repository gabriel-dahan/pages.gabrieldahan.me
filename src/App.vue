<script setup lang="ts">
import { RouterView } from 'vue-router';
import Footer from './components/Footer.vue';
import Header from './components/Header.vue'

</script>

<template>
  <div class="h-[calc(100%-257px)]">
    <Header />

    <main class="container mx-auto p-4 min-h-full flex flex-col items-center justify-center">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>
