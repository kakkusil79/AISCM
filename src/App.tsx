import { useMemo, useRef, useState } from 'react'
import {
  Anchor,
  Compass,
  Crown,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gem,
  GripVertical,
  MapPin,
  Plus,
  Printer,
  RotateCcw,
  ScrollText,
  Send,
  Ship,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  INITIAL_MATERIALS,
  INITIAL_ORDERS,
  KIOSK_MODELS,
  SUPPLIER_MAP,
  checkQuantityError,
} from './data/mockScmData'
import type { BuyerOrder, KioskModelId, SupplierPO } from './types/scm'

interface SampleDraggableFile {
  id: string
  fileName: string
  fileType: 'PDF' | 'EXCEL'
  docNo: string
  buyerName: string
  buyerBizNo: string
  buyerCeo: string
  buyerManager: string
  buyerPhone: string
  deliveryPlace: string
  modelId: KioskModelId
  quantity: number
  suggestedQty: number
  dueDate: string
  docMemo: string
  badgeText: string
}

const SAMPLE_DRAGGABLE_FILES: SampleDraggableFile[] = [
  {
    id: 'SAMPLE-1',
    fileName: '🍾 투썸왕국_표준키오스크_의뢰서(35대).pdf',
    fileType: 'PDF',
    docNo: 'TWS-PO-2026-1108',
    buyerName: '투썸플레이스 가맹본부',
    buyerBizNo: '201-86-39104',
    buyerCeo: '문영주',
    buyerManager: '김민수 과장',
    buyerPhone: '02-2051-3090',
    deliveryPlace: '경기도 이천시 마장면 덕평로 통합물류센터 2동',
    modelId: 'KSK-21',
    quantity: 35,
    suggestedQty: 35,
    dueDate: '2026-11-24',
    docMemo: '수도권 직영·가맹 리뉴얼 매장 35개점 표준 21인치 키오스크 납품건',
    badgeText: '✨ 정상 보물 의뢰 (35대)',
  },
  {
    id: 'SAMPLE-2',
    fileName: '☠️ 컴포즈길드_미니키오스크_함정문서(2대).xlsx',
    fileType: 'EXCEL',
    docNo: 'CMP-202611-042',
    buyerName: '컴포즈커피 코리아(주)',
    buyerBizNo: '605-86-11290',
    buyerCeo: '김진성',
    buyerManager: '박지훈 대리',
    buyerPhone: '051-744-8820',
    deliveryPlace: '경상남도 김해시 주촌면 골든루트로 물류허브',
    modelId: 'KSK-15',
    quantity: 2,
    suggestedQty: 20,
    dueDate: '2026-11-21',
    docMemo:
      '영남권 신규 오픈 매장 20개점 카운터형 키오스크 일괄 발주건 (엑셀 입력 시 20대가 2대로 잘못 기재됨)',
    badgeText: '💀 저주받은 과소수량 (2대)',
  },
  {
    id: 'SAMPLE-3',
    fileName: '☠️ 롯데시네마_대화면키오스크_오타문서(990대).pdf',
    fileType: 'PDF',
    docNo: 'LTC-PO-261109',
    buyerName: '롯데시네마 멀티플렉스',
    buyerBizNo: '215-85-99102',
    buyerCeo: '최병환',
    buyerManager: '정다은 차장',
    buyerPhone: '02-3470-3500',
    deliveryPlace: '서울특별시 송파구 올림픽로 300 월드타워 시네마 물류실',
    modelId: 'KSK-27',
    quantity: 990,
    suggestedQty: 30,
    dueDate: '2026-11-26',
    docMemo:
      '전국 주요 극장 티켓 무인발권기 30대 교체 발주 (담당자 키보드 오타로 990대로 입력됨)',
    badgeText: '💀 거대 숫자 괴물 (990대)',
  },
  {
    id: 'SAMPLE-4',
    fileName: '🍾 파리바게뜨_빌트인키오스크_의뢰서(15대).xlsx',
    fileType: 'EXCEL',
    docNo: 'SPC-PB-2026-77',
    buyerName: '파리바게뜨 SPC본사',
    buyerBizNo: '129-81-03291',
    buyerCeo: '황재복',
    buyerManager: '오현우 팀장',
    buyerPhone: '02-2276-6100',
    deliveryPlace: '경기도 성남시 중원구 사기막골로 SPC물류센터',
    modelId: 'KSK-32',
    quantity: 15,
    suggestedQty: 15,
    dueDate: '2026-11-28',
    docMemo: '대형 플래그십 스토어 15개점 매립형 32인치 와이드 키오스크 정식 발주',
    badgeText: '✨ 정상 보물 의뢰 (15대)',
  },
]

const ISLAND_META: Record<
  string,
  { islandTitle: string; emoji: string; desc: string }
> = {
  한빛디스플레이: {
    islandTitle: '빛의 수정섬 (한빛디스플레이 길드)',
    emoji: '🔮',
    desc: '신비한 15·21·27·32인치 마법 터치패널 유물을 깎아내는 수정 장인들의 섬',
  },
  코리아임베디드: {
    islandTitle: '강철 심장섬 (코리아임베디드 길드)',
    emoji: '⚙️',
    desc: '키오스크의 두뇌인 통합 메인보드와 고효율 마력 전원장치를 벼려내는 기계섬',
  },
  페이먼트테크: {
    islandTitle: '황금 주화섬 (페이먼트테크 길드)',
    emoji: '🪙',
    desc: '황금 카드 리더기와 영수증 두루마리 인쇄기를 제작하는 상인 길드의 본거지',
  },
  정밀메탈웍스: {
    islandTitle: '무쇠 대장간섬 (정밀메탈웍스 길드)',
    emoji: '🛡️',
    desc: '어떤 폭풍우도 견디는 키오스크 강철 외함 갑옷을 두드리는 드워프 대장간섬',
  },
}

function formatCurrency(won: number): string {
  const man = won / 10000
  if (man >= 10000) {
    const eok = Math.floor(man / 10000)
    const restMan = man % 10000
    return restMan > 0
      ? `${eok}억 ${restMan.toLocaleString()}만 골드(원)`
      : `${eok}억 골드(원)`
  }
  return `${man.toLocaleString()}만 골드(원)`
}

