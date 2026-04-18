import type {
  Armament,
  ArmamentCategory,
  Country,
  ExportCsvBody,
  RegionalTivBody,
  SearchFilter,
  SubArmamentCategory,
  TopCsvBody,
  Trade,
  TradeSearchResult,
  TypeListEntry
} from '../types/sipri'

const BASE_URL = 'https://atbackend.sipri.org/api/p'

async function sipriFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`
  return $fetch<T>(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    ...init
  })
}

// --- Countries ---

export async function getAllCountriesTrimmed(): Promise<Country[]> {
  return sipriFetch<Country[]>('/countries/getAllCountriesTrimmed')
}

export async function getCountryById(countryId: number): Promise<Country> {
  return sipriFetch<Country>(`/countries/getById?countryId=${countryId}`)
}

// --- Armaments ---

export async function getArmamentById(armamentId: number): Promise<Armament> {
  return sipriFetch<Armament>(`/armaments/getById?armamentId=${armamentId}`)
}

// --- Trades / Transfers ---

export async function getTradeById(tradeId: number): Promise<Trade> {
  return sipriFetch<Trade>(`/trades/getById?tradeId=${tradeId}`)
}

export async function searchTrades(
  filters: SearchFilter[],
  logic: 'AND' | 'OR' = 'AND',
  pageNo: number = 0,
  pageSize: number = 100,
  sorts: Record<string, string> = {}
): Promise<TradeSearchResult[]> {
  return sipriFetch<TradeSearchResult[]>('/trades/search', {
    method: 'POST',
    body: { filters, logic, pageNo, pageSize, sorts }
  })
}

export async function searchTradesCount(
  filters: SearchFilter[],
  logic: 'AND' | 'OR' = 'AND'
): Promise<number> {
  const url = `${BASE_URL}/trades/search/count`
  const res = await $fetch<string>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: { filters, logic }
  })
  return Number(res)
}

export async function exportCsv(body: ExportCsvBody): Promise<Blob> {
  return sipriFetch<Blob>('/trades/import-export-csv/', {
    method: 'POST',
    body
  })
}

export async function exportTopCsv(body: TopCsvBody): Promise<Blob> {
  return sipriFetch<Blob>('/trades/import-export-top-csv/', {
    method: 'POST',
    body
  })
}

export async function exportRegionalTivCsv(body: RegionalTivBody): Promise<Blob> {
  return sipriFetch<Blob>('/trades/regional-tiv-csv/', {
    method: 'POST',
    body
  })
}

// --- Type Lists (Reference Data) ---

export async function getAllArmamentCategories(): Promise<ArmamentCategory[]> {
  return sipriFetch<ArmamentCategory[]>('/typelists/getAllArmamentCategories')
}

export async function getAllSubArmamentCategories(): Promise<SubArmamentCategory[]> {
  return sipriFetch<SubArmamentCategory[]>('/typelists/getAllSubArmamentCategories')
}

export async function getAllTerms(): Promise<TypeListEntry[]> {
  return sipriFetch<TypeListEntry[]>('/typelists/getAllTerms')
}

export async function getAllTermsQuick(): Promise<TypeListEntry[]> {
  return sipriFetch<TypeListEntry[]>('/typelists/getAllTermsQuick')
}

export async function getAllStatuses(): Promise<TypeListEntry[]> {
  return sipriFetch<TypeListEntry[]>('/typelists/getAllStatuses')
}

export async function getAllDevStatuses(): Promise<TypeListEntry[]> {
  return sipriFetch<TypeListEntry[]>('/typelists/getAllDevStatuses')
}
