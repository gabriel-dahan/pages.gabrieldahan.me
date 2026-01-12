<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const language = ref<'en' | 'fr'>('en');
const isFileMissing = ref(false);

const pdfPath = computed(() => {
  return language.value === 'en' 
    ? '/files/resume_en.pdf' 
    : '/files/resume_fr.pdf';
});

watch(pdfPath, async (path) => {
    isFileMissing.value = false;
    try {
        const response = await fetch(path, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        
        if (!response.ok || (contentType && contentType.includes('text/html'))) {
            isFileMissing.value = true;
        }
    } catch (e) {
        isFileMissing.value = true;
    }
}, { immediate: true });

const downloadPdf = () => {
    if (isFileMissing.value) return;
    const link = document.createElement('a');
    link.href = pdfPath.value;
    link.download = `Gabriel_Dahan_Resume_${language.value.toUpperCase()}.pdf`;
    link.click();
};
</script>

<template>
  <div class="flex flex-col items-center w-full h-full gap-6">
    
    <div class="flex flex-wrap items-center justify-center gap-4 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        
        <div class="flex bg-gray-100 dark:bg-gray-900 rounded-xl p-1">
            <button 
                @click="language = 'en'"
                class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300"
                :class="language === 'en' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
            >
                English
            </button>
            <button 
                @click="language = 'fr'"
                class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300"
                :class="language === 'fr' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
            >
                Français
            </button>
        </div>

        <div class="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2 hidden sm:block"></div>

        <button 
            @click="downloadPdf"
            :disabled="isFileMissing"
            class="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
        </button>
    </div>

    <div class="w-full max-w-5xl flex-grow bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 relative min-h-[60vh] md:min-h-[75vh]">
        
        <div v-if="isFileMissing" class="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-lg font-medium">This version of the resume is not currently available.</p>
        </div>

        <object 
            v-else
            :data="pdfPath" 
            type="application/pdf" 
            class="w-full h-full absolute inset-0"
        >
            <div class="flex flex-col items-center justify-center h-full text-center p-8 text-gray-600 dark:text-gray-300">
                <p class="mb-4 text-lg">Your browser does not support inline PDF viewing.</p>
                <a :href="pdfPath" download class="btn btn-primary">
                    Download the PDF instead
                </a>
            </div>
        </object>
    </div>

  </div>
</template>

<style scoped>
button {
    touch-action: manipulation;
}
</style>