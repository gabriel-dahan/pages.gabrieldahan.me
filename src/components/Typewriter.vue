<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  speed?: number
  delay?: number
  showCursor?: boolean
  as?: string
}>(), {
  speed: 18,
  delay: 0,
  showCursor: true,
  as: 'span',
})

const emit = defineEmits<{
  done: []
}>()

const displayed = ref('')
const done = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
let cancelled = false

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function finish() {
  displayed.value = props.text
  done.value = true
  emit('done')
}

function type(fromIndex = 0) {
  if (cancelled) return
  if (fromIndex >= props.text.length) {
    finish()
    return
  }
  displayed.value = props.text.slice(0, fromIndex + 1)
  timer = setTimeout(() => type(fromIndex + 1), props.speed)
}

function start() {
  clearTimer()
  cancelled = false
  done.value = false
  displayed.value = ''

  if (!props.text) {
    finish()
    return
  }

  if (prefersReducedMotion()) {
    finish()
    return
  }

  timer = setTimeout(() => type(0), props.delay)
}

onMounted(start)

watch(() => props.text, () => {
  start()
})

onUnmounted(() => {
  cancelled = true
  clearTimer()
})
</script>

<template>
  <component :is="as" class="term-typewriter">
    <span>{{ displayed }}</span>
    <span v-if="showCursor && !done" class="cursor-blink" aria-hidden="true" />
  </component>
</template>
