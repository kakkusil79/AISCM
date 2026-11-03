import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Eye,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Layers,
  Mail,
  Package,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserCheck,
} from 'lucide-react'
import {
  INITIAL_MATERIALS,
  INITIAL_ORDERS,
  KIOSK_MODELS,
  checkQuantityError,
} from './data/mockScmData'
import type { BuyerOrder, KioskModelId, SupplierPO } from './types/scm'

interface SampleDraggableFile {
  id: string
  fileName: string
  fileType: 'PDF' | 'EXCEL'
  buyerName: string
  modelId: KioskModelId
  quantity: number
  suggestedQty: number
  dueDate: string
  badgeText: string
}

const SAMPLE_DRAGGABLE_FILES: SampleDraggableFile[] = [
  {
    id: 'SAMPLE-1',
    fileName: '투썸플레이스_표준키오스크_발주서(35대).pdf',
    fileType: 'PDF',
    buyerName: '투썸플레이스 가맹본부',
    modelId: 'KSK-21',
    quantity: 35,
    suggestedQty: 35,
    dueDate: '2026-11-24',
    badgeText: '정상 수량 (35대)',
  },
  {
    id: 'SAMPLE-2',
    fileName: '컴포즈커피_미니키오스크_주문서(2대_오타).xlsx',
    fileType: 'EXCEL',
    buyerName: '컴포즈커피 코리아',
    modelId: 'KSK-15',
    quantity: 2,
    suggestedQty: 20,
    dueDate: '2026-11-21',
    badgeText: '과소 수량 오류 (2대)',
  },
  {
    id: 'SAMPLE-3',
    fileName: '롯데시네마_대화면키오스크_발주(990대_오타).pdf',
    fileType: 'PDF',
    buyerName: '롯데시네마 멀티플렉스',
    modelId: 'KSK-27',
    quantity: 990,
    suggestedQty: 30,
    dueDate: '2026-11-26',
    badgeText: '이상 수량 오타 (990대)',
  },
  {
    id: 'SAMPLE-4',
    fileName: '파리바게뜨_빌트인키오스크_발주서(15대).xlsx',
    fileType: 'EXCEL',
    buyerName: '파리바게뜨 SPC본사',
    modelId: 'KSK-32',
    quantity: 15,
    suggestedQty: 15,
    dueDate: '2026-11-28',
    badgeText: '정상 수량 (15대)',
  },
]

function formatCurrency(won: number): string {
  const man = won / 10000
  if (man >= 10000) {
    const eok = Math.floor(man / 10000)
    const restMan = man % 10000
    return restMan > 0
      ? `${eok}억 ${restMan.toLocaleString()}만 원`
      : `${eok}억 원`
  }
  return `${man.toLocaleString()}만 원`
}

