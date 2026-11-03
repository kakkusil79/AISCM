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

function formatManWon(won: number): string {
  return `${(won / 10000).toLocaleString()}만 원`
}

function App() {
  const [orders, setOrders] = useState<BuyerOrder[]>(INITIAL_ORDERS)
  const [materials] = useState(INITIAL_MATERIALS)

  // 오류 주문 수량 수정용 입력 상태
  const [editQtyMap, setEditQtyMap] = useState<Record<string, string>>({
    'ORD-01': '20',
    'ORD-02': '25',
    'ORD-03': '10',
  })

  // 신규 주문 테스트 추가 상태
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
      const subTotalCost = item.shortageQty * item.unitCost

      if (!existing) {
        map.set(item.supplierName, {
          supplierName: item.supplierName,
          supplierEmail: item.supplierEmail,
          items: [
            {
              materialId: item.id,
              materialName: item.name,
              unitCost: item.unitCost,
              requiredQty: item.requiredQty,
              currentStock: item.stock,
              orderQty: item.shortageQty,
              subTotalCost,
            },
          ],
          totalOrderCost: subTotalCost,
          humanConfirmed: !!poConfirmMap[item.supplierName],
          mailSent: !!poSentMap[item.supplierName],
        })
      } else {
        existing.items.push({
          materialId: item.id,
          materialName: item.name,
          unitCost: item.unitCost,
          requiredQty: item.requiredQty,
          currentStock: item.stock,
          orderQty: item.shortageQty,
          subTotalCost,
        })
        existing.totalOrderCost += subTotalCost
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
      alert('메일 발송 전에 [사람 최종 확인] 체크를 먼저 진행해주세요.')
      return
    }
    setPoSentMap((prev) => ({
      ...prev,
      [supplierName]: true,
    }))
  }

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#2C302E] py-8 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 상단 헤더 */}
        <header className="bg-[#FDFCF9] border border-[#E2DDD2] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#232725] tracking-tight">
              키오스크 자동 발주 관리 시스템
            </h1>
            <p className="text-base md:text-lg text-[#5C625E] mt-1">
              바이어 주문 확인(1차 사람 확인) → 4종 모델 BOM·재고 대조 → 발주처 메일 발송(2차 사람 확인)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-base font-semibold">
            <span className="px-4 py-2 rounded-xl bg-[#FDF4E7] text-[#9E5818] border border-[#EED3B3]">
              확인 대기 주문: {orders.filter((o) => !o.confirmed).length}건
            </span>
            <span className="px-4 py-2 rounded-xl bg-[#EBF2EE] text-[#2F5D48] border border-[#C6DDD0]">
              발주 필요 거래처: {supplierPOs.length}곳
            </span>
          </div>
        </header>

        {/* STEP 1. 바이어 주문서 목록 및 오류 수량 사람 확인 */}
        <section className="bg-[#FDFCF9] border border-[#E2DDD2] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#232725] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#3D6B58] text-white text-base font-bold flex items-center justify-center">
                1
              </span>
              바이어 주문서 접수 및 수량 오류 확인 (1차 사람 확인)
            </h2>
            <p className="text-base text-[#5C625E] mt-1">
              수량이 너무 적거나 이상한 숫자(오타·음수 등)는 자동 보류됩니다. 담당자가 수량을 확인·수정한 뒤 승인해야 반영됩니다.
            </p>
          </div>

          {/* 테스트 주문 추가 폼 */}
          <form
            onSubmit={handleAddOrder}
            className="flex flex-wrap items-center gap-3 bg-[#F3EFE6] p-4 rounded-xl border border-[#E2DDD2] text-base"
          >
            <span className="text-[#4A504C] font-bold mr-1">
              신규 주문 테스트:
            </span>
            <input
              type="text"
              placeholder="업체명 입력"
              value={newBuyer}
              onChange={(e) => setNewBuyer(e.target.value)}
              className="bg-white border border-[#CFC8B8] rounded-lg px-3.5 py-2 text-base text-[#232725]"
            />
            <select
              value={newModel}
              onChange={(e) => setNewModel(e.target.value as KioskModelId)}
              className="bg-white border border-[#CFC8B8] rounded-lg px-3.5 py-2 text-base text-[#232725]"
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
              className="w-44 bg-white border border-[#CFC8B8] rounded-lg px-3.5 py-2 text-base text-[#232725]"
            />
            <input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
              className="bg-white border border-[#CFC8B8] rounded-lg px-3.5 py-2 text-base text-[#232725]"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#3D6B58] hover:bg-[#315847] text-white font-bold cursor-pointer transition"
            >
              주문 추가
            </button>
          </form>

          {/* 주문서 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr className="border-b-2 border-[#E2DDD2] text-[#4A504C] bg-[#F3EFE6]">
                  <th className="py-3.5 px-4 font-bold">주문번호</th>
                  <th className="py-3.5 px-4 font-bold">바이어 업체명</th>
                  <th className="py-3.5 px-4 font-bold">모델명 (단가 400만)</th>
                  <th className="py-3.5 px-4 font-bold">납기일</th>
                  <th className="py-3.5 px-4 font-bold">주문 수량</th>
                  <th className="py-3.5 px-4 font-bold">검증 상태 및 오류 안내</th>
                  <th className="py-3.5 px-4 text-right font-bold">사람 확인 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3D9]">
                {orders.map((ord) => (
                  <tr
                    key={ord.id}
                    className={
                      !ord.confirmed
                        ? 'bg-[#FDF5EB]'
                        : 'hover:bg-[#F7F4ED] transition'
                    }
                  >
                    <td className="py-4 px-4 font-mono text-[#5C625E] font-medium">
                      {ord.id}
                    </td>
                    <td className="py-4 px-4 font-bold text-lg text-[#232725]">
                      {ord.buyerName}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#3B5B7C]">
                      {ord.modelId}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#4A504C]">
                      {ord.dueDate}
                    </td>
                    <td className="py-4 px-4 font-mono text-lg font-extrabold">
                      {!ord.confirmed ? (
                        <span className="text-[#B85D19]">{ord.quantity}대</span>
                      ) : (
                        <span className="text-[#232725]">{ord.quantity}대</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {!ord.confirmed ? (
                        <div className="inline-flex items-center gap-2 text-[#A64B14] font-semibold">
                          <AlertTriangle className="w-5 h-5 text-[#C2621A] shrink-0" />
                          <span>{ord.errorMsg}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[#2E6B4E] font-bold">
                          <CheckCircle2 className="w-5 h-5" />
                          정상 확인됨 (주문액 {(ord.quantity * 400).toLocaleString()}만 원)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {!ord.confirmed ? (
                        <div className="inline-flex items-center gap-2">
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
                            className="w-24 bg-white border-2 border-[#D48A46] rounded-lg px-3 py-1.5 text-right font-mono text-lg font-bold text-[#232725]"
                          />
                          <span className="text-[#4A504C] font-semibold">대</span>
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(ord.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B86B28] hover:bg-[#9E581B] text-white font-bold cursor-pointer transition shadow-xs"
                          >
                            <UserCheck className="w-4 h-4" />
                            사람 확인 승인
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#6E7570] font-medium">반영 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* STEP 2. 키오스크 모델 4종 (개당 400만원 동일) 및 BOM 단가 구조 */}
        <section className="bg-[#FDFCF9] border border-[#E2DDD2] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#232725] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#3D6B58] text-white text-base font-bold flex items-center justify-center">
                2
              </span>
              키오스크 4종 모델별 BOM 및 단가 구성 (전 모델 개당 400만 원 동일)
            </h2>
            <p className="text-base text-[#5C625E] mt-1">
              4개 모델에 공통으로 들어가는 부자재 4종은 <strong>동일 단가(합계 225만 원)</strong>가 적용되며, 크기·규격이 다른 <strong>터치패널과 외함(합계 175만 원)</strong>에서 단가를 맞춰 모든 모델이 <strong>개당 400만 원</strong>으로 동일합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {KIOSK_MODELS.map((model) => {
              const confirmedSum = orders
                .filter((o) => o.confirmed && o.modelId === model.id)
                .reduce((acc, o) => acc + o.quantity, 0)

              return (
                <div
                  key={model.id}
                  className="bg-[#F7F4ED] border border-[#DFD9CC] rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DDD2] pb-3">
                    <div>
                      <span className="font-mono font-bold text-base px-2.5 py-1 rounded-md bg-[#E4ECE8] text-[#2F5D48] mr-2">
                        {model.id}
                      </span>
                      <span className="font-bold text-lg text-[#232725]">
                        {model.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-[#3B5B7C] block">
                        모델 단가: {formatManWon(model.unitPrice)}
                      </span>
                      <span className="text-sm font-semibold text-[#2E6B4E]">
                        현재 확정 주문: {confirmedSum}대
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-base">
                    {model.bom.map((b) => {
                      const mat = materials.find((m) => m.id === b.materialId)
                      if (!mat) return null
                      const isCommon = mat.specType === '공통 부자재'
                      return (
                        <div
                          key={b.materialId}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border ${
                            isCommon
                              ? 'bg-[#FDFCF9] border-[#E5E0D5]'
                              : 'bg-[#EEF3F7] border-[#CBD9E6]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isCommon
                                  ? 'bg-[#E6E2D8] text-[#4A504C]'
                                  : 'bg-[#3B5B7C] text-white'
                              }`}
                            >
                              {isCommon ? '공통' : '규격별'}
                            </span>
                            <span className="font-semibold text-[#232725]">
                              {mat.name}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#2C302E]">
                            {formatManWon(mat.unitCost)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* STEP 3. 부자재 재고 대조 및 부족 수량 확인 */}
        <section className="bg-[#FDFCF9] border border-[#E2DDD2] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#232725] flex items-center gap-2.5">
              <Package className="w-6 h-6 text-[#3D6B58]" />
              부자재 재고 현황 및 발주 필요 수량 산출
            </h2>
            <p className="text-base text-[#5C625E] mt-1">
              확정된 주문 수량에 따른 부자재별 총 필요 수량과 창고 재고를 비교하여 부족한 수량을 자동 계산합니다.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr className="border-b-2 border-[#E2DDD2] text-[#4A504C] bg-[#F3EFE6]">
                  <th className="py-3.5 px-4 font-bold">구분</th>
                  <th className="py-3.5 px-4 font-bold">부자재명</th>
                  <th className="py-3.5 px-4 font-bold">지정 발주처</th>
                  <th className="py-3.5 px-4 text-right font-bold">부자재 단가</th>
                  <th className="py-3.5 px-4 text-right font-bold">총 필요수량</th>
                  <th className="py-3.5 px-4 text-right font-bold">현재 재고</th>
                  <th className="py-3.5 px-4 text-right font-bold">발주 필요 (부족분)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3D9]">
                {materialStatusList.map((m) => {
                  const isCommon = m.specType === '공통 부자재'
                  return (
                    <tr key={m.id} className="hover:bg-[#F7F4ED] transition">
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-sm font-bold px-2.5 py-1 rounded-md ${
                            isCommon
                              ? 'bg-[#E6E2D8] text-[#4A504C]'
                              : 'bg-[#DCE7F0] text-[#2D4B68]'
                          }`}
                        >
                          {isCommon ? '공통 단가' : '규격별 단가'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-lg text-[#232725]">
                        {m.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#4A504C] font-medium">
                        {m.supplierName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#3B5B7C]">
                        {formatManWon(m.unitCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-lg font-semibold text-[#232725]">
                        {m.requiredQty}개
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-lg text-[#5C625E]">
                        {m.stock}개
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-lg font-extrabold">
                        {m.shortageQty > 0 ? (
                          <span className="px-3 py-1 rounded-lg bg-[#FCEEEB] text-[#A83B2E] border border-[#F2C9C2]">
                            {m.shortageQty}개 발주 필요
                          </span>
                        ) : (
                          <span className="text-[#2E6B4E]">재고 충분</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* STEP 4. 발주처별 최종 발주서 메일 발송 (2차 사람 확인) */}
        <section className="bg-[#FDFCF9] border border-[#E2DDD2] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[#232725] flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#3D6B58] text-white text-base font-bold flex items-center justify-center">
                3
              </span>
              발주처별 자동 발주서 및 메일 발송 (2차 사람 확인)
            </h2>
            <p className="text-base text-[#5C625E] mt-1">
              부족한 부자재를 발주처별로 모았습니다. 최종 메일을 보내기 전에 <strong>담당자가 확인 체크를 완료해야</strong> 발송 버튼이 열립니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {supplierPOs.map((po) => (
              <div
                key={po.supplierName}
                className="bg-[#F7F4ED] border border-[#DFD9CC] rounded-2xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-[#E2DDD2] pb-3">
                    <div>
                      <h3 className="font-bold text-xl text-[#232725]">
                        {po.supplierName}
                      </h3>
                      <p className="text-base text-[#5C625E] flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-4 h-4 text-[#3B5B7C]" />
                        {po.supplierEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      {po.mailSent ? (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-[#E3F1E8] text-[#265E42] border border-[#B8DEC6]">
                          메일 발송 완료
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-[#EAE6DC] text-[#5C625E]">
                          발송 대기
                        </span>
                      )}
                      <div className="text-base font-bold text-[#3B5B7C] mt-1">
                        총 발주액: {formatManWon(po.totalOrderCost)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-base">
                    {po.items.map((item) => (
                      <div
                        key={item.materialId}
                        className="flex flex-wrap items-center justify-between bg-[#FDFCF9] px-4 py-3 rounded-xl border border-[#E5E0D5]"
                      >
                        <div>
                          <div className="text-[#232725] font-bold">
                            {item.materialName}
                          </div>
                          <div className="text-sm text-[#6E7570]">
                            단가 {formatManWon(item.unitCost)} · 필요 {item.requiredQty}개 / 재고 {item.currentStock}개
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <strong className="text-lg text-[#A83B2E] block">
                            발주 {item.orderQty}개
                          </strong>
                          <span className="text-sm text-[#4A504C] font-semibold">
                            ({formatManWon(item.subTotalCost)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2차 사람 확인 체크박스 + 메일 발송 버튼 */}
                <div className="pt-4 border-t border-[#E2DDD2] flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2.5 text-base font-bold text-[#2C302E] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      disabled={po.mailSent}
                      checked={po.humanConfirmed}
                      onChange={() => togglePoConfirm(po.supplierName)}
                      className="w-5 h-5 accent-[#3D6B58] rounded cursor-pointer"
                    />
                    <span>발주 내역 사람 최종 확인</span>
                  </label>

                  <button
                    type="button"
                    disabled={!po.humanConfirmed || po.mailSent}
                    onClick={() => handleSendMail(po.supplierName)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold transition ${
                      po.mailSent
                        ? 'bg-[#E3F1E8] text-[#265E42] cursor-default'
                        : po.humanConfirmed
                        ? 'bg-[#3D6B58] hover:bg-[#2F5646] text-white cursor-pointer shadow-xs'
                        : 'bg-[#E2DDD2] text-[#8C918D] cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {po.mailSent ? '발송 완료됨' : '발주서 메일 보내기'}
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
