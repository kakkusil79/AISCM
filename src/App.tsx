import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Package,
  Send,
  UserCheck,
} from 'lucide-react'
import {
  INITIAL_MATERIALS,
  INITIAL_ORDERS,
  KIOSK_MODELS,
  checkQuantityError,
} from './data/mockScmData'
import type { BuyerOrder, KioskModelId, SupplierPO } from './types/scm'

function App() {
  const [orders, setOrders] = useState<BuyerOrder[]>(INITIAL_ORDERS)
  const [materials] = useState(INITIAL_MATERIALS)

  // 오류 주문 수량 수정용 입력 상태
  const [editQtyMap, setEditQtyMap] = useState<Record<string, string>>({
    'ORD-01': '20',
    'ORD-02': '25',
    'ORD-03': '10',
  })

  // 간단한 신규 주문 테스트 추가 상태
  const [newBuyer, setNewBuyer] = useState('')
  const [newModel, setNewModel] = useState<KioskModelId>('KSK-21')
  const [newQty, setNewQty] = useState('')
  const [newDue, setNewDue] = useState('2026-11-25')

  // 발주처별 2차 사람 확인 및 메일 발송 상태
  const [poConfirmMap, setPoConfirmMap] = useState<Record<string, boolean>>({})
  const [poSentMap, setPoSentMap] = useState<Record<string, boolean>>({})

  // 1차 사람 확인: 수량 수정 및 주문 확정
  const handleConfirmOrder = (orderId: string) => {
    const rawVal = editQtyMap[orderId]
    const targetOrder = orders.find((o) => o.id === orderId)
    if (!targetOrder) return

    const nextQty = rawVal !== undefined ? Number(rawVal) : targetOrder.quantity
    if (!Number.isFinite(nextQty) || nextQty <= 0 || !Number.isInteger(nextQty)) {
      alert('수량은 1 이상의 정수로 입력해주세요.')
      return
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              quantity: nextQty,
              errorMsg: undefined,
              confirmed: true,
            }
          : o
      )
    )
    // 주문이 변경되면 발주서 2차 확인 상태 초기화
    setPoConfirmMap({})
    setPoSentMap({})
  }

  // 신규 주문서 추가
  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBuyer.trim() || !newQty) return
    const qtyNum = Number(newQty)
    const err = checkQuantityError(qtyNum)
    const created: BuyerOrder = {
      id: `ORD-0${orders.length + 1}`,
      buyerName: newBuyer.trim(),
      modelId: newModel,
      quantity: qtyNum,
      dueDate: newDue,
      errorMsg: err,
      confirmed: !err,
    }
    setOrders((prev) => [created, ...prev])
    if (err) {
      setEditQtyMap((prev) => ({ ...prev, [created.id]: String(qtyNum) }))
    }
    setNewBuyer('')
    setNewQty('')
    setPoConfirmMap({})
    setPoSentMap({})
  }

  // 확정된 주문서 기준으로 BOM 전개 → 부자재별 필요수량 및 부족수량 계산
  const materialStatusList = useMemo(() => {
    const confirmedOrders = orders.filter((o) => o.confirmed && o.quantity > 0)

    return materials.map((mat) => {
      let requiredQty = 0
      for (const ord of confirmedOrders) {
        const model = KIOSK_MODELS.find((m) => m.id === ord.modelId)
        const bomItem = model?.bom.find((b) => b.materialId === mat.id)
        if (bomItem) {
          requiredQty += ord.quantity * bomItem.qtyPerUnit
        }
      }
      const shortageQty = Math.max(0, requiredQty - mat.stock)
      return {
        ...mat,
        requiredQty,
        shortageQty,
      }
    })
  }, [orders, materials])

  // 부족한 부자재를 발주처별로 묶어 발주서(PO) 생성
  const supplierPOs: SupplierPO[] = useMemo(() => {
    const map = new Map<string, SupplierPO>()
    for (const item of materialStatusList) {
      if (item.shortageQty <= 0) continue
      const existing = map.get(item.supplierName)
      if (!existing) {
        map.set(item.supplierName, {
          supplierName: item.supplierName,
          supplierEmail: item.supplierEmail,
          items: [
            {
              materialId: item.id,
              materialName: item.name,
              requiredQty: item.requiredQty,
              currentStock: item.stock,
              orderQty: item.shortageQty,
            },
          ],
          humanConfirmed: !!poConfirmMap[item.supplierName],
          mailSent: !!poSentMap[item.supplierName],
        })
      } else {
        existing.items.push({
          materialId: item.id,
          materialName: item.name,
          requiredQty: item.requiredQty,
          currentStock: item.stock,
          orderQty: item.shortageQty,
        })
      }
    }
    return Array.from(map.values())
  }, [materialStatusList, poConfirmMap, poSentMap])

  const togglePoConfirm = (supplierName: string) => {
    setPoConfirmMap((prev) => ({
      ...prev,
      [supplierName]: !prev[supplierName],
    }))
  }

  const handleSendMail = (supplierName: string) => {
    if (!poConfirmMap[supplierName]) {
      alert('메일 발송 전에 [사람 확인 완료] 체크를 먼저 진행해주세요.')
      return
    }
    setPoSentMap((prev) => ({
      ...prev,
      [supplierName]: true,
    }))
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 */}
        <header className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-white">
              키오스크 자동 발주 시스템
            </h1>
            <p className="text-sm text-slate-400">
              바이어 주문서 확인(1차 사람 확인) → 4종 모델 BOM 및 재고 조회 → 발주처 메일 발송(2차 사람 확인)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
              확인 필요 주문: {orders.filter((o) => !o.confirmed).length}건
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              발주 필요 거래처: {supplierPOs.length}곳
            </span>
          </div>
        </header>

        {/* STEP 1. 바이어 주문서 목록 및 오류 수량 사람 확인 */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center">
                  1
                </span>
                바이어 주문서 접수 및 수량 오류 확인 (1차 사람 확인)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                너무 적거나 이상한 수량(오타·음수 등)은 보류되며, 사람이 직접 수량을 확인·수정한 뒤 승인해야 반영됩니다.
              </p>
            </div>
          </div>

          {/* 간단한 테스트 주문 추가 폼 */}
          <form
            onSubmit={handleAddOrder}
            className="flex flex-wrap items-center gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs"
          >
            <span className="text-slate-400 font-semibold mr-1">
              주문서 테스트 추가:
            </span>
            <input
              type="text"
              placeholder="업체명 (예: 투썸플레이스)"
              value={newBuyer}
              onChange={(e) => setNewBuyer(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            />
            <select
              value={newModel}
              onChange={(e) => setNewModel(e.target.value as KioskModelId)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            >
              {KIOSK_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} ({m.name})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="수량 (예: 2 또는 999)"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
              className="w-36 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            />
            <input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
            >
              추가
            </button>
          </form>

          {/* 주문서 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                  <th className="py-2.5 px-3">주문번호</th>
                  <th className="py-2.5 px-3">바이어 업체명</th>
                  <th className="py-2.5 px-3">모델명</th>
                  <th className="py-2.5 px-3">납기일</th>
                  <th className="py-2.5 px-3">주문 수량</th>
                  <th className="py-2.5 px-3">검증 상태 / 오류 내용</th>
                  <th className="py-2.5 px-3 text-right">사람 확인 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className={
                      !ord.confirmed ? 'bg-amber-950/20' : 'hover:bg-slate-800/40'
                    }
                  >
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {ord.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {ord.buyerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-indigo-300">
                      {ord.modelId}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {ord.dueDate}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">
                      {!ord.confirmed ? (
                        <span className="text-amber-400">{ord.quantity}대</span>
                      ) : (
                        <span className="text-white">{ord.quantity}대</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {!ord.confirmed ? (
                        <div className="inline-flex items-center gap-1.5 text-amber-300 font-medium">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{ord.errorMsg}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          정상 확인됨
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!ord.confirmed ? (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            value={
                              editQtyMap[ord.id] !== undefined
                                ? editQtyMap[ord.id]
                                : String(ord.quantity)
                            }
                            onChange={(e) =>
                              setEditQtyMap((prev) => ({
                                ...prev,
                                [ord.id]: e.target.value,
                              }))
                            }
                            className="w-20 bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-right font-mono text-white"
                          />
                          <span className="text-slate-400">대</span>
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(ord.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            사람 확인 승인
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">반영 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* STEP 2. 모델 4종 BOM 및 부자재 재고 확인 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측: 4개 모델 BOM 요약 (5칸) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center">
                  2
                </span>
                키오스크 모델 4종 & BOM 구성
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                각 키오스크 1대 제작에 필요한 부자재 목록입니다.
              </p>
            </div>

            <div className="space-y-3">
              {KIOSK_MODELS.map((model) => {
                const confirmedSum = orders
                  .filter((o) => o.confirmed && o.modelId === model.id)
                  .reduce((acc, o) => acc + o.quantity, 0)

                return (
                  <div
                    key={model.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-xs text-indigo-400 mr-2">
                          {model.id}
                        </span>
                        <span className="font-bold text-sm text-white">
                          {model.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        확정 주문: {confirmedSum}대
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {model.bom.map((b) => {
                        const mat = materials.find((m) => m.id === b.materialId)
                        return (
                          <span
                            key={b.materialId}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                          >
                            {mat?.name} ×{b.qtyPerUnit}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 우측: 부자재 재고 및 부족 수량 확인 (7칸) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                부자재 재고 현황 및 필요 발주량 산출
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                확정된 주문의 BOM 총 필요 수량과 현재 재고를 비교하여 부족한 수량을 계산합니다.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="py-2.5 px-3">부자재명</th>
                    <th className="py-2.5 px-3">발주처</th>
                    <th className="py-2.5 px-3 text-right">총 필요수량</th>
                    <th className="py-2.5 px-3 text-right">현재 재고</th>
                    <th className="py-2.5 px-3 text-right">발주 필요(부족분)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {materialStatusList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {m.supplierName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        {m.requiredQty}개
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {m.stock}개
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {m.shortageQty > 0 ? (
                          <span className="text-rose-400">
                            {m.shortageQty}개 발주필요
                          </span>
                        ) : (
                          <span className="text-emerald-400">재고 충분</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* STEP 3. 발주처별 최종 발주서 메일 발송 (2차 사람 확인) */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center">
                3
              </span>
              발주처별 자동 발주서 및 메일 발송 (2차 사람 확인)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              부족한 부자재를 발주처별로 모았습니다. 메일을 보내기 전에 사람이 최종 확인을 체크해야 발송 버튼이 활성화됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplierPOs.map((po) => (
              <div
                key={po.supplierName}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {po.supplierName}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        {po.supplierEmail}
                      </p>
                    </div>
                    {po.mailSent ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        메일 발송 완료
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                        발송 대기
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {po.items.map((item) => (
                      <div
                        key={item.materialId}
                        className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded border border-slate-800/80"
                      >
                        <span className="text-slate-200 font-medium">
                          {item.materialName}
                        </span>
                        <span className="font-mono text-slate-400">
                          필요 {item.requiredQty} / 재고 {item.currentStock} →{' '}
                          <strong className="text-indigo-300">
                            발주 {item.orderQty}개
                          </strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2차 사람 확인 체크박스 + 메일 발송 버튼 */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={po.mailSent}
                      checked={po.humanConfirmed}
                      onChange={() => togglePoConfirm(po.supplierName)}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                    <span>발주 내역 사람 최종 확인</span>
                  </label>

                  <button
                    type="button"
                    disabled={!po.humanConfirmed || po.mailSent}
                    onClick={() => handleSendMail(po.supplierName)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                      po.mailSent
                        ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                        : po.humanConfirmed
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {po.mailSent ? '발송됨' : '발주서 메일 보내기'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
