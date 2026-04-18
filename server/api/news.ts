export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = String(query.q || '').trim()
  if (!search) return []

  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(search)}&hl=en-US&gl=US&ceid=US:en`

  try {
    const xml = await $fetch<string>(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    })

    const items: { title: string; link: string; pubDate: string; source: string }[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
      const item = match[1]
      const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
        || item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || ''
      const link = item.match(/<link\/?>\s*([\s\S]*?)<\/link>/)?.[1]?.trim()
        || item.match(/<link[^>]*href="([^"]*)"/)?.[1] || ''
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || ''
      const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || ''
      if (title) {
        items.push({
          title: decodeHTMLEntities(title),
          link,
          pubDate,
          source
        })
      }
    }
    return items
  }
  catch {
    return []
  }
})

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
