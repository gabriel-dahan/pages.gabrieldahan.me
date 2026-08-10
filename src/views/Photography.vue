<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ImageCard from '../components/ImageCard.vue'

type PhotographyCategory = {
  id: number
  name: string
  slug: string
  imageCount: number
}

type PhotographyImage = {
  id: number
  categoryId: number
  categoryName: string
  categorySlug: string
  name: string
  path: string
  camera: string | null
  iso: number | null
  obturation: string | null
  timestamp: string | null
}

const categories = ref<PhotographyCategory[]>([])
const images = ref<PhotographyImage[]>([])
const activeSlug = ref<string | null>(null)
const loading = ref(true)
const error = ref('')

const visibleImages = computed(() => {
  if (!activeSlug.value) return images.value
  return images.value.filter((img) => img.categorySlug === activeSlug.value)
})

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [catRes, imgRes] = await Promise.all([
      fetch('/api/photography/categories'),
      fetch('/api/photography/images'),
    ])
    if (!catRes.ok || !imgRes.ok) throw new Error('Failed to load gallery')
    const catData = await catRes.json()
    const imgData = await imgRes.json()
    categories.value = catData.categories || []
    images.value = imgData.images || []
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load photography gallery'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="w-full term-fade-in font-mono">
    <h1 class="app__subtitle mb-2">
      <span class="term-dim">$</span> ./photography
    </h1>
    <p class="term-dim text-sm mb-6">selected frames · by category</p>

    <div v-if="loading" class="term-frame" data-title="gallery">
      <p class="text-sm term-dim py-6 text-center">
        loading<span class="cursor-blink" aria-hidden="true" />
      </p>
    </div>

    <div v-else-if="error" class="term-frame" data-title="gallery">
      <p class="term-error text-sm">err: {{ error }}</p>
    </div>

    <div v-else class="space-y-5">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="term-btn text-xs"
          :class="{ active: activeSlug === null }"
          @click="activeSlug = null"
        >
          all [{{ images.length }}]
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="term-btn text-xs"
          :class="{ active: activeSlug === cat.slug }"
          @click="activeSlug = cat.slug"
        >
          {{ cat.slug }} [{{ cat.imageCount }}]
        </button>
      </div>

      <div v-if="visibleImages.length === 0" class="term-frame" data-title="gallery">
        <p class="term-dim text-sm py-8 text-center"># no images in this set</p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <ImageCard
          v-for="image in visibleImages"
          :key="image.id"
          :name="image.name"
          :src="image.path"
          :camera="image.camera"
          :iso="image.iso"
          :obturation="image.obturation"
          :timestamp="image.timestamp"
          :category-name="activeSlug ? null : image.categoryName"
        />
      </div>
    </div>
  </div>
</template>
