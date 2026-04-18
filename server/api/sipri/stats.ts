export default defineEventHandler(async () => {
  const [countries, categories] = await Promise.all([
    getAllCountriesTrimmed(),
    getAllArmamentCategories()
  ])
  return {
    countries: countries.length,
    categories: categories.length
  }
})
