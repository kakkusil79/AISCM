import type { BuyerOrder, KioskModel, MaterialItem } from '../types/scm'

// 1. 키오스크 모델 4종 및 각 모델별 BOM
export const KIOSK_MODELS: KioskModel[] = [
  {
    id: 'KSK-15',
    name: '15인치 미니 키오스크',
    bom: [
      { materialId: 'MAT-PANEL-15', qtyPerUnit: 1 },
      { materialId: 'MAT-BOARD-STD', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-MINI', qtyPerUnit: 1 },
    ],
  },
  {
    id: 'KSK-21',
    name: '21인치 표준 키오스크',
    bom: [
      { materialId: 'MAT-PANEL-21', qtyPerUnit: 1 },
      { materialId: 'MAT-BOARD-STD', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-STD', qtyPerUnit: 1 },
    ],
  },
  {
    id: 'KSK-27',
    name: '27인치 프리미엄 키오스크',
    bom: [
      { materialId: 'MAT-PANEL-27', qtyPerUnit: 1 },
      { materialId: 'MAT-BOARD-PRO', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 2 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-STD', qtyPerUnit: 1 },
    ],
  },
  {
    id: 'KSK-32',
    name: '32인치 아웃도어 키오스크',
    bom: [
      { materialId: 'MAT-PANEL-32', qtyPerUnit: 1 },
      { materialId: 'MAT-BOARD-PRO', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-OUT', qtyPerUnit: 1 },
    ],
  },
]

// 2. 부자재 재고 및 지정 발주처
export const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: 'MAT-PANEL-15',
    name: '15인치 터치패널',
    stock: 20,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-PANEL-21',
    name: '21인치 터치패널',
    stock: 25,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-PANEL-27',
    name: '27인치 터치패널',
    stock: 15,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-PANEL-32',
    name: '32인치 방수 터치패널',
    stock: 5,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-BOARD-STD',
    name: '표준 메인보드',
    stock: 40,
    supplierName: '코리아임베디드',
    supplierEmail: 'sales@korea-embedded.kr',
  },
  {
    id: 'MAT-BOARD-PRO',
    name: '고성능 메인보드',
    stock: 15,
    supplierName: '코리아임베디드',
    supplierEmail: 'sales@korea-embedded.kr',
  },
  {
    id: 'MAT-READER',
    name: '카드 결제 리더기',
    stock: 50,
    supplierName: '페이먼트테크',
    supplierEmail: 'po@payment-tech.co.kr',
  },
  {
    id: 'MAT-PRINTER',
    name: '영수증 프린터 모듈',
    stock: 45,
    supplierName: '페이먼트테크',
    supplierEmail: 'po@payment-tech.co.kr',
  },
  {
    id: 'MAT-CASE-MINI',
    name: '미니 데스크 외함',
    stock: 15,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },
  {
    id: 'MAT-CASE-STD',
    name: '스탠드형 표준 외함',
    stock: 30,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },
  {
    id: 'MAT-CASE-OUT',
    name: '방수 아웃도어 외함',
    stock: 4,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },
]

// 수량 오류 체크 함수 (너무 적거나, 음수/소수점, 너무 큰 이상한 숫자)
export function checkQuantityError(qty: number): string | undefined {
  if (!Number.isFinite(qty) || qty <= 0) {
    return `잘못된 숫자(${qty}대): 0 이하 음수입니다.`
  }
  if (!Number.isInteger(qty)) {
    return `잘못된 숫자(${qty}대): 소수점 수량입니다.`
  }
  if (qty < 5) {
    return `수량 과소(${qty}대): 최소 주문 기준(5대)보다 너무 적습니다.`
  }
  if (qty > 200) {
    return `이상 수량(${qty}대): 단일 주문 상한(200대)을 초과한 오타 의심 숫자입니다.`
  }
  return undefined
}

// 3. 바이어 주문서 초기 데이터
export const INITIAL_ORDERS: BuyerOrder[] = [
  {
    id: 'ORD-01',
    buyerName: '메가커피 본사',
    modelId: 'KSK-21',
    quantity: 1,
    dueDate: '2026-11-20',
    errorMsg: '수량 과소(1대): 최소 주문 기준(5대)보다 너무 적습니다.',
    confirmed: false,
  },
  {
    id: 'ORD-02',
    buyerName: '버거킹덤 코리아',
    modelId: 'KSK-27',
    quantity: 2500,
    dueDate: '2026-11-22',
    errorMsg: '이상 수량(2500대): 단일 주문 상한(200대)을 초과한 오타 의심 숫자입니다.',
    confirmed: false,
  },
  {
    id: 'ORD-03',
    buyerName: '스타파킹 모빌리티',
    modelId: 'KSK-32',
    quantity: -10,
    dueDate: '2026-11-25',
    errorMsg: '잘못된 숫자(-10대): 0 이하 음수입니다.',
    confirmed: false,
  },
  {
    id: 'ORD-04',
    buyerName: '올리브마켓 리테일',
    modelId: 'KSK-21',
    quantity: 30,
    dueDate: '2026-11-18',
    confirmed: true,
  },
  {
    id: 'ORD-05',
    buyerName: '청담다이닝 그룹',
    modelId: 'KSK-15',
    quantity: 25,
    dueDate: '2026-11-19',
    confirmed: true,
  },
]
