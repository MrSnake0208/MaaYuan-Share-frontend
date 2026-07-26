import type { ReactNode, Ref } from 'react'

import type {
  OperationShareDisc,
  OperationShareModel,
  OperationShareOperator,
} from './operationShareModel'
import {
  ShareCardFrame,
  ShareOperatorAvatar,
  ShareSectionTitle,
  shareCardPalette as palette,
} from './shareCardComponents'

const DISC_TONES: Record<string, { background: string; color: string }> = {
  金: { background: '#f6dfaa', color: '#7a4d0b' },
  紫: { background: '#eadcf4', color: '#6f3b83' },
  蓝: { background: '#d9e8ef', color: '#315f73' },
  橙: { background: '#f5d4b6', color: '#9a4d16' },
}

const rowBackgrounds = ['#f3e3c9', '#ddc09e'] as const
const DISC_SLOTS = [1, 2, 3] as const

export function alignOperationShareDiscs(discs: OperationShareDisc[]) {
  const discsBySlot = new Map(discs.map((disc) => [disc.slot, disc]))
  return DISC_SLOTS.map((slot) => discsBySlot.get(slot))
}

function DiscAbbreviation({ disc }: { disc: OperationShareDisc }) {
  const tone = DISC_TONES[disc.color ?? ''] ?? {
    background: '#e7d6bd',
    color: '#5f4a31',
  }

  return (
    <span
      className="inline-flex min-w-[96px] max-w-full items-center justify-center whitespace-nowrap rounded-sm border px-2 py-1 text-[15px] font-bold leading-tight"
      style={{
        borderColor: tone.color,
        background: tone.background,
        color: tone.color,
      }}
    >
      {disc.forbidden ? '禁 · ' : ''}
      {disc.abbreviation}
    </span>
  )
}

function DiscSlotLines({
  discs,
  field,
}: {
  discs: OperationShareDisc[]
  field: 'disc' | 'starStone' | 'assistStar'
}) {
  const alignedDiscs = alignOperationShareDiscs(discs)
  const slotHeight = field === 'disc' ? 64 : 52

  return (
    <div
      className="grid"
      style={{ gridTemplateRows: `repeat(3, ${slotHeight}px)` }}
    >
      {alignedDiscs.map((disc, index) => (
        <div
          key={DISC_SLOTS[index]}
          className="flex min-w-0 items-center justify-center overflow-hidden border-b px-1 text-center last:border-b-0"
          style={{ borderColor: 'rgba(120, 80, 31, 0.24)' }}
        >
          {disc ? (
            field === 'disc' ? (
              <DiscAbbreviation disc={disc} />
            ) : (
              <span className="whitespace-nowrap text-[16px] font-semibold leading-6">
                {disc[field] ?? '—'}
              </span>
            )
          ) : (
            <span style={{ color: '#9a856d' }}>—</span>
          )}
        </div>
      ))}
    </div>
  )
}

function AscensionLevel({ value }: { value?: number }) {
  if (value === undefined) return <span style={{ color: '#9a856d' }}>—</span>

  return (
    <div
      aria-label={`化极 ${value}`}
      className="flex items-center justify-center gap-1.5"
    >
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          aria-hidden
          className="text-[22px] leading-none"
          style={{ color: level <= value ? '#e96913' : '#cdb89e' }}
        >
          ◆
        </span>
      ))}
    </div>
  )
}

function OperatorHeader({ operator }: { operator: OperationShareOperator }) {
  return (
    <div className="flex min-h-[212px] flex-col items-center justify-end px-2 pb-4 pt-5">
      <div>
        <ShareOperatorAvatar
          className="h-[132px] w-[132px] border-[3px] border-white bg-white object-cover shadow-sm"
          operator={operator}
          size={132}
        />
      </div>
      <div className="mt-3 break-words text-center text-[20px] font-bold leading-tight">
        {operator.name}
      </div>
      <div
        className="mt-1 text-xs font-semibold"
        style={{ color: palette.muted }}
      >
        技能 {operator.skill ?? '—'}
        {operator.module ? ` · ${operator.module} 模组` : ''}
      </div>
    </div>
  )
}

