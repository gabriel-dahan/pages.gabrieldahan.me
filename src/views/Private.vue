<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

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

const checkActiveSession = () => {
  const token = localStorage.getItem('vault_token')
  const storedUser = localStorage.getItem('vault_user')
  if (token && storedUser) {
    isAuthenticated.value = true
    authenticatedUser.value = storedUser
    fetchFiles()
    fetchPendingComments()
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

      <div class="term-frame overflow-x-auto" data-title="vault">
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
</style>
