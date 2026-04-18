export default defineEventHandler(async () => {
  const [categories, subCategories] = await Promise.all([
    getAllArmamentCategories(),
    getAllSubArmamentCategories()
  ])
  return { categories, subCategories }
})
