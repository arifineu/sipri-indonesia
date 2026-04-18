export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = String(query.q || '').trim()
  if (!search) return null

  try {
    const res = await $fetch<any>(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&srnamespace=0&srlimit=1&format=json`
    )
    const title = res?.query?.search?.[0]?.title
    if (!title) return null

    const summary: any = await $fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    )

    return {
      title: summary?.title || '',
      extract: summary?.extract || '',
      url: summary?.content_urls?.desktop?.page || ''
    }
  }
  catch {
    return null
  }
})
