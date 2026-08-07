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
  <div class="flex flex-col w-full h-full gap-4 term-fade-in font-mono">
    <h1 class="app__subtitle mb-2">
      <span class="term-dim">$</span> cat ./resume
    </h1>

    <div class="flex flex-wrap items-center gap-3 w-full term-frame py-3" data-title="controls">
        <div class="flex items-center gap-2">
            <span class="term-dim text-xs">lang:</span>
            <button 
                type="button"
                @click="language = 'en'"
                class="term-btn text-xs"
                :class="{ active: language === 'en' }"
            >
                en
            </button>
            <button 
                type="button"
                @click="language = 'fr'"
                class="term-btn text-xs"
                :class="{ active: language === 'fr' }"
            >
                fr
            </button>
        </div>

        <span class="term-muted hidden sm:inline">|</span>

        <button 
            type="button"
            @click="downloadPdf"
            :disabled="isFileMissing"
            class="term-btn text-xs"
        >
            $ download
        </button>
    </div>

    <div class="w-full flex-grow term-frame overflow-hidden relative min-h-[60vh] md:min-h-[75vh] p-0" data-title="viewer">
        <div v-if="isFileMissing" class="absolute inset-0 flex flex-col items-center justify-center term-dim p-6 text-center">
            <p class="text-base">err: resume file not found</p>
            <p class="text-sm mt-2 term-muted">This version of the resume is not currently available.</p>
        </div>

        <object 
            v-else
            :data="pdfPath" 
            type="application/pdf" 
            class="w-full h-full absolute inset-0"
        >
            <div class="flex flex-col items-center justify-center h-full text-center p-8">
                <p class="mb-4">Your browser does not support inline PDF viewing.</p>
                <a :href="pdfPath" download class="term-btn">
                    $ download --force
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
