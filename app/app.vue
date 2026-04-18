<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.png' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'SIPRI Indonesia — Arms Transfers Database'
const description = 'Explore Indonesia\'s arms transfers data from the SIPRI Arms Transfers Database. Browse, search, and analyze weapons procurement records.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <UHeader :toggle="false">
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/arifineu/sipri-indonesia"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <div class="text-sm text-muted space-y-0.5">
          <p>
            Data sourced from the <a href="https://armstransfers.sipri.org" target="_blank" rel="noopener noreferrer" class="underline hover:text-gray-700 dark:hover:text-gray-300">SIPRI Arms Transfers Database</a>
          </p>
          <p>
            Built by <a href="https://github.com/arifineu" target="_blank">arifineu</a> © {{ new Date().getFullYear() }}
          </p>
        </div>
      </template>

      <template #right>
        <UButton
          to="https://github.com/arifineu/sipri-indonesia"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
