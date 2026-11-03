export type KioskModelId = 'KSK-15' | 'KSK-21' | 'KSK-27' | 'KSK-32'

export interface KioskModel {
  id: KioskModelId
  name: string
  unitPrice: number // 모델 개당 단가 (4,000,000원)
  bom: {
    materialId: string
    qtyPerUnit: number
  }[]
}

export interface MaterialItem {
  id: string
  name: string
  specType: '공통 부자재' | '모델별 규격 부자재'
  unitCost: number // 부자재 개당 단가
  stock: number
  supplierName: string
  supplierEmail: string
}

export interface BuyerOrder {
  id: string
  buyerName: string
  modelId: KioskModelId
  quantity: number
  dueDate: string
  errorMsg?: string
  confirmed: boolean // 1차 사람 확인 여부
}

export interface SupplierPO {
  supplierName: string
  supplierEmail: string
  items: {
    materialId: string
    materialName: string
    unitCost: number
    requiredQty: number
    currentStock: number
    orderQty: number
    subTotalCost: number
  }[]
  totalOrderCost: number
  humanConfirmed: boolean // 2차 사람 확인 여부 (메일 발송 전)
  mailSent: boolean
}
