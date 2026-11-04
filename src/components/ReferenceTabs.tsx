import { useState } from 'react'
import { KIOSK_MODELS, SUPPLIER_MAP } from '../data/mockScmData'
import { TYPE_LABEL, fileNameFromUrl, rowKeyHandler, sourceName } from '../lib/scmLogic'
import type { BuyerOrder, MaterialItem } from '../types/scm'
import { DocumentPreview, PageHeader } from './ui'

// 유성구청 주문서는 HTML 외에 같은 내용의 TXT도 제공된다
const EXTRA_FILES = [
  {
    buyerName: '대전광역시 유성구청',
    format: 'TXT' as const,
    url: '/orders/주문서_05_대전유성구청_TAPI-9320J_음수함정(-10대_실제10대).txt',
  },
]

export function SourceFilesTab({ orders }: { orders: BuyerOrder[] }) {
  const files = [
    ...orders.flatMap((o) =>
      o.downloadUrl
        ? [{ buyerName: o.buyerName, format: o.fileFormat, url: o.downloadUrl, fileName: sourceName(o) }]
        : []
    ),
    ...EXTRA_FILES.map((f) => ({ ...f, fileName: fileNameFromUrl(f.url) })),
  ].sort((a, b) => a.fileName.localeCompare(b.fileName, 'ko'))
  const [selectedUrl, setSelectedUrl] = useState(files[0]?.url)
  const selected = files.find((f) => f.url === selectedUrl) ?? files[0]

  return (
    <div className="page">
      <PageHeader
        title="주문서 원본"
        desc="수요기관이 보낸 원본 파일입니다. 수량 판단이 애매하면 여기서 직접 대조하세요."
        kpis={[{ label: '파일', value: String(files.length), unit: '개' }]}
      />
      <div className="split" style={{ '--split': 'minmax(420px, 1fr) minmax(0, 1.5fr)' } as React.CSSProperties}>
        <section className="panel">
          <div className="panel-body">
            <table className="tbl">
              <thead>
                <tr>
                  <th>수요기관 / 파일명</th>
                  <th className="center">형식</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr
                    key={f.url}
                    tabIndex={0}
                    aria-selected={f === selected}
                    className={`row-click ${f === selected ? 'row-selected' : ''}`}
                    onClick={() => setSelectedUrl(f.url)}
                    onKeyDown={rowKeyHandler(() => setSelectedUrl(f.url))}
                  >
                    <td className="wrap">
                      <div className="c-key">{f.buyerName}</div>
                      <div className="c-faint break-all">{f.fileName}</div>
                    </td>
                    <td className="center c-dim">{f.format ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <div className="flex-1 min-h-0">
            {selected ? (
              <DocumentPreview url={selected.url} format={selected.format} fileName={selected.fileName} />
            ) : (
              <p className="p-3 text-[var(--muted)]">파일이 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

const GROUP_ORDER: MaterialItem['specType'][] = ['공통 부자재', 'J 전용 (장애인용)', '모델별 규격 부자재']

export function BomMatrixTab({ materials }: { materials: MaterialItem[] }) {
  const rows = GROUP_ORDER.flatMap((type) => materials.filter((m) => m.specType === type))
  const qtyOf = (modelIndex: number, materialId: string) =>
    KIOSK_MODELS[modelIndex].bom.find((b) => b.materialId === materialId)?.qtyPerUnit ?? 0

  return (
    <div className="page">
      <PageHeader
        title="모델별 BOM"
        desc="공통 부자재는 모델 간 단가가 같고, 규격별 부자재에서 단가를 조정해 합계를 맞춥니다."
        kpis={[
          { label: '모델', value: String(KIOSK_MODELS.length), unit: '종' },
          { label: '부자재', value: String(materials.length), unit: '종' },
          { label: '모델 1대 단가', value: '4,000,000', unit: '원' },
        ]}
      />
      <section className="panel flex-1">
        <div className="panel-body">
          <table className="tbl">
            <thead>
              <tr>
                <th>구분</th>
                <th>부자재</th>
                <th>사양</th>
                <th className="num">단가</th>
                {KIOSK_MODELS.map((m) => (
                  <th key={m.id} className="num text-[var(--text)]! font-bold!" title={`${m.name} · 물품식별번호 ${m.itemIdNo} · ${m.dimensions}`}>
                    {m.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((mat) => (
                <tr key={mat.id}>
                  <td>
                    <span className={`tag ${mat.specType === '공통 부자재' ? 'tag-gray' : 'tag-blue'}`}>
                      {TYPE_LABEL[mat.specType]}
                    </span>
                  </td>
                  <td className="c-key">{mat.name}</td>
                  <td className="c-faint max-w-80 truncate" title={mat.spec}>
                    {mat.spec}
                  </td>
                  <td className="num c-dim">{mat.unitCost.toLocaleString()}</td>
                  {KIOSK_MODELS.map((m, i) => {
                    const qty = qtyOf(i, mat.id)
                    return (
                      <td key={m.id} className={`num ${qty === 0 ? 'text-[#b6bec8]' : ''}`}>
                        {qty > 1 && <span className="c-faint mr-1">{qty}개</span>}
                        {qty === 0 ? '-' : (qty * mat.unitCost).toLocaleString()}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>1대 합계</td>
                {KIOSK_MODELS.map((m, i) => (
                  <td key={m.id} className="num">
                    {materials.reduce((s, mat) => s + qtyOf(i, mat.id) * mat.unitCost, 0).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  )
}

export function SuppliersTab({ materials }: { materials: MaterialItem[] }) {
  const suppliers = Object.values(SUPPLIER_MAP)
  return (
    <div className="page">
      <PageHeader
        title="발주처"
        desc="모두 가상 업체입니다. 사업자 정보와 리드타임은 주문서에 없는 가정값입니다."
        kpis={[{ label: '발주처', value: String(suppliers.length), unit: '곳' }]}
      />
      <section className="panel flex-1">
        <div className="panel-body">
          <table className="tbl">
            <thead>
              <tr>
                <th>업체명</th>
                <th>공급 내용</th>
                <th>담당자</th>
                <th>이메일</th>
                <th>연락처</th>
                <th className="num">리드타임</th>
                <th className="num">품목</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.name}>
                  <td className="c-key">{s.name}</td>
                  <td className="wrap">{s.note ?? '-'}</td>
                  <td className="c-dim">{s.contactName}</td>
                  <td className="c-dim">{s.email}</td>
                  <td className="c-dim">{s.phone}</td>
                  <td className="num font-semibold">{s.leadTimeDays}일</td>
                  <td className="num c-dim">{materials.filter((m) => m.supplierName === s.name).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
