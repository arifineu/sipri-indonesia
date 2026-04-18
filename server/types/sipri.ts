// SIPRI Arms Transfers Database — TypeScript types
// Reverse-engineered from atbackend.sipri.org API

// --- Search / Filter ---

export interface SearchFilter {
  field: string
  condition: string
  value1: string | number | null
  value2: string | number | null
  listData?: string[]
}

export interface SearchBody {
  filters: SearchFilter[]
  logic: 'AND' | 'OR'
}

// --- Countries ---

export interface Country {
  EntityId: number
  Name: string
  CountryCode: string
  deleted: boolean
}

// --- Armaments ---

export interface Armament {
  id: number
  designation: string
  armamentCategory: string
  armamentCategoryId: number
  subArmamentCategory: string
  subArmamentCategoryId: number
  term: string
  termId: number
  status: string
  statusId: number
  devStatus: string
  devStatusId: number
  description: string
}

// --- Trades / Transfers ---

export interface Trade {
  EntityId: number
  CreatedOn: string
  UpdatedOn: string
  deleted: boolean
  tradeId: number
  orderDate: number
  deliveryCompletionYear: number
  status1: string
  unitsOrdered: number
  externalComment?: string
  estimatedOrderDate: boolean
  estimatedOrderCount: boolean
  status2: boolean
  armamentId: number
  buyerCountryId: number
  sellerCountryId: number
  buyerCountryCode: string
  buyerCountry: string
  sellerCountryCode: string
  sellerCountry: string
  armamentProductionCountry: string
  armamentProducerCompany: string
  armamentDesignation: string
  armamentDesignation2: string
  armamentDesignation3: string
  armamentSipriEstimate: number
  armamentName: string
  armamentCategoryId: number
  armamentDescription: string
  armamentCategoryName: string
  deliveries: TradeDelivery[]
  legacySources: unknown[]
  sources: Source[]
  deleteDeliveries: unknown[]
}

export interface TradeDelivery {
  EntityId: number
  CreatedOn: string
  UpdatedOn: string
  deleted: boolean
  year: number
  units: number
  tradeId: number
}

export interface TradeSearchResult {
  id: number
  tradeId: number
  buyer: string
  seller: string
  orderYr: number
  orderYrEst: boolean
  units: number
  unitsEst: boolean
  deliveryYr: number
  status: string
  statusEst: boolean
  desg: string
  desc: string
  category: string
}

export interface Source {
  id: number
  fileName: string
  description: string
}

// --- Type Lists (Reference Data) ---

export interface ArmamentCategory {
  EntityId: number
  Name: string
  Code: string
  Type: number
}

export interface SubArmamentCategory {
  EntityId: number
  Name: string
  Code: string
  Type: number
  CategoryId: number
}

export interface TypeListEntry {
  EntityId: number
  Name: string
}

// --- CSV Export Bodies ---

export interface ExportCsvBody {
  filters: SearchFilter[]
  logic: 'AND' | 'OR'
  yearFrom: number
  yearTo: number
  isSupply: boolean
  isRecipient: boolean
  isInTiv: boolean
  isOutTiv: boolean
  isTotals: boolean
  isArmamentCategory: boolean
  isSubArmamentCategory: boolean
  isTerm: boolean
  supplierCountryIds?: number[]
  recipientCountryIds?: number[]
  armamentCategoryIds?: number[]
}

export interface TopCsvBody {
  filters: SearchFilter[]
  logic: 'AND' | 'OR'
  yearFrom: number
  yearTo: number
  topN: number
  isSupply: boolean
  isRecipient: boolean
}

export interface RegionalTivBody {
  filters: SearchFilter[]
  logic: 'AND' | 'OR'
  yearFrom: number
  yearTo: number
}
