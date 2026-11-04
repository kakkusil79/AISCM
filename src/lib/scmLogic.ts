import type { KeyboardEvent } from 'react'
import { KIOSK_MODELS, SUPPLIER_MAP, checkQuantityError } from '../data/mockScmData'
import type {
  BuyerOrder,
  KioskModelId,
  MaterialItem,
  SupplierPO,
} from '../types/scm'

// 당사 정보 (주문서_01 XLSX의 공급자 항목 기준)
export const COMPANY = {
  name: '한국타피(주)',
  bizNo: '128-81-49201',
  ceo: '김대표',
  dept: '공공조달영업팀',
  phone: '031-612-8800',
  address: '경기도 화성시 동탄산단 무인민원발급기 제1공장',
}

export const NOT_STATED = '미기재'

// 주문서 비고 기준으로 입력칸에 미리 넣어 두는 제안 수량. 확정은 사람이 한다.
export const INITIAL_SUGGESTED_QTY: Record<string, string> = {
  'ORD-01': '20',
  'ORD-02': '25',
  'ORD-03': '10',
}

export interface MaterialStatus extends MaterialItem {
  requiredQty: number
  shortageQty: number
  orderCost: number
}

export interface SupplierPOView extends SupplierPO {
  signature: string
  resendNeeded: boolean // 발송 후 발주 내용이 바뀐 경우
}

export const TYPE_LABEL: Record<MaterialItem['specType'], string> = {
  '공통 부자재': '공통',
  'J 전용 (장애인용)': 'J 전용',
  '모델별 규격 부자재': '규격별',
}

// 표 행 키보드 조작: Enter/Space 선택, 위아래 화살표로 이동
export function rowKeyHandler(action: () => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const row = e.currentTarget
      const next = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling
      if (next instanceof HTMLElement) {
        next.focus()
        next.click()
      }
    }
  }
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

// 오늘부터 해당 날짜까지 남은 일수. 날짜 형식이 아니면 null.
export function daysUntil(isoDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null
  return Math.round((new Date(`${isoDate}T00:00:00`).getTime() - startOfDay(new Date())) / DAY_MS)
}

export function addDaysIso(days: number): string {
  return new Date(startOfDay(new Date()) + days * DAY_MS).toLocaleDateString('sv-SE')
}

// 이 부자재들을 쓰는 확정 주문 중 가장 빠른 고객 납기
export function earliestDueFor(orders: BuyerOrder[], materialIds: string[]): string | null {
  const dues = orders
    .filter(
      (o) =>
        o.confirmed &&
        daysUntil(o.dueDate) !== null &&
        findModel(o.modelId)?.bom.some((b) => materialIds.includes(b.materialId))
    )
    .map((o) => o.dueDate)
    .sort()
  return dues[0] ?? null
}

