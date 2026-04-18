<script setup lang="ts">
import { h } from 'vue'
import type { SortingState, HeaderContext } from '@tanstack/vue-table'

const route = useRoute()
const router = useRouter()
const page = ref(Number(route.query.page) || 0)
const pageSize = ref(Number(route.query.pageSize) || 10)
const searchInput = ref(String(route.query.search || ''))
const search = ref(String(route.query.search || ''))
const searchField = ref(String(route.query.searchField || 'Designation'))

if (route.query.page || route.query.pageSize || route.query.search || route.query.searchField) {
  router.replace({ path: '/' })
}
const sorting = ref<SortingState>([{ id: 'orderYr', desc: true }])

const sortField = computed(() => sorting.value[0]?.id || 'orderYr')
const sortDir = computed(() => sorting.value[0]?.desc ? 'desc' : 'asc')

const { data, pending } = await useFetch('/api/sipri/trades', {
  query: { page, pageSize, sortField, sortDir, search, searchField }
})

useHead({ title: 'Indonesia Arms Transfers — SIPRI' })

const tzLabel = useTimezoneLabel()

const lastUpdated = computed(() => {
  if (!data.value) return null
  return new Date().toLocaleString('en-GB', { hour12: false })
})

const statusLabels: Record<string, string> = {
  N: 'N - Not delivered (ordered but not yet delivered)',
  S: 'S - Suspended/Cancelled',
  R: 'R - Received/Delivered'
}

function sortableHeader(label: string) {
  return (ctx: HeaderContext<any, any>) => {
    const sorted = ctx.column.getIsSorted()
    const arrow = sorted === 'desc' ? ' \u2193' : sorted === 'asc' ? ' \u2191' : ''
    return h('span', {
      class: 'cursor-pointer select-none inline-flex items-center gap-1',
      onClick: ctx.column.getToggleSortingHandler()
    }, [label, h('span', { class: 'text-xs text-gray-400' }, arrow)])
  }
}

const columns = [
  { id: 'orderYr', header: sortableHeader('Year'), accessorKey: 'orderYr' },
  { id: 'seller', header: sortableHeader('Supplier'), accessorKey: 'seller' },
  { id: 'desg', header: 'Designation', accessorKey: 'desg' },
  { id: 'desc', header: 'Description', accessorKey: 'desc' },
  { id: 'category', header: sortableHeader('Category'), accessorKey: 'category' },
  { id: 'units', header: sortableHeader('Units'), accessorKey: 'units' },
  { id: 'deliveryYr', header: sortableHeader('Delivery'), accessorKey: 'deliveryYr' },
  {
    id: 'status',
    header: sortableHeader('Status'),
    accessorKey: 'status',
    cell: ({ row }: { row: { original: { status: string } } }) => {
      const code = row.original.status
      return statusLabels[code] ?? code
    }
  }
]

// --- XL Slideover ---
const isXl = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(min-width: 1280px)')
  isXl.value = mq.matches
  mq.addEventListener('change', e => isXl.value = e.matches)
})

const slideOpen = ref(false)
const selectedId = ref<number | null>(null)

const { data: tradeDetail, pending: detailPending, execute: fetchDetail } = useFetch(
  () => `/api/sipri/trade/${selectedId.value}`,
  { immediate: false, lazy: true, default: () => null }
)

watch(selectedId, (id) => {
  if (id) fetchDetail()
})

function onRowSelect(e: Event, row: any) {
  if (isXl.value) {
    selectedId.value = row.original.id
    slideOpen.value = true
  } else {
    navigateTo(`/trade/${row.original.id}?fromPage=${page}&fromPageSize=${pageSize}&fromSearch=${encodeURIComponent(search)}&fromSearchField=${searchField}`)
  }
}

function closeSlideover() {
  slideOpen.value = false
}

function row(label: string, value: string | number | undefined | null) {
  return { label, value: value || '—' }
}

const slideoverWeapon = computed(() => {
  if (!tradeDetail.value) return []
  const t = tradeDetail.value
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

const slideoverTransfer = computed(() => {
  if (!tradeDetail.value) return []
  const t = tradeDetail.value
  return [
    row('Supplier', `${t.sellerCountry} (${t.sellerCountryCode})`),
    row('Recipient', `${t.buyerCountry} (${t.buyerCountryCode})`),
    row('Order Year', t.orderDate),
    row('Units', t.unitsOrdered),
    row('Status', statusLabels[t.status1] ?? t.status1),
    row('TIV', t.armamentSipriEstimate),
    row('Delivery Year', t.deliveryCompletionYear)
  ]
})

const slideoverMeta = computed(() => {
  if (!tradeDetail.value) return []
  const t = tradeDetail.value
  return [
    row('Comment', t.externalComment),
    row('Created', t.CreatedOn ? new Date(t.CreatedOn).toLocaleString('en-GB', { hour12: false }) + ' ' + tzLabel.value : undefined),
    row('Last Updated', t.UpdatedOn ? new Date(t.UpdatedOn).toLocaleString('en-GB', { hour12: false }) + ' ' + tzLabel.value : undefined)
  ].filter(m => m.value !== '—' || m.label === 'Last Updated')
})

// --- Pagination ---
const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / pageSize.value))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const pages: (number | '...')[] = []
  pages.push(0)
  if (current > 2) pages.push('...')
  for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 3) pages.push('...')
  pages.push(total - 1)
  return pages
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    search.value = searchInput.value.trim()
    page.value = 0
  }, 300)
}

