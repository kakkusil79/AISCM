import { useEffect, useMemo, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { MaterialsTab } from './components/MaterialsTab'
import { OrdersTab } from './components/OrdersTab'
import { PurchaseTab } from './components/PurchaseTab'
import { BomMatrixTab, SourceFilesTab, SuppliersTab } from './components/ReferenceTabs'
import { INITIAL_MATERIALS, INITIAL_ORDERS } from './data/mockScmData'
import {
  COMPANY,
  INITIAL_SUGGESTED_QTY,
  buildSupplierPOs,
  computeMaterialStatus,
  createOrder,
  fileStem,
  formatFromFileName,
  nextOrderNumber,
  parseOrderFileName,
  sourceName,
  todayIso,
} from './lib/scmLogic'
import type { SupplierPOView } from './lib/scmLogic'
import type { BuyerOrder, KioskModelId } from './types/scm'

type TabId = 'ORDERS' | 'MATERIALS' | 'PURCHASE' | 'FILES' | 'BOM' | 'SUPPLIERS'

// Alt+1 ~ Alt+6 단축키 순서
const TAB_ORDER: TabId[] = ['ORDERS', 'MATERIALS', 'PURCHASE', 'FILES', 'BOM', 'SUPPLIERS']

function App() {
  const [tab, setTab] = useState<TabId>('ORDERS')
  const [orders, setOrders] = useState<BuyerOrder[]>(INITIAL_ORDERS)
  const [selectedOrderId, setSelectedOrderId] = useState(INITIAL_ORDERS[0].id)
  const [editQty, setEditQty] = useState<Record<string, string>>(INITIAL_SUGGESTED_QTY)
  const [confirmedBy, setConfirmedBy] = useState<Record<string, string>>({})
  const [sentBy, setSentBy] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)

  const materials = useMemo(() => computeMaterialStatus(orders, INITIAL_MATERIALS), [orders])
  const pos = useMemo(() => buildSupplierPOs(materials, confirmedBy, sentBy), [materials, confirmedBy, sentBy])

  const pendingCount = orders.filter((o) => !o.confirmed).length
  const shortageCount = materials.filter((m) => m.shortageQty > 0).length
  const sentCount = pos.filter((p) => p.mailSent).length

  const goToTab = (next: TabId) => {
    setTab(next)
    setNotice(null)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return
      const next = TAB_ORDER[Number(e.key) - 1]
      if (next) {
        e.preventDefault()
        setTab(next)
        setNotice(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // 드롭 영역 밖에 파일을 놓아도 브라우저가 파일로 이동해 입력 내용을 잃지 않게 한다
  useEffect(() => {
    const block = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  const handleConfirm = (id: string): string | undefined => {
    const order = orders.find((o) => o.id === id)
    if (!order) return undefined
    const qty = Number(editQty[id] ?? order.quantity)
    if (!Number.isInteger(qty) || qty <= 0) return '수량은 1 이상의 정수로 입력해 주세요.'
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, quantity: qty, errorMsg: undefined, confirmed: true } : o))
    )
    const nextPending = orders.find((o) => o.id !== id && !o.confirmed)
    if (nextPending) setSelectedOrderId(nextPending.id)
    return undefined
  }

  const handleReopen = (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, confirmed: false } : o)))
    const order = orders.find((o) => o.id === id)
    if (order) setEditQty((prev) => ({ ...prev, [id]: String(order.quantity) }))
  }

  const handleFiles = (files: FileList) => {
    const known = new Set(orders.map((o) => fileStem(sourceName(o))).filter(Boolean))
    const created: BuyerOrder[] = []
    const duplicates: string[] = []
    const unreadable: string[] = []
    const unsupported: string[] = []
    let number = nextOrderNumber(orders)

    for (const file of Array.from(files)) {
      if (!formatFromFileName(file.name)) {
        unsupported.push(file.name)
        continue
      }
      const stem = fileStem(file.name)
      if (known.has(stem)) {
        duplicates.push(file.name)
        continue
      }
      const parsed = parseOrderFileName(file.name)
      if (!parsed) {
        unreadable.push(file.name)
        continue
      }
      known.add(stem)
      created.push(
        createOrder({
          number: number++,
          buyerName: parsed.buyerName,
          modelId: parsed.modelId,
          quantity: parsed.quantity,
          docMemo: `업로드 파일명에서 읽은 값입니다. 원본 문서를 확인해 주세요. (${file.name})`,
          fileFormat: formatFromFileName(file.name),
          downloadUrl: URL.createObjectURL(file),
          sourceFileName: file.name,
        })
      )
    }

    if (created.length > 0) {
      setOrders((prev) => [...prev, ...created])
      setSelectedOrderId(created[0].id)
    }
    const messages = [
      created.length > 0 && `${created.length}건 등록`,
      duplicates.length > 0 && `이미 등록된 파일 ${duplicates.length}건 제외`,
      unreadable.length > 0 && `파일명에서 모델을 찾지 못한 ${unreadable.length}건 제외 (직접 입력해 주세요)`,
      unsupported.length > 0 && `지원하지 않는 형식 ${unsupported.length}건 제외`,
    ].filter(Boolean)
    setNotice(messages.join(' · '))
  }

  const handleManualAdd = (input: {
    buyerName: string
    modelId: KioskModelId
    quantity: number
    dueDate: string
  }) => {
    const order = createOrder({
      number: nextOrderNumber(orders),
      buyerName: input.buyerName,
      modelId: input.modelId,
      quantity: input.quantity,
      dueDate: input.dueDate,
      docMemo: '직접 입력한 주문입니다.',
    })
    setOrders((prev) => [...prev, order])
    setSelectedOrderId(order.id)
    setNotice(`${input.buyerName} 주문을 등록했습니다.`)
  }

  const handleToggleConfirm = (po: SupplierPOView) => {
    setConfirmedBy((prev) => {
      const next = { ...prev }
      if (po.humanConfirmed) delete next[po.supplierName]
      else next[po.supplierName] = po.signature
      return next
    })
  }

  const handleMarkSent = (po: SupplierPOView) => {
    if (!po.humanConfirmed) return
    setSentBy((prev) => ({ ...prev, [po.supplierName]: po.signature }))
    setNotice(`${po.supplierName} 발주서를 발송 완료로 기록했습니다.`)
  }

  const handleReset = () => {
    if (!window.confirm('입력한 수량 확인과 발송 기록을 모두 지우고 처음 상태로 되돌립니다. 계속할까요?')) return
    setOrders(INITIAL_ORDERS)
    setSelectedOrderId(INITIAL_ORDERS[0].id)
    setEditQty(INITIAL_SUGGESTED_QTY)
    setConfirmedBy({})
    setSentBy({})
    setNotice(null)
    setTab('ORDERS')
  }

  const workTabs: { id: TabId; label: string; badge: string; tone: string }[] = [
    {
      id: 'ORDERS',
      label: '1. 주문 확인',
      badge: pendingCount > 0 ? `확인 ${pendingCount}` : '완료',
      tone: pendingCount > 0 ? 'tag-red' : 'tag-green',
    },
    {
      id: 'MATERIALS',
      label: '2. 소요량·재고',
      badge: `부족 ${shortageCount}`,
      tone: shortageCount > 0 ? 'tag-amber' : 'tag-green',
    },
    {
      id: 'PURCHASE',
      label: '3. 발주서',
      badge: `발송 ${sentCount}/${pos.length}`,
      tone: pos.length > 0 && sentCount === pos.length ? 'tag-green' : 'tag-gray',
    },
  ]
  const referenceTabs: { id: TabId; label: string }[] = [
    { id: 'FILES', label: '주문서 원본' },
    { id: 'BOM', label: '모델별 BOM' },
    { id: 'SUPPLIERS', label: '발주처' },
  ]
  const shortcut = (id: TabId) => `Alt+${TAB_ORDER.indexOf(id) + 1}`

  return (
    <div className="flex flex-col h-dvh min-w-0">
      <header className="flex items-center gap-3 flex-none h-9 px-3 bg-[var(--brand)] text-white">
        <h1 className="m-0 text-[14px] font-bold">무인민원발급기 부자재 발주 관리</h1>
        <span className="text-[12px] text-white/70 hidden sm:inline">
          {COMPANY.name} {COMPANY.dept}
        </span>
        <span className="flex-1" />
        <span className="text-[12px] text-white/80">기준일 {todayIso()}</span>
        <button type="button" className="btn h-6!" onClick={handleReset}>
          <RotateCcw />
          초기화
        </button>
      </header>

      <nav
        role="tablist"
        aria-label="업무 화면"
        className="flex items-end flex-none gap-0.5 px-2 pt-1 bg-white border-b border-[var(--line)] overflow-x-auto overflow-y-hidden"
      >
        {workTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            title={shortcut(t.id)}
            className="main-tab"
            onClick={() => goToTab(t.id)}
          >
            {t.label}
            <span className={`tag ${t.tone}`}>{t.badge}</span>
          </button>
        ))}
        <span className="flex-1 min-w-4" />
        <span className="t-7 self-center mr-1">자료</span>
        {referenceTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            title={shortcut(t.id)}
            className="main-tab main-tab-ref"
            onClick={() => goToTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div role="status" className="flex items-center gap-2 flex-none px-3 py-1 bg-[var(--accent-soft)] border-b border-[#b3cdea]">
          <span className="flex-1 font-semibold">{notice}</span>
          <button type="button" aria-label="알림 닫기" className="cursor-pointer" onClick={() => setNotice(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 min-h-0 overflow-auto p-2">
        {tab === 'ORDERS' && (
          <OrdersTab
            orders={orders}
            selectedId={selectedOrderId}
            onSelect={setSelectedOrderId}
            editQty={editQty}
            onEditQty={(id, value) => setEditQty((prev) => ({ ...prev, [id]: value }))}
            onConfirm={handleConfirm}
            onReopen={handleReopen}
            onFiles={handleFiles}
            onManualAdd={handleManualAdd}
            onNext={() => goToTab('MATERIALS')}
          />
        )}
        {tab === 'MATERIALS' && (
          <MaterialsTab orders={orders} materials={materials} onNext={() => goToTab('PURCHASE')} />
        )}
        {tab === 'PURCHASE' && (
          <PurchaseTab pos={pos} orders={orders} onToggleConfirm={handleToggleConfirm} onMarkSent={handleMarkSent} />
        )}
        {tab === 'FILES' && <SourceFilesTab orders={orders} />}
        {tab === 'BOM' && <BomMatrixTab materials={INITIAL_MATERIALS} />}
        {tab === 'SUPPLIERS' && <SuppliersTab materials={INITIAL_MATERIALS} />}
      </main>
    </div>
  )
}

export default App
