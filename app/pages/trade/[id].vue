<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const statusLabels: Record<string, string> = {
  N: 'N - Not delivered (ordered but not yet delivered)',
  S: 'S - Suspended/Cancelled',
  R: 'R - Received/Delivered'
}

const tzLabel = useTimezoneLabel()

const nuxtApp = useNuxtApp()
const { data: trade, pending, error } = await useFetch(`/api/sipri/trade/${id}`, {
  getCachedData(key) {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  }
})

const newsQuery = computed(() => {
  if (!trade.value) return ''
  const t = trade.value
  const terms = [
    t.armamentDesignation,
    t.armamentDesignation2,
    t.armamentDesignation3,
    t.armamentName,
    t.externalComment
  ].filter(v => v && v !== '-' && v !== 'n.a.' && v !== 'benchmark')

  const searchTerms = terms.length > 0 ? terms[0] : t.armamentDescription
  return `Indonesia ${searchTerms}`
})

const { data: news } = await useFetch('/api/news', {
  query: { q: newsQuery },
  server: false,
  lazy: true,
  default: () => []
})

useHead(() => ({
  title: trade.value ? `${trade.value.armamentDesignation} — SIPRI` : 'Trade Details'
}))

const details = computed(() => {
  if (!trade.value) return []
  const t = trade.value
  return [
    { label: 'Designation', value: t.armamentDesignation },
    { label: 'Alt. Designation', value: t.armamentDesignation2 },
    { label: 'Alt. Designation 2', value: t.armamentDesignation3 },
    { label: 'Weapon Name', value: t.armamentName },
    { label: 'Description', value: t.armamentDescription },
    { label: 'Category', value: t.armamentCategoryName },
    { label: 'Supplier', value: `${t.sellerCountry} (${t.sellerCountryCode})` },
    { label: 'Recipient', value: `${t.buyerCountry} (${t.buyerCountryCode})` },
    { label: 'Producer Country', value: t.armamentProductionCountry },
    { label: 'Producer Company', value: t.armamentProducerCompany },
    { label: 'Order Year', value: t.orderDate || '—' },
    { label: 'Units Ordered', value: t.unitsOrdered },
    { label: 'Comment', value: t.externalComment },
    { label: 'Status', value: statusLabels[t.status1] ?? t.status1 },
    { label: 'SIPRI Estimate (TIV)', value: t.armamentSipriEstimate ?? '—', tooltip: 'Trend Indicator Value — not a price. It measures the volume of military capability transferred, based on estimated production costs. Used to compare the scale of arms transfers across countries and over time.' },
    { label: 'Delivery Completion Year', value: t.deliveryCompletionYear || '—' },
    { label: 'Estimated Order Date', value: t.estimatedOrderDate ? 'Yes' : 'No' },
    { label: 'Estimated Order Count', value: t.estimatedOrderCount ? 'Yes' : 'No' },
    { label: 'Created', value: t.CreatedOn ? new Date(t.CreatedOn).toLocaleString('en-GB', { hour12: false }) + ' ' + tzLabel.value : '—' },
    { label: 'Last Updated', value: t.UpdatedOn ? new Date(t.UpdatedOn).toLocaleString('en-GB', { hour12: false }) + ' ' + tzLabel.value : '—' }
  ]
})
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <UButton variant="outline" size="sm" to="/" icon="i-lucide-arrow-left">
        Back
      </UButton>
    </div>

    <div v-if="pending" class="text-gray-400 py-8 text-center">Loading...</div>

    <div v-else-if="error" class="text-red-500 py-8 text-center">
      Failed to load trade details: {{ error.message }}
    </div>

    <template v-else-if="trade">
      <div>
        <h1 class="text-2xl font-bold">{{ trade.armamentDesignation }}</h1>
        <p class="text-gray-500 mt-1">
          {{ trade.armamentDescription }} — {{ trade.sellerCountry }} to {{ trade.buyerCountry }}
        </p>
      </div>

      <div class="border rounded-lg divide-y">
        <div
          v-for="item in details"
          :key="item.label"
          class="flex px-4 py-3 text-sm"
        >
          <span class="w-48 shrink-0 text-gray-500 inline-flex items-center gap-1">
            {{ item.label }}
            <UTooltip v-if="item.tooltip" :text="item.tooltip">
              <UIcon name="i-lucide-info" class="text-gray-400 size-3.5" />
            </UTooltip>
          </span>
          <span class="font-medium">{{ item.value || '—' }}</span>
        </div>
      </div>

      <div v-if="trade.deliveries.length">
        <h2 class="text-lg font-semibold mb-2">Deliveries</h2>
        <UTable
          :data="trade.deliveries"
          :columns="[
            { id: 'year', header: 'Year', accessorKey: 'year' },
            { id: 'units', header: 'Units', accessorKey: 'units' }
          ]"
        />
      </div>

      <div v-if="trade.sources.length">
        <h2 class="text-lg font-semibold mb-2">Sources</h2>
        <ul class="list-disc list-inside text-sm space-y-1">
          <li v-for="src in trade.sources" :key="src.id">
            {{ src.description }}
          </li>
        </ul>
      </div>

      <div v-if="news.length">
        <h2 class="text-lg font-semibold mb-2">Related News</h2>
        <div class="space-y-3">
          <a
            v-for="item in news"
            :key="item.link"
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="block border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 class="font-medium text-sm text-[var(--ui-primary)]">{{ item.title }}</h3>
            <p class="text-xs text-gray-400 mt-1">
              {{ item.source }}
              <span v-if="item.pubDate"> · {{ new Date(item.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
            </p>
          </a>
        </div>
      </div>
    </template>
  </div>
</template>
