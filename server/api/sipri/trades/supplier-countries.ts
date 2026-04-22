import type { SearchFilter } from '~/server/types/sipri'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
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

  const total = await searchTradesCount(filters, 'AND')
  const allTrades = await searchTrades(filters, 'AND', 0, total, {})

  const sellerNames = [...new Set(allTrades.map(t => t.seller))]

  const countries = await getAllCountriesTrimmed()
  const validNames = new Set(
    countries
      .filter(c => !c.deleted)
      .map(c => c.Name)
  )

  const items = sellerNames
    .filter(name => validNames.has(name))
    .map(name => {
      const country = countries.find(c => c.Name === name)!
      return { label: name, value: country.EntityId }
    })
    .sort((a, b) => a.label.localeCompare(b.label))

  return items
})
