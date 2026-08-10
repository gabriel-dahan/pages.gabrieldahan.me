<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import exifr from 'exifr'
import ImageCard from '../components/ImageCard.vue'

type VaultFile = {
  name: string
  size: number
  path: string
  virtualPath: string
  metadata?: { alias?: string; description?: string }
}

type PendingComment = {
  id: number
  author: string
  message: string
  created_at: string
}

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
  size: number
  path: string
  camera: string | null
  iso: number | null
  obturation: string | null
  timestamp: string | null
}

const isAuthenticated = ref(false)
const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const isLoadingFiles = ref(false)
const authenticatedUser = ref('')
const files = ref<VaultFile[]>([])
const currentFolder = ref('')
const commandEcho = ref('')

const pendingComments = ref<PendingComment[]>([])
const isLoadingComments = ref(false)
const moderatingId = ref<number | null>(null)

const editingPath = ref<string | null>(null)
const editAlias = ref('')
const editDescription = ref('')
const savingMeta = ref(false)
const metaError = ref('')

const photoCategories = ref<PhotographyCategory[]>([])
const uploadedImages = ref<PhotographyImage[]>([])
const isLoadingPhotos = ref(false)
const photoError = ref('')
const newCategoryName = ref('')
const creatingCategory = ref(false)
const deletingCategoryId = ref<number | null>(null)
const deletingImageId = ref<number | null>(null)
const uploadingImage = ref(false)
const showUploadForm = ref(false)

const uploadFile = ref<File | null>(null)
const uploadName = ref('')
const uploadCategoryId = ref<number | null>(null)
const uploadCamera = ref('')
const uploadIso = ref('')
const uploadObturation = ref('')
const uploadTimestamp = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const visibleItems = computed(() => {
  const folders = new Set<string>()
  const f: VaultFile[] = []

  for (const file of files.value) {
    if (!file.virtualPath) continue

    const inCurrentFolder = currentFolder.value === ''
      ? true
      : file.virtualPath.startsWith(currentFolder.value + '/')

    if (inCurrentFolder) {
      const relativePath = currentFolder.value === ''
        ? file.virtualPath
        : file.virtualPath.slice(currentFolder.value.length + 1)

      if (!relativePath.includes('/')) {
        f.push(file)
      } else {
        folders.add(relativePath.split('/')[0])
      }
    }
  }

  return { folders: Array.from(folders).sort(), files: f }
})

const vaultPath = computed(() => {
  const base = `~/vault`
  return currentFolder.value ? `${base}/${currentFolder.value}` : base
})

const navigateTo = (folder: string) => {
  currentFolder.value = currentFolder.value ? currentFolder.value + '/' + folder : folder
}

const navigateUp = () => {
  if (!currentFolder.value) return
  const parts = currentFolder.value.split('/')
  parts.pop()
  currentFolder.value = parts.join('/')
}

const API_BASE = '/api/private'
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('vault_token')}`,
  'Content-Type': 'application/json',
})

const authOnlyHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('vault_token')}`,
})

const checkActiveSession = () => {
  const token = localStorage.getItem('vault_token')
  const storedUser = localStorage.getItem('vault_user')
  if (token && storedUser) {
    isAuthenticated.value = true
    authenticatedUser.value = storedUser
    fetchFiles()
    fetchPendingComments()
    fetchPhotography()
  }
}

onMounted(() => {
  checkActiveSession()
})

const handleLogin = async () => {
  error.value = ''
  isLoading.value = true
  commandEcho.value = `$ auth --user ${username.value}`

  try {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    })

    const data = await res.json()

    if (res.ok) {
      localStorage.setItem('vault_token', data.token)
      localStorage.setItem('vault_user', data.username)
      authenticatedUser.value = data.username
      isAuthenticated.value = true
      password.value = ''
      fetchFiles()
      fetchPendingComments()
      fetchPhotography()
    } else {
      error.value = data.error || 'Authentication failed'
    }
  } catch {
    error.value = 'Failed to connect to server'
  } finally {
    isLoading.value = false
  }
}

