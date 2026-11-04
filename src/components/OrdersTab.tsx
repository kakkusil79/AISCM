import { useRef, useState } from 'react'
import { ArrowRight, Check, Plus, Upload } from 'lucide-react'
import { INITIAL_MATERIALS, KIOSK_MODELS } from '../data/mockScmData'
import { findModel, formatWon, orderAmount, rowKeyHandler, sourceName, todayIso } from '../lib/scmLogic'
import type { BuyerOrder, KioskModelId } from '../types/scm'
import { DocumentPreview, DueDay, Fields, OrderStatusTag, PageHeader, SubTabs } from './ui'

type DetailTab = 'INFO' | 'SOURCE' | 'BOM'

interface OrdersTabProps {
  orders: BuyerOrder[]
  selectedId: string
  onSelect: (id: string) => void
  editQty: Record<string, string>
  onEditQty: (id: string, value: string) => void
  onConfirm: (id: string) => string | undefined
  onReopen: (id: string) => void
  onFiles: (files: FileList) => void
  onManualAdd: (input: { buyerName: string; modelId: KioskModelId; quantity: number; dueDate: string }) => void
  onNext: () => void
}

export function OrdersTab(props: OrdersTabProps) {
  const { orders, selectedId, onSelect, onFiles, onManualAdd, onNext } = props
  const [detailTab, setDetailTab] = useState<DetailTab>('INFO')
  const [showForm, setShowForm] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const selected = orders.find((o) => o.id === selectedId) ?? orders[0]
  const pending = orders.filter((o) => !o.confirmed).length
  const confirmed = orders.filter((o) => o.confirmed)
  const confirmedUnits = confirmed.reduce((s, o) => s + o.quantity, 0)
  const confirmedAmount = confirmed.reduce((s, o) => s + orderAmount(o), 0)

  return (
    <div className="page">
      <PageHeader
        title="주문 확인"
        desc={pending > 0 ? `수량이 의심되는 주문 ${pending}건을 원본과 대조해 확정하세요.` : '모든 주문의 수량 확인이 끝났습니다.'}
        descTone={pending > 0 ? 'red' : 'green'}
        kpis={[
          { label: '확인 대기', value: String(pending), unit: '건', tone: pending > 0 ? 'red' : 'green' },
          { label: '확정 수량', value: confirmedUnits.toLocaleString(), unit: '대' },
          { label: '확정 공급가액', value: confirmedAmount.toLocaleString(), unit: '원' },
        ]}
        action={
          <button type="button" className={`btn btn-lg ${pending === 0 ? 'btn-primary' : ''}`} onClick={onNext}>
            다음: 소요량·재고
            <ArrowRight />
          </button>
        }
      />

      <div className="split" style={{ '--split': 'minmax(0, 1.4fr) minmax(420px, 1fr)' } as React.CSSProperties}>
        <section
          className={`panel ${dragging ? 'outline-2 outline-[var(--accent)] -outline-offset-2' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={(e) => {
            // 패널 안쪽 요소로 옮겨갈 때는 강조를 유지한다
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files)
          }}
        >
          <div className="panel-head">
            <span>주문 목록</span>
            <span className="t-6 font-normal">{orders.length}건</span>
            <span className="flex-1" />
            <button type="button" className="btn" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
              <Plus />
              직접 입력
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.json,.html,.htm,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) onFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className={`dropzone ${dragging ? 'dropzone-active' : ''}`}
            onClick={() => fileInput.current?.click()}
          >
            <Upload />
            <span className="min-w-0">
              <span className="t-4 block">
                {dragging ? '여기에 놓으면 주문서가 등록됩니다' : '바이어 주문서를 여기로 끌어다 놓으세요'}
              </span>
              <span className="t-7 block">
                PDF, XLSX, CSV, JSON, HTML, TXT · 여러 개 가능 · 클릭해서 선택 · 파일명에 모델명(예: TAPI-9270J)과 수량(예: 20대) 필요
              </span>
            </span>
          </button>

          {showForm && (
            <ManualOrderForm
              onCancel={() => setShowForm(false)}
              onSubmit={(input) => {
                onManualAdd(input)
                setShowForm(false)
              }}
            />
          )}

          <div className="panel-body">
            <table className="tbl">
              <thead>
                <tr>
                  <th>상태</th>
                  <th>수요기관 / 문서번호</th>
                  <th>모델</th>
                  <th className="num">표기 수량</th>
                  <th className="num">확정 수량</th>
                  <th>납기</th>
                  <th className="num">공급가액</th>
                  <th className="center">형식</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const suspicious = !o.confirmed || o.rawQuantity !== o.quantity
                  return (
                    <tr
                      key={o.id}
                      tabIndex={0}
                      aria-selected={o.id === selected?.id}
                      className={`row-click ${o.id === selected?.id ? 'row-selected' : ''}`}
                      onClick={() => onSelect(o.id)}
                      onKeyDown={rowKeyHandler(() => onSelect(o.id))}
                    >
                      <td>
                        <OrderStatusTag order={o} />
                      </td>
                      <td>
                        <div className="c-key">{o.buyerName}</div>
                        <div className="c-faint">{o.docNo}</div>
                      </td>
                      <td className="c-dim">{o.modelId}</td>
                      <td className={`num ${suspicious ? 'c-hero text-[var(--red)]' : 'c-dim'}`}>
                        {o.rawQuantity.toLocaleString()}
                      </td>
                      <td className={`num ${o.confirmed ? 'c-hero' : 'c-dim'}`}>
                        {o.confirmed ? o.quantity.toLocaleString() : '-'}
                      </td>
                      <td>
                        <DueDay date={o.dueDate} />
                      </td>
                      <td className="num">{o.confirmed ? formatWon(orderAmount(o)) : <span className="c-dim">-</span>}</td>
                      <td className="center c-faint">{o.fileFormat ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>확정 합계</td>
                  <td className="num">{confirmedUnits.toLocaleString()}</td>
                  <td />
                  <td className="num">{formatWon(confirmedAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="panel">
          {selected ? (
            <>
              <SubTabs
                tabs={[
                  { id: 'INFO', label: '주문 내용' },
                  { id: 'SOURCE', label: '원본 문서' },
                  { id: 'BOM', label: '모델 BOM' },
                ]}
                value={detailTab}
                onChange={setDetailTab}
              />
              <div className={`flex-1 min-h-0 ${detailTab === 'SOURCE' ? 'overflow-hidden' : 'overflow-auto'}`}>
                {detailTab === 'INFO' && <OrderInfo key={selected.id} order={selected} {...props} />}
                {detailTab === 'SOURCE' && (
                  <DocumentPreview
                    url={selected.downloadUrl}
                    format={selected.fileFormat}
                    fileName={sourceName(selected)}
                  />
                )}
                {detailTab === 'BOM' && <ModelBom modelId={selected.modelId} />}
              </div>
            </>
          ) : (
            <p className="p-4 text-[var(--muted)]">등록된 주문이 없습니다.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function OrderInfo({
  order,
  editQty,
  onEditQty,
  onConfirm,
  onReopen,
}: OrdersTabProps & { order: BuyerOrder }) {
  const [error, setError] = useState<string>()
  const model = findModel(order.modelId)
  const value = editQty[order.id] ?? String(order.quantity)
  const previewQty = order.confirmed ? order.quantity : Number(value)
  const validPreview = Number.isInteger(previewQty) && previewQty > 0
  const supply = validPreview ? previewQty * (model?.unitPrice ?? 0) : 0

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="t-3 m-0">{order.buyerName}</h3>
          <div className="t-6">
            {order.modelId} · {model?.name}
          </div>
        </div>
        <OrderStatusTag order={order} />
      </div>

      {!order.confirmed && order.errorMsg && (
        <div className="callout callout-red font-semibold">{order.errorMsg}</div>
      )}

      {order.confirmed ? (
        <div className="flex items-end gap-5 pb-3 border-b border-[var(--line-soft)]">
          {order.rawQuantity !== order.quantity && (
            <div>
              <div className="t-7">표기 수량</div>
              <div className="t-3 text-[var(--muted)] line-through">{order.rawQuantity.toLocaleString()}대</div>
            </div>
          )}
          <div>
            <div className="t-7">확정 수량</div>
            <div className="t-1 text-[var(--green)]">
              {order.quantity.toLocaleString()}
              <span className="unit">대</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="t-7">공급가액</div>
            <div className="t-4">{validPreview ? formatWon(supply) : '-'}</div>
          </div>
          <button type="button" className="btn" onClick={() => onReopen(order.id)}>
            확인 취소
          </button>
        </div>
      ) : (
        <form
          className="flex items-end gap-4 pb-3 border-b border-[var(--line-soft)]"
          onSubmit={(e) => {
            e.preventDefault()
            setError(onConfirm(order.id))
          }}
        >
          <div>
            <div className="t-7">표기 수량</div>
            <div className="t-1 text-[var(--red)]">
              {order.rawQuantity.toLocaleString()}
              <span className="unit">대</span>
            </div>
          </div>
          <div>
            <label htmlFor="confirm-qty" className="t-7 block mb-0.5">
              확정 수량
            </label>
            <div className="flex items-center gap-1">
              <input
                id="confirm-qty"
                type="number"
                className="input input-hero"
                value={value}
                onChange={(e) => onEditQty(order.id, e.target.value)}
              />
              <span className="t-6">대</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="t-7">예상 공급가액</div>
            <div className="t-4">{validPreview ? formatWon(supply) : '-'}</div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            <Check />
            수량 확정
          </button>
        </form>
      )}
      {error && <div className="callout callout-red font-semibold">{error}</div>}

      <div>
        <h4 className="t-4 m-0 mb-1">수량 판단 근거 (주문서 비고)</h4>
        <div className="callout callout-amber text-[14px]! leading-relaxed">{order.docMemo}</div>
      </div>

      <div>
        <h4 className="t-6 font-semibold m-0 mb-1">주문 상세</h4>
        <Fields
          rows={[
            ['문서번호', `${order.docNo} (${order.orderDate} 발주)`],
            ['납기요청일', order.dueDate],
            ['납품장소', order.deliveryPlace],
            ['담당자', `${order.buyerManager} · ${order.buyerPhone}`],
            ['사업자/기관장', `${order.buyerBizNo} / ${order.buyerCeo}`],
            ['식별번호/규격', `${model?.itemIdNo ?? '-'} · ${model?.dimensions ?? '-'}`],
            ['단가', `${formatWon(model?.unitPrice ?? 0)} (부가세 별도)`],
          ]}
        />
      </div>
    </div>
  )
}

function ModelBom({ modelId }: { modelId: KioskModelId }) {
  const model = findModel(modelId)
  const rows = (model?.bom ?? []).map((b) => {
    const mat = INITIAL_MATERIALS.find((m) => m.id === b.materialId)
    return { ...b, name: mat?.name ?? b.materialId, unitCost: mat?.unitCost ?? 0 }
  })
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>{modelId} 부자재</th>
          <th className="num">1대 수량</th>
          <th className="num">단가</th>
          <th className="num">금액</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.materialId}>
            <td className="font-semibold">{r.name}</td>
            <td className="num c-dim">{r.qtyPerUnit}</td>
            <td className="num c-dim">{r.unitCost.toLocaleString()}</td>
            <td className="num">{(r.unitCost * r.qtyPerUnit).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>합계</td>
          <td className="num">{rows.reduce((s, r) => s + r.qtyPerUnit, 0)}</td>
          <td />
          <td className="num">{rows.reduce((s, r) => s + r.unitCost * r.qtyPerUnit, 0).toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  )
}

function ManualOrderForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: OrdersTabProps['onManualAdd']
  onCancel: () => void
}) {
  const [buyerName, setBuyerName] = useState('')
  const [modelId, setModelId] = useState<KioskModelId>(KIOSK_MODELS[0].id)
  const [quantity, setQuantity] = useState('')
  const [dueDate, setDueDate] = useState(todayIso())

  return (
    <form
      className="flex flex-wrap items-center gap-1.5 flex-none px-2.5 py-2 border-b border-[var(--line)] bg-[#fafbfc]"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ buyerName: buyerName.trim(), modelId, quantity: Number(quantity), dueDate })
      }}
    >
      <input
        required
        aria-label="수요기관"
        placeholder="수요기관"
        className="input flex-1 min-w-36"
        value={buyerName}
        onChange={(e) => setBuyerName(e.target.value)}
      />
      <select
        aria-label="모델"
        className="input"
        value={modelId}
        onChange={(e) => setModelId(e.target.value as KioskModelId)}
      >
        {KIOSK_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.id} · {m.name}
          </option>
        ))}
      </select>
      <input
        required
        type="number"
        aria-label="수량"
        placeholder="수량"
        className="input w-20 text-right"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <input
        type="date"
        aria-label="납기"
        className="input"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button type="submit" className="btn btn-primary">
        등록
      </button>
      <button type="button" className="btn" onClick={onCancel}>
        취소
      </button>
    </form>
  )
}
