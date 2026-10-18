<script setup lang="ts">
const attended = 1
const won = 0
</script>

<template>
  <section class="term-card" data-title="hackathons">
    <p class="term-dim text-xs mb-3">$ hackathons</p>
    <div class="space-y-2 text-sm flex-grow">
      <p class="flex items-baseline justify-between gap-3">
        <span class="term-dim">attended</span>
        <span class="term-bright text-2xl tabular-nums font-semibold">{{ attended }}</span>
      </p>
      <p class="flex items-baseline justify-between gap-3">
        <span class="term-dim">won</span>
        <span class="term-bright text-2xl tabular-nums font-semibold">{{ won }}</span>
      </p>
    </div>
    <p class="term-muted text-xs mt-auto pt-3">
      still grinding<span class="cursor-blink" aria-hidden="true" />
    </p>
  </section>
</template>
