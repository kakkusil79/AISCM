import { useState } from 'react'
import { Check, Mail, Printer } from 'lucide-react'
import {
  COMPANY,
  addDaysIso,
  buildPoMailto,
  daysUntil,
  earliestDueFor,
  rowKeyHandler,
  todayIso,
} from '../lib/scmLogic'
import type { SupplierPOView } from '../lib/scmLogic'
import type { BuyerOrder } from '../types/scm'
import { Fields, PageHeader } from './ui'

function PoStatusTag({ po }: { po: SupplierPOView }) {
  if (po.mailSent) return <span className="tag tag-green">발송 완료</span>
  if (po.resendNeeded) return <span className="tag tag-red">내용 변경·재발송</span>
  if (po.humanConfirmed) return <span className="tag tag-blue">확인 완료</span>
  return <span className="tag tag-amber">확인 대기</span>
}

// 납기 여유 = 가장 빠른 고객 납기 - 입고 예정일
function deliveryPlan(po: SupplierPOView, orders: BuyerOrder[]) {
  const arrival = addDaysIso(po.supplierInfo.leadTimeDays)
  const due = earliestDueFor(orders, po.items.map((i) => i.materialId))
  const dueDays = due ? daysUntil(due) : null
  const margin = dueDays === null ? null : dueDays - po.supplierInfo.leadTimeDays
  return { arrival, due, margin }
}

function MarginTag({ margin }: { margin: number | null }) {
  if (margin === null) return <span className="c-dim">-</span>
  const tone = margin < 0 ? 'tag-red' : margin <= 3 ? 'tag-amber' : 'tag-gray'
  return <span className={`tag ${tone}`}>{margin < 0 ? `${-margin}일 지연` : `${margin}일`}</span>
}

