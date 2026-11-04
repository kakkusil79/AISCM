export type KioskModelId = 'TAPI-9270J' | 'TAPI-9270T' | 'TAPI-9320J' | 'TAPI-9320T'

export interface KioskModel {
  id: KioskModelId
  name: string
  itemIdNo: string // 물품식별번호 (24292471 등)
  dimensions: string // 규격치수
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
  spec: string // 재질(모델명)/사양
  specType: '공통 부자재' | 'J 전용 (장애인용)' | '모델별 규격 부자재'
  applicableModels: string
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
  note?: string
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
  fileFormat?: 'XLSX' | 'PDF' | 'CSV' | 'JSON' | 'HTML' | 'TXT'
  downloadUrl?: string
  sourceFileName?: string // 사용자가 올린 파일의 이름 (중복 등록 방지용)
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
    specType: '공통 부자재' | 'J 전용 (장애인용)' | '모델별 규격 부자재'
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