export function downloadCsv(fileName: string, rows: (string | number)[][]): void {
  const text = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function formatWon(won: number): string {
  return `${won.toLocaleString()}원`
}

export function todayIso(): string {
  return new Date().toLocaleDateString('sv-SE')
}

export function findModel(id: KioskModelId) {
  return KIOSK_MODELS.find((m) => m.id === id)
}

export function orderAmount(order: BuyerOrder): number {
  return order.quantity * (findModel(order.modelId)?.unitPrice ?? 0)
}

export function computeMaterialStatus(
  orders: BuyerOrder[],
  materials: MaterialItem[]
): MaterialStatus[] {
  const confirmed = orders.filter((o) => o.confirmed && o.quantity > 0)
  return materials.map((mat) => {
    const requiredQty = confirmed.reduce((sum, order) => {
      const item = findModel(order.modelId)?.bom.find((b) => b.materialId === mat.id)
      return sum + order.quantity * (item?.qtyPerUnit ?? 0)
    }, 0)
    const shortageQty = Math.max(0, requiredQty - mat.stock)
    return { ...mat, requiredQty, shortageQty, orderCost: shortageQty * mat.unitCost }
  })
}

// 확인·발송 기록은 발주 내용(signature)에 묶는다. 수량이 바뀌면 자동으로 다시 확인해야 한다.
export function buildSupplierPOs(
  materials: MaterialStatus[],
  confirmedBy: Record<string, string>,
  sentBy: Record<string, string>
): SupplierPOView[] {
  const supplierNames = Object.keys(SUPPLIER_MAP)
  return supplierNames.flatMap((name, index) => {
    const short = materials.filter((m) => m.supplierName === name && m.shortageQty > 0)
    if (short.length === 0) return []
    const signature = short.map((m) => `${m.id}:${m.shortageQty}`).join('|')
    return [
      {
        poNo: `PO-202611-${String(index + 1).padStart(3, '0')}`,
        supplierName: name,
        supplierEmail: SUPPLIER_MAP[name].email,
        supplierInfo: SUPPLIER_MAP[name],
        items: short.map((m) => ({
          materialId: m.id,
          materialCode: m.code,
          materialName: m.name,
          specType: m.specType,
          unitCost: m.unitCost,
          requiredQty: m.requiredQty,
          currentStock: m.stock,
          orderQty: m.shortageQty,
          subTotalCost: m.orderCost,
        })),
        totalOrderCost: short.reduce((sum, m) => sum + m.orderCost, 0),
        humanConfirmed: confirmedBy[name] === signature,
        mailSent: sentBy[name] === signature,
        resendNeeded: sentBy[name] !== undefined && sentBy[name] !== signature,
        signature,
      },
    ]
  })
}

export function sourceName(order: BuyerOrder): string {
  if (order.sourceFileName) return order.sourceFileName
  if (order.downloadUrl) return fileNameFromUrl(order.downloadUrl)
  return ''
}

export function fileNameFromUrl(url: string): string {
  return decodeURI(url.split('/').pop() ?? '')
}

export function fileStem(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

const FORMAT_BY_EXTENSION: Record<string, BuyerOrder['fileFormat']> = {
  xlsx: 'XLSX',
  xls: 'XLSX',
  pdf: 'PDF',
  csv: 'CSV',
  json: 'JSON',
  html: 'HTML',
  htm: 'HTML',
  txt: 'TXT',
}

export function formatFromFileName(name: string): BuyerOrder['fileFormat'] {
  return FORMAT_BY_EXTENSION[name.split('.').pop()?.toLowerCase() ?? '']
}

// 업로드 파일은 파일명에서만 값을 읽는다. 없는 값은 지어내지 않고 사람이 확인하도록 넘긴다.
export function parseOrderFileName(
  name: string
): { modelId: KioskModelId; buyerName: string; quantity: number | null } | null {
  const stem = fileStem(name)
  const model = stem.match(/TAPI-?(9270|9320)([JT])/i)
  if (!model) return null
  const parts = stem.split(/[_\s]+/)
  const buyerName =
    parts.find(
      (p) => p !== '주문서' && !/^\d+$/.test(p) && !/^TAPI/i.test(p) && !/^-?\d/.test(p)
    ) ?? NOT_STATED
  const qty = stem.match(/(-?\d[\d,]*)\s*대/)
  return {
    modelId: `TAPI-${model[1]}${model[2].toUpperCase()}` as KioskModelId,
    buyerName,
    quantity: qty ? Number(qty[1].replaceAll(',', '')) : null,
  }
}

export function nextOrderNumber(orders: BuyerOrder[]): number {
  return orders.reduce((max, o) => Math.max(max, Number(o.id.replace('ORD-', '')) || 0), 0) + 1
}

export function createOrder(params: {
  number: number
  buyerName: string
  modelId: KioskModelId
  quantity: number | null
  dueDate?: string
  docMemo: string
  fileFormat?: BuyerOrder['fileFormat']
  downloadUrl?: string
  sourceFileName?: string
}): BuyerOrder {
  const quantity = params.quantity ?? 0
  // 파일명만 읽어 등록한 주문은 수량이 정상 범위여도 원본과 대조하기 전에는 확정하지 않는다
  const errorMsg =
    params.quantity === null
      ? '수량 미확인: 파일명에서 수량을 찾지 못했습니다. 원본을 보고 입력해 주세요.'
      : (checkQuantityError(quantity) ??
        (params.sourceFileName ? '파일명에서 읽은 수량입니다. 원본과 대조한 뒤 확정해 주세요.' : undefined))
  return {
    id: `ORD-${String(params.number).padStart(2, '0')}`,
    docNo: NOT_STATED,
    orderDate: todayIso(),
    buyerName: params.buyerName,
    buyerBizNo: NOT_STATED,
    buyerCeo: NOT_STATED,
    buyerManager: NOT_STATED,
    buyerPhone: NOT_STATED,
    deliveryPlace: NOT_STATED,
    modelId: params.modelId,
    rawQuantity: quantity,
    quantity,
    dueDate: params.dueDate || NOT_STATED,
    docMemo: params.docMemo,
    fileFormat: params.fileFormat,
    downloadUrl: params.downloadUrl,
    sourceFileName: params.sourceFileName,
    errorMsg,
    confirmed: !errorMsg,
  }
}

export function buildPoMailto(po: SupplierPOView): string {
  const lines = [
    `${po.supplierInfo.name} ${po.supplierInfo.contactName} 귀하`,
    '',
    `${COMPANY.name} ${COMPANY.dept}입니다. 아래와 같이 부자재를 발주합니다.`,
    `발주번호: ${po.poNo}`,
    '',
    ...po.items.map(
      (i, n) =>
        `${n + 1}. ${i.materialName} / ${i.orderQty.toLocaleString()}개 / 단가 ${formatWon(i.unitCost)} / ${formatWon(i.subTotalCost)}`
    ),
    '',
    `공급가액 합계: ${formatWon(po.totalOrderCost)} (부가세 별도)`,
    `납품처: ${COMPANY.address}`,
    `연락처: ${COMPANY.phone}`,
  ]
  const subject = `[발주] ${COMPANY.name} ${po.poNo}`
  return `mailto:${po.supplierEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}
