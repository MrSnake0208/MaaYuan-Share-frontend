import type { ReactNode, Ref } from 'react'

import type {
  OperationShareCardConfig,
  OperationShareDisc,
  OperationShareModel,
  OperationShareOperator,
} from './operationShareModel'
import {
  buildOperationShareDiscKey,
  createOperationShareCardConfig,
} from './operationShareModel'
import {
  ShareCardFrame,
  ShareOperatorAvatar,
  ShareSectionTitle,
  shareCardPalette as palette,
} from './shareCardComponents'

const DISC_TONES: Record<string, string> = {
  金: '#7a4d0b',
  紫: '#6f3b83',
  蓝: '#315f73',
  橙: '#9a4d16',
}

const rowBackgrounds = ['#f3e3c9', '#ddc09e'] as const
const DISC_SLOTS = [1, 2, 3] as const
const DISC_FIELDS = [
  { field: 'disc', label: '命盘' },
  { field: 'starStone', label: '主星' },
  { field: 'assistStar', label: '辅星' },
] as const
const emptyRequiredDiscSlots: ReadonlySet<number> = new Set()
const defaultCardConfig = createOperationShareCardConfig()

function getDiscDisplayPriority(
  disc: OperationShareDisc,
  requiredDiscSlots: ReadonlySet<number>,
) {
  if (disc.forbidden) return 1
  if (requiredDiscSlots.has(disc.slot)) return 0
  return 2
}

export function orderOperationShareDiscs(
  discs: OperationShareDisc[],
  requiredDiscSlots: ReadonlySet<number> = emptyRequiredDiscSlots,
) {
  const discsBySlot = new Map(discs.map((disc) => [disc.slot, disc]))
  const orderedDiscs = DISC_SLOTS.flatMap((slot) => {
    const disc = discsBySlot.get(slot)
    return disc ? [disc] : []
  }).sort(
    (left, right) =>
      getDiscDisplayPriority(left, requiredDiscSlots) -
        getDiscDisplayPriority(right, requiredDiscSlots) ||
      left.slot - right.slot,
  )

  return DISC_SLOTS.map((_, index) => orderedDiscs[index])
}

function DiscAbbreviation({
  disc,
  required,
}: {
  disc: OperationShareDisc
  required: boolean
}) {
  const color = DISC_TONES[disc.color ?? ''] ?? '#5f4a31'

  if (disc.forbidden) {
    return (
      <span
        aria-label={`绝对不能有命盘：${disc.abbreviation}`}
        className="inline-flex max-w-full flex-col items-center justify-center gap-1 rounded-md border-2 px-2.5 py-1.5"
        style={{
          background: '#fde7e2',
          borderColor: '#a92f24',
          color: '#8f2117',
        }}
      >
        <span className="break-words text-[17px] font-black leading-snug line-through decoration-2">
          {disc.abbreviation}
        </span>
      </span>
    )
  }

  if (required) {
    return (
      <span
        aria-label={`必须携带命盘：${disc.abbreviation}`}
        className="inline-flex max-w-full flex-col items-center justify-center gap-1 rounded-md border px-2 py-1.5"
        style={{
          background: '#fff2cf',
          borderColor: '#c88a25',
          color: '#75450e',
        }}
      >
        <span
          className="break-words text-[17px] font-black leading-snug"
          style={{ color }}
        >
          {disc.abbreviation}
        </span>
      </span>
    )
  }

  return (
    <span
      className="break-words text-[17px] font-bold leading-snug"
      style={{ color }}
    >
      {disc.abbreviation}
    </span>
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
    <tr style={{ background, height: minHeight }}>
      <th
        className="w-[108px] border px-3 text-[21px] font-bold"
        scope="row"
        style={{ borderColor: '#78501f' }}
      >
        {label}
      </th>
      {operators.map((operator, index) => (
        <td
          key={`${label}-${operator.rawName}-${index}`}
          className="border px-3 py-4 text-center text-[21px] font-semibold align-middle"
          style={{ borderColor: '#78501f' }}
        >
          {children(operator)}
        </td>
      ))}
    </tr>
  )
}

function DiscRows({
  config,
  operators,
}: {
  config: OperationShareCardConfig
  operators: OperationShareOperator[]
}) {
  const orderedDiscs = operators.map((operator, operatorIndex) => {
    const operatorSlot = operator.slot ?? operatorIndex + 1
    const requiredDiscSlots = new Set(
      operator.discs
        .filter(
          (disc) =>
            config.requiredDiscs[
              buildOperationShareDiscKey(operatorSlot, disc.slot)
            ] === true,
        )
        .map((disc) => disc.slot),
    )

    return orderOperationShareDiscs(operator.discs, requiredDiscSlots)
  })

  return (
    <>
      {DISC_FIELDS.map(({ field, label }, fieldIndex) => (
        <tr
          key={field}
          style={{
            background:
              rowBackgrounds[(fieldIndex + 1) % rowBackgrounds.length],
            height: 126,
          }}
        >
          <th
            className="w-[108px] border px-3 text-[20px] font-bold leading-snug"
            scope="row"
            style={{ borderColor: '#78501f' }}
          >
            {label}
          </th>
          {operators.map((operator, operatorIndex) => {
            return (
              <td
                key={`${field}-${operator.rawName}-${operatorIndex}`}
                className="border px-2 py-3 text-center align-middle"
                style={{ borderColor: '#78501f' }}
              >
                <div className="flex flex-col items-center justify-center gap-1.5">
                  {orderedDiscs[operatorIndex].map((disc, slotIndex) => (
                    <div
                      key={DISC_SLOTS[slotIndex]}
                      className="flex min-h-[28px] w-full items-center justify-center"
                    >
                      {disc ? (
                        field === 'disc' ? (
                          <DiscAbbreviation
                            disc={disc}
                            required={
                              !disc.forbidden &&
                              config.requiredDiscs[
                                buildOperationShareDiscKey(
                                  operator.slot ?? operatorIndex + 1,
                                  disc.slot,
                                )
                              ] === true
                            }
                          />
                        ) : (
                          <span className="break-words text-[15px] leading-5">
                            {disc[field] ?? '—'}
                          </span>
                        )
                      ) : (
                        <span style={{ color: '#9a856d' }}>—</span>
                      )}
                    </div>
                  ))}
                </div>
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

export function DeployedOperatorsShareCard({
  model,
  cardRef,
  qrDataUrl,
  hideQrCode = true,
  config = defaultCardConfig,
}: {
  model: OperationShareModel
  cardRef?: Ref<HTMLDivElement>
  qrDataUrl: string
  hideQrCode?: boolean
  config?: OperationShareCardConfig
}) {
  return (
    <ShareCardFrame
      cardRef={cardRef}
      eyebrow="MaaYuan · 上阵密探"
      hideQrCode={hideQrCode}
      model={model}
      qrDataUrl={qrDataUrl}
    >
      <section className="mt-10">
        <ShareSectionTitle>上阵密探属性一览</ShareSectionTitle>
        {model.operators.length > 0 ? (
          <table
            className="mt-5 w-full table-fixed border-collapse border-2"
            style={{ borderColor: '#78501f', color: '#624015' }}
          >
            <thead>
              <tr style={{ background: '#f0dec1' }}>
                <th
                  aria-label="属性"
                  className="w-[108px] border"
                  style={{ borderColor: '#78501f' }}
                />
                {model.operators.map((operator, index) => (
                  <th
                    key={`${operator.rawName}-${index}`}
                    className="border p-0 align-bottom"
                    scope="col"
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
              <DiscRows config={config} operators={model.operators} />
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
