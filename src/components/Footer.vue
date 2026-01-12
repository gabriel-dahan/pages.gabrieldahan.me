<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';


const currentYear = new Date().getFullYear();

const githubLink = 'https://github.com/gabriel-dahan';
const linkedinLink = 'https://www.linkedin.com/in/gabriel-dahan-964b59371/en/';

</script>

<template>
    <footer class="footer sm:footer-horizontal bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 p-10">
        <div>
            <p class="font-bold text-gray-900 dark:text-gray-100">Gabriel Dahan - {{ currentYear }}</p>
            <small>Any bug/issue ? Contact me !</small>
        </div>
        <nav>
            <h6 class="footer-title text-gray-900 dark:text-white opacity-100">LINKS</h6>
            <RouterLink class="link link-hover hover:text-indigo-500" to="/contact">Contact</RouterLink>
            <RouterLink class="link link-hover hover:text-indigo-500" to="/projects">Projects</RouterLink>
            <RouterLink class="link link-hover hover:text-indigo-500" to="/resume">CV/Resume</RouterLink>
        </nav>
        <nav>
            <h6 class="footer-title text-gray-900 dark:text-white opacity-100">SOCIAL</h6>
            <a class="link link-hover hover:text-indigo-500" :href="githubLink" target="_blank">GitHub</a>
            <a class="link link-hover hover:text-indigo-500" :href="linkedinLink" target="_blank">LinkedIn</a>
        </nav>
    </footer>
</template>