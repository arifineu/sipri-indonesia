<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const statusLabels: Record<string, string> = {
  N: 'N - Not delivered (ordered but not yet delivered)',
  S: 'S - Suspended/Cancelled',
  R: 'R - Received/Delivered'
}

const fromPage = route.query.fromPage || '0'
const fromPageSize = route.query.fromPageSize || '10'
const fromSearch = route.query.fromSearch ? String(route.query.fromSearch) : ''
const fromSearchField = route.query.fromSearchField || 'Designation'

const goingBack = ref(false)

async function goBack() {
  goingBack.value = true
  const params = new URLSearchParams({ page: fromPage, pageSize: fromPageSize })
  if (fromSearch) {
    params.set('search', fromSearch)
    params.set('searchField', fromSearchField)
  }
  await navigateTo(`/?${params}`)
}

const tzLabel = useTimezoneLabel()

const nuxtApp = useNuxtApp()
const { data: trade, pending, error } = await useFetch(`/api/sipri/trade/${id}`, {
  getCachedData(key) {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  }
})

const imageQuery = computed(() => {
  if (!trade.value) return ''
  const t = trade.value
  const name = [t.armamentDesignation, t.armamentName]
    .find(v => v && v !== '-' && v !== 'n.a.')
  const desc = t.armamentDescription && t.armamentDescription !== '-' && t.armamentDescription !== 'n.a.'
    ? t.armamentDescription
    : ''
  if (!name) return desc
  return desc ? `${name} ${desc}` : name
})

const { data: images, pending: imagesPending } = await useFetch('/api/weapon-images', {
  query: { q: imageQuery },
  server: false,
  lazy: true,
  default: () => ({ main: null, gallery: [] })
})

const mainImage = ref<string | null>(null)
const lightboxOpen = ref(false)
watch(() => images.value?.main, (url) => {
  if (url) mainImage.value = url
}, { immediate: true })

const lightboxCaption = computed(() => {
  if (!mainImage.value || !images.value) return ''
  const all = [images.value.main, ...images.value.gallery.map(g => g.url)].filter(Boolean)
  const idx = all.indexOf(mainImage.value)
  if (idx > 0 && images.value.gallery[idx - 1]?.title) return images.value.gallery[idx - 1].title
  return trade.value?.armamentDesignation || ''
})

const { data: wiki } = await useFetch('/api/wikipedia', {
  query: { q: imageQuery },
  server: false,
  lazy: true,
  default: () => null
})

const newsQuery = computed(() => {
  if (!trade.value) return ''
  const t = trade.value
  const term = [
    t.armamentDesignation,
    t.armamentDesignation2,
    t.armamentName,
    t.armamentDescription
  ].find(v => v && v !== '-' && v !== 'n.a.' && v !== 'benchmark')

  return term ? `${term} Indonesia` : ''
})

const deliveryCutoff = computed(() => {
  if (!trade.value?.deliveryCompletionYear) return null
  return trade.value.deliveryCompletionYear
})

const { data: rawNews } = await useFetch('/api/news', {
  query: { q: newsQuery },
  server: false,
  lazy: true,
  default: () => []
})

const news = computed(() => {
  if (!deliveryCutoff.value) return rawNews.value
  return rawNews.value.filter(item => {
    if (!item.pubDate) return true
    return new Date(item.pubDate).getFullYear() <= deliveryCutoff.value!
  })
})

useHead(() => ({
  title: trade.value ? `${trade.value.armamentDesignation} — SIPRI` : 'Trade Details'
}))

function row(label: string, value: string | number | undefined | null, tooltip?: string) {
  return { label, value: value || '—', tooltip }
}

const weaponInfo = computed(() => {
  if (!trade.value) return []
  const t = trade.value
  return [
    row('Category', t.armamentCategoryName),
    row('Weapon Name', t.armamentName),
    row('Description', t.armamentDescription),
    row('Alt. Designation', t.armamentDesignation2),
    row('Alt. Designation 2', t.armamentDesignation3),
    row('Producer', t.armamentProducerCompany),
    row('Producer Country', t.armamentProductionCountry)
  ]
})

