import { useState } from 'react'
import { ArrowRight, Download, TriangleAlert } from 'lucide-react'
import { KIOSK_MODELS } from '../data/mockScmData'
import { TYPE_LABEL, downloadCsv, rowKeyHandler, todayIso } from '../lib/scmLogic'
import type { MaterialStatus } from '../lib/scmLogic'
import type { BuyerOrder, KioskModelId } from '../types/scm'
import { PageHeader } from './ui'

function coverage(m: MaterialStatus): number {
  return m.requiredQty === 0 ? 100 : Math.min(100, Math.round((m.stock / m.requiredQty) * 100))
}

export function MaterialsTab({
  orders,
  materials,
  onNext,
}: {
  orders: BuyerOrder[]
  materials: MaterialStatus[]
  onNext: () => void
}) {
  const [modelFilter, setModelFilter] = useState<KioskModelId | null>(null)
  const [shortOnly, setShortOnly] = useState(false)
  const [byAmount, setByAmount] = useState(true)

  const pending = orders.filter((o) => !o.confirmed).length
  const confirmed = orders.filter((o) => o.confirmed && o.quantity > 0)
  const modelRows = KIOSK_MODELS.map((m) => {
    const units = confirmed.filter((o) => o.modelId === m.id).reduce((s, o) => s + o.quantity, 0)
    return { ...m, units, amount: units * m.unitPrice }
  })
  const totalUnits = modelRows.reduce((s, m) => s + m.units, 0)
  const totalAmount = modelRows.reduce((s, m) => s + m.amount, 0)

  const selectedModel = KIOSK_MODELS.find((m) => m.id === modelFilter)
  const filtered = materials.filter(
    (m) =>
      (!selectedModel || selectedModel.bom.some((b) => b.materialId === m.id)) &&
      (!shortOnly || m.shortageQty > 0)
  )
  const visible = byAmount ? [...filtered].sort((a, b) => b.orderCost - a.orderCost) : filtered
  const shortage = materials.filter((m) => m.shortageQty > 0)
  const orderTotal = shortage.reduce((s, m) => s + m.orderCost, 0)

  const exportCsv = () =>
    downloadCsv(`부자재_소요량_${todayIso()}.csv`, [
      ['구분', '코드', '부자재', '사양', '발주처', '단가', '소요량', '재고', '충당률(%)', '발주 수량', '발주 금액'],
      ...visible.map((m) => [
        TYPE_LABEL[m.specType],
        m.code,
        m.name,
        m.spec,
        m.supplierName,
        m.unitCost,
        m.requiredQty,
        m.stock,
        coverage(m),
        m.shortageQty,
        m.orderCost,
      ]),
    ])

  return (
    <div className="page">
      <PageHeader
        title="소요량·재고"
        desc={
          pending > 0
            ? `확인 대기 주문 ${pending}건은 계산에서 제외되어 있습니다.`
            : '확정 주문 기준으로 부족한 부자재를 계산했습니다.'
        }
        descTone={pending > 0 ? 'red' : undefined}
        kpis={[
          { label: '확정 수량', value: totalUnits.toLocaleString(), unit: '대' },
          { label: '부족 부자재', value: String(shortage.length), unit: '종', tone: shortage.length > 0 ? 'red' : 'green' },
          { label: '발주 공급가액', value: orderTotal.toLocaleString(), unit: '원' },
        ]}
        action={
          <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
            다음: 발주서
            <ArrowRight />
          </button>
        }
      />

      <div className="split" style={{ '--split': 'minmax(300px, 330px) minmax(0, 1fr)' } as React.CSSProperties}>
        <section className="panel">
          <div className="panel-head">모델별 확정 수량</div>
          <div className="panel-body">
            <table className="tbl">
              <thead>
                <tr>
                  <th>모델</th>
                  <th className="num">확정</th>
                  <th className="num">공급가액</th>
                </tr>
              </thead>
              <tbody>
                {modelRows.map((m) => (
                  <tr
                    key={m.id}
                    tabIndex={0}
                    aria-selected={modelFilter === m.id}
                    className={`row-click ${modelFilter === m.id ? 'row-selected' : ''}`}
                    onClick={() => setModelFilter(modelFilter === m.id ? null : m.id)}
                    onKeyDown={rowKeyHandler(() => setModelFilter(modelFilter === m.id ? null : m.id))}
                  >
                    <td className="wrap">
                      <div className="c-key">{m.id}</div>
                      <div className="c-faint">{m.name}</div>
                    </td>
                    <td className="num c-hero">{m.units.toLocaleString()}</td>
                    <td className="num c-dim">{m.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>합계</td>
                  <td className="num">{totalUnits.toLocaleString()}</td>
                  <td className="num">{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            <p className="t-7 px-2.5 py-2 m-0">모델을 누르면 그 모델에 쓰는 부자재만 표시합니다.</p>
          </div>
          <div className="p-2 space-y-2 flex-none border-t border-[var(--line)]">
            {pending > 0 && (
              <div className="callout callout-red">
                <TriangleAlert className="inline w-3.5 h-3.5 mr-1 align-[-2px]" />
                미확정 {pending}건이 확정되면 소요량이 늘어납니다.
              </div>
            )}
            <div className="callout callout-amber">재고는 주문서에 없는 데모 가정값입니다. 실제 재고로 교체해야 합니다.</div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <span>부자재 소요량 및 재고 대조</span>
            <span className="t-6 font-normal">
              {selectedModel ? `${selectedModel.id} 사용 ` : '전체 '}
              {visible.length}종
            </span>
            <span className="flex-1" />
            <label className="t-6 inline-flex items-center gap-1.5 font-normal cursor-pointer">
              <input type="checkbox" checked={byAmount} onChange={(e) => setByAmount(e.target.checked)} />
              발주 금액순
            </label>
            <label className="t-6 inline-flex items-center gap-1.5 font-normal cursor-pointer">
              <input type="checkbox" checked={shortOnly} onChange={(e) => setShortOnly(e.target.checked)} />
              부족 품목만
            </label>
            <button type="button" className="btn" onClick={exportCsv}>
              <Download />
              CSV
            </button>
          </div>
          <div className="panel-body">
            <table className="tbl">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>부자재</th>
                  <th>사양</th>
                  <th>발주처</th>
                  <th className="num">단가</th>
                  <th className="num">소요량</th>
                  <th className="num">재고</th>
                  <th className="num">충당률</th>
                  <th className="num">발주 수량</th>
                  <th className="num">발주 금액</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => {
                  const rate = coverage(m)
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className={`tag ${m.specType === '공통 부자재' ? 'tag-gray' : 'tag-blue'}`}>
                          {TYPE_LABEL[m.specType]}
                        </span>
                      </td>
                      <td className="c-key">{m.name}</td>
                      <td className="c-faint max-w-40 truncate" title={m.spec}>
                        {m.spec}
                      </td>
                      <td className="c-dim">{m.supplierName}</td>
                      <td className="num c-dim">{m.unitCost.toLocaleString()}</td>
                      <td className="num">{m.requiredQty.toLocaleString()}</td>
                      <td className="num">{m.stock.toLocaleString()}</td>
                      <td className={`num c-dim ${rate < 50 ? 'text-[var(--red)]! font-semibold' : ''}`}>{rate}%</td>
                      <td className={`num ${m.shortageQty > 0 ? 'c-hero text-[var(--red)]' : 'c-dim'}`}>
                        {m.shortageQty > 0 ? m.shortageQty.toLocaleString() : '-'}
                      </td>
                      <td className={`num ${m.shortageQty > 0 ? 'font-bold' : 'c-dim'}`}>
                        {m.shortageQty > 0 ? m.orderCost.toLocaleString() : '-'}
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={10} className="center py-6! text-[var(--muted)]">
                      표시할 부족 품목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