function App() {
  const [orders, setOrders] = useState<BuyerOrder[]>(INITIAL_ORDERS)
  const [materials] = useState(INITIAL_MATERIALS)
  const [selectedModelTab, setSelectedModelTab] = useState<KioskModelId | 'ALL'>('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [previewMailSupplier, setPreviewMailSupplier] = useState<string | null>(null)

  // 드래그 앤 드롭 상태
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [uploadNotice, setUploadNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 오류 주문 수량 수정용 입력 상태
  const [editQtyMap, setEditQtyMap] = useState<Record<string, string>>({
    'ORD-01': '20',
    'ORD-02': '25',
    'ORD-03': '10',
  })

  // 신규 주문 수동 추가 상태
  const [newBuyer, setNewBuyer] = useState('')
  const [newModel, setNewModel] = useState<KioskModelId>('KSK-21')
  const [newQty, setNewQty] = useState('')
  const [newDue, setNewDue] = useState('2026-11-25')

  // 발주처별 2차 사람 확인 및 메일 발송 상태
  const [poConfirmMap, setPoConfirmMap] = useState<Record<string, boolean>>({})
  const [poSentMap, setPoSentMap] = useState<Record<string, boolean>>({})

  const showUploadBanner = (msg: string) => {
    setUploadNotice(msg)
    setTimeout(() => {
      setUploadNotice((prev) => (prev === msg ? null : prev))
    }, 4500)
  }

  // 주문서 객체 등록 공통 헬퍼
  const registerParsedOrder = (params: {
    buyerName: string
    modelId: KioskModelId
    quantity: number
    suggestedQty?: number
    dueDate: string
    sourceLabel: string
  }) => {
    const err = checkQuantityError(params.quantity)
    const nextId = `ORD-${String(orders.length + 1).padStart(2, '0')}`
    const created: BuyerOrder = {
      id: nextId,
      buyerName: params.buyerName,
      modelId: params.modelId,
      quantity: params.quantity,
      dueDate: params.dueDate,
      errorMsg: err,
      confirmed: !err,
    }

    setOrders((prev) => [created, ...prev])
    if (err) {
      const fallbackSuggest =
        params.suggestedQty ??
        (params.quantity <= 0 ? 10 : params.quantity < 5 ? 20 : 25)
      setEditQtyMap((prev) => ({
        ...prev,
        [nextId]: String(fallbackSuggest),
      }))
      showUploadBanner(
        `📄 [${params.sourceLabel}] 주문서 분석 완료 — 이상 수량(${params.quantity}대)이 감지되어 1차 사람 확인 대기 목록에 추가되었습니다.`
      )
    } else {
      showUploadBanner(
        `✅ [${params.sourceLabel}] 주문서 분석 완료 — ${params.buyerName} (${params.modelId} · ${params.quantity}대) 정상 등록되어 BOM 및 재고에 반영되었습니다.`
      )
    }
    setPoConfirmMap({})
    setPoSentMap({})
  }

  // 샘플 주문서 카드 드래그 시작
  const handleSampleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    sample: SampleDraggableFile
  ) => {
    e.dataTransfer.setData('application/x-sample-order', JSON.stringify(sample))
    e.dataTransfer.effectAllowed = 'copy'
  }

  // 드롭존에 파일 또는 샘플 카드 드롭 시 처리
  const handleDropZoneDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)

    // 1. 화면 내 샘플 주문서 카드를 드래그해서 놓은 경우
    const sampleJson = e.dataTransfer.getData('application/x-sample-order')
    if (sampleJson) {
      try {
        const sample = JSON.parse(sampleJson) as SampleDraggableFile
        registerParsedOrder({
          buyerName: sample.buyerName,
          modelId: sample.modelId,
          quantity: sample.quantity,
          suggestedQty: sample.suggestedQty,
          dueDate: sample.dueDate,
          sourceLabel: sample.fileName,
        })
        return
      } catch {
        // ignore parse error
      }
    }

    // 2. 내 컴퓨터의 실제 파일(PDF, Excel 등)을 드래그해서 놓은 경우
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleRealFilesUpload(e.dataTransfer.files)
    }
  }

  // 실제 파일 선택 또는 드롭 처리 (파일명에서 업체명·모델·수량 스마트 추출)
  const handleRealFilesUpload = (fileList: FileList) => {
    const models: KioskModelId[] = ['KSK-15', 'KSK-21', 'KSK-27', 'KSK-32']

    Array.from(fileList).forEach((file, idx) => {
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      const parts = baseName.split(/[_\-\s]+/)
      const extractedBuyer =
        parts[0] && parts[0].length >= 2
          ? `${parts[0]} (파일업로드)`
          : `신규바이어_${orders.length + idx + 1}`

      // 파일명에 15, 21, 27, 32가 포함되어 있으면 모델 매칭
      let matchedModel: KioskModelId = models[(orders.length + idx) % models.length]
      if (baseName.includes('15')) matchedModel = 'KSK-15'
      else if (baseName.includes('21')) matchedModel = 'KSK-21'
      else if (baseName.includes('27')) matchedModel = 'KSK-27'
      else if (baseName.includes('32')) matchedModel = 'KSK-32'

      // 파일명에서 숫자(대수) 추출, 없으면 데모용으로 2대(과소 오류) 또는 20대(정상) 부여
      const numMatch = baseName.replace(/15|21|27|32/g, '').match(/-?\d+/)
      const extractedQty = numMatch
        ? Number(numMatch[0])
        : idx % 2 === 0
        ? 3 // 사람 확인 유도용 과소 수량(3대)
        : 20

      registerParsedOrder({
        buyerName: extractedBuyer,
        modelId: matchedModel,
        quantity: extractedQty,
        dueDate: '2026-11-25',
        sourceLabel: file.name,
      })
    })
  }

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

  // 신규 주문서 수동 추가
  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBuyer.trim() || !newQty) return
    registerParsedOrder({
      buyerName: newBuyer.trim(),
      modelId: newModel,
      quantity: Number(newQty),
      dueDate: newDue,
      sourceLabel: '수기 입력 주문서',
    })
    setNewBuyer('')
    setNewQty('')
    setShowAddForm(false)
  }

  const handleReset = () => {
    setOrders(INITIAL_ORDERS)
    setEditQtyMap({
      'ORD-01': '20',
      'ORD-02': '25',
      'ORD-03': '10',
    })
    setPoConfirmMap({})
    setPoSentMap({})
    setUploadNotice(null)
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
    if (!poConfirmMap[supplierName]) return
    setPoSentMap((prev) => ({
      ...prev,
      [supplierName]: true,
    }))
  }

  // 요약 수치
  const pendingOrdersCount = orders.filter((o) => !o.confirmed).length
  const confirmedOrders = orders.filter((o) => o.confirmed)
  const totalConfirmedUnits = confirmedOrders.reduce((s, o) => s + o.quantity, 0)
  const shortageMaterialsCount = materialStatusList.filter(
    (m) => m.shortageQty > 0
  ).length
  const sentPoCount = supplierPOs.filter((p) => p.mailSent).length

  return (
    <div className="min-h-screen pb-16">
      {/* 상단 모던 내비게이션 바 */}
      <header className="sticky top-0 z-30 bg-[#F6F5F0]/85 backdrop-blur-md border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-extrabold text-stone-900 tracking-tight">
                  AI-SCM 키오스크 발주 관리
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  이중 휴먼 컨펌
                </span>
              </div>
              <p className="text-sm text-stone-500">
                바이어 주문 이상치 사람 확인 → 4종 모델 BOM·재고 자동 대조 → 발주처 메일 사람 확인 후 발송
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-base font-bold transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              수기 주문 입력
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/90 text-base font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-stone-500" />
              초기화
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-7 space-y-9">
        {/* 상단 핵심 요약 KPI 카드 4개 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold text-stone-500">
                1차 사람 확인 대기 주문
              </span>
              <div className="text-3xl font-extrabold text-amber-700 mt-1">
                {pendingOrdersCount}건
              </div>
              <span className="text-sm text-stone-500 mt-1 block">
                수량 오타·음수·과소 감지
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold text-stone-500">
                확정된 키오스크 수주량
              </span>
              <div className="text-3xl font-extrabold text-stone-900 mt-1">
                {totalConfirmedUnits}대
              </div>
              <span className="text-sm text-teal-700 font-semibold mt-1 block">
                총 {formatCurrency(totalConfirmedUnits * 4000000)} (개당 400만)
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold text-stone-500">
                재고 부족 부자재 품목
              </span>
              <div className="text-3xl font-extrabold text-rose-700 mt-1">
                {shortageMaterialsCount}종
              </div>
              <span className="text-sm text-stone-500 mt-1 block">
                전체 {materials.length}종 부자재 중 발주 필요
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-700">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] flex items-start justify-between">
            <div>
              <span className="text-sm font-semibold text-stone-500">
                2차 발주서 메일 발송
              </span>
              <div className="text-3xl font-extrabold text-stone-900 mt-1">
                {sentPoCount}{' '}
                <span className="text-xl font-semibold text-stone-400">
                  / {supplierPOs.length}곳
                </span>
              </div>
              <span className="text-sm text-stone-500 mt-1 block">
                담당자 최종 확인 후 발송
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
              <Mail className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* 바이어 주문서 드래그 앤 드롭 업로드 존 */}
        <section className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 flex items-center gap-2">
                <UploadCloud className="w-6 h-6 text-teal-700" />
                바이어 주문서 드래그 앤 드롭 접수
              </h2>
              <p className="text-base text-stone-500 mt-0.5">
                바이어에게 받은 주문서 파일(PDF·엑셀)을 아래 점선 영역에 끌어다 놓거나, 우측의 <strong>샘플 주문서 파일 카드를 마우스로 드래그해서</strong> 놓아보세요.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 좌측: 드롭존 (7칸) */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingOver(true)
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropZoneDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`lg:col-span-7 rounded-2xl border-2 border-dashed p-7 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                isDraggingOver
                  ? 'border-teal-700 bg-teal-50/70 scale-[1.01]'
                  : 'border-stone-300 bg-[#FAF9F5] hover:border-teal-700/60 hover:bg-stone-100/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleRealFilesUpload(e.target.files)
                    e.target.value = ''
                  }
                }}
                className="hidden"
              />
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition ${
                  isDraggingOver
                    ? 'bg-teal-700 text-white'
                    : 'bg-white border border-stone-200 text-teal-800 shadow-xs'
                }`}
              >
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-lg font-extrabold text-stone-900">
                {isDraggingOver
                  ? '여기에 주문서 파일을 놓아주세요!'
                  : '바이어 주문서 파일을 이곳에 드래그하거나 클릭하여 업로드'}
              </p>
              <p className="text-sm text-stone-500 mt-1">
                지원 형식: PDF, Excel (.xlsx, .csv) · 업로드 즉시 업체명, 모델명, 수량, 납기를 자동 추출합니다
              </p>
            </div>

            {/* 우측: 마우스로 끌어서 테스트할 수 있는 샘플 주문서 파일 4종 (5칸) */}
            <div className="lg:col-span-5 bg-[#FAF9F5] border border-stone-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-stone-700">
                  💡 테스트용 가상 주문서 파일 (끌어서 왼쪽에 놓거나 클릭)
                </span>
              </div>

              <div className="space-y-2">
                {SAMPLE_DRAGGABLE_FILES.map((sample) => {
                  const isErr = sample.quantity < 5 || sample.quantity > 200
                  return (
                    <div
                      key={sample.id}
                      draggable
                      onDragStart={(e) => handleSampleDragStart(e, sample)}
                      onClick={() =>
                        registerParsedOrder({
                          buyerName: sample.buyerName,
                          modelId: sample.modelId,
                          quantity: sample.quantity,
                          suggestedQty: sample.suggestedQty,
                          dueDate: sample.dueDate,
                          sourceLabel: sample.fileName,
                        })
                      }
                      className="group bg-white hover:bg-teal-50/40 border border-stone-200/90 hover:border-teal-700/50 rounded-xl p-3 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition shadow-[0_1px_6px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-stone-400 shrink-0 group-hover:text-teal-700" />
                        {sample.fileType === 'PDF' ? (
                          <FileText className="w-5 h-5 text-rose-600 shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="text-sm font-bold text-stone-900 truncate">
                            {sample.fileName}
                          </div>
                          <div className="text-xs text-stone-500">
                            {sample.buyerName} · {sample.modelId} · 납기 {sample.dueDate}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
                          isErr
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-teal-50 text-teal-800'
                        }`}
                      >
                        {sample.badgeText}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 업로드 완료 피드백 배너 */}
          {uploadNotice && (
            <div className="bg-teal-900 text-white px-5 py-3.5 rounded-2xl text-base font-bold flex items-center justify-between shadow-sm">
              <span>{uploadNotice}</span>
              <button
                type="button"
                onClick={() => setUploadNotice(null)}
                className="text-teal-200 hover:text-white text-sm ml-4 cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>
          )}
        </section>

        {/* 신규 주문 수기 등록 폼 */}
        {showAddForm && (
          <form
            onSubmit={handleAddOrder}
            className="bg-white border-2 border-teal-700/30 rounded-2xl p-6 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-700" />
                바이어 주문서 수기 입력 등록
              </h3>
              <span className="text-sm text-stone-500">
                수량에 1~4(과소), 201 이상(과다), 음수를 입력하면 1차 사람 확인 대상으로 분류됩니다.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                required
                placeholder="바이어 업체명 (예: 투썸플레이스)"
                value={newBuyer}
                onChange={(e) => setNewBuyer(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-base text-stone-900 focus:outline-none focus:border-teal-700"
              />
              <select
                value={newModel}
                onChange={(e) => setNewModel(e.target.value as KioskModelId)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-base text-stone-900 focus:outline-none focus:border-teal-700"
              >
                {KIOSK_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} · {m.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="수량 입력 (예: 2 또는 999)"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-base text-stone-900 focus:outline-none focus:border-teal-700"
              />
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-base text-stone-900 focus:outline-none focus:border-teal-700"
              />
              <button
                type="submit"
                className="bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl px-5 py-2.5 text-base transition cursor-pointer"
              >
                주문 접수하기
              </button>
            </div>
          </form>
        )}

        {/* STEP 1. 바이어 주문서 접수 및 1차 사람 확인 */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">
                  1
                </span>
                Step 1 · Human-in-the-Loop
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
                접수된 바이어 주문서 및 이상 수량 확인 ({orders.length}건)
              </h2>
            </div>
            <p className="text-base text-stone-600">
              오류 의심 수량은 자동 보류됩니다. 담당자가 정확한 수량을 확인한 뒤 승인해 주세요.
            </p>
          </div>

          <div className="space-y-3">
            {orders.map((ord) => {
              const modelObj = KIOSK_MODELS.find((m) => m.id === ord.modelId)
              const isPending = !ord.confirmed

              return (
                <div
                  key={ord.id}
                  className={`rounded-2xl p-5 transition border ${
                    isPending
                      ? 'bg-[#FFFDF9] border-amber-300/90 shadow-[0_4px_20px_-4px_rgba(180,83,9,0.08)]'
                      : 'bg-white border-stone-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* 좌측: 주문 기본 정보 */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-stone-400">
                          {ord.id}
                        </span>
                        <h3 className="text-xl font-extrabold text-stone-900">
                          {ord.buyerName}
                        </h3>
                        <span className="px-3 py-1 rounded-lg bg-stone-100 text-stone-800 font-semibold text-sm border border-stone-200/80">
                          {ord.modelId} · {modelObj?.name}
                        </span>
                        <span className="text-sm text-stone-500 font-medium">
                          납기일: <strong className="text-stone-700">{ord.dueDate}</strong>
                        </span>
                      </div>

                      {/* 상태 메시지 */}
                      {isPending ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-base font-semibold">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span>
                            원본 수량 <strong className="underline">{ord.quantity}대</strong> 감지 — {ord.errorMsg}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-teal-800 text-base font-semibold">
                          <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          <span>
                            수량 검증 완료 · 주문 금액{' '}
                            <strong>{formatCurrency(ord.quantity * 4000000)}</strong> (단가 400만 원 × {ord.quantity}대)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 우측: 수량 수정 및 사람 확인 액션 */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isPending ? (
                        <div className="flex flex-wrap items-center gap-2.5 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                          <span className="text-sm font-bold text-amber-900 pl-1">
                            정정 수량:
                          </span>
                          <div className="relative flex items-center">
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
                              className="w-24 bg-white border-2 border-amber-400 rounded-xl px-3 py-1.5 text-right font-mono text-lg font-extrabold text-stone-900 focus:outline-none focus:border-amber-600"
                            />
                            <span className="ml-1.5 mr-1 text-base font-bold text-stone-700">
                              대
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(ord.id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-base font-bold transition cursor-pointer shadow-xs"
                          >
                            <UserCheck className="w-5 h-5" />
                            사람 확인 승인
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs text-stone-400 block font-semibold">
                              확정 수량
                            </span>
                            <span className="text-2xl font-extrabold text-stone-900 font-mono">
                              {ord.quantity}대
                            </span>
                          </div>
                          <span className="px-3.5 py-2 rounded-xl bg-stone-100 text-stone-600 text-sm font-bold">
                            승인 완료
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* STEP 2. 키오스크 4종 모델 (개당 400만 원) & 부자재 재고 대조 */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Step 2 · BOM & Inventory Check
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
                4종 모델 BOM 단가 구성 (개당 400만 원) 및 부자재 재고 현황
              </h2>
            </div>
            <p className="text-base text-stone-600">
              공통 부자재 4종은 <strong>동일 단가(합계 225만 원)</strong>, 크기·규격이 다른 부자재 2종에서 단가를 맞춰 <strong>모든 모델이 400만 원</strong>입니다.
            </p>
          </div>

          {/* 4개 모델 모던 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {KIOSK_MODELS.map((model) => {
              const confirmedSum = orders
                .filter((o) => o.confirmed && o.modelId === model.id)
                .reduce((acc, o) => acc + o.quantity, 0)
              const isSelected = selectedModelTab === model.id

              return (
                <div
                  key={model.id}
                  onClick={() =>
                    setSelectedModelTab(isSelected ? 'ALL' : model.id)
                  }
                  className={`bg-white rounded-2xl p-5 border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-700 ring-2 ring-teal-700/20 shadow-md'
                      : 'border-stone-200/90 hover:border-stone-300 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-lg bg-stone-100 text-stone-800 font-mono font-extrabold text-sm">
                        {model.id}
                      </span>
                      <span className="text-base font-extrabold text-teal-800">
                        단가 400만 원
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold text-stone-900">
                        {model.name}
                      </h3>
                      <p className="text-sm font-semibold text-stone-500 mt-0.5">
                        현재 확정 주문:{' '}
                        <strong className="text-teal-700">{confirmedSum}대</strong>
                      </p>
                    </div>

                    {/* 단가 비율 바 (공통 225만 + 규격 175만 = 400만) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden flex">
                        <div
                          className="bg-stone-600 h-full"
                          style={{ width: '56.25%' }}
                          title="공통 부자재 225만 원"
                        />
                        <div
                          className="bg-teal-600 h-full"
                          style={{ width: '43.75%' }}
                          title="규격별 부자재 175만 원"
                        />
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-stone-500">
                        <span>● 공통 4종: 225만</span>
                        <span className="text-teal-800">● 규격별 2종: 175만</span>
                      </div>
                    </div>

                    {/* 해당 모델의 BOM 리스트 */}
                    <div className="pt-2 border-t border-stone-100 space-y-1.5 text-sm">
                      {model.bom.map((b) => {
                        const mat = materials.find((m) => m.id === b.materialId)
                        if (!mat) return null
                        const isCommon = mat.specType === '공통 부자재'
                        return (
                          <div
                            key={b.materialId}
                            className="flex items-center justify-between py-0.5"
                          >
                            <span
                              className={`truncate ${
                                isCommon
                                  ? 'text-stone-600'
                                  : 'text-teal-900 font-bold'
                              }`}
                            >
                              {isCommon ? '· ' : '★ '}
                              {mat.name.replace(' (공용)', '')}
                            </span>
                            <span className="font-mono font-bold text-stone-800 shrink-0 ml-2">
                              {(mat.unitCost / 10000).toLocaleString()}만
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 부자재 재고 및 부족 수량 모던 카드 테이블 */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-4 bg-stone-50/80 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-800" />
                <h3 className="text-lg font-extrabold text-stone-900">
                  부자재별 실시간 재고 대조 및 발주 필요 수량
                </h3>
              </div>
              <span className="text-sm text-stone-500">
                총 필요 수량 대비 창고 재고가 부족한 품목은 자동으로 발주서에 담깁니다.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-base">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 text-sm bg-stone-50/40">
                    <th className="py-3.5 px-5 font-bold">구분</th>
                    <th className="py-3.5 px-5 font-bold">부자재 품명</th>
                    <th className="py-3.5 px-5 font-bold">발주처</th>
                    <th className="py-3.5 px-5 text-right font-bold">개당 단가</th>
                    <th className="py-3.5 px-5 text-right font-bold">총 필요수량</th>
                    <th className="py-3.5 px-5 text-right font-bold">현재 창고재고</th>
                    <th className="py-3.5 px-5 font-bold w-44">재고 충당률</th>
                    <th className="py-3.5 px-5 text-right font-bold">발주 필요 수량</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70">
                  {materialStatusList.map((m) => {
                    const isCommon = m.specType === '공통 부자재'
                    const ratio =
                      m.requiredQty > 0
                        ? Math.min(100, Math.round((m.stock / m.requiredQty) * 100))
                        : 100
                    const isShort = m.shortageQty > 0

                    return (
                      <tr
                        key={m.id}
                        className={`transition ${
                          isShort ? 'bg-rose-50/25 hover:bg-rose-50/50' : 'hover:bg-stone-50/80'
                        }`}
                      >
                        <td className="py-4 px-5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isCommon
                                ? 'bg-stone-200/80 text-stone-700'
                                : 'bg-teal-50 text-teal-800 border border-teal-200/80'
                            }`}
                          >
                            {isCommon ? '공통 단가' : '규격별 단가'}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-extrabold text-stone-900 text-lg">
                          {m.name}
                        </td>
                        <td className="py-4 px-5 text-stone-600 font-semibold">
                          {m.supplierName}
                        </td>
                        <td className="py-4 px-5 text-right font-mono font-bold text-stone-800">
                          {formatCurrency(m.unitCost)}
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-lg font-bold text-stone-900">
                          {m.requiredQty}개
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-lg text-stone-600 font-semibold">
                          {m.stock}개
                        </td>
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <div className="h-2.5 w-full rounded-full bg-stone-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isShort ? 'bg-rose-500' : 'bg-teal-600'
                                }`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-stone-500 block">
                              {m.requiredQty === 0
                                ? '소요 없음'
                                : `재고 충당 ${ratio}%`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isShort ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-100/90 text-rose-800 font-mono text-base font-extrabold border border-rose-200">
                              +{m.shortageQty}개 발주
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-bold text-base">
                              <Check className="w-4 h-4" />
                              재고 충분
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* STEP 3. 발주처별 자동 발주서 및 최종 메일 발송 (2차 사람 확인) */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 uppercase tracking-wide">
                <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center text-xs">
                  3
                </span>
                Step 3 · Final Human Confirmation & Email
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900 mt-1">
                발주처별 자동 발주서(PO) 및 최종 메일 발송
              </h2>
            </div>
            <p className="text-base text-stone-600">
              최종 발주서 메일을 보내기 전에 <strong>담당자가 발주 내역을 확인(체크)</strong>해야 발송 버튼이 활성화됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {supplierPOs.map((po) => {
              const isPreviewOpen = previewMailSupplier === po.supplierName

              return (
                <div
                  key={po.supplierName}
                  className={`bg-white rounded-2xl border transition flex flex-col justify-between overflow-hidden ${
                    po.mailSent
                      ? 'border-teal-300 shadow-xs'
                      : po.humanConfirmed
                      ? 'border-teal-700/60 shadow-md'
                      : 'border-stone-200/90 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {/* 카드 상단 헤더 */}
                  <div>
                    <div className="p-6 border-b border-stone-100 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-extrabold text-stone-900">
                              {po.supplierName}
                            </h3>
                            {po.mailSent ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                                메일 발송 완료
                              </span>
                            ) : po.humanConfirmed ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                사람 확인됨 · 발송 가능
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
                                2차 확인 대기
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1 font-mono">
                            <Mail className="w-4 h-4 text-stone-400" />
                            {po.supplierEmail}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-stone-400 block">
                          총 발주 합계금액
                        </span>
                        <span className="text-2xl font-extrabold text-teal-800 font-mono">
                          {formatCurrency(po.totalOrderCost)}
                        </span>
                      </div>
                    </div>

                    {/* 발주 부자재 목록 */}
                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-400 uppercase pb-1">
                        <span>발주 부자재 품목 ({po.items.length}종)</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewMailSupplier(
                              isPreviewOpen ? null : po.supplierName
                            )
                          }
                          className="inline-flex items-center gap-1 text-teal-700 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isPreviewOpen ? '메일 미리보기 닫기' : '발주 메일 전문 보기'}
                        </button>
                      </div>

                      {po.items.map((item) => (
                        <div
                          key={item.materialId}
                          className="flex items-center justify-between bg-stone-50/90 border border-stone-200/70 rounded-xl px-4 py-3"
                        >
                          <div>
                            <div className="font-bold text-stone-900 text-base">
                              {item.materialName}
                            </div>
                            <div className="text-sm text-stone-500">
                              단가 {formatCurrency(item.unitCost)} · 필요{' '}
                              {item.requiredQty}개 (현재 재고 {item.currentStock}개)
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-lg font-extrabold text-rose-700">
                              {item.orderQty}개 발주
                            </div>
                            <div className="text-sm font-bold text-stone-600">
                              {formatCurrency(item.subTotalCost)}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 이메일 본문 미리보기 토글 영역 */}
                      {isPreviewOpen && (
                        <div className="mt-3 p-4 rounded-xl bg-stone-900 text-stone-100 text-sm font-mono space-y-1.5 leading-relaxed">
                          <div className="text-teal-300 font-bold">
                            수신: {po.supplierEmail} ({po.supplierName} 발주담당자 귀하)
                          </div>
                          <div className="text-stone-300 border-b border-stone-700 pb-2">
                            제목: [발주서] 키오스크 생산 부자재 발주 요청의 건 ({po.supplierName})
                          </div>
                          <div className="pt-1 text-stone-200 whitespace-pre-line">
                            {`안녕하십니까, ${po.supplierName} 담당자님.\n키오스크 수주 확정에 따라 아래 부자재 발주를 요청드립니다.\n\n` +
                              po.items
                                .map(
                                  (i) =>
                                    `• ${i.materialName}: ${i.orderQty}개 (단가 ${formatCurrency(
                                      i.unitCost
                                    )} / 소계 ${formatCurrency(i.subTotalCost)})`
                                )
                                .join('\n') +
                              `\n\n총 발주 금액: ${formatCurrency(
                                po.totalOrderCost
                              )}\n납기 일정 내 입고 부탁드립니다. 감사합니다.`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 하단 2차 사람 확인 & 발송 액션 바 */}
                  <div className="px-6 py-4 bg-stone-50 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={po.mailSent}
                        checked={po.humanConfirmed}
                        onChange={() => togglePoConfirm(po.supplierName)}
                        className="w-5 h-5 accent-teal-800 rounded cursor-pointer"
                      />
                      <span className="text-base font-bold text-stone-800">
                        발주 수량·금액 사람 최종 확인 완료
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!po.humanConfirmed || po.mailSent}
                      onClick={() => handleSendMail(po.supplierName)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-bold transition ${
                        po.mailSent
                          ? 'bg-teal-100 text-teal-800 cursor-default'
                          : po.humanConfirmed
                          ? 'bg-teal-800 hover:bg-teal-900 text-white cursor-pointer shadow-sm'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {po.mailSent ? (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          메일 발송 완료됨
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          발주서 메일 보내기
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
