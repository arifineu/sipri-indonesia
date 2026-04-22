import type { SearchFilter } from '~/server/types/sipri'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 0
  const pageSize = Number(query.pageSize) || 100
  const sortField = String(query.sortField || 'orderYr')
  const sortDir = String(query.sortDir || 'desc').toUpperCase()
  const search = String(query.search || '').trim()
  const searchField = String(query.searchField || 'Designation')
  const supplierCountryId = query.supplierCountryId ? Number(query.supplierCountryId) : null
  const categoryId = query.categoryId ? Number(query.categoryId) : null
  const recipientCountryId = query.recipientCountryId ? Number(query.recipientCountryId) : 1050423

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

  if (supplierCountryId) {
    filters.push({
      field: 'Supplier',
      oldField: '',
      condition: 'contains',
      value1: '',
      value2: '',
      listData: [supplierCountryId]
    })
  }

  if (categoryId) {
    filters.push({
      field: 'Weapon category',
      oldField: '',
      condition: 'contains',
      value1: '',
      value2: '',
      listData: [categoryId]
    })
  }

  if (search) {
    filters.push({
      field: searchField,
      oldField: '',
      condition: 'contains',
      value1: search,
      value2: '',
      listData: []
    })
  }

  const sorts: Record<string, string> = { [sortField]: sortDir }

  const [trades, total] = await Promise.all([
    searchTrades(filters, 'AND', page, pageSize, sorts),
    searchTradesCount(filters, 'AND')
  ])

  return { trades, total, page, pageSize }
})