function AttributeRow({
  background,
  children,
  label,
  minHeight,
  operators,
}: {
  background: string
  children: (operator: OperationShareOperator) => ReactNode
  label: string
  minHeight: number
  operators: OperationShareOperator[]
}) {
  return (
    <tr style={{ background }}>
      <th
        className="w-[108px] border-2 px-3 text-[22px] font-bold"
        style={{ borderColor: '#78501f', minHeight }}
      >
        {label}
      </th>
      {operators.map((operator, index) => (
        <td
          key={`${label}-${operator.rawName}-${index}`}
          className="border-2 px-3 py-4 text-center text-[21px] font-semibold align-middle"
          style={{ borderColor: '#78501f', minHeight }}
        >
          {children(operator)}
        </td>
      ))}
    </tr>
  )
}

export function DeployedOperatorsShareCard({
  model,
  cardRef,
  qrDataUrl,
}: {
  model: OperationShareModel
  cardRef?: Ref<HTMLDivElement>
  qrDataUrl: string
}) {
  return (
    <ShareCardFrame
      cardRef={cardRef}
      eyebrow="MaaYuan · 上阵密探"
      model={model}
      qrDataUrl={qrDataUrl}
    >
      <section className="mt-10">
        <ShareSectionTitle>上阵密探属性一览</ShareSectionTitle>
        {model.operators.length > 0 ? (
          <table
            className="mt-5 w-full table-fixed border-collapse"
            style={{ borderColor: '#78501f', color: '#624015' }}
          >
            <thead>
              <tr style={{ background: '#f0dec1' }}>
                <th
                  className="w-[108px] border-2"
                  style={{ borderColor: '#78501f' }}
                />
                {model.operators.map((operator, index) => (
                  <th
                    key={`${operator.rawName}-${index}`}
                    className="border-2 p-0 align-bottom"
                    style={{ borderColor: '#78501f' }}
                  >
                    <OperatorHeader operator={operator} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AttributeRow
                background={rowBackgrounds[0]}
                label="生命"
                minHeight={72}
                operators={model.operators}
              >
                {(operator) => operator.hp ?? '—'}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[1]}
                label="攻击"
                minHeight={72}
                operators={model.operators}
              >
                {(operator) => operator.attack ?? '—'}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[0]}
                label="等级"
                minHeight={68}
                operators={model.operators}
              >
                {(operator) => operator.level}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[1]}
                label="修为"
                minHeight={68}
                operators={model.operators}
              >
                {(operator) => operator.elite}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[0]}
                label="化极"
                minHeight={76}
                operators={model.operators}
              >
                {(operator) => <AscensionLevel value={operator.starLevel} />}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[1]}
                label="命盘"
                minHeight={170}
                operators={model.operators}
              >
                {(operator) => (
                  <DiscSlotLines discs={operator.discs} field="disc" />
                )}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[0]}
                label="主星"
                minHeight={130}
                operators={model.operators}
              >
                {(operator) => (
                  <DiscSlotLines discs={operator.discs} field="starStone" />
                )}
              </AttributeRow>
              <AttributeRow
                background={rowBackgrounds[1]}
                label="辅星"
                minHeight={130}
                operators={model.operators}
              >
                {(operator) => (
                  <DiscSlotLines discs={operator.discs} field="assistStar" />
                )}
              </AttributeRow>
            </tbody>
          </table>
        ) : (
          <div
            className="mt-5 border-2 border-dashed px-5 py-12 text-center text-lg font-semibold"
            style={{ borderColor: '#9aaba5', color: palette.muted }}
          >
            此作业未配置上阵密探
          </div>
        )}
      </section>
    </ShareCardFrame>
  )
}
