import type { SearchFilter, TradeSearchResult } from '~/server/types/sipri'

const FETCH_PAGE_SIZE = 100
const PARALLEL_BATCH = 6

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const recipientCountryId = query.recipientCountryId ? Number(query.recipientCountryId) : 1150592

  const filters: SearchFilter[] = [
    {
      field: 'Recipient',
      oldField: '',
      condition: 'contains',
      value1: '',
      value2: '',
      listData: [recipientCountryId]
    }
  ]

  const total = await searchTradesCount(filters, 'AND')
  const pages = Math.ceil(total / FETCH_PAGE_SIZE)
  const allTrades: TradeSearchResult[] = []
  // Fire requests in parallel batches to avoid sequential round-trip latency.
  for (let i = 0; i < pages; i += PARALLEL_BATCH) {
    const slice = Array.from(
      { length: Math.min(PARALLEL_BATCH, pages - i) },
      (_, j) => searchTrades(filters, 'AND', i + j, FETCH_PAGE_SIZE, {})
    )
    const results = await Promise.all(slice)
    for (const batch of results) {
      allTrades.push(...batch)
    }
  }

  const sellerNames = [...new Set(allTrades.map(t => t.seller))]

  const countries = await getAllCountriesTrimmed()
  const validNames = new Set(
    countries
      .filter(c => !c.deleted)
      .map(c => c.Name)
  )

  const items = sellerNames
    .filter(name => validNames.has(name))
    .map((name) => {
      const country = countries.find(c => c.Name === name)!
      return { label: name, value: country.EntityId }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return items
})
