<template>
    <div class="pdf-viewer">
        <iframe
            src="/src/assets/International_CV.pdf"
            class="pdf-frame"
            title="My PDF File"
        ></iframe>
    </div>
</template>

<style scoped>
.pdf-viewer {
    width: 100%;
    height: 70vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.pdf-frame {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>