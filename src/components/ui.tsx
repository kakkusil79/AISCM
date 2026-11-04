import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { daysUntil } from '../lib/scmLogic'
import type { BuyerOrder } from '../types/scm'

export function OrderStatusTag({ order }: { order: BuyerOrder }) {
  if (!order.confirmed) return <span className="tag tag-red">확인 필요</span>
  if (order.rawQuantity !== order.quantity) return <span className="tag tag-blue">정정 확정</span>
  return <span className="tag tag-green">정상</span>
}

export function DueDay({ date }: { date: string }) {
  const days = daysUntil(date)
  if (days === null) return <span className="c-dim">{date}</span>
  const tone = days < 0 ? 'tag-red' : days <= 7 ? 'tag-amber' : 'tag-gray'
  const label = days === 0 ? 'D-day' : days > 0 ? `D-${days}` : `D+${-days}`
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="c-dim">{date.slice(5)}</span>
      <span className={`tag ${tone}`}>{label}</span>
    </span>
  )
}

export interface Kpi {
  label: string
  value: string
  unit?: string
  tone?: 'red' | 'green'
}

// 화면 머리글. 핵심 숫자를 가장 크게, 제목을 그다음으로, 안내문을 작게 보여 준다.
export function PageHeader({
  title,
  desc,
  descTone,
  kpis = [],
  action,
}: {
  title: string
  desc: string
  descTone?: 'red' | 'green'
  kpis?: Kpi[]
  action?: ReactNode
}) {
  const toneClass = (tone?: 'red' | 'green') =>
    tone === 'red' ? 'text-[var(--red)]' : tone === 'green' ? 'text-[var(--green)]' : ''
  return (
    <header className="page-head">
      <div className="flex-1 min-w-56">
        <h2 className="t-2 m-0 text-[var(--brand)]">{title}</h2>
        <p className={`m-0 mt-0.5 ${descTone ? `font-semibold ${toneClass(descTone)}` : 'text-[var(--muted)]'}`}>
          {desc}
        </p>
      </div>
      {kpis.map((k) => (
        <div key={k.label} className="kpi">
          <div className="t-7">{k.label}</div>
          <div className={`t-1 ${toneClass(k.tone)}`}>
            {k.value}
            {k.unit && <span className="unit">{k.unit}</span>}
          </div>
        </div>
      ))}
      {action}
    </header>
  )
}

export function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="fields">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SubTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div role="tablist" className="flex flex-none bg-[var(--panel-head)] border-b border-[var(--line)] px-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className="sub-tab"
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function TextPreview({ url, format }: { url: string; format?: string }) {
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.text()
      })
      .then((t) => {
        if (!cancelled) setText(t.replace(/^﻿/, ''))
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [url])

  if (failed) return <p className="p-3 text-[var(--red)]">원본 파일을 불러오지 못했습니다.</p>
  if (text === null) return <p className="p-3 text-[var(--muted)]">불러오는 중…</p>
  return (
    <pre className="m-0 p-3 text-[12px] leading-[1.5] font-[inherit] whitespace-pre" data-format={format}>
      {text}
    </pre>
  )
}

// 주문서 원본 미리보기. 브라우저가 표시할 수 없는 XLSX는 내려받기만 제공한다.
export function DocumentPreview({
  url,
  format,
  fileName,
}: {
  url?: string
  format?: BuyerOrder['fileFormat']
  fileName: string
}) {
  if (!url) {
    return <p className="p-3 text-[var(--muted)]">직접 입력한 주문이라 원본 파일이 없습니다.</p>
  }
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 flex-none px-2 py-1 border-b border-[var(--line-soft)]">
        <span className="tag tag-gray">{format ?? '파일'}</span>
        <span className="truncate min-w-0 flex-1 text-[12px]" title={fileName}>
          {fileName}
        </span>
        <a className="btn" href={url} target="_blank" rel="noreferrer">
          <ExternalLink />
          새 창
        </a>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {format === 'PDF' && <iframe key={url} src={url} title={fileName} className="w-full h-full border-0" />}
        {format === 'HTML' && (
          <iframe key={url} src={url} title={fileName} sandbox="" className="w-full h-full border-0 bg-white" />
        )}
        {(format === 'CSV' || format === 'JSON' || format === 'TXT') && (
          <TextPreview key={url} url={url} format={format} />
        )}
        {(format === 'XLSX' || !format) && (
          <div className="p-4 space-y-2">
            <p>이 형식은 화면에서 미리 볼 수 없습니다. 내려받아 확인해 주세요.</p>
            <a className="btn" href={url} download={fileName}>
              파일 내려받기
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
