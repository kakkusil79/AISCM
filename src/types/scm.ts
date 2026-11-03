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
  code: string
  name: string
  specType: '공통 부자재' | '모델별 규격 부자재'
  unitCost: number // 부자재 개당 단가
  stock: number
  supplierName: string
  supplierEmail: string
}

export interface SupplierInfo {
  name: string
  bizNo: string
  ceo: string
  contactName: string
  phone: string
  email: string
  address: string
  leadTimeDays: number
}

export interface BuyerOrder {
  id: string
  docNo: string
  orderDate: string
  buyerName: string
  buyerBizNo: string
  buyerCeo: string
  buyerManager: string
  buyerPhone: string
  deliveryPlace: string
  modelId: KioskModelId
  rawQuantity: number // 원본 주문서에 적힌 수량
  quantity: number    // 현재 적용(또는 정정된) 수량
  dueDate: string
  docMemo: string     // 주문서 원문에 적힌 특이사항/비고 (사람이 오류를 판단하는 근거)
  errorMsg?: string
  confirmed: boolean  // 1차 사람 확인 여부
}

export interface SupplierPO {
  poNo: string
  supplierName: string
  supplierEmail: string
  supplierInfo: SupplierInfo
  items: {
    materialId: string
    materialCode: string
    materialName: string
    specType: '공통 부자재' | '모델별 규격 부자재'
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
