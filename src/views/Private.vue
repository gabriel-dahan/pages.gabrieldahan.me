<template>
  <div class="w-full flex items-center justify-center p-4"> <!-- Login Dialog -->
    <div v-if="!isAuthenticated"
      class="relative w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200 dark:border-slate-700/50 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-300">

      <div class="text-center mb-8 relative z-10">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Private Access</h2>
        <p class="mt-2 text-gray-500 dark:text-slate-400 text-sm">Please log in to view secure files.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5 relative z-10 group">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Username</label>
          <div class="relative">
            <input v-model="username" type="text" required
              class="w-full bg-gray-50/50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              placeholder="Enter your username" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Password</label>
          <div class="relative">
            <input v-model="password" type="password" required
              class="w-full bg-gray-50/50 dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700/50 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              placeholder="••••••••" />
          </div>
        </div>

        <div v-if="error"
          class="bg-red-500/10 border border-red-500/20 text-red-400 max-w-sm w-full mx-auto px-4 py-3 rounded-lg text-sm text-center">
          {{ error }}
        </div>

        <button type="submit" :disabled="isLoading"
          class="w-full mt-8 bg-indigo-500 hover:bg-indigo-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-indigo-500/40 relative overflow-hidden flex justify-center items-center gap-2">
          <span v-if="isLoading"
            class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
          <span v-else>Unlock Vault</span>
        </button>
      </form>
    </div>

    <!-- Directory Listing -->
    <div v-else class="relative w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-500">

      <!-- Top header -->
      <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-slate-800">
        <div class="flex items-center gap-4 mb-4 sm:mb-0">
          <div class="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
              {{ authenticatedUser }}'s Vault
            </h1>
            <p class="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Secure private storage directory</p>
          </div>
        </div>

        <button @click="logout"
          class="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 focus:ring-2 focus:ring-indigo-500 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Lock & Exit
        </button>
      </div>

      <!-- File List -->
      <div
        class="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl">

        <!-- Table Header -->
        <div
          class="grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-slate-700/50 bg-gray-50/80 dark:bg-slate-800/80 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          <div class="col-span-8 sm:col-span-7">Name</div>
          <div class="col-span-4 sm:col-span-3 text-right">Size</div>
          <div class="col-span-12 sm:col-span-2 hidden sm:block text-right">Action</div>
        </div>

        <div v-if="isLoadingFiles"
          class="p-12 text-center text-gray-500 dark:text-slate-400 flex flex-col items-center justify-center">
          <div class="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          Decrypting vault contents...
        </div>

        <div v-else-if="files.length === 0" class="p-16 text-center">
          <div
            class="inline-flex w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center mb-4 border border-gray-200 dark:border-slate-700">
            <svg class="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-gray-700 dark:text-slate-300 font-medium text-lg">Empty Vault</h3>
          <p class="text-gray-500 dark:text-slate-500 text-sm mt-1">There are no files available for your account.</p>
        </div>

        <!-- File Rows -->
        <div class="divide-y divide-gray-100 dark:divide-slate-700/30">
          <div v-for="file in files" :key="file.name"
            class="group grid grid-cols-12 gap-4 px-4 sm:px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            @click="openFile(file.name, file.path)">

            <div class="col-span-8 sm:col-span-7 flex items-center gap-3 overflow-hidden">
              <div
                class="w-10 h-10 rounded-lg bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:border-indigo-300 dark:group-hover:border-indigo-500/30 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                <svg
                  class="w-5 h-5 text-indigo-300 dark:text-indigo-200 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span
                class="text-gray-700 dark:text-slate-200 font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 flex-1 transition-colors">{{
                  file.name }}</span>
            </div>

            <div class="col-span-4 sm:col-span-3 text-right text-sm text-gray-500 dark:text-slate-400 tabular-nums">
              {{ formatBytes(file.size) }}
            </div>

            <div
              class="col-span-12 sm:col-span-2 hidden sm:flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button @click.stop="openFile(file.name, file.path, true)"
                class="p-2 text-gray-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                title="Download">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isAuthenticated = ref(false);
const username = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const isLoadingFiles = ref(false);
const authenticatedUser = ref('');
const files = ref<{ name: string, size: number, path: string }[]>([]);

// Using a relative URL handles dev vs prod server gracefully (same origin mostly or via proxy)
// Assuming proxy in vite setup or absolute URL needed
const API_BASE = import.meta.env.DEV ? 'http://localhost:3000/api/private' : '/api/private';

const checkActiveSession = () => {
  const token = localStorage.getItem('vault_token');
  const storedUser = localStorage.getItem('vault_user');
  if (token && storedUser) {
    isAuthenticated.value = true;
    authenticatedUser.value = storedUser;
    fetchFiles();
  }
}

onMounted(() => {
  checkActiveSession();
})

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    const res = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('vault_token', data.token);
      localStorage.setItem('vault_user', data.username);
      authenticatedUser.value = data.username;
      isAuthenticated.value = true;
      password.value = ''; // clear
      fetchFiles();
    } else {
      error.value = data.error || 'Authentication failed';
    }
  } catch (err) {
    error.value = 'Failed to connect to server';
  } finally {
    isLoading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('vault_token');
  localStorage.removeItem('vault_user');
  isAuthenticated.value = false;
  authenticatedUser.value = '';
  files.value = [];
  username.value = '';
};

const fetchFiles = async () => {
  isLoadingFiles.value = true;
  try {
    const res = await fetch(`${API_BASE}/files`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('vault_token')}`
      }
    });

    if (res.status === 401) {
      logout(); // Session expired
      return;
    }

    if (res.ok) {
      const data = await res.json();
      files.value = data.files || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    isLoadingFiles.value = false;
  }
};

const openFile = (filename: string, filePath: string, forceDownload = false) => {
  const token = localStorage.getItem('vault_token');
  if (!token) return;

  const url = `${API_BASE}/file?path=${encodeURIComponent(filePath)}&token=${encodeURIComponent(token)}`;

  if (forceDownload) {
    // Hidden anchor trick to force download attribute depending on browser support, 
    // but the easiest is just a normal link if backend doesn't explicitly send attachment headers.
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    // Open in new tab
    window.open(url, '_blank');
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
</script>