function App() {
  const [orders, setOrders] = useState<BuyerOrder[]>(INITIAL_ORDERS)
  const [materials] = useState(INITIAL_MATERIALS)
  const [selectedModelTab, setSelectedModelTab] = useState<KioskModelId | 'ALL'>('ALL')
  const [showAddForm, setShowAddForm] = useState(false)

  // 문서 열람 모달 상태
  const [viewingBuyerOrderId, setViewingBuyerOrderId] = useState<string | null>(null)
  const [viewingSupplierPoName, setViewingSupplierPoName] = useState<string | null>(null)
  const [showDocArchiveModal, setShowDocArchiveModal] = useState(false)
  const [archiveTab, setArchiveTab] = useState<'BUYER_ORDER' | 'SUPPLIER_PO'>('BUYER_ORDER')
  const [archiveSelectedOrderId, setArchiveSelectedOrderId] = useState<string>('ORD-01')
  const [archiveSelectedPoSupplier, setArchiveSelectedPoSupplier] = useState<string>('한빛디스플레이')

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
    docNo?: string
    buyerName: string
    buyerBizNo?: string
    buyerCeo?: string
    buyerManager?: string
    buyerPhone?: string
    deliveryPlace?: string
    modelId: KioskModelId
    quantity: number
    suggestedQty?: number
    dueDate: string
    docMemo?: string
    sourceLabel: string
  }) => {
    const err = checkQuantityError(params.quantity)
    const nextId = `ORD-${String(orders.length + 1).padStart(2, '0')}`
    const created: BuyerOrder = {
      id: nextId,
      docNo: params.docNo || `PO-202611-${orders.length + 10}`,
      orderDate: '2026-11-03',
      buyerName: params.buyerName,
      buyerBizNo: params.buyerBizNo || '120-81-99401',
      buyerCeo: params.buyerCeo || '이대표',
      buyerManager: params.buyerManager || '구매담당자',
      buyerPhone: params.buyerPhone || '02-550-1234',
      deliveryPlace: params.deliveryPlace || '경기도 성남시 분당구 판교물류센터',
      modelId: params.modelId,
      rawQuantity: params.quantity,
      quantity: params.quantity,
      dueDate: params.dueDate,
      docMemo:
        params.docMemo ||
        `${params.buyerName} ${params.modelId} 키오스크 발주 의뢰서 (원본: ${params.sourceLabel})`,
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
        `☠️ [${params.sourceLabel}] 유리병 편지에서 숫자 함정(${params.quantity}대) 발견! 선장님(1차 사람 확인)의 해독이 필요합니다!`
      )
    } else {
      showUploadBanner(
        `🪙 [${params.sourceLabel}] 유리병 의뢰서 해독 성공! ${params.buyerName} (${params.modelId} · ${params.quantity}대) 보물 지도에 등록 완료!`
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

    const sampleJson = e.dataTransfer.getData('application/x-sample-order')
    if (sampleJson) {
      try {
        const sample = JSON.parse(sampleJson) as SampleDraggableFile
        registerParsedOrder({
          docNo: sample.docNo,
          buyerName: sample.buyerName,
          buyerBizNo: sample.buyerBizNo,
          buyerCeo: sample.buyerCeo,
          buyerManager: sample.buyerManager,
          buyerPhone: sample.buyerPhone,
          deliveryPlace: sample.deliveryPlace,
          modelId: sample.modelId,
          quantity: sample.quantity,
          suggestedQty: sample.suggestedQty,
          dueDate: sample.dueDate,
          docMemo: sample.docMemo,
          sourceLabel: sample.fileName,
        })
        return
      } catch {
        // ignore parse error
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleRealFilesUpload(e.dataTransfer.files)
    }
  }

  // 실제 파일 선택 또는 드롭 처리
  const handleRealFilesUpload = (fileList: FileList) => {
    const models: KioskModelId[] = ['KSK-15', 'KSK-21', 'KSK-27', 'KSK-32']

    Array.from(fileList).forEach((file, idx) => {
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      const parts = baseName.split(/[_\-\s]+/)
      const extractedBuyer =
        parts[0] && parts[0].length >= 2
          ? `${parts[0]}`
          : `신규바이어_${orders.length + idx + 1}`

      let matchedModel: KioskModelId = models[(orders.length + idx) % models.length]
      if (baseName.includes('15')) matchedModel = 'KSK-15'
      else if (baseName.includes('21')) matchedModel = 'KSK-21'
      else if (baseName.includes('27')) matchedModel = 'KSK-27'
      else if (baseName.includes('32')) matchedModel = 'KSK-32'

      const numMatch = baseName.replace(/15|21|27|32/g, '').match(/-?\d+/)
      const extractedQty = numMatch
        ? Number(numMatch[0])
        : idx % 2 === 0
        ? 3
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
      alert('선장님! 수량은 1 이상의 정수로 해독해 주세요!')
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
      sourceLabel: '선장님 직속 의뢰서',
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

  // 부족한 부자재를 발주처(보물섬 길드)별로 묶어 정식 발주서(PO) 생성
  const supplierPOs: SupplierPO[] = useMemo(() => {
    const map = new Map<string, SupplierPO>()
    let idx = 1
    for (const item of materialStatusList) {
      if (item.shortageQty <= 0) continue
      const existing = map.get(item.supplierName)
      const subTotalCost = item.shortageQty * item.unitCost
      const supInfo = SUPPLIER_MAP[item.supplierName] || {
        name: item.supplierName,
        bizNo: '120-88-00102',
        ceo: '대표이사',
        contactName: '길드장',
        phone: '02-000-0000',
        email: item.supplierEmail,
        address: '보물섬 장인 마을',
        leadTimeDays: 5,
      }

      if (!existing) {
        map.set(item.supplierName, {
          poNo: `PO-202611-00${idx++}`,
          supplierName: item.supplierName,
          supplierEmail: item.supplierEmail,
          supplierInfo: supInfo,
          items: [
            {
              materialId: item.id,
              materialCode: item.code,
              materialName: item.name,
              specType: item.specType,
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
          materialCode: item.code,
          materialName: item.name,
          specType: item.specType,
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
    showUploadBanner(
      `🦅 [${supplierName}] 보물섬 길드로 황금 전서구(발주서 메일)가 출항했습니다! 곧 부자재 보물선이 도착합니다!`
    )
  }

  // 요약 수치
  const pendingOrdersCount = orders.filter((o) => !o.confirmed).length
  const confirmedOrders = orders.filter((o) => o.confirmed)
  const totalConfirmedUnits = confirmedOrders.reduce((s, o) => s + o.quantity, 0)
  const shortageMaterialsCount = materialStatusList.filter(
    (m) => m.shortageQty > 0
  ).length
  const sentPoCount = supplierPOs.filter((p) => p.mailSent).length

  const viewingBuyerOrder = orders.find((o) => o.id === viewingBuyerOrderId) || null
  const viewingSupplierPo =
    supplierPOs.find((p) => p.supplierName === viewingSupplierPoName) || null

  // 양피지 스타일 바이어 주문서 원문 문서 렌더링
  const renderBuyerOrderDocument = (ord: BuyerOrder) => {
    const modelObj = KIOSK_MODELS.find((m) => m.id === ord.modelId)
    const supplyAmount = ord.quantity * 4000000
    const vatAmount = supplyAmount * 0.1
    const totalAmount = supplyAmount + vatAmount

    return (
      <div className="bg-[#FDF6E2] border-4 border-[#8B5A2B] rounded-2xl p-6 md:p-8 text-[#3B2313] space-y-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#8B5A2B] pb-5">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#8B5A2B] text-[#FDF6E2] text-xs font-extrabold mb-1.5">
              📜 바이어 원본 의뢰서 (BUYER PURCHASE ORDER)
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3B2313]">
              물 품 구 매 주 문 서
            </h3>
            <p className="text-sm text-[#6B4423] mt-1 font-semibold">
              문서번호: <strong className="font-mono">{ord.docNo}</strong> · 발주일자:{' '}
              <strong className="font-mono">{ord.orderDate}</strong>
            </p>
          </div>

          <div className="border-2 border-[#8B5A2B] bg-[#F5E6C4] text-center text-xs rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 bg-[#E6CFA0] border-b border-[#8B5A2B] font-extrabold text-[#3B2313]">
              <div className="px-4 py-1 border-r border-[#8B5A2B]">담 당</div>
              <div className="px-4 py-1 border-r border-[#8B5A2B]">팀 장</div>
              <div className="px-4 py-1">길드장(대표)</div>
            </div>
            <div className="grid grid-cols-3 h-12 items-center">
              <div className="px-3 border-r border-[#8B5A2B] h-full flex items-center justify-center">
                <span className="border-2 border-red-700 text-red-700 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold">
                  {ord.buyerManager.split(' ')[0]}인
                </span>
              </div>
              <div className="px-3 border-r border-[#8B5A2B] h-full flex items-center justify-center">
                <span className="border-2 border-red-700 text-red-700 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold">
                  승인
                </span>
              </div>
              <div className="px-3 h-full flex items-center justify-center">
                <span className="border-2 border-red-800 bg-red-100 text-red-800 rounded px-1.5 py-0.5 text-[11px] font-extrabold">
                  {ord.buyerCeo}직인
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="border-2 border-[#C19A6B] bg-[#FAF0D7] rounded-xl overflow-hidden">
            <div className="bg-[#E6CFA0] px-4 py-2 font-extrabold text-[#3B2313] border-b border-[#C19A6B]">
              🏰 의뢰 왕국 (공급받는자 / 바이어)
            </div>
            <div className="p-3.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B4423]">상호(법인명):</span>
                <strong className="text-[#3B2313]">{ord.buyerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">사업자번호 / 대표자:</span>
                <span className="font-mono font-bold">
                  {ord.buyerBizNo} / {ord.buyerCeo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">발주 담당자:</span>
                <span className="font-semibold">
                  {ord.buyerManager} ({ord.buyerPhone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">보물 하역지(납품처):</span>
                <span className="text-right font-bold">{ord.deliveryPlace}</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#C19A6B] bg-[#FAF0D7] rounded-xl overflow-hidden">
            <div className="bg-[#E6CFA0] px-4 py-2 font-extrabold text-[#3B2313] border-b border-[#C19A6B]">
              ⛵ 우리 해적단 (공급자 / 키오스크 제작단)
            </div>
            <div className="p-3.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B4423]">상호(법인명):</span>
                <strong className="text-[#3B2313]">(주)스마트키오스크 대항해단</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">사업자번호 / 선장:</span>
                <span className="font-mono font-bold">128-86-77401 / 캡틴 케빈(Kevin)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">담당 부서:</span>
                <span className="font-semibold">보물섬 SCM 원정대 (031-612-8800)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">납기 요청일:</span>
                <strong className="font-mono text-emerald-800">{ord.dueDate} 까지 도착</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-extrabold text-[#3B2313]">
            1. 의뢰 유물(키오스크) 및 수량 명세
          </div>
          <div className="overflow-x-auto border-2 border-[#8B5A2B] rounded-xl bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#E6CFA0] border-b-2 border-[#8B5A2B] text-[#3B2313]">
                  <th className="py-2.5 px-3 font-extrabold">No</th>
                  <th className="py-2.5 px-3 font-extrabold">모델코드</th>
                  <th className="py-2.5 px-3 font-extrabold">유물명 및 규격</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">원본 표기수량</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">해독(확정)수량</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">개당 현상금(단가)</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">공급가액</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#C19A6B]">
                  <td className="py-3 px-3 font-mono font-bold">1</td>
                  <td className="py-3 px-3 font-mono font-extrabold text-amber-900">
                    {ord.modelId}
                  </td>
                  <td className="py-3 px-3 font-bold">
                    {modelObj?.name || ord.modelId} (황금 BOM 풀세트)
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    {ord.rawQuantity !== ord.quantity ? (
                      <span className="line-through text-red-600">
                        {ord.rawQuantity}대
                      </span>
                    ) : (
                      <span className={!ord.confirmed ? 'text-red-700 font-extrabold' : ''}>
                        {ord.rawQuantity}대
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-base font-extrabold text-[#3B2313]">
                    {ord.quantity}대
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    400만 골드
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold">
                    {supplyAmount > 0 ? `₩${supplyAmount.toLocaleString()}` : '-'}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-[#FAF0D7] font-extrabold text-[#3B2313]">
                  <td colSpan={4} className="py-2.5 px-3">
                    총 보물 의뢰금 (공급가액 + 부가세 10%)
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-right font-mono text-base text-emerald-900">
                    {supplyAmount > 0
                      ? `₩${totalAmount.toLocaleString()} (VAT ₩${vatAmount.toLocaleString()} 포함)`
                      : '선장님 암호 해독 필요!'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-amber-100/90 border-2 border-amber-600 rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            2. 양피지 의뢰서 비밀 메모 (선장님 암호 해독 단서!)
          </div>
          <p className="text-base font-extrabold text-[#3B2313] leading-relaxed">
            "{ord.docMemo}"
          </p>
          {!ord.confirmed && (
            <p className="text-sm text-red-800 font-bold pt-1">
              ☠️ 항해사 경고: 양피지 메모에 적힌 실제 수량과 표의 수량({ord.quantity}대)이 다릅니다! 숫자 함정을 해제해 주세요!
            </p>
          )}
        </div>

        {!ord.confirmed && (
          <div className="bg-[#E6CFA0] border-2 border-[#8B5A2B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-base font-extrabold text-[#3B2313]">
              ⚔️ 선장님! 진짜 수량으로 함정을 해제하시겠습니까?
            </span>
            <div className="flex items-center gap-2">
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
                className="w-24 bg-white border-2 border-[#8B5A2B] rounded-xl px-3 py-1.5 text-right font-mono text-lg font-extrabold"
              />
              <span className="font-extrabold">대</span>
              <button
                type="button"
                onClick={() => handleConfirmOrder(ord.id)}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold cursor-pointer shadow"
              >
                ⚔️ 함정 해제 & 선장 승인!
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 발주처별 정식 발주서(PO) 양식 렌더링 컴포넌트
  const renderSupplierPoDocument = (po: SupplierPO) => {
    const vat = po.totalOrderCost * 0.1
    const grandTotal = po.totalOrderCost + vat
    const island = ISLAND_META[po.supplierName]

    return (
      <div className="bg-[#FDF6E2] border-4 border-[#8B5A2B] rounded-2xl p-6 md:p-8 text-[#3B2313] space-y-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#8B5A2B] pb-5">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-800 text-white text-xs font-extrabold mb-1.5">
              🦅 보물섬 장인 길드행 정식 발주서 (PURCHASE ORDER)
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#3B2313]">
              {island?.emoji} 부 자 재 보 물 발 주 서
            </h3>
            <p className="text-sm text-[#6B4423] mt-1 font-semibold">
              발주번호: <strong className="font-mono">{po.poNo}</strong> · 발행일자:{' '}
              <strong className="font-mono">2026-11-03</strong> · 보물선 도착기한:{' '}
              <strong>출항 후 {po.supplierInfo.leadTimeDays}일 이내</strong>
            </p>
          </div>

          <div className="border-2 border-[#8B5A2B] bg-[#F5E6C4] text-center text-xs rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-[#E6CFA0] border-b border-[#8B5A2B] font-extrabold">
              <div className="px-4 py-1 border-r border-[#8B5A2B]">항해사 산출</div>
              <div className="px-4 py-1">캡틴(선장) 인장</div>
            </div>
            <div className="grid grid-cols-2 h-12 items-center">
              <div className="px-3 border-r border-[#8B5A2B] h-full flex items-center justify-center">
                <span className="border-2 border-emerald-800 text-emerald-800 rounded px-1.5 py-0.5 text-[11px] font-extrabold">
                  보물탐지필
                </span>
              </div>
              <div className="px-3 h-full flex items-center justify-center">
                {po.humanConfirmed ? (
                  <span className="border-2 border-red-700 bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-[11px] font-extrabold">
                    캡틴케빈인
                  </span>
                ) : (
                  <span className="text-amber-800 font-extrabold text-[11px]">
                    인장 대기중
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="border-2 border-[#C19A6B] bg-[#FAF0D7] rounded-xl overflow-hidden">
            <div className="bg-[#E6CFA0] px-4 py-2 font-extrabold text-[#3B2313] border-b border-[#C19A6B]">
              🏝️ 목적지 보물섬 (공급자 / 장인 길드)
            </div>
            <div className="p-3.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B4423]">길드(법인명):</span>
                <strong className="text-[#3B2313]">{po.supplierInfo.name} 귀하</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">사업자번호 / 길드장:</span>
                <span className="font-mono font-bold">
                  {po.supplierInfo.bizNo} / {po.supplierInfo.ceo}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">연락책 / 전서구 주소:</span>
                <strong className="font-mono text-emerald-900">{po.supplierEmail}</strong>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#C19A6B] bg-[#FAF0D7] rounded-xl overflow-hidden">
            <div className="bg-[#E6CFA0] px-4 py-2 font-extrabold text-[#3B2313] border-b border-[#C19A6B]">
              ⛵ 발주 원정대 (공급받는자 / 당사)
            </div>
            <div className="p-3.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B4423]">원정대명:</span>
                <strong className="text-[#3B2313]">(주)스마트키오스크 대항해단</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">총사령관(대표):</span>
                <span className="font-mono font-bold">캡틴 케빈 (김여원)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B4423]">보물 하역 항구:</span>
                <span className="font-bold">평택 진위산단 제1전진기지 보물창고</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-extrabold text-[#3B2313]">
            1. 원정 발주 유물(부자재) 명세표
          </div>
          <div className="overflow-x-auto border-2 border-[#8B5A2B] rounded-xl bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#E6CFA0] border-b-2 border-[#8B5A2B] text-[#3B2313]">
                  <th className="py-2.5 px-3 font-extrabold">No</th>
                  <th className="py-2.5 px-3 font-extrabold">유물코드</th>
                  <th className="py-2.5 px-3 font-extrabold">부자재 보물명</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">총 필요량</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">창고보유</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">원정 발주수량</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">단가</th>
                  <th className="py-2.5 px-3 text-right font-extrabold">공급가액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C19A6B]">
                {po.items.map((item, i) => (
                  <tr key={item.materialId}>
                    <td className="py-3 px-3 font-mono font-bold">{i + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#6B4423]">
                      {item.materialCode}
                    </td>
                    <td className="py-3 px-3 font-extrabold">
                      {item.materialName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {item.requiredQty}개
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-stone-500">
                      {item.currentStock}개
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base font-extrabold text-red-700">
                      +{item.orderQty}개
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₩{item.unitCost.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold">
                      ₩{item.subTotalCost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#FAF0D7] font-extrabold text-[#3B2313] border-t-2 border-[#8B5A2B]">
                  <td colSpan={5} className="py-3 px-3">
                    총 보물 발주 금화 (공급가액 ₩{po.totalOrderCost.toLocaleString()} + 세금 ₩
                    {vat.toLocaleString()})
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right font-mono text-lg text-emerald-900">
                    ₩{grandTotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="bg-[#E6CFA0] border-2 border-[#8B5A2B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={po.mailSent}
              checked={po.humanConfirmed}
              onChange={() => togglePoConfirm(po.supplierName)}
              className="w-5 h-5 accent-red-700 rounded cursor-pointer"
            />
            <span className="text-base font-extrabold text-[#3B2313]">
              🧭 선장님(2차 사람 확인): 발주 두루마리의 수량과 금화를 확인하고 인장을 찍습니다!
            </span>
          </label>

          <button
            type="button"
            disabled={!po.humanConfirmed || po.mailSent}
            onClick={() => handleSendMail(po.supplierName)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-extrabold transition ${
              po.mailSent
                ? 'bg-emerald-800 text-white cursor-default'
                : po.humanConfirmed
                ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer shadow-lg'
                : 'bg-stone-400 text-stone-200 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            {po.mailSent ? '🦅 전서구 출항 완료!' : '🦅 황금 전서구(발주 메일) 날리기!'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 text-[#3B2313]">
      {/* 상단 해적선 조타실 헤더 */}
      <header className="sticky top-0 z-30 bg-[#1B120C]/95 backdrop-blur-md border-b-4 border-[#B8860B] text-[#FDF6E2] shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 text-[#1B120C] flex items-center justify-center shadow-lg border-2 border-amber-200 ship-float">
              <Ship className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black text-amber-300 tracking-tight drop-shadow">
                  🏴‍☠️ 보물섬 키오스크 대항해 발주 원정대
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-red-700 text-amber-100 border border-amber-400">
                  선장님 2단 컨펌 퀘스트!
                </span>
              </div>
              <p className="text-sm text-amber-100/80 mt-0.5">
                [1단계] 유리병 주문서 함정 해독(선장 확인) ➔ [2단계] 400만 골드 유물 설계도 & 보물창고 탐색 ➔ [3단계] 4대 장인섬으로 전서구(발주서) 날리기!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowDocArchiveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#1B120C] text-base font-black transition cursor-pointer shadow-md border-2 border-amber-200"
            >
              <FolderOpen className="w-5 h-5" />
              🗺️ 선장님의 비밀 문서 보관함
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-base font-extrabold transition cursor-pointer border-2 border-emerald-400"
            >
              <Plus className="w-4 h-4" />
              의뢰서 직접 작성
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2E1F14] hover:bg-[#3E2A1C] text-amber-200 border border-amber-700 text-base font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              항해 초기화
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-10">
        {/* 보물지도 항해 루트 트래커 배너 */}
        <section className="bg-gradient-to-r from-[#F3E2B8] via-[#FAF0D7] to-[#F3E2B8] border-4 border-[#8B5A2B] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 border-b-2 border-dashed border-[#8B5A2B]/50 pb-4">
            <div className="flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-red-700 animate-spin" style={{ animationDuration: '12s' }} />
              <h2 className="text-xl md:text-2xl font-black text-[#3B2313]">
                🗺️ 그랜드 라인 부자재 보물섬 항해 지도 (Adventure Map)
              </h2>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-[#3B2313] text-amber-300 text-sm font-extrabold">
              🪙 키오스크 유물 1대당 현상금: 400만 골드 (공통 파츠 225만 + 전용 파츠 175만)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* 제1항구 */}
            <div className="bg-[#FFF9EA] border-2 border-[#8B5A2B] rounded-2xl p-4 shadow-md relative">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-red-700 text-white text-xs font-black">
                  제1항구 · 유리병 해변
                </span>
                <Skull className="w-5 h-5 text-red-700" />
              </div>
              <div className="text-2xl font-black text-red-700 mt-2">
                함정 의뢰서 {pendingOrdersCount}건
              </div>
              <p className="text-sm font-bold text-[#6B4423] mt-1">
                {pendingOrdersCount > 0
                  ? '🧭 선장님! 이상한 수량 함정을 해독하세요!'
                  : '✨ 모든 의뢰서 암호 해독 완료!'}
              </p>
            </div>

            {/* 제2항구 */}
            <div className="bg-[#FFF9EA] border-2 border-[#8B5A2B] rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-700 text-white text-xs font-black">
                  제2관문 · 황금 골렘 신전
                </span>
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-[#3B2313] mt-2">
                목표 제작 {totalConfirmedUnits}대
              </div>
              <p className="text-sm font-bold text-emerald-800 mt-1">
                총 현상금 {formatCurrency(totalConfirmedUnits * 4000000)}
              </p>
            </div>

            {/* 제3항구 */}
            <div className="bg-[#FFF9EA] border-2 border-[#8B5A2B] rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-teal-800 text-white text-xs font-black">
                  제3관문 · 선박 보물창고
                </span>
                <Gem className="w-5 h-5 text-teal-700" />
              </div>
              <div className="text-2xl font-black text-rose-700 mt-2">
                부족한 보물 {shortageMaterialsCount}종
              </div>
              <p className="text-sm font-bold text-[#6B4423] mt-1">
                보물섬에서 캐와야 할 부자재 파츠!
              </p>
            </div>

            {/* 제4항구 */}
            <div className="bg-[#FFF9EA] border-2 border-[#8B5A2B] rounded-2xl p-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-800 text-white text-xs font-black">
                  최종 목적지 · 4대 장인섬
                </span>
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-2">
                전서구 출항 {sentPoCount} / {supplierPOs.length}섬
              </div>
              <p className="text-sm font-bold text-[#6B4423] mt-1">
                선장님 인장 날인 후 전서구 발송!
              </p>
            </div>
          </div>
        </section>

        {/* 🍾 바이어 유리병 주문서 드래그 앤 드롭 갑판 */}
        <section className="bg-[#FAF0D7] rounded-3xl border-4 border-[#8B5A2B] p-6 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-[#3B2313] flex items-center gap-2.5">
                <Anchor className="w-7 h-7 text-amber-700" />
                🍾 바다에서 떠내려온 바이어 유리병 주문서 건지기 (드래그 앤 드롭)
              </h2>
              <p className="text-base font-bold text-[#6B4423] mt-1">
                내 PC의 주문서 파일을 갑판에 던져 넣거나, 우측의 <strong>유리병 편지 4종을 마우스로 끌어서 왼쪽 갑판에 투하</strong>해 보세요!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* 좌측: 갑판 드롭존 (7칸) */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingOver(true)
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDropZoneDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`lg:col-span-7 rounded-2xl border-4 border-dashed p-7 flex flex-col items-center justify-center text-center transition cursor-pointer ${
                isDraggingOver
                  ? 'border-red-700 bg-amber-200/80 scale-[1.01]'
                  : 'border-[#8B5A2B] bg-[#F3E2B8] hover:bg-[#EAD29C]'
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
              <div className="w-16 h-16 rounded-full bg-[#3B2313] text-amber-300 border-4 border-amber-400 flex items-center justify-center mb-3 shadow-lg">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="text-xl font-black text-[#3B2313]">
                {isDraggingOver
                  ? '⚓ 갑판 위에 유리병 주문서를 내려놓으세요!'
                  : '🍾 여기에 유리병 주문서(파일)를 끌어다 놓거나 클릭하여 건져 올리세요!'}
              </p>
              <p className="text-sm font-bold text-[#6B4423] mt-1">
                유리병을 여는 즉시 의뢰 왕국(업체명), 유물 모델, 수량, 납기를 해독하고 함정 숫자를 찾아냅니다!
              </p>
            </div>

            {/* 우측: 마우스로 끌어서 테스트할 수 있는 유리병 주문서 4종 (5칸) */}
            <div className="lg:col-span-5 bg-[#EED9A8] border-2 border-[#8B5A2B] rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-[#3B2313]">
                  🧭 파도에 밀려온 유리병 편지 (끌어서 왼쪽에 놓거나 클릭!)
                </span>
              </div>

              <div className="space-y-2.5">
                {SAMPLE_DRAGGABLE_FILES.map((sample) => {
                  const isErr = sample.quantity < 5 || sample.quantity > 200
                  return (
                    <div
                      key={sample.id}
                      draggable
                      onDragStart={(e) => handleSampleDragStart(e, sample)}
                      onClick={() =>
                        registerParsedOrder({
                          docNo: sample.docNo,
                          buyerName: sample.buyerName,
                          buyerBizNo: sample.buyerBizNo,
                          buyerCeo: sample.buyerCeo,
                          buyerManager: sample.buyerManager,
                          buyerPhone: sample.buyerPhone,
                          deliveryPlace: sample.deliveryPlace,
                          modelId: sample.modelId,
                          quantity: sample.quantity,
                          suggestedQty: sample.suggestedQty,
                          dueDate: sample.dueDate,
                          docMemo: sample.docMemo,
                          sourceLabel: sample.fileName,
                        })
                      }
                      className="group bg-[#FFF9EA] hover:bg-white border-2 border-[#8B5A2B] rounded-xl p-3 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className="w-5 h-5 text-[#8B5A2B] shrink-0" />
                        {sample.fileType === 'PDF' ? (
                          <FileText className="w-5 h-5 text-red-700 shrink-0" />
                        ) : (
                          <FileSpreadsheet className="w-5 h-5 text-emerald-800 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className="text-sm font-black text-[#3B2313] truncate">
                            {sample.fileName}
                          </div>
                          <div className="text-xs font-bold text-[#6B4423]">
                            {sample.buyerName} · {sample.modelId} · 기한 {sample.dueDate}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 border ${
                          isErr
                            ? 'bg-red-100 text-red-800 border-red-400'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-400'
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

          {uploadNotice && (
            <div className="bg-[#3B2313] text-amber-300 border-2 border-amber-400 px-5 py-3.5 rounded-2xl text-base font-black flex items-center justify-between shadow-lg">
              <span>{uploadNotice}</span>
              <button
                type="button"
                onClick={() => setUploadNotice(null)}
                className="text-amber-100 hover:text-white text-sm ml-4 cursor-pointer"
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
            className="bg-[#FAF0D7] border-4 border-[#8B5A2B] rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#3B2313] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                📜 새로운 왕국 의뢰서 직접 작성하기
              </h3>
              <span className="text-sm font-bold text-[#6B4423]">
                수량에 1~4(과소), 201 이상(과다), 음수를 입력하면 함정 의뢰서로 발동됩니다!
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input
                type="text"
                required
                placeholder="의뢰 왕국명 (예: 투썸플레이스)"
                value={newBuyer}
                onChange={(e) => setNewBuyer(e.target.value)}
                className="bg-white border-2 border-[#8B5A2B] rounded-xl px-4 py-2.5 text-base font-bold text-[#3B2313]"
              />
              <select
                value={newModel}
                onChange={(e) => setNewModel(e.target.value as KioskModelId)}
                className="bg-white border-2 border-[#8B5A2B] rounded-xl px-4 py-2.5 text-base font-bold text-[#3B2313]"
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
                placeholder="수량 (예: 2 또는 999)"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="bg-white border-2 border-[#8B5A2B] rounded-xl px-4 py-2.5 text-base font-bold text-[#3B2313]"
              />
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                className="bg-white border-2 border-[#8B5A2B] rounded-xl px-4 py-2.5 text-base font-bold text-[#3B2313]"
              />
              <button
                type="submit"
                className="bg-red-700 hover:bg-red-800 text-white font-black rounded-xl px-5 py-2.5 text-base transition cursor-pointer shadow"
              >
                의뢰서 등록!
              </button>
            </div>
          </form>
        )}

        {/* 🏝️ 제1관문: 바이어 주문서 함정 해독 & 1차 선장님 확인 */}
        <section className="bg-[#FAF0D7] border-4 border-[#8B5A2B] rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#8B5A2B]/40 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-700 text-amber-200 text-xs font-black uppercase">
                🏝️ Quest 1 · 선장님의 1차 암호 해독 (Human-in-the-Loop #1)
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#3B2313] mt-1.5">
                바이어 의뢰서 숫자 함정 해제 & 선장 승인 ({orders.length}건)
              </h2>
            </div>
            <p className="text-base font-bold text-[#6B4423]">
              <strong>[📜 양피지 주문서 원문 보기]</strong>로 비밀 메모를 읽고, 잘못된 수량 함정을 진짜 수량으로 고쳐 승인하세요!
            </p>
          </div>

          <div className="space-y-4">
            {orders.map((ord) => {
              const modelObj = KIOSK_MODELS.find((m) => m.id === ord.modelId)
              const isPending = !ord.confirmed

              return (
                <div
                  key={ord.id}
                  className={`rounded-2xl p-5 transition border-3 ${
                    isPending
                      ? 'bg-[#FFF3D6] border-red-600 shadow-lg'
                      : 'bg-[#FFFDF7] border-[#C19A6B]'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* 좌측: 의뢰 정보 */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#3B2313] text-amber-300 font-mono text-sm font-black">
                          {ord.id}
                        </span>
                        <h3 className="text-xl font-black text-[#3B2313]">
                          🏰 {ord.buyerName}
                        </h3>
                        <span className="px-3 py-1 rounded-lg bg-[#E6CFA0] text-[#3B2313] font-extrabold text-sm border border-[#8B5A2B]">
                          {ord.modelId} · {modelObj?.name}
                        </span>
                        <span className="text-sm text-[#6B4423] font-bold">
                          기한: <strong className="text-[#3B2313]">{ord.dueDate}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingBuyerOrderId(ord.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#3B2313] border-2 border-[#8B5A2B] text-sm font-black transition cursor-pointer shadow-xs"
                        >
                          <ScrollText className="w-4 h-4" />
                          📜 양피지 주문서 원문 보기
                        </button>
                      </div>

                      {/* 원문 비밀 메모 */}
                      <div className="text-sm font-bold text-[#5A381E] bg-[#F3E2B8] px-3.5 py-2 rounded-xl border border-[#C19A6B]">
                        🧭 <strong>양피지 원문 단서:</strong> "{ord.docMemo}"
                      </div>

                      {/* 함정 상태 vs 해독 완료 */}
                      {isPending ? (
                        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-100 border-2 border-red-500 text-red-900 text-base font-black">
                          <Skull className="w-5 h-5 text-red-700 shrink-0" />
                          <span>
                            함정 숫자 <strong className="underline">{ord.quantity}대</strong> 발동! — {ord.errorMsg}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-emerald-900 text-base font-black">
                          <Trophy className="w-5 h-5 text-amber-600" />
                          <span>
                            선장 해독 완료! · 획득 예상 금화{' '}
                            <strong className="underline">
                              {formatCurrency(ord.quantity * 4000000)}
                            </strong>{' '}
                            (400만 골드 × {ord.quantity}대)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 우측: 함정 해제 컨트롤 */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isPending ? (
                        <div className="flex flex-wrap items-center gap-2.5 bg-[#F5E0B5] p-3 rounded-2xl border-2 border-red-600">
                          <span className="text-sm font-black text-red-900 pl-1">
                            해독 수량:
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
                              className="w-24 bg-white border-2 border-[#8B5A2B] rounded-xl px-3 py-1.5 text-right font-mono text-lg font-black text-[#3B2313]"
                            />
                            <span className="ml-1.5 mr-1 text-base font-black text-[#3B2313]">
                              대
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleConfirmOrder(ord.id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-base font-black transition cursor-pointer shadow-md border border-amber-300"
                          >
                            <Swords className="w-5 h-5" />
                            함정 해제 & 선장 승인!
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-emerald-100 border-2 border-emerald-700 px-4 py-2.5 rounded-2xl">
                          <div className="text-right">
                            <span className="text-xs text-emerald-800 block font-extrabold">
                              확정 유물 수량
                            </span>
                            <span className="text-2xl font-black text-emerald-950 font-mono">
                              {ord.quantity}대
                            </span>
                          </div>
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-800 text-amber-200 text-xs font-black">
                            🪙 해독완료
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

        {/* 🏛️ 제2관문 & 제3관문: 4대 키오스크 골렘 설계도(400만 골드) & 선박 보물창고 탐색 */}
        <section className="bg-[#FAF0D7] border-4 border-[#8B5A2B] rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#8B5A2B]/40 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700 text-white text-xs font-black uppercase">
                🏛️ Quest 2 & 3 · 고대 유물 BOM 조합표 & 선박 보물창고 점검
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#3B2313] mt-1.5">
                전설의 4대 키오스크 설계도 (개당 400만 골드) & 부족한 보물 파츠 탐색
              </h2>
            </div>
            <p className="text-base font-bold text-[#6B4423]">
              공통 유물 4종(<strong>225만 골드 동일</strong>) + 규격별 유물 2종(<strong>175만 골드</strong>) = <strong>모든 모델 400만 골드!</strong>
            </p>
          </div>

          {/* 4개 모델 보물 설계도 카드 */}
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
                  className={`bg-[#FFFDF7] rounded-2xl p-5 border-3 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-red-700 ring-4 ring-amber-400/50 shadow-xl'
                      : 'border-[#8B5A2B] hover:border-red-700 shadow-md'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-lg bg-[#3B2313] text-amber-300 font-mono font-black text-sm">
                        🗿 {model.id}
                      </span>
                      <span className="text-base font-black text-amber-800">
                        🪙 400만 골드
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-[#3B2313]">
                        {model.name}
                      </h3>
                      <p className="text-sm font-extrabold text-emerald-800 mt-0.5">
                        의뢰 확정 수량: <strong>{confirmedSum}대</strong>
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="h-3 w-full rounded-full bg-[#E6CFA0] overflow-hidden flex border border-[#8B5A2B]">
                        <div
                          className="bg-[#6B4423] h-full"
                          style={{ width: '56.25%' }}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: '43.75%' }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-extrabold text-[#6B4423]">
                        <span>● 공통파츠: 225만</span>
                        <span className="text-amber-900">★ 전용파츠: 175만</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#C19A6B] space-y-1.5 text-sm">
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
                                  ? 'text-[#6B4423] font-semibold'
                                  : 'text-red-800 font-black'
                              }`}
                            >
                              {isCommon ? '⚙️ ' : '💎 '}
                              {mat.name.replace(' (공용)', '')}
                            </span>
                            <span className="font-mono font-black text-[#3B2313] shrink-0 ml-2">
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

          {/* 선박 보물창고 재고 & 원정 채집 필요 수량 표 */}
          <div className="bg-[#FFFDF7] rounded-2xl border-3 border-[#8B5A2B] overflow-hidden shadow-lg">
            <div className="px-6 py-4 bg-[#E6CFA0] border-b-2 border-[#8B5A2B] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gem className="w-6 h-6 text-red-700" />
                <h3 className="text-lg font-black text-[#3B2313]">
                  🗝️ 우리 배의 보물창고(현재 재고) 대조 및 원정 채집(발주) 목표량
                </h3>
              </div>
              <span className="text-sm font-extrabold text-[#5A381E]">
                창고에 부족한 파츠는 아래 4대 장인 보물섬 원정 발주서에 자동으로 기록됩니다!
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-base">
                <thead>
                  <tr className="border-b-2 border-[#8B5A2B] text-[#3B2313] text-sm bg-[#F5E6C4]">
                    <th className="py-3.5 px-5 font-black">파츠 등급</th>
                    <th className="py-3.5 px-5 font-black">부자재 유물명</th>
                    <th className="py-3.5 px-5 font-black">생산 보물섬(발주처)</th>
                    <th className="py-3.5 px-5 text-right font-black">파츠 단가</th>
                    <th className="py-3.5 px-5 text-right font-black">총 필요 파츠</th>
                    <th className="py-3.5 px-5 text-right font-black">창고 보유량</th>
                    <th className="py-3.5 px-5 font-black w-44">보물창고 게이지</th>
                    <th className="py-3.5 px-5 text-right font-black">보물섬 원정 목표</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFC699]">
                  {materialStatusList.map((m) => {
                    const isCommon = m.specType === '공통 부자재'
                    const ratio =
                      m.requiredQty > 0
                        ? Math.min(100, Math.round((m.stock / m.requiredQty) * 100))
                        : 100
                    const isShort = m.shortageQty > 0
                    const island = ISLAND_META[m.supplierName]

                    return (
                      <tr
                        key={m.id}
                        className={`transition ${
                          isShort ? 'bg-red-50/60 hover:bg-red-100/50' : 'hover:bg-[#FAF0D7]'
                        }`}
                      >
                        <td className="py-4 px-5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                              isCommon
                                ? 'bg-[#E6CFA0] text-[#3B2313]'
                                : 'bg-amber-400 text-[#3B2313] border border-[#8B5A2B]'
                            }`}
                          >
                            {isCommon ? '⚙️ 공통 유물' : '💎 전용 유물'}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-black text-[#3B2313] text-lg">
                          {m.name}
                        </td>
                        <td className="py-4 px-5 text-[#5A381E] font-extrabold">
                          {island?.emoji} {m.supplierName}
                        </td>
                        <td className="py-4 px-5 text-right font-mono font-black text-[#3B2313]">
                          {(m.unitCost / 10000).toLocaleString()}만 골드
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-lg font-black text-[#3B2313]">
                          {m.requiredQty}개
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-lg text-[#6B4423] font-bold">
                          {m.stock}개
                        </td>
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <div className="h-3 w-full rounded-full bg-[#E6CFA0] overflow-hidden border border-[#8B5A2B]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isShort ? 'bg-red-600' : 'bg-emerald-600'
                                }`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <span className="text-xs font-extrabold text-[#6B4423] block">
                              {m.requiredQty === 0
                                ? '소요 없음'
                                : `창고 충당 ${ratio}%`}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isShort ? (
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-700 text-amber-200 font-mono text-base font-black shadow-xs">
                              🧭 +{m.shortageQty}개 원정발주!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-800 font-black text-base">
                              💰 창고 보물 충분!
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

        {/* 🏴‍☠️ 최종 보물섬: 4대 장인 길드 섬으로 전서구(발주서 메일) 날리기! */}
        <section className="bg-[#FAF0D7] border-4 border-[#8B5A2B] rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#8B5A2B]/40 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-amber-200 text-xs font-black uppercase">
                ⛵ Final Quest · 선장님의 2차 인장 날인 & 전서구 출항 (Human-in-the-Loop #2)
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#3B2313] mt-1.5">
                4대 장인의 보물섬으로 발주 두루마리(메일) 날리기!
              </h2>
            </div>
            <p className="text-base font-bold text-[#6B4423]">
              각 보물섬 카드의 <strong>[📜 정식 발주서 두루마리 보기]</strong>를 확인하고, <strong>선장님 최종 인장 체크</strong> 후 전서구를 날려 보내세요!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {supplierPOs.map((po) => {
              const island = ISLAND_META[po.supplierName] || {
                islandTitle: `${po.supplierName} 보물섬`,
                emoji: '🏝️',
                desc: '전설의 부자재 장인들이 모여 사는 보물섬',
              }

              return (
                <div
                  key={po.supplierName}
                  className={`rounded-3xl border-4 transition flex flex-col justify-between overflow-hidden ${
                    po.mailSent
                      ? 'bg-[#EBF7EE] border-emerald-700 shadow-lg'
                      : po.humanConfirmed
                      ? 'bg-[#FFFDF7] border-red-700 shadow-2xl scale-[1.01]'
                      : 'bg-[#FFFDF7] border-[#8B5A2B] shadow-md'
                  }`}
                >
                  <div>
                    <div className="p-6 bg-[#E6CFA0] border-b-2 border-[#8B5A2B] flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-[#3B2313] border-2 border-amber-400 flex items-center justify-center text-3xl shrink-0 shadow">
                          {island.emoji}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-[#3B2313] text-amber-300">
                              {po.poNo}
                            </span>
                            <h3 className="text-xl font-black text-[#3B2313]">
                              {island.islandTitle}
                            </h3>
                          </div>
                          <p className="text-xs font-bold text-[#5A381E] mt-1">
                            {island.desc}
                          </p>
                          <p className="text-xs font-mono font-bold text-emerald-900 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            전서구 목적지: {po.supplierEmail} ({po.supplierInfo.contactName})
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#6B4423] block">
                          필요 금화 (공급가액)
                        </span>
                        <span className="text-2xl font-black text-red-800 font-mono">
                          {formatCurrency(po.totalOrderCost)}
                        </span>
                      </div>
                    </div>

                    {/* 채집할 보물 품목 */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-sm font-black text-[#6B4423]">
                          📦 이 섬에서 조달할 부족 보물 ({po.items.length}종)
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewingSupplierPoName(po.supplierName)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#3B2313] border-2 border-[#8B5A2B] text-sm font-black transition cursor-pointer shadow-xs"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          📜 정식 발주서(PO) 두루마리 보기
                        </button>
                      </div>

                      {po.items.map((item) => (
                        <div
                          key={item.materialId}
                          className="flex items-center justify-between bg-[#FAF0D7] border-2 border-[#C19A6B] rounded-2xl px-4 py-3"
                        >
                          <div>
                            <div className="font-black text-[#3B2313] text-base">
                              💎 {item.materialName}
                            </div>
                            <div className="text-sm font-bold text-[#6B4423]">
                              단가 {(item.unitCost / 10000).toLocaleString()}만 골드 · 총 필요{' '}
                              {item.requiredQty}개 (창고 보유 {item.currentStock}개)
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-lg font-black text-red-700">
                              +{item.orderQty}개 발주!
                            </div>
                            <div className="text-sm font-extrabold text-[#3B2313]">
                              {formatCurrency(item.subTotalCost)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 하단 2차 선장님 인장 체크 & 전서구 날리기 */}
                  <div className="px-6 py-4 bg-[#F3E2B8] border-t-2 border-[#8B5A2B] flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={po.mailSent}
                        checked={po.humanConfirmed}
                        onChange={() => togglePoConfirm(po.supplierName)}
                        className="w-5 h-5 accent-red-700 rounded cursor-pointer"
                      />
                      <span className="text-base font-black text-[#3B2313]">
                        🧭 선장님 최종 인장 찍기 (2차 사람 확인)
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!po.humanConfirmed || po.mailSent}
                      onClick={() => handleSendMail(po.supplierName)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-black transition ${
                        po.mailSent
                          ? 'bg-emerald-800 text-amber-200 cursor-default'
                          : po.humanConfirmed
                          ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer shadow-lg border border-amber-300'
                          : 'bg-[#D5BE8B] text-[#8C734B] cursor-not-allowed'
                      }`}
                    >
                      {po.mailSent ? (
                        <>
                          <Trophy className="w-5 h-5 text-amber-300" />
                          🦅 전서구 출항 & 보물 확보 완료!
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          🦅 황금 전서구(발주 메일) 날리기!
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

      {/* 모달 1: 개별 바이어 양피지 주문서 원문 열람 모달 */}
      {viewingBuyerOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#E6CFA0] border-4 border-[#8B5A2B] rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-red-800" />
                <span className="font-black text-xl text-[#3B2313]">
                  📜 바이어 유리병 양피지 의뢰서 원문 ({viewingBuyerOrder.buyerName})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FDF6E2] border-2 border-[#8B5A2B] text-[#3B2313] text-sm font-black hover:bg-white cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  양피지 인쇄 / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingBuyerOrderId(null)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#3B2313] text-amber-300 text-sm font-black hover:bg-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  닫기
                </button>
              </div>
            </div>

            {renderBuyerOrderDocument(viewingBuyerOrder)}
          </div>
        </div>
      )}

      {/* 모달 2: 개별 발주처 정식 발주서(PO) 두루마리 열람 모달 */}
      {viewingSupplierPo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#E6CFA0] border-4 border-[#8B5A2B] rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-6 h-6 text-emerald-900" />
                <span className="font-black text-xl text-[#3B2313]">
                  📜 보물섬 장인 길드 정식 발주서 두루마리 ({viewingSupplierPo.supplierName})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FDF6E2] border-2 border-[#8B5A2B] text-[#3B2313] text-sm font-black hover:bg-white cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  발주서 인쇄 / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setViewingSupplierPoName(null)}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#3B2313] text-amber-300 text-sm font-black hover:bg-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  닫기
                </button>
              </div>
            </div>

            {renderSupplierPoDocument(viewingSupplierPo)}
          </div>
        </div>
      )}

      {/* 모달 3: 선장님의 비밀 문서 보관함 (통합 열람) */}
      {showDocArchiveModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#E6CFA0] border-4 border-[#8B5A2B] rounded-3xl max-w-5xl w-full p-6 space-y-5 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#8B5A2B] pb-4">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="w-7 h-7 text-red-800" />
                <div>
                  <h2 className="text-2xl font-black text-[#3B2313]">
                    🗺️ 선장님의 비밀 양피지 문서 보관함
                  </h2>
                  <p className="text-sm font-bold text-[#6B4423]">
                    바이어가 보낸 유리병 주문서 원문({orders.length}건)과 4대 장인섬으로 보낼 정식 발주서({supplierPOs.length}건)가 모두 보관되어 있습니다!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#3B2313] p-1 rounded-xl text-sm font-black">
                  <button
                    type="button"
                    onClick={() => setArchiveTab('BUYER_ORDER')}
                    className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                      archiveTab === 'BUYER_ORDER'
                        ? 'bg-amber-400 text-[#3B2313]'
                        : 'text-amber-200 hover:text-white'
                    }`}
                  >
                    🍾 바이어 의뢰서 원문 ({orders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveTab('SUPPLIER_PO')}
                    className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                      archiveTab === 'SUPPLIER_PO'
                        ? 'bg-amber-400 text-[#3B2313]'
                        : 'text-amber-200 hover:text-white'
                    }`}
                  >
                    🦅 보물섬 정식 발주서 ({supplierPOs.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDocArchiveModal(false)}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-red-800 text-white text-sm font-black hover:bg-red-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  닫기
                </button>
              </div>
            </div>

            {archiveTab === 'BUYER_ORDER' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {orders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setArchiveSelectedOrderId(o.id)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-black border-2 transition cursor-pointer ${
                        archiveSelectedOrderId === o.id
                          ? 'bg-[#3B2313] text-amber-300 border-[#3B2313]'
                          : !o.confirmed
                          ? 'bg-red-100 text-red-900 border-red-600'
                          : 'bg-[#FDF6E2] text-[#3B2313] border-[#8B5A2B]'
                      }`}
                    >
                      {o.id} · {o.buyerName} ({o.quantity}대)
                    </button>
                  ))}
                </div>
                {renderBuyerOrderDocument(
                  orders.find((o) => o.id === archiveSelectedOrderId) || orders[0]
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {supplierPOs.map((po) => (
                    <button
                      key={po.supplierName}
                      type="button"
                      onClick={() => setArchiveSelectedPoSupplier(po.supplierName)}
                      className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition cursor-pointer ${
                        archiveSelectedPoSupplier === po.supplierName
                          ? 'bg-emerald-900 text-amber-200 border-emerald-900'
                          : 'bg-[#FDF6E2] text-[#3B2313] border-[#8B5A2B]'
                      }`}
                    >
                      {ISLAND_META[po.supplierName]?.emoji} {po.poNo} · {po.supplierName}
                    </button>
                  ))}
                </div>
                {supplierPOs.length > 0 &&
                  renderSupplierPoDocument(
                    supplierPOs.find(
                      (p) => p.supplierName === archiveSelectedPoSupplier
                    ) || supplierPOs[0]
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
