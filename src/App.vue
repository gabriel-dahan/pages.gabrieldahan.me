<script setup lang="ts">
import { RouterView } from 'vue-router';
import Footer from './components/Footer.vue';
import Header from './components/Header.vue';
</script>

<template>
  <div class="term-scanlines min-h-screen w-full flex flex-col relative bg-[var(--term-bg)] text-[var(--term-fg)]">
    <Header class="relative z-50 w-full" />

    <main class="flex-grow w-full px-3 sm:px-6 py-8 relative z-10">
      <RouterView />
    </main>

    <Footer class="relative z-10 w-full" />
  </div>
</template>
