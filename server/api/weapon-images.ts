export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = String(query.q || '').trim()
  if (!search) return { main: null, gallery: [] }

  try {
    // Step 1: Search Wikipedia for the article
    const searchRes = await $fetch<any>(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&srnamespace=0&srlimit=1&format=json`
    )
    const results = searchRes?.query?.search
    if (!results?.length) return { main: null, gallery: [] }

    const title = results[0].title

    // Step 2: Get the page summary for main image
    const summary: any = await $fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    )

    const mainUrl = summary?.originalimage?.source || summary?.thumbnail?.source || null

    // Step 3: Get images from the article page
    const imagesRes: any = await $fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=6&format=json`
    )

    const pages = imagesRes?.query?.pages || {}
    const page = Object.values(pages)[0] as any
    const imageFiles = ((page?.images || []) as { title: string }[])
      .filter((img) => {
        const t = img.title.toLowerCase()
        return (t.endsWith('.jpg') || t.endsWith('.png') || t.endsWith('.jpeg'))
          && !t.includes('flag') && !t.includes('icon') && !t.includes('logo')
          && !t.includes('symbol') && !t.includes('coat_of_arms')
      })
      .slice(0, 6)

    // Step 4: Get URLs for each image
    const gallery: { url: string; title: string }[] = []
    if (imageFiles.length) {
      const titles = imageFiles.map(img => img.title).join('|')
      const imgRes: any = await $fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json`
      )
      const imgPages = imgRes?.query?.pages || {}
      for (const p of Object.values(imgPages) as any[]) {
        const url = p?.imageinfo?.[0]?.thumburl
        const name = String(p?.title || '').replace('File:', '').replace(/\.\w+$/, '')
        if (url) gallery.push({ url, title: name })
      }
    }

    return { main: mainUrl, gallery }
  }
  catch {
    return { main: null, gallery: [] }
  }
})
