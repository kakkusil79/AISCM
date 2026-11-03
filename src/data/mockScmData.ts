import type { BuyerOrder, KioskModel, MaterialItem } from '../types/scm'

// 1. 키오스크 모델 4종 (모든 모델 개당 단가 4,000,000원 동일)
export const KIOSK_MODELS: KioskModel[] = [
  {
    id: 'KSK-15',
    name: '15인치 카운터형 키오스크',
    unitPrice: 4000000,
    bom: [
      { materialId: 'MAT-BOARD', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-POWER', qtyPerUnit: 1 },
      { materialId: 'MAT-PANEL-15', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-15', qtyPerUnit: 1 },
    ],
  },
  {
    id: 'KSK-21',
    name: '21인치 표준 스탠드 키오스크',
    unitPrice: 4000000,
    bom: [
      { materialId: 'MAT-BOARD', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-POWER', qtyPerUnit: 1 },
      { materialId: 'MAT-PANEL-21', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-21', qtyPerUnit: 1 },
    ],
  },
  {
    id: 'KSK-27',
    name: '27인치 대화면 프리미엄 키오스크',
    unitPrice: 4000000,
    bom: [
      { materialId: 'MAT-BOARD', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-POWER', qtyPerUnit: 1 },
      { materialId: 'MAT-PANEL-27', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-27', qtyPerUnit: 1 },
    ],
  },
  {
    id: 'KSK-32',
    name: '32인치 와이드 빌트인 키오스크',
    unitPrice: 4000000,
    bom: [
      { materialId: 'MAT-BOARD', qtyPerUnit: 1 },
      { materialId: 'MAT-READER', qtyPerUnit: 1 },
      { materialId: 'MAT-PRINTER', qtyPerUnit: 1 },
      { materialId: 'MAT-POWER', qtyPerUnit: 1 },
      { materialId: 'MAT-PANEL-32', qtyPerUnit: 1 },
      { materialId: 'MAT-CASE-32', qtyPerUnit: 1 },
    ],
  },
]

// 2. 부자재 마스터 (공통 부자재 4종 단가 동일 = 225만원 / 크기·규격별 부자재 2종 = 175만원 → 모델당 총 400만원)
export const INITIAL_MATERIALS: MaterialItem[] = [
  // [공통 부자재] 4개 모델 모두 동일하게 사용되며 단가도 동일함 (소계: 2,250,000원)
  {
    id: 'MAT-BOARD',
    name: '산업용 통합 메인보드 (공용)',
    specType: '공통 부자재',
    unitCost: 850000,
    stock: 40,
    supplierName: '코리아임베디드',
    supplierEmail: 'sales@korea-embedded.kr',
  },
  {
    id: 'MAT-READER',
    name: '카드·간편결제 리더기 (공용)',
    specType: '공통 부자재',
    unitCost: 500000,
    stock: 50,
    supplierName: '페이먼트테크',
    supplierEmail: 'po@payment-tech.co.kr',
  },
  {
    id: 'MAT-PRINTER',
    name: '자동절단 영수증 프린터 (공용)',
    specType: '공통 부자재',
    unitCost: 500000,
    stock: 45,
    supplierName: '페이먼트테크',
    supplierEmail: 'po@payment-tech.co.kr',
  },
  {
    id: 'MAT-POWER',
    name: '고효율 통합 전원모듈 (공용)',
    specType: '공통 부자재',
    unitCost: 400000,
    stock: 55,
    supplierName: '코리아임베디드',
    supplierEmail: 'sales@korea-embedded.kr',
  },

  // [모델별 크기·규격 부자재] 화면 크기별 터치패널 + 외함 규격에서 단가를 맞춰 각 모델 합계 400만원 구성
  // KSK-15 전용: 패널(75만) + 전동 카운터 외함(100만) = 175만원 (+ 공통 225만 = 400만원)
  {
    id: 'MAT-PANEL-15',
    name: '15인치 정전식 터치패널',
    specType: '모델별 규격 부자재',
    unitCost: 750000,
    stock: 20,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-CASE-15',
    name: '15인치 높이조절 카운터 외함',
    specType: '모델별 규격 부자재',
    unitCost: 1000000,
    stock: 15,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },

  // KSK-21 전용: 패널(90만) + 표준 스탠드 외함(85만) = 175만원 (+ 공통 225만 = 400만원)
  {
    id: 'MAT-PANEL-21',
    name: '21인치 FHD 강화유리 터치패널',
    specType: '모델별 규격 부자재',
    unitCost: 900000,
    stock: 25,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-CASE-21',
    name: '21인치 표준 스탠드 타워 외함',
    specType: '모델별 규격 부자재',
    unitCost: 850000,
    stock: 20,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },

  // KSK-27 전용: 패널(105만) + 슬림 스탠드 외함(70만) = 175만원 (+ 공통 225만 = 400만원)
  {
    id: 'MAT-PANEL-27',
    name: '27인치 QHD 대화면 터치패널',
    specType: '모델별 규격 부자재',
    unitCost: 1050000,
    stock: 15,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-CASE-27',
    name: '27인치 슬림 스탠드·월마운트 외함',
    specType: '모델별 규격 부자재',
    unitCost: 700000,
    stock: 12,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },

  // KSK-32 전용: 패널(120만) + 빌트인 오픈프레임 외함(55만) = 175만원 (+ 공통 225만 = 400만원)
  {
    id: 'MAT-PANEL-32',
    name: '32인치 고휘도 와이드 터치패널',
    specType: '모델별 규격 부자재',
    unitCost: 1200000,
    stock: 8,
    supplierName: '한빛디스플레이',
    supplierEmail: 'order@hanbit-display.co.kr',
  },
  {
    id: 'MAT-CASE-32',
    name: '32인치 매립형 빌트인 프레임 외함',
    specType: '모델별 규격 부자재',
    unitCost: 550000,
    stock: 6,
    supplierName: '정밀메탈웍스',
    supplierEmail: 'metal@jm-metal.com',
  },
]

// 수량 오류 체크 함수
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
    errorMsg: '수량 과소(1대): 최소 기준(5대)보다 너무 적습니다.',
    confirmed: false,
  },
  {
    id: 'ORD-02',
    buyerName: '버거킹덤 코리아',
    modelId: 'KSK-27',
    quantity: 2500,
    dueDate: '2026-11-22',
    errorMsg: '이상 수량(2,500대): 오타 의심 대량 숫자입니다.',
    confirmed: false,
  },
  {
    id: 'ORD-03',
    buyerName: '스타파킹 모빌리티',
    modelId: 'KSK-32',
    quantity: -10,
    dueDate: '2026-11-25',
    errorMsg: '잘못된 숫자(-10대): 음수가 입력되었습니다.',
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
