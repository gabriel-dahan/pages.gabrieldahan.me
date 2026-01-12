<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <div>
        <h1 class="app__title">Gabriel Dahan</h1>
    </div>

    <section id="about" class="about">
        <h2>Hi, I'm Gabriel <span aria-hidden="true">👋</span></h2>

        <p>
            I'm a student at <strong>ENSAI</strong> — the French National School for Statistics and Data Analysis — where I study
            mathematics, statistics, and data science.
        </p>

        <p>
            I’m passionate about <strong>programming</strong>, <strong>data-driven projects</strong>, and the intersection between
            <strong>theoretical modeling</strong> and <strong>practical implementation</strong>.
        </p>

        <p>
            I enjoy exploring a wide range of topics in computer science, from <strong>algorithm design</strong> and
            <strong>data visualization</strong> to <strong>software engineering</strong> and <strong>AI applications</strong>.
            What I love most is turning complex ideas into elegant, efficient, and meaningful solutions.
        </p>

        <p>
            Over time, I’ve worked on projects involving <strong>Python</strong>, <strong>Vue.js</strong>, <strong>TypeScript</strong>,
            <strong>OCaml</strong>, <strong>R</strong>, and more, which have helped me develop both strong <strong>analytical skills</strong>
            and a solid <strong>technical mindset</strong>.
        </p>

        <p>
            When I’m not coding or working on data-related challenges, I enjoy doing photography and hanging out.
            I’m always eager to <strong>learn</strong>, <strong>create</strong>, and <strong>collaborate</strong> on ideas that make a real impact.
        </p>

        <p>
            Welcome to my portfolio — feel free to explore my work and <RouterLink to="/contact" title="Contact Gabriel" class="link decoration-blue-200"><strong>reach out</strong></RouterLink>
            if you’d like to collaborate or discuss new projects!
        </p>
    </section>

    <section>
        <p class="text-center">
            Go check out my 
            <RouterLink 
                to="/projects" 
                class="btn bg-gray-900 text-white btn-sm rounded-2xl border-none m-3 py-0 btn-glow"
            >
                Projects
            </RouterLink>
        </p>
    </section>
</template>

<style scoped>
.about {
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1rem;
    line-height: 1.6;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}

.about h2 {
    font-size: 1.6rem;
    margin-bottom: 1rem;
}

.about p {
    margin: 0 0 1rem 0;
    text-align: justify;
}

.about a {
    text-decoration: underline;
}

.btn-glow {
  transition: all 0.3s ease-in-out;
  animation: glowing 3s infinite;
}

@keyframes glowing {
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); 
  }
  50% {
    box-shadow: 0 0 20px 0 rgba(99, 102, 241, 0.7); 
    transform: scale(1.05); 
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); 
  }
}
</style>