export function PurchaseTab({
  pos,
  orders,
  onToggleConfirm,
  onMarkSent,
}: {
  pos: SupplierPOView[]
  orders: BuyerOrder[]
  onToggleConfirm: (po: SupplierPOView) => void
  onMarkSent: (po: SupplierPOView) => void
}) {
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const sorted = [...pos].sort((a, b) => b.totalOrderCost - a.totalOrderCost)
  const selected = sorted.find((p) => p.supplierName === selectedName) ?? sorted[0]
  const total = pos.reduce((s, p) => s + p.totalOrderCost, 0)
  const sent = pos.filter((p) => p.mailSent).length
  const pendingConfirm = pos.filter((p) => !p.humanConfirmed && !p.mailSent).length
  const late = pos.filter((p) => (deliveryPlan(p, orders).margin ?? 0) < 0).length

  return (
    <div className="page">
      <PageHeader
        title="발주서"
        desc={
          pos.length === 0
            ? '재고로 충당되어 발주할 부자재가 없습니다.'
            : sent === pos.length
              ? '모든 발주서를 발송 완료로 기록했습니다.'
              : `발주서 ${pendingConfirm}건의 수량과 금액을 확인한 뒤 발송하세요.`
        }
        descTone={pos.length > 0 && sent === pos.length ? 'green' : undefined}
        kpis={[
          { label: '발송', value: `${sent}/${pos.length}`, unit: '곳', tone: pos.length > 0 && sent === pos.length ? 'green' : undefined },
          { label: '납기 지연 위험', value: String(late), unit: '곳', tone: late > 0 ? 'red' : undefined },
          { label: '발주 공급가액', value: total.toLocaleString(), unit: '원' },
        ]}
      />

      {selected ? (
        <div className="split" style={{ '--split': 'minmax(430px, 480px) minmax(0, 1fr)' } as React.CSSProperties}>
          <section className="panel">
            <div className="panel-head">
              <span>발주처별 발주서</span>
              <span className="t-6 font-normal">{pos.length}곳 · 금액순</span>
            </div>
            <div className="panel-body">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>발주처</th>
                    <th className="num">품목</th>
                    <th className="num">공급가액</th>
                    <th className="center">납기 여유</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr
                      key={p.supplierName}
                      tabIndex={0}
                      aria-selected={p === selected}
                      className={`row-click ${p === selected ? 'row-selected' : ''}`}
                      onClick={() => setSelectedName(p.supplierName)}
                      onKeyDown={rowKeyHandler(() => setSelectedName(p.supplierName))}
                    >
                      <td className="c-key">{p.supplierName}</td>
                      <td className="num c-dim">{p.items.length}</td>
                      <td className="num font-bold">{p.totalOrderCost.toLocaleString()}</td>
                      <td className="center">
                        <MarginTag margin={deliveryPlan(p, orders).margin} />
                      </td>
                      <td>
                        <PoStatusTag po={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>합계</td>
                    <td className="num">{pos.reduce((s, p) => s + p.items.length, 0)}</td>
                    <td className="num">{total.toLocaleString()}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="t-7 m-0 px-2.5 py-1.5 flex-none border-t border-[var(--line-soft)]">
              납기 여유 = 가장 빠른 고객 납기 - 입고 예정일. 리드타임은 가상 업체 가정값입니다.
            </p>
          </section>

          <PoDocument
            key={selected.supplierName}
            po={selected}
            orders={orders}
            onToggleConfirm={onToggleConfirm}
            onMarkSent={onMarkSent}
          />
        </div>
      ) : (
        <section className="panel flex-1 items-center justify-center text-[var(--muted)]">표시할 발주서가 없습니다.</section>
      )}
    </div>
  )
}

function PoDocument({
  po,
  orders,
  onToggleConfirm,
  onMarkSent,
}: {
  po: SupplierPOView
  orders: BuyerOrder[]
  onToggleConfirm: (po: SupplierPOView) => void
  onMarkSent: (po: SupplierPOView) => void
}) {
  const vat = po.totalOrderCost * 0.1
  const info = po.supplierInfo
  const plan = deliveryPlan(po, orders)

  return (
    <section className="panel print-area">
      <div className="panel-head no-print">
        <span>발주서 미리보기</span>
        <PoStatusTag po={po} />
        <span className="flex-1" />
        <button type="button" className="btn" onClick={() => window.print()}>
          <Printer />
          인쇄 / PDF
        </button>
      </div>

      <div className="panel-body p-3 space-y-3">
        <div className="flex items-end justify-between gap-4 border-b-2 border-[var(--brand)] pb-1.5">
          <h2 className="t-2 m-0 tracking-[0.2em] text-[var(--brand)]">부자재 발주서</h2>
          <div className="t-6 text-right">
            발주번호 <strong className="text-[var(--text)]">{po.poNo}</strong> · 발행일{' '}
            <strong className="text-[var(--text)]">{todayIso()}</strong>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="t-7">수신</div>
            <div className="t-3">{info.name} 귀하</div>
          </div>
          <div className="text-right">
            <div className="t-7">합계 금액 (부가세 포함)</div>
            <div className="t-1">
              {(po.totalOrderCost + vat).toLocaleString()}
              <span className="unit">원</span>
            </div>
          </div>
        </div>

        <table className="tbl border border-[var(--line)]">
          <thead>
            <tr>
              <th className="center">No</th>
              <th>부자재</th>
              <th>코드</th>
              <th className="num">소요량</th>
              <th className="num">재고</th>
              <th className="num">발주 수량</th>
              <th className="num">단가</th>
              <th className="num">공급가액</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, i) => (
              <tr key={item.materialId}>
                <td className="center c-faint">{i + 1}</td>
                <td className="c-key">{item.materialName}</td>
                <td className="c-faint">{item.materialCode}</td>
                <td className="num c-dim">{item.requiredQty.toLocaleString()}</td>
                <td className="num c-dim">{item.currentStock.toLocaleString()}</td>
                <td className="num c-hero">{item.orderQty.toLocaleString()}</td>
                <td className="num c-dim">{item.unitCost.toLocaleString()}</td>
                <td className="num font-bold">{item.subTotalCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7}>공급가액 합계</td>
              <td className="num">{po.totalOrderCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td colSpan={7} className="font-medium! text-[12.5px]!">
                부가세 10%
              </td>
              <td className="num font-medium! text-[12.5px]!">{vat.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <h4 className="t-6 font-semibold m-0 mb-1">공급자</h4>
            <Fields
              rows={[
                ['담당자', info.contactName],
                ['이메일', po.supplierEmail],
                ['연락처', info.phone],
                ['입고 예정', `${plan.arrival} (발주 후 ${info.leadTimeDays}일)`],
                ['고객 납기', plan.due ?? '-'],
              ]}
            />
          </div>
          <div>
            <h4 className="t-6 font-semibold m-0 mb-1">발주자</h4>
            <Fields
              rows={[
                ['회사명', COMPANY.name],
                ['사업자번호', COMPANY.bizNo],
                ['대표자', COMPANY.ceo],
                ['담당 부서', `${COMPANY.dept} · ${COMPANY.phone}`],
                ['납품처', COMPANY.address],
              ]}
            />
          </div>
        </div>
      </div>

      <div className="panel-foot no-print flex-wrap">
        <label className={`t-4 inline-flex items-center gap-1.5 ${po.mailSent ? '' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            disabled={po.mailSent}
            checked={po.humanConfirmed || po.mailSent}
            onChange={() => onToggleConfirm(po)}
          />
          발주 수량과 금액을 확인했습니다
        </label>
        <span className="flex-1" />
        <span className="t-7">메일 서버 미연동: 메일 앱으로 보낸 뒤 완료 처리</span>
        {po.humanConfirmed || po.mailSent ? (
          <a className="btn" href={buildPoMailto(po)}>
            <Mail />
            메일 작성
          </a>
        ) : (
          <button type="button" className="btn" disabled>
            <Mail />
            메일 작성
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!po.humanConfirmed || po.mailSent}
          onClick={() => onMarkSent(po)}
        >
          <Check />
          {po.mailSent ? '발송 완료됨' : '발송 완료 처리'}
        </button>
      </div>
    </section>
  )
}
