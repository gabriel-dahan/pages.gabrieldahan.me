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
    <header>
        <div class="navbar bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm text-gray-800 dark:text-gray-200">
            <div class="navbar-start">
                <div class="dropdown">
                    <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul tabindex="0"
                        class="menu menu-sm dropdown-content bg-white dark:bg-gray-800 rounded-box mt-3 w-52 p-2 shadow-xl border border-gray-100 dark:border-gray-700 z-[100]">
                        <li><RouterLink to="/projects" @click="closeMenu">Projects</RouterLink></li>
                        <li><RouterLink to="/contact" @click="closeMenu">Contact</RouterLink></li>
                        <li><RouterLink to="/resume" @click="closeMenu">CV/Resume</RouterLink></li>
                    </ul>
                </div>
                <RouterLink class="app__title-main link no-underline font-bold text-xl hover:text-indigo-500 transition-colors" to="/">{{ title }}</RouterLink>
            </div>
            <div class="navbar-center hidden lg:flex">
                <ul class="menu menu-horizontal px-1 font-medium">
                    <li><RouterLink to="/projects" class="hover:text-indigo-500 active:bg-transparent">Projects</RouterLink></li>
                    <li><RouterLink to="/contact" class="hover:text-indigo-500 active:bg-transparent">Contact</RouterLink></li>
                    <li><RouterLink to="/resume" class="hover:text-indigo-500 active:bg-transparent">CV/Resume</RouterLink></li>
                </ul>
            </div>
            <div class="navbar-end"></div>
        </div>
    </header>
</template>