watch(searchField, () => {
  if (search.value) page.value = 0
})

watch(sorting, () => {
  page.value = 0
})
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Indonesia Arms Transfers</h1>
      <div class="flex justify-between gap-4 mt-2">
        <p class="text-gray-500">
          SIPRI Arms Transfers Database — {{ data?.total ?? '...' }} records
        </p>
        <span v-if="lastUpdated" class="text-gray-400 text-right text-sm">Last updated: {{ lastUpdated }} {{ tzLabel }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <USelect
        v-model="searchField"
        :items="['Designation', 'Description']"
        size="lg"
        class="w-36"
      />
      <UInput
        v-model="searchInput"
        placeholder="Search..."
        icon="i-lucide-search"
        size="lg"
        class="flex-1"
        @input="onSearchInput"
      />
    </div>

    <div v-if="pending" class="text-gray-400 py-8 text-center">Loading...</div>

    <template v-else-if="data">
      <UTable
        :data="data.trades"
        :columns="columns"
        v-model:sorting="sorting"
        :sorting-options="{ manualSorting: true }"
        :on-select="onRowSelect"
      />

      <div class="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
        <div class="flex items-center gap-3 text-sm text-gray-500">
          <span>
            {{ page * pageSize + 1 }}–{{ Math.min((page + 1) * pageSize, data.total) }} of {{ data.total }}
          </span>
          <div class="flex items-center gap-1.5">
            <span>Show</span>
            <USelect
              :model-value="String(pageSize)"
              @update:model-value="pageSize = Number($event); page = 0"
              :items="['10', '25', '50', '100']"
              size="xs"
              class="w-18"
            />
            <span>per page</span>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <UButton
            :disabled="page === 0"
            variant="outline"
            size="sm"
            icon="i-lucide-chevrons-left"
            @click="page = 0"
          />
          <UButton
            :disabled="page === 0"
            variant="outline"
            size="sm"
            icon="i-lucide-chevron-left"
            @click="page--"
          />
          <template v-for="p in visiblePages" :key="p">
            <UButton
              v-if="p === '...'"
              variant="outline"
              size="sm"
              :label="'...'"
              disabled
            />
            <UButton
              v-else
              :variant="p === page ? 'solid' : 'outline'"
              size="sm"
              :label="String(p + 1)"
              @click="page = p"
            />
          </template>
          <UButton
            :disabled="page >= totalPages - 1"
            variant="outline"
            size="sm"
            icon="i-lucide-chevron-right"
            @click="page++"
          />
          <UButton
            :disabled="page >= totalPages - 1"
            variant="outline"
            size="sm"
            icon="i-lucide-chevrons-right"
            @click="page = totalPages - 1"
          />
        </div>
      </div>
    </template>
  </div>

  <!-- XL Slideover -->
  <USlideover
    v-model:open="slideOpen"
    side="right"
    :title="detailPending ? 'Loading...' : tradeDetail?.armamentDesignation"
    :description="detailPending ? 'Loading...' : tradeDetail?.armamentDescription"
    @after:leave=""
  >
    <template #body="{ close }">
      <!-- Skeleton loading -->
      <div v-if="detailPending" class="space-y-6 p-4">
        <div class="space-y-3">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-2/3" />
        </div>
        <div class="space-y-3">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-2/3" />
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="tradeDetail" class="space-y-4 p-4">
        <!-- Weapon card -->
        <div class="border rounded-lg">
          <div class="px-4 py-2 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Weapon</h3>
          </div>
          <div class="divide-y divide-gray-300 text-sm">
            <div v-for="item in slideoverWeapon" :key="item.label" class="flex justify-between gap-3 px-4 py-2">
              <span class="text-gray-500 shrink-0">{{ item.label }}</span>
              <span class="font-medium text-right">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Transfer card -->
        <div class="border rounded-lg">
          <div class="px-4 py-2 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Transfer</h3>
          </div>
          <div class="divide-y divide-gray-300 text-sm">
            <div v-for="item in slideoverTransfer" :key="item.label" class="flex justify-between gap-3 px-4 py-2">
              <span class="text-gray-500 shrink-0">{{ item.label }}</span>
              <span class="font-medium text-right">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Deliveries -->
        <div v-if="tradeDetail.deliveries.length" class="border rounded-lg">
          <div class="px-4 py-2 border-b rounded-t-lg bg-gray-50 dark:bg-gray-800/50">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Deliveries</h3>
          </div>
          <UTable
            :data="tradeDetail.deliveries"
            :columns="[
              { id: 'year', header: 'Year', accessorKey: 'year' },
              { id: 'units', header: 'Units', accessorKey: 'units' }
            ]"
          />
        </div>

        <!-- Meta -->
        <div v-if="slideoverMeta.length" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 px-1">
          <template v-for="item in slideoverMeta" :key="item.label">
            <span v-if="item.value !== '—'">
              {{ item.label }}: <span class="text-gray-500 font-medium">{{ item.value }}</span>
            </span>
          </template>
        </div>

        <!-- View full detail link -->
        <UButton
          variant="outline"
          size="sm"
          block
          icon="i-lucide-external-link"
          :to="`/trade/${tradeDetail.EntityId}?fromPage=${page}&fromPageSize=${pageSize}&fromSearch=${encodeURIComponent(search)}&fromSearchField=${searchField}`"
        >
          View Full Details
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