const transferInfo = computed(() => {
  if (!trade.value) return []
  const t = trade.value
  return [
    row('Supplier', `${t.sellerCountry} (${t.sellerCountryCode})`),
    row('Recipient', `${t.buyerCountry} (${t.buyerCountryCode})`),
    row('Order Year', t.orderDate),
    row('Units Ordered', t.unitsOrdered),
    row('Status', statusLabels[t.status1] ?? t.status1),
    row('TIV', t.armamentSipriEstimate, 'Trend Indicator Value — not a price. It measures the volume of military capability transferred, based on estimated production costs. Used to compare the scale of arms transfers across countries and over time.'),
    row('Delivery Year', t.deliveryCompletionYear),
    row('Est. Order Date', t.estimatedOrderDate ? 'Yes' : 'No'),
    row('Est. Order Count', t.estimatedOrderCount ? 'Yes' : 'No')
  ]
})

const metaInfo = computed(() => {
  if (!trade.value) return []
  const t = trade.value
  return [
    row('Comment', t.externalComment),
    row('Created', t.CreatedOn ? new Date(t.CreatedOn).toLocaleString('en-GB', { hour12: false }) + ' ' + tzLabel.value : undefined),
    row('Last Updated', t.UpdatedOn ? new Date(t.UpdatedOn).toLocaleString('en-GB', { hour12: false }) + ' ' + tzLabel.value : undefined)
  ].filter(m => m.value !== '—' || m.label === 'Last Updated')
})
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <UButton variant="outline" size="sm" :icon="goingBack ? 'i-lucide-loader-2' : 'i-lucide-arrow-left'" :loading="goingBack" @click="goBack()">
      Back
    </UButton>

    <div v-if="pending" class="text-gray-400 py-8 text-center">Loading...</div>

    <div v-else-if="error" class="text-red-500 py-8 text-center">
      Failed to load trade details: {{ error.message }}
    </div>

    <template v-else-if="trade">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">{{ trade.armamentDesignation }}</h1>
          <p class="text-gray-500 mt-1">{{ trade.armamentDescription }}</p>
        </div>
        <!--<span class="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800">-->
        <!--  {{ statusLabels[trade.status1] ?? trade.status1 }}-->
        <!--</span>-->
      </div>

      <!-- Armament images -->
      <div v-if="images?.main || images?.gallery?.length">
        <div v-if="mainImage" class="mb-3">
          <img
            :src="mainImage"
            :alt="trade.armamentDesignation"
            class="w-full max-h-72 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            loading="lazy"
            @click="lightboxOpen = true"
          />
        </div>
        <div v-if="images.gallery?.length" class="grid grid-cols-2 md:grid-cols-5 gap-2">
          <img
            v-for="img in images.gallery"
            :key="img.url"
            :src="img.url"
            :alt="img.title"
            class="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            :class="{ 'ring-2 ring-[var(--ui-primary)]': mainImage === img.url }"
            loading="lazy"
            @click="mainImage = img.url"
          />
        </div>
      </div>
      <div v-else-if="imagesPending" class="space-y-3">
        <USkeleton class="h-72 w-full rounded-lg" />
        <div class="grid grid-cols-4 gap-2">
          <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-lg" />
        </div>
      </div>

      <!-- Lightbox modal -->
      <UModal v-model:open="lightboxOpen" :ui="{ content: 'sm:max-w-4xl' }">
        <template #content>
          <div class="p-4 space-y-3">
            <img
              v-if="mainImage"
              :src="mainImage"
              :alt="lightboxCaption"
              class="w-full max-h-[70vh] object-contain rounded-lg"
            />
            <p class="text-sm text-gray-500 text-center">{{ lightboxCaption }}</p>
            <div v-if="images?.gallery?.length" class="flex justify-center gap-2 overflow-x-auto p-1">
              <img
                v-for="img in images.gallery"
                :key="img.url"
                :src="img.url"
                :alt="img.title"
                class="w-16 h-16 object-cover rounded-lg cursor-pointer shrink-0 hover:opacity-80 transition-opacity"
                :class="{ 'ring-2 ring-[var(--ui-primary)]': mainImage === img.url }"
                @click="mainImage = img.url"
              />
            </div>
          </div>
        </template>
      </UModal>

      <!-- Two-column cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Weapon Info -->
        <div class="border rounded-lg">
          <div class="px-4 py-2.5 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Weapon</h2>
          </div>
          <div class="divide-y divide-gray-300 text-sm">
            <div v-for="item in weaponInfo" :key="item.label" class="flex justify-between gap-4 px-4 py-2">
              <span class="text-gray-500 shrink-0 inline-flex items-center gap-1">
                {{ item.label }}
                <UTooltip v-if="item.tooltip" :text="item.tooltip">
                  <UIcon name="i-lucide-info" class="text-gray-400 size-3" />
                </UTooltip>
              </span>
              <span class="font-medium text-right">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Transfer Info -->
        <div class="border rounded-lg">
          <div class="px-4 py-2.5 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Transfer</h2>
          </div>
          <div class="divide-y divide-gray-300 text-sm">
            <div v-for="item in transferInfo" :key="item.label" class="flex justify-between gap-4 px-4 py-2">
              <span class="text-gray-500 shrink-0 inline-flex items-center gap-1">
                {{ item.label }}
                <UTooltip v-if="item.tooltip" :text="item.tooltip">
                  <UIcon name="i-lucide-info" class="text-gray-400 size-3" />
                </UTooltip>
              </span>
              <span class="font-medium text-right">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Meta row (full width, compact) -->
      <div v-if="metaInfo.length" class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 px-1">
        <template v-for="item in metaInfo" :key="item.label">
          <span v-if="item.value !== '—'">
            {{ item.label }}: <span class="text-gray-500 font-medium">{{ item.value }}</span>
          </span>
        </template>
      </div>

      <!-- Deliveries + News side by side -->
      <div v-if="trade.deliveries.length || trade.sources.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="trade.deliveries.length">
          <div class="border rounded-lg">
            <div class="px-4 py-2.5 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Deliveries</h2>
            </div>
            <UTable
              :data="trade.deliveries"
              :columns="[
                { id: 'year', header: 'Year', accessorKey: 'year' },
                { id: 'units', header: 'Units', accessorKey: 'units' }
              ]"
            />
          </div>
        </div>

        <div v-if="trade.sources.length">
          <div class="border rounded-lg">
            <div class="px-4 py-2.5 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
              <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Sources</h2>
            </div>
            <div class="p-4">
              <ul class="list-disc list-inside text-sm space-y-1">
                <li v-for="src in trade.sources" :key="src.id">
                  {{ src.description }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Wikipedia -->
      <div v-if="wiki?.extract" class="border rounded-lg">
        <div class="px-4 py-2.5 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">About</h2>
          <a v-if="wiki.url" :href="wiki.url" target="_blank" rel="noopener noreferrer" class="text-xs text-[var(--ui-primary)] hover:underline">Wikipedia</a>
        </div>
        <div class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {{ wiki.extract }}
        </div>
      </div>

      <!-- Related News (full width) -->
      <div v-if="news.length">
        <div class="border rounded-lg">
          <div class="px-4 py-2.5 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Related News</h2>
          </div>
          <div class="divide-y divide-gray-300">
            <a
              v-for="item in news"
              :key="item.link"
              :href="item.link"
              target="_blank"
              rel="noopener noreferrer"
              class="flex justify-between items-start gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <h3 class="font-medium text-sm text-[var(--ui-primary)]">{{ item.title }}</h3>
              <span class="shrink-0 text-xs text-gray-400">
                {{ item.source }}
                <span v-if="item.pubDate"> · {{ new Date(item.pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
