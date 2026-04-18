<script setup lang="ts">
const { data: countries, pending: countriesLoading } = await useFetch('/api/sipri/countries')
const { data: categories, pending: categoriesLoading } = await useFetch('/api/sipri/categories')
const { data: stats, pending: statsLoading } = await useFetch('/api/sipri/stats')

const tradeId = ref('1067232')
const { data: trade, pending: tradeLoading, execute: fetchTrade } = await useFetch(
  () => `/api/sipri/trade/${tradeId.value}`,
  { immediate: false, watch: false }
)
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto space-y-8">
    <div>
      <h1 class="text-2xl font-bold mb-2">SIPRI Arms Transfers Database</h1>
      <p v-if="stats" class="text-gray-500">
        {{ stats.countries }} countries &middot; {{ stats.categories }} categories indexed
      </p>
    </div>

    <!-- Trade lookup -->
    <div>
      <h2 class="text-lg font-semibold mb-3">Trade Lookup</h2>
      <div class="flex gap-2 items-end">
        <UFormField label="Trade ID">
          <UInput v-model="tradeId" placeholder="e.g. 1067232" />
        </UFormField>
        <UButton :loading="tradeLoading" @click="fetchTrade()">
          Fetch Trade
        </UButton>
      </div>
      <UCard v-if="trade" class="mt-4">
        <pre class="text-xs overflow-auto max-h-96">{{ JSON.stringify(trade, null, 2) }}</pre>
      </UCard>
    </div>

    <!-- Countries -->
    <div>
      <h2 class="text-lg font-semibold mb-3">Countries ({{ countries?.length ?? '...' }})</h2>
      <div v-if="countriesLoading" class="text-gray-400">Loading...</div>
      <div v-else class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        <UCard
          v-for="c in (countries ?? []).slice(0, 48)"
          :key="c.EntityId"
          class="text-center text-sm p-2"
        >
          {{ c.Name }}
        </UCard>
      </div>
      <p v-if="(countries?.length ?? 0) > 48" class="text-gray-400 mt-2 text-sm">
        Showing first 48 of {{ countries?.length }}
      </p>
    </div>

    <!-- Categories -->
    <div>
      <h2 class="text-lg font-semibold mb-3">Armament Categories</h2>
      <div v-if="categoriesLoading" class="text-gray-400">Loading...</div>
      <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2">
        <UCard
          v-for="cat in categories?.categories ?? []"
          :key="cat.EntityId"
          class="p-3 text-sm"
        >
          {{ cat.Name }}
        </UCard>
      </div>
    </div>
  </div>
</template>
