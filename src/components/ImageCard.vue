<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  src: string
  camera?: string | null
  iso?: number | null
  obturation?: string | null
  timestamp?: string | null
  categoryName?: string | null
}>()

const metaParts = computed(() => {
  const parts: string[] = []
  if (props.camera) parts.push(props.camera)
  if (props.iso != null) parts.push(`ISO ${props.iso}`)
  if (props.obturation) parts.push(props.obturation)
  if (props.timestamp) parts.push(props.timestamp)
  return parts
})
</script>

<template>
  <article class="term-card w-full h-full flex flex-col gap-3 overflow-hidden" :data-title="name">
    <div class="border border-[var(--term-border)] bg-[var(--term-bg)] overflow-hidden -mx-1">
      <img
        :src="src"
        :alt="name"
        class="w-full aspect-[4/3] object-cover block"
        loading="lazy"
      />
    </div>

    <div class="min-w-0">
      <h3 class="term-bright text-sm truncate" :title="name">{{ name }}</h3>
      <p v-if="categoryName" class="text-xs term-dim mt-1 truncate">
        # {{ categoryName }}
      </p>
    </div>

    <p
      v-if="metaParts.length"
      class="text-xs term-muted leading-relaxed mt-auto pt-2 border-t border-[var(--term-border)]"
    >
      <span v-for="(part, i) in metaParts" :key="part + i">
        <span v-if="i > 0" class="term-dim"> · </span>{{ part }}
      </span>
    </p>
  </article>
</template>
