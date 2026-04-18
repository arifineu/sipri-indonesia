<script setup lang="ts">
import { h } from 'vue'
import type { SortingState, HeaderContext } from '@tanstack/vue-table'

const route = useRoute()
const router = useRouter()
const page = ref(Number(route.query.page) || 0)
const pageSize = ref(Number(route.query.pageSize) || 25)

if (route.query.page || route.query.pageSize) {
  router.replace({ path: '/' })
}
const sorting = ref<SortingState>([{ id: 'orderYr', desc: true }])
const searchInput = ref('')
const search = ref('')
const searchField = ref('Designation')

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
      <div class="flex justify-between gap-4">
        <p class="text-gray-500 mt-1">
          SIPRI Arms Transfers Database — {{ data?.total ?? '...' }} records
        </p>
        <span v-if="lastUpdated" class="text-gray-400 text-right">Last updated: {{ lastUpdated }} {{ tzLabel }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <USelect
        v-model="searchField"
        :items="['Designation', 'Description']"
        size="lg"
        class="w-40"
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
        :on-select="(e, row) => navigateTo(`/trade/${row.original.id}?fromPage=${page}&fromPageSize=${pageSize}`)"
      />

      <div class="flex items-center justify-between pt-4">
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
</template>
