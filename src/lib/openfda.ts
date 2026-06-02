const OPENFDA_BASE = 'https://api.fda.gov/drug'
const API_KEY = process.env.OPENFDA_API_KEY

function withKey(url: string) {
  return API_KEY ? `${url}&api_key=${API_KEY}` : url
}

export interface OpenFDADrug {
  brand_name: string[]
  generic_name: string[]
  product_type: string[]
  route: string[]
  substance_name: string[]
  pharm_class_epc?: string[]
}

export async function searchDrugs(query: string, limit = 10) {
  const url = withKey(
    `${OPENFDA_BASE}/ndc.json?search=brand_name:"${encodeURIComponent(query)}"+generic_name:"${encodeURIComponent(query)}"&limit=${limit}`
  )
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []) as OpenFDADrug[]
}

export async function getDrugInfo(genericName: string) {
  const url = withKey(
    `${OPENFDA_BASE}/label.json?search=openfda.generic_name:"${encodeURIComponent(genericName)}"&limit=1`
  )
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0] ?? null
}