const logout = () => {
  localStorage.removeItem('vault_token')
  localStorage.removeItem('vault_user')
  isAuthenticated.value = false
  authenticatedUser.value = ''
  files.value = []
  username.value = ''
  commandEcho.value = ''
  currentFolder.value = ''
  pendingComments.value = []
  editingPath.value = null
  photoCategories.value = []
  uploadedImages.value = []
  showUploadForm.value = false
  resetUploadForm()
}

const fetchFiles = async () => {
  isLoadingFiles.value = true
  try {
    const res = await fetch(`${API_BASE}/files`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('vault_token')}` },
    })

    if (res.status === 401) {
      logout()
      return
    }

    if (res.ok) {
      const data = await res.json()
      files.value = data.files || []
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingFiles.value = false
  }
}

const fetchPendingComments = async () => {
  isLoadingComments.value = true
  try {
    const res = await fetch('/api/comments/pending', {
      headers: { Authorization: `Bearer ${localStorage.getItem('vault_token')}` },
    })
    if (res.status === 401) {
      logout()
      return
    }
    if (res.ok) {
      const data = await res.json()
      pendingComments.value = data.comments || []
    }
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingComments.value = false
  }
}

const moderateComment = async (id: number, action: 'approve' | 'reject') => {
  moderatingId.value = id
  try {
    const res = await fetch(`/api/comments/${id}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('vault_token')}` },
    })
    if (res.status === 401) {
      logout()
      return
    }
    if (res.ok) {
      pendingComments.value = pendingComments.value.filter((c) => c.id !== id)
    }
  } catch (err) {
    console.error(err)
  } finally {
    moderatingId.value = null
  }
}

const startEditMeta = (file: VaultFile) => {
  editingPath.value = file.path
  editAlias.value = file.metadata?.alias || ''
  editDescription.value = file.metadata?.description || ''
  metaError.value = ''
}

const cancelEditMeta = () => {
  editingPath.value = null
  metaError.value = ''
}

const saveMeta = async (filePath: string) => {
  savingMeta.value = true
  metaError.value = ''
  try {
    const res = await fetch(`${API_BASE}/files/meta`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        path: filePath,
        alias: editAlias.value,
        description: editDescription.value,
      }),
    })
    if (res.status === 401) {
      logout()
      return
    }
    const data = await res.json()
    if (!res.ok) {
      metaError.value = data.error || 'Failed to save'
      return
    }
    const idx = files.value.findIndex((f) => f.path === filePath)
    if (idx >= 0 && data.file) {
      files.value[idx] = data.file
    }
    editingPath.value = null
  } catch {
    metaError.value = 'Failed to connect'
  } finally {
    savingMeta.value = false
  }
}

const openFile = (filename: string, filePath: string, forceDownload = false) => {
  const token = localStorage.getItem('vault_token')
  if (!token) return

  const url = `${API_BASE}/file?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(token)}`

  if (forceDownload) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else {
    window.open(url, '_blank')
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const resetUploadForm = () => {
  uploadFile.value = null
  uploadName.value = ''
  uploadCategoryId.value = photoCategories.value[0]?.id ?? null
  uploadCamera.value = ''
  uploadIso.value = ''
  uploadObturation.value = ''
  uploadTimestamp.value = ''
  photoError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const fetchPhotography = async () => {
  isLoadingPhotos.value = true
  photoError.value = ''
  try {
    const [catRes, imgRes] = await Promise.all([
      fetch('/api/photography/categories'),
      fetch('/api/photography/images'),
    ])
    if (!catRes.ok || !imgRes.ok) throw new Error('load failed')
    const catData = await catRes.json()
    const imgData = await imgRes.json()
    photoCategories.value = catData.categories || []
    uploadedImages.value = imgData.images || []
    if (uploadCategoryId.value == null && photoCategories.value.length) {
      uploadCategoryId.value = photoCategories.value[0].id
    }
  } catch (err) {
    console.error(err)
    photoError.value = 'Failed to load photography data'
  } finally {
    isLoadingPhotos.value = false
  }
}

const createCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) return
  creatingCategory.value = true
  photoError.value = ''
  try {
    const res = await fetch('/api/photography/categories', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name }),
    })
    if (res.status === 401) {
      logout()
      return
    }
    const data = await res.json()
    if (!res.ok) {
      photoError.value = data.error || 'Failed to create category'
      return
    }
    photoCategories.value = [...photoCategories.value, data.category]
    if (uploadCategoryId.value == null) uploadCategoryId.value = data.category.id
    newCategoryName.value = ''
  } catch {
    photoError.value = 'Failed to connect'
  } finally {
    creatingCategory.value = false
  }
}

const removeCategory = async (id: number) => {
  if (!confirm('Delete this category and all of its images?')) return
  deletingCategoryId.value = id
  photoError.value = ''
  try {
    const res = await fetch(`/api/photography/categories/${id}`, {
      method: 'DELETE',
      headers: authOnlyHeaders(),
    })
    if (res.status === 401) {
      logout()
      return
    }
    if (!res.ok) {
      const data = await res.json()
      photoError.value = data.error || 'Failed to delete category'
      return
    }
    photoCategories.value = photoCategories.value.filter((c) => c.id !== id)
    uploadedImages.value = uploadedImages.value.filter((img) => img.categoryId !== id)
    if (uploadCategoryId.value === id) {
      uploadCategoryId.value = photoCategories.value[0]?.id ?? null
    }
  } catch {
    photoError.value = 'Failed to connect'
  } finally {
    deletingCategoryId.value = null
  }
}

const formatShutterSpeed = (exposureTime: unknown): string | null => {
  const value = typeof exposureTime === 'number'
    ? exposureTime
    : typeof exposureTime === 'string'
      ? Number(exposureTime)
      : NaN
  if (!Number.isFinite(value) || value <= 0) return null
  if (value >= 1) {
    return Number.isInteger(value) ? `${value}s` : `${value.toFixed(1)}s`
  }
  const denom = Math.round(1 / value)
  return denom > 0 ? `1/${denom}` : null
}

const formatExifDate = (raw: unknown): string | null => {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear()
    const m = String(raw.getMonth() + 1).padStart(2, '0')
    const d = String(raw.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) {
      return formatExifDate(parsed)
    }
    // EXIF often uses "YYYY:MM:DD HH:MM:SS"
    const match = raw.match(/^(\d{4}):(\d{2}):(\d{2})/)
    if (match) return `${match[1]}-${match[2]}-${match[3]}`
  }
  return null
}

const fillExifFromFile = async (file: File) => {
  try {
    const exif = await exifr.parse(file, {
      pick: [
        'Make',
        'Model',
        'ISO',
        'ISOSpeedRatings',
        'PhotographicSensitivity',
        'ExposureTime',
        'ShutterSpeedValue',
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
      ],
    })
    if (!exif) return

    const make = typeof exif.Make === 'string' ? exif.Make.trim() : ''
    const model = typeof exif.Model === 'string' ? exif.Model.trim() : ''
    let camera = ''
    if (make && model) {
      camera = model.toLowerCase().startsWith(make.toLowerCase())
        ? model
        : `${make} ${model}`
    } else {
      camera = model || make
    }
    if (camera) uploadCamera.value = camera

    const isoRaw = exif.ISO ?? exif.ISOSpeedRatings ?? exif.PhotographicSensitivity
    const iso = Array.isArray(isoRaw) ? Number(isoRaw[0]) : Number(isoRaw)
    if (Number.isFinite(iso) && iso > 0) {
      uploadIso.value = String(Math.round(iso))
    }

    let shutter = formatShutterSpeed(exif.ExposureTime)
    if (!shutter && typeof exif.ShutterSpeedValue === 'number') {
      // APEX shutter speed: ExposureTime = 2^(-ShutterSpeedValue)
      shutter = formatShutterSpeed(Math.pow(2, -exif.ShutterSpeedValue))
    }
    if (shutter) uploadObturation.value = shutter

    const date = formatExifDate(exif.DateTimeOriginal ?? exif.CreateDate ?? exif.ModifyDate)
    if (date) uploadTimestamp.value = date
  } catch (err) {
    console.error('Failed to read image EXIF', err)
  }
}

const onFilePicked = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  uploadFile.value = file
  if (!file) return

  if (!uploadName.value) {
    uploadName.value = file.name.replace(/\.[^.]+$/, '')
  }
  await fillExifFromFile(file)
}

const openUploadForm = () => {
  showUploadForm.value = true
  photoError.value = ''
  if (uploadCategoryId.value == null && photoCategories.value.length) {
    uploadCategoryId.value = photoCategories.value[0].id
  }
}

const cancelUpload = () => {
  showUploadForm.value = false
  resetUploadForm()
}

const importNewImage = async () => {
  photoError.value = ''
  if (!uploadFile.value) {
    photoError.value = 'Choose an image file first'
    return
  }
  if (!uploadCategoryId.value) {
    photoError.value = 'Create a category before uploading'
    return
  }

  uploadingImage.value = true
  try {
    const form = new FormData()
    form.append('image', uploadFile.value)
    form.append('categoryId', String(uploadCategoryId.value))
    form.append('name', uploadName.value.trim() || uploadFile.value.name)
    if (uploadCamera.value.trim()) form.append('camera', uploadCamera.value.trim())
    if (uploadIso.value.trim()) form.append('iso', uploadIso.value.trim())
    if (uploadObturation.value.trim()) form.append('obturation', uploadObturation.value.trim())
    if (uploadTimestamp.value.trim()) form.append('timestamp', uploadTimestamp.value.trim())

    const res = await fetch('/api/photography/images', {
      method: 'POST',
      headers: authOnlyHeaders(),
      body: form,
    })
    if (res.status === 401) {
      logout()
      return
    }
    const data = await res.json()
    if (!res.ok) {
      photoError.value = data.error || 'Upload failed'
      return
    }
    uploadedImages.value = [data.image, ...uploadedImages.value]
    const cat = photoCategories.value.find((c) => c.id === data.image.categoryId)
    if (cat) cat.imageCount += 1
    showUploadForm.value = false
    resetUploadForm()
  } catch {
    photoError.value = 'Failed to connect'
  } finally {
    uploadingImage.value = false
  }
}

const removeImage = async (id: number) => {
  if (!confirm('Delete this image?')) return
  deletingImageId.value = id
  photoError.value = ''
  try {
    const res = await fetch(`/api/photography/images/${id}`, {
      method: 'DELETE',
      headers: authOnlyHeaders(),
    })
    if (res.status === 401) {
      logout()
      return
    }
    if (!res.ok) {
      const data = await res.json()
      photoError.value = data.error || 'Failed to delete image'
      return
    }
    const removed = uploadedImages.value.find((img) => img.id === id)
    uploadedImages.value = uploadedImages.value.filter((img) => img.id !== id)
    if (removed) {
      const cat = photoCategories.value.find((c) => c.id === removed.categoryId)
      if (cat && cat.imageCount > 0) cat.imageCount -= 1
    }
  } catch {
    photoError.value = 'Failed to connect'
  } finally {
    deletingImageId.value = null
  }
}
</script>

<template>
  <div class="w-full term-fade-in font-mono">
    <!-- Login shell -->
    <div v-if="!isAuthenticated" class="w-full term-frame" data-title="secure_shell">
      <p class="term-dim text-sm mb-4">// authorized access only</p>

      <form class="space-y-3 max-w-xl" @submit.prevent="handleLogin">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="term-dim shrink-0" for="vault-user">login:</label>
          <input
            id="vault-user"
            v-model="username"
            type="text"
            required
            autocomplete="username"
            class="term-input flex-1"
            placeholder="_"
          />
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <label class="term-dim shrink-0" for="vault-pass">password:</label>
          <input
            id="vault-pass"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="term-input flex-1"
            placeholder="_"
          />
        </div>

        <p v-if="commandEcho" class="text-sm term-dim pt-2">{{ commandEcho }}</p>

        <p v-if="isLoading" class="text-sm">
          authenticating<span class="cursor-blink" aria-hidden="true" />
        </p>

        <p v-else-if="error" class="term-error text-sm">
          err: {{ error }}
        </p>

        <button type="submit" :disabled="isLoading" class="term-btn mt-4">
          $ unlock
        </button>
      </form>
    </div>

    <!-- Authenticated view -->
    <div v-else class="w-full space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="app__subtitle mb-1">
            <span class="term-dim">$</span> ls {{ vaultPath }}
          </h1>
          <p class="term-dim text-sm">user: {{ authenticatedUser }}</p>
        </div>
        <button type="button" class="term-btn text-xs self-start" @click="logout">
          $ logout
        </button>
      </div>

      <div class="term-frame" data-title="vault">
        <div class="grid grid-cols-12 gap-2 text-xs term-dim border-b border-[var(--term-border)] pb-2 mb-2 min-w-[28rem]">
          <div class="col-span-6">name</div>
          <div class="col-span-2 text-right">size</div>
          <div class="col-span-4 text-right">action</div>
        </div>

        <div v-if="isLoadingFiles" class="py-10 text-center text-sm">
          decrypting<span class="cursor-blink" aria-hidden="true" />
        </div>

        <div v-else-if="visibleItems.files.length === 0 && visibleItems.folders.length === 0" class="py-10 text-center">
          <p class="term-dim"># empty directory</p>
        </div>

        <div v-else class="space-y-0 min-w-[28rem]">
          <button
            v-if="currentFolder"
            type="button"
            class="vault-row w-full grid grid-cols-12 gap-2 py-2 px-1 text-left"
            @click="navigateUp"
          >
            <span class="col-span-6 truncate">
              <span class="term-dim">drwx</span> ../
            </span>
            <span class="col-span-2 text-right term-muted">—</span>
            <span class="col-span-4 text-right term-dim">cd ..</span>
          </button>

          <button
            v-for="folder in visibleItems.folders"
            :key="'folder-' + folder"
            type="button"
            class="vault-row w-full grid grid-cols-12 gap-2 py-2 px-1 text-left"
            @click="navigateTo(folder)"
          >
            <span class="col-span-6 truncate">
              <span class="term-dim">drwx</span> {{ folder }}/
            </span>
            <span class="col-span-2 text-right term-muted">dir</span>
            <span class="col-span-4 text-right term-dim">cd</span>
          </button>

          <div
            v-for="file in visibleItems.files"
            :key="file.path"
            class="border-b border-[var(--term-border)] last:border-0"
          >
            <div
              class="vault-row grid grid-cols-12 gap-2 py-2 px-1 items-center cursor-pointer"
              @click="openFile(file.name, file.path)"
            >
              <div class="col-span-6 min-w-0">
                <div class="truncate">
                  <span class="term-dim">-rw-</span>
                  {{ file.metadata && file.metadata.alias ? file.metadata.alias : file.name }}
                </div>
                <div v-if="file.metadata && file.metadata.description" class="text-xs term-muted truncate mt-0.5">
                  {{ file.metadata.description }}
                </div>
              </div>
              <div class="col-span-2 text-right text-sm term-dim tabular-nums">
                {{ formatBytes(file.size) }}
              </div>
              <div class="col-span-4 text-right flex justify-end gap-1">
                <button
                  type="button"
                  class="term-btn text-xs py-0.5 px-1"
                  title="Edit metadata"
                  @click.stop="startEditMeta(file)"
                >
                  meta
                </button>
                <button
                  type="button"
                  class="term-btn text-xs py-0.5 px-1"
                  title="Download"
                  @click.stop="openFile(file.name, file.path, true)"
                >
                  get
                </button>
              </div>
            </div>

            <div
              v-if="editingPath === file.path"
              class="px-1 pb-3 space-y-2"
              @click.stop
            >
              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <label class="term-dim text-xs shrink-0" :for="'alias-' + file.path">alias:</label>
                <input
                  :id="'alias-' + file.path"
                  v-model="editAlias"
                  type="text"
                  class="term-input flex-1 text-sm"
                  placeholder="display name"
                />
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                <label class="term-dim text-xs shrink-0" :for="'desc-' + file.path">desc:</label>
                <input
                  :id="'desc-' + file.path"
                  v-model="editDescription"
                  type="text"
                  class="term-input flex-1 text-sm"
                  placeholder="short description"
                />
              </div>
              <p v-if="metaError" class="term-error text-xs">err: {{ metaError }}</p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="term-btn text-xs"
                  :disabled="savingMeta"
                  @click="saveMeta(file.path)"
                >
                  $ save
                </button>
                <button type="button" class="term-btn text-xs" @click="cancelEditMeta">
                  cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <p class="term-muted text-xs mt-4 pt-2 border-t border-[var(--term-border)]">
          {{ vaultPath }}&gt; <span class="cursor-blink" aria-hidden="true" />
        </p>
      </div>

      <!-- Comment moderation -->
      <div class="term-frame" data-title="comments_queue">
        <div class="flex items-center justify-between gap-3 mb-4">
          <h2 class="text-base">
            <span class="term-dim">$</span> moderate ./guestbook
          </h2>
          <button type="button" class="term-btn text-xs" @click="fetchPendingComments">
            refresh
          </button>
        </div>

        <div v-if="isLoadingComments" class="text-sm term-dim py-4">
          loading<span class="cursor-blink" aria-hidden="true" />
        </div>
        <p v-else-if="pendingComments.length === 0" class="term-dim text-sm py-4">
          # queue empty
        </p>
        <ul v-else class="space-y-4">
          <li
            v-for="c in pendingComments"
            :key="c.id"
            class="border-b border-[var(--term-border)] pb-3 last:border-0"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-2 text-xs term-dim mb-1">
              <span class="term-bright">{{ c.author }}</span>
              <span>{{ c.created_at }}</span>
            </div>
            <p class="text-sm leading-relaxed whitespace-pre-wrap mb-3">{{ c.message }}</p>
            <div class="flex gap-2">
              <button
                type="button"
                class="term-btn text-xs"
                :disabled="moderatingId === c.id"
                @click="moderateComment(c.id, 'approve')"
              >
                approve
              </button>
              <button
                type="button"
                class="term-btn text-xs"
                :disabled="moderatingId === c.id"
                @click="moderateComment(c.id, 'reject')"
              >
                reject
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- Photography management -->
      <div class="term-frame" data-title="photography">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 class="text-base">
            <span class="term-dim">$</span> manage ./photography
          </h2>
          <div class="flex gap-2">
            <button type="button" class="term-btn text-xs" @click="fetchPhotography">
              refresh
            </button>
            <button
              type="button"
              class="term-btn text-xs"
              :disabled="!photoCategories.length"
              @click="openUploadForm"
            >
              import
            </button>
          </div>
        </div>

        <div class="mb-5 space-y-3">
          <p class="text-xs term-dim">categories</p>
          <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="createCategory">
            <input
              v-model="newCategoryName"
              type="text"
              class="term-input flex-1 text-sm"
              placeholder="new category name"
              maxlength="64"
            />
            <button type="submit" class="term-btn text-xs" :disabled="creatingCategory || !newCategoryName.trim()">
              $ mkdir
            </button>
          </form>

          <ul v-if="photoCategories.length" class="space-y-1">
            <li
              v-for="cat in photoCategories"
              :key="cat.id"
              class="flex items-center justify-between gap-2 text-sm py-1 border-b border-[var(--term-border)] last:border-0"
            >
              <span class="truncate">
                <span class="term-dim">drwx</span>
                {{ cat.name }}
                <span class="term-muted text-xs">[{{ cat.slug }} · {{ cat.imageCount }}]</span>
              </span>
              <button
                type="button"
                class="term-btn text-xs py-0.5 px-1"
                :disabled="deletingCategoryId === cat.id"
                @click="removeCategory(cat.id)"
              >
                rm
              </button>
            </li>
          </ul>
          <p v-else class="term-dim text-sm"># no categories yet — create one to import photos</p>
        </div>

        <div v-if="showUploadForm" class="mb-5 space-y-3 border border-[var(--term-border)] p-3">
          <p class="text-xs term-dim">$ import --image</p>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <label class="term-dim text-xs shrink-0" for="photo-file">file:</label>
            <input
              id="photo-file"
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="text-sm term-dim w-full"
              @change="onFilePicked"
            />
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <label class="term-dim text-xs shrink-0" for="photo-name">name:</label>
            <input
              id="photo-name"
              v-model="uploadName"
              type="text"
              class="term-input flex-1 text-sm"
              placeholder="display title"
            />
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <label class="term-dim text-xs shrink-0" for="photo-cat">category:</label>
            <select
              id="photo-cat"
              v-model.number="uploadCategoryId"
              class="term-input flex-1 text-sm"
            >
              <option v-for="cat in photoCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <label class="term-dim text-xs shrink-0" for="photo-camera">camera:</label>
              <input
                id="photo-camera"
                v-model="uploadCamera"
                type="text"
                class="term-input flex-1 text-sm"
                placeholder="e.g. Fujifilm X100V"
              />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <label class="term-dim text-xs shrink-0" for="photo-iso">iso:</label>
              <input
                id="photo-iso"
                v-model="uploadIso"
                type="number"
                min="0"
                class="term-input flex-1 text-sm"
                placeholder="200"
              />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <label class="term-dim text-xs shrink-0" for="photo-obt">shutter:</label>
              <input
                id="photo-obt"
                v-model="uploadObturation"
                type="text"
                class="term-input flex-1 text-sm"
                placeholder="1/250"
              />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-2">
              <label class="term-dim text-xs shrink-0" for="photo-ts">date:</label>
              <input
                id="photo-ts"
                v-model="uploadTimestamp"
                type="text"
                class="term-input flex-1 text-sm"
                placeholder="2024-06-12"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="term-btn text-xs"
              :disabled="uploadingImage"
              @click="importNewImage"
            >
              $ upload
            </button>
            <button type="button" class="term-btn text-xs" @click="cancelUpload">
              cancel
            </button>
          </div>
        </div>

        <p v-if="photoError" class="term-error text-xs mb-3">err: {{ photoError }}</p>

        <div v-if="isLoadingPhotos" class="text-sm term-dim py-4">
          loading<span class="cursor-blink" aria-hidden="true" />
        </div>
        <p v-else-if="uploadedImages.length === 0" class="term-dim text-sm py-4">
          # no images imported
        </p>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="image in uploadedImages" :key="image.id" class="relative">
            <ImageCard
              :name="image.name"
              :src="image.path"
              :camera="image.camera"
              :iso="image.iso"
              :obturation="image.obturation"
              :timestamp="image.timestamp"
              :category-name="image.categoryName"
            />
            <button
              type="button"
              class="term-btn text-xs mt-2 w-full"
              :disabled="deletingImageId === image.id"
              @click="removeImage(image.id)"
            >
              rm {{ formatBytes(image.size) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vault-row {
  transition: background 0.15s ease;
}

.vault-row:hover {
  background: color-mix(in srgb, var(--term-fg) 8%, transparent);
}

select.term-input {
  appearance: none;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 50%, var(--term-fg-dim) 50%),
    linear-gradient(135deg, var(--term-fg-dim) 50%, transparent 50%);
  background-position: calc(100% - 12px) calc(50% - 2px), calc(100% - 7px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 1.5rem;
}
</style>
