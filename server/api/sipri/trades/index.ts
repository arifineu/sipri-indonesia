export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 0
  const pageSize = Number(query.pageSize) || 100
  const sortField = String(query.sortField || 'orderYr')
  const sortDir = String(query.sortDir || 'desc').toUpperCase()
  const search = String(query.search || '').trim()
  const searchField = String(query.searchField || 'Designation')

  const INDONESIA_ID = 1050423

  const filters = [
    {
      field: 'Recipient',
      oldField: '',
      condition: 'contains',
      value1: '',
      value2: '',
      listData: [INDONESIA_ID]
    }
  ]

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
