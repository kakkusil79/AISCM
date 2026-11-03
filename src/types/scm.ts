export type KioskModelId = 'KSK-15' | 'KSK-21' | 'KSK-27' | 'KSK-32'

export interface KioskModel {
  id: KioskModelId
  name: string
  bom: {
    materialId: string
    qtyPerUnit: number
  }[]
}

export interface MaterialItem {
  id: string
  name: string
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
  errorMsg?: string // 수량 오류 등 이상 감지 메시지
  confirmed: boolean // 1차 사람 확인 여부
}

export interface SupplierPO {
  supplierName: string
  supplierEmail: string
  items: {
    materialId: string
    materialName: string
    requiredQty: number
    currentStock: number
    orderQty: number // 부족 수량 (= 발주 수량)
  }[]
  humanConfirmed: boolean // 2차 사람 확인 여부 (메일 발송 전)
  mailSent: boolean       // 최종 메일 발송 여부
}
