<script setup lang="ts">
import { RouterLink } from 'vue-router';

const title = import.meta.env.VITE_APP_TITLE

const closeMenu = () => {
    const elem = document.activeElement;
    if (elem instanceof HTMLElement) {
        elem.blur();
    }
};
</script>

<template>
    <header class="w-full border-b border-[var(--term-border)] bg-[var(--term-bg-elevated)]">
        <div class="w-full flex items-center justify-between gap-3 px-3 sm:px-6 py-3 font-mono text-sm">
            <div class="flex items-center gap-2 min-w-0">
                <div class="dropdown lg:hidden">
                    <div tabindex="0" role="button" class="term-btn px-2 py-1" aria-label="Open menu">
                        <span aria-hidden="true">[=]</span>
                    </div>
                    <ul tabindex="0"
                        class="menu menu-sm dropdown-content mt-2 w-56 p-2 z-[100] border border-[var(--term-border)] bg-[var(--term-bg-panel)]">
                        <li>
                            <RouterLink to="/projects" class="term-link font-mono" @click="closeMenu">./projects</RouterLink>
                        </li>
                        <li>
                            <RouterLink to="/contact" class="term-link font-mono" @click="closeMenu">./contact</RouterLink>
                        </li>
                        <li>
                            <RouterLink to="/resume" class="term-link font-mono" @click="closeMenu">./resume</RouterLink>
                        </li>
                    </ul>
                </div>

                <RouterLink
                    class="app__title-main truncate"
                    to="/"
                >
                    <span class="term-dim">~/</span>{{ title || 'pages' }}
                </RouterLink>
            </div>

            <nav class="hidden lg:flex items-center gap-5 text-[var(--term-fg)]">
                <RouterLink to="/projects" class="term-link">./projects</RouterLink>
                <RouterLink to="/contact" class="term-link">./contact</RouterLink>
                <RouterLink to="/resume" class="term-link">./resume</RouterLink>
            </nav>
        </div>
    </header>
</template>
