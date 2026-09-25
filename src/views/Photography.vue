<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

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
const lightboxId = ref<number | null>(null)

const visibleImages = computed(() => {
  if (!activeSlug.value) return images.value
  return images.value.filter((img) => img.categorySlug === activeSlug.value)
})

const lightboxImage = computed(() =>
  visibleImages.value.find((img) => img.id === lightboxId.value) ?? null,
)

const lightboxIndex = computed(() =>
  visibleImages.value.findIndex((img) => img.id === lightboxId.value),
)

const techLine = (image: PhotographyImage) => {
  const parts: string[] = []
  if (image.camera) parts.push(image.camera)
  if (image.iso != null) parts.push(`ISO ${image.iso}`)
  if (image.obturation) parts.push(image.obturation)
  return parts.join(' · ')
}

const openLightbox = (id: number) => {
  lightboxId.value = id
}

const closeLightbox = () => {
  lightboxId.value = null
}

const showPrev = () => {
  const list = visibleImages.value
  if (!list.length || lightboxIndex.value < 0) return
  const next = (lightboxIndex.value - 1 + list.length) % list.length
  lightboxId.value = list[next].id
}

const showNext = () => {
  const list = visibleImages.value
  if (!list.length || lightboxIndex.value < 0) return
  const next = (lightboxIndex.value + 1) % list.length
  lightboxId.value = list[next].id
}

const onKeydown = (event: KeyboardEvent) => {
  if (lightboxId.value == null) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') showPrev()
  if (event.key === 'ArrowRight') showNext()
}

watch(lightboxId, (id) => {
  document.body.style.overflow = id != null ? 'hidden' : ''
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

onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
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

      <div v-else class="photo-masonry">
        <button
          v-for="image in visibleImages"
          :key="image.id"
          type="button"
          class="photo-tile group"
          :aria-label="`View ${image.name}`"
          @click="openLightbox(image.id)"
        >
          <img
            :src="image.path"
            :alt="image.name"
            class="photo-tile__img"
            loading="lazy"
          />

          <div class="photo-tile__veil" aria-hidden="true" />

          <span class="photo-tile__meta photo-tile__meta--tl">{{ image.name }}</span>
          <span
            v-if="!activeSlug && image.categoryName"
            class="photo-tile__meta photo-tile__meta--tr"
          >
            {{ image.categoryName }}
          </span>
          <span
            v-if="techLine(image)"
            class="photo-tile__meta photo-tile__meta--bl"
          >
            {{ techLine(image) }}
          </span>
          <span
            v-if="image.timestamp"
            class="photo-tile__meta photo-tile__meta--br"
          >
            {{ image.timestamp }}
          </span>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxImage"
        class="photo-lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="lightboxImage.name"
        @click.self="closeLightbox"
      >
        <button
          type="button"
          class="photo-lightbox__close term-btn text-xs"
          @click="closeLightbox"
        >
          close [esc]
        </button>

        <button
          v-if="visibleImages.length > 1"
          type="button"
          class="photo-lightbox__nav photo-lightbox__nav--prev term-btn text-xs"
          aria-label="Previous image"
          @click="showPrev"
        >
          ‹
        </button>

        <figure class="photo-lightbox__figure">
          <img
            :src="lightboxImage.path"
            :alt="lightboxImage.name"
            class="photo-lightbox__img"
          />
          <figcaption class="photo-lightbox__caption">
            <span class="term-bright">{{ lightboxImage.name }}</span>
            <span v-if="techLine(lightboxImage)" class="term-dim">
              {{ techLine(lightboxImage) }}
            </span>
            <span v-if="lightboxImage.timestamp" class="term-muted">
              {{ lightboxImage.timestamp }}
            </span>
          </figcaption>
        </figure>

        <button
          v-if="visibleImages.length > 1"
          type="button"
          class="photo-lightbox__nav photo-lightbox__nav--next term-btn text-xs"
          aria-label="Next image"
          @click="showNext"
        >
          ›
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.photo-masonry {
  column-count: 1;
  column-gap: 0.75rem;
}

@media (min-width: 640px) {
  .photo-masonry {
    column-count: 2;
  }
}

@media (min-width: 1024px) {
  .photo-masonry {
    column-count: 3;
  }
}

@media (min-width: 1400px) {
  .photo-masonry {
    column-count: 4;
  }
}

.photo-tile {
  position: relative;
  display: block;
  width: 100%;
  margin: 0 0 0.75rem;
  padding: 0;
  break-inside: avoid;
  border: 1px solid var(--term-border);
  background: transparent;
  cursor: zoom-in;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.photo-tile:hover,
.photo-tile:focus-visible {
  border-color: var(--term-fg-dim);
  outline: none;
}

.photo-tile__img {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: middle;
  transition: transform 0.35s ease;
}

.photo-tile:hover .photo-tile__img,
.photo-tile:focus-visible .photo-tile__img {
  transform: scale(1.02);
}

.photo-tile__veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--term-bg) 72%, transparent) 0%,
    transparent 28%,
    transparent 72%,
    color-mix(in srgb, var(--term-bg) 78%, transparent) 100%
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-tile:hover .photo-tile__veil,
.photo-tile:focus-visible .photo-tile__veil {
  opacity: 1;
}

.photo-tile__meta {
  position: absolute;
  z-index: 1;
  max-width: calc(100% - 1.25rem);
  padding: 0.15rem 0.35rem;
  font-size: 0.68rem;
  line-height: 1.3;
  color: var(--term-fg-bright);
  background: color-mix(in srgb, var(--term-bg) 70%, transparent);
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-tile:hover .photo-tile__meta,
.photo-tile:focus-visible .photo-tile__meta {
  opacity: 1;
  transform: translateY(0);
}

.photo-tile__meta--tl {
  top: 0.45rem;
  left: 0.45rem;
}

.photo-tile__meta--tr {
  top: 0.45rem;
  right: 0.45rem;
  text-align: right;
}

.photo-tile__meta--bl {
  bottom: 0.45rem;
  left: 0.45rem;
  color: var(--term-fg);
  white-space: normal;
}

.photo-tile__meta--br {
  bottom: 0.45rem;
  right: 0.45rem;
  color: var(--term-fg-dim);
  text-align: right;
}

.photo-lightbox {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 3rem 2.5rem;
  background: color-mix(in srgb, var(--term-bg) 88%, black);
  backdrop-filter: blur(6px);
  animation: photoFadeIn 0.2s ease-out both;
}

.photo-lightbox__figure {
  margin: 0;
  max-width: min(96vw, 1400px);
  max-height: calc(100vh - 6rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.photo-lightbox__img {
  display: block;
  max-width: 100%;
  max-height: calc(100vh - 8.5rem);
  width: auto;
  height: auto;
  border: 1px solid var(--term-border);
  object-fit: contain;
}

.photo-lightbox__caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem 0.85rem;
  font-size: 0.75rem;
  text-align: center;
}

.photo-lightbox__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.photo-lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.4rem;
  line-height: 1;
  padding: 0.35rem 0.65rem;
}

.photo-lightbox__nav--prev {
  left: 0.75rem;
}

.photo-lightbox__nav--next {
  right: 0.75rem;
}

@keyframes photoFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-tile__img,
  .photo-tile__veil,
  .photo-tile__meta,
  .photo-lightbox {
    transition: none;
    animation: none;
  }

  .photo-tile:hover .photo-tile__img,
  .photo-tile:focus-visible .photo-tile__img {
    transform: none;
  }
}
</style>
