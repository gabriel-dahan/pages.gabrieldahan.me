<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useTerminalTheme, type TerminalTheme } from '../composables/useTerminalTheme';

const currentYear = new Date().getFullYear();

const githubLink = 'https://github.com/gabriel-dahan';
const linkedinLink = 'https://www.linkedin.com/in/gabriel-dahan-964b59371/en/';

const { theme, setTheme } = useTerminalTheme();

function selectTheme(value: TerminalTheme) {
  setTheme(value);
}
</script>

<template>
    <footer class="w-full border-t border-[var(--term-border)] bg-[var(--term-bg-elevated)] text-[var(--term-fg)] font-mono text-sm">
        <div class="w-full px-3 sm:px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
                <p class="font-semibold">Gabriel Dahan — {{ currentYear }}</p>
                <p class="term-dim text-xs mt-1">Any bug/issue? Contact me!</p>
            </div>

            <nav class="flex flex-col gap-1">
                <span class="term-dim text-xs tracking-wider">// LINKS</span>
                <RouterLink class="term-link" to="/contact">./contact</RouterLink>
                <RouterLink class="term-link" to="/projects">./projects</RouterLink>
                <RouterLink class="term-link" to="/resume">./resume</RouterLink>
            </nav>

            <nav class="flex flex-col gap-1">
                <span class="term-dim text-xs tracking-wider">// SOCIAL</span>
                <a class="term-link" :href="githubLink" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a class="term-link" :href="linkedinLink" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </nav>
        </div>

        <div class="w-full px-3 sm:px-6 py-3 border-t border-[var(--term-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span class="term-muted">session: active</span>
            <div class="flex items-center gap-2" role="group" aria-label="Theme color">
                <span class="term-dim">[ theme:</span>
                <button
                    type="button"
                    class="term-btn py-0.5 px-2 text-xs"
                    :class="{ active: theme === 'sage' }"
                    @click="selectTheme('sage')"
                >
                    sage
                </button>
                <span class="term-dim">|</span>
                <button
                    type="button"
                    class="term-btn py-0.5 px-2 text-xs"
                    :class="{ active: theme === 'sand' }"
                    @click="selectTheme('sand')"
                >
                    sand
                </button>
                <span class="term-dim">]</span>
            </div>
        </div>
    </footer>
</template>
