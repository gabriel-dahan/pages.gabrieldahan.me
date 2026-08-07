<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const pad = (n: number) => String(n).padStart(2, '0')

const timeStr = () => {
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const dateStr = () =>
  now.value.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const tzStr = () => {
  const offset = -now.value.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="term-card" data-title="clock">
    <p class="term-dim text-xs mb-3">$ date</p>
    <p class="term-bright text-3xl sm:text-4xl tracking-wider tabular-nums font-semibold">
      {{ timeStr() }}
    </p>
    <p class="mt-2 text-sm">{{ dateStr() }}</p>
    <p class="term-muted text-xs mt-auto pt-4">{{ tzStr() }}</p>
  </section>
</template>
