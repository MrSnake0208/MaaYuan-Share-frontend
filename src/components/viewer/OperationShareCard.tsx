import type { CSSProperties, Ref } from 'react'

import type {
  OperationShareAction,
  OperationShareCardConfig,
  OperationShareModel,
  OperationShareOperator,
} from './operationShareModel'
import {
  buildOperationShareCellKey,
  createOperationShareCardConfig,
  filterOperationShareActions,
} from './operationShareModel'
import {
  ShareCardFrame,
  ShareOperatorAvatar,
  ShareOperatorStarLevel,
  ShareSectionTitle,
  shareCardPalette as palette,
} from './shareCardComponents'

const defaultCardConfig = createOperationShareCardConfig()
const tableHeaderBackground = palette.panel
const tableBodyBackground = palette.stripe

export function getOperationShareActionCellBackground(
  cellColors: OperationShareCardConfig['cellColors'],
  round: number,
  slot: number,
) {
  return (
    cellColors[buildOperationShareCellKey(round, `slot-${slot}`)] ??
    tableBodyBackground
  )
}

export function getOperationShareActionLabel(action: OperationShareAction) {
  const order = action.label.match(/^\d+/)?.[0] ?? ''
  const starColor = action.raw.match(/^重开:无(.+)星$/)?.[1]

  if (starColor) {
    return `${order}无${starColor}星重开`
  }

  const fallenSlot = action.raw.match(/^重开:检测(\d+)号位阵亡$/)?.[1]
  if (fallenSlot) {
    return `${fallenSlot}号位阵亡就重开`
  }

  return action.label
}

function OperatorColumn({
  operator,
  slot,
}: {
  operator?: OperationShareOperator
  slot: number
}) {
  if (!operator) {
    return (
      <div className="flex min-h-[238px] flex-col items-center justify-center px-2 text-center">
        <div
          className="flex h-[118px] w-[118px] items-center justify-center border-2 border-dashed text-lg font-semibold"
          style={{ borderColor: '#9aaba5', color: palette.muted }}
        >
          {slot} 号位
        </div>
        <div
          className="mt-4 text-base font-semibold"
          style={{ color: palette.muted }}
        >
          未配置密探
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[238px] flex-col items-center px-2 pb-4 pt-5 text-center">
      <div className="relative">
        <ShareOperatorAvatar
          className="h-[118px] w-[118px] border-[3px] border-white bg-white object-cover shadow-sm"
          operator={operator}
          size={118}
        />
        <span
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white"
          style={{ background: palette.brand }}
        >
          {slot}
        </span>
      </div>
      <div className="mt-3 text-[21px] font-bold leading-tight">
        {operator.name}
      </div>
      <div
        className="mt-2 min-h-10 text-[13px] font-medium leading-5"
        style={{ color: palette.muted }}
      >
        {operator.skill ? <div>技能 {operator.skill}</div> : null}
        {operator.starLevel !== undefined ? (
          <ShareOperatorStarLevel value={operator.starLevel} />
        ) : null}
        {operator.module ? <div>{operator.module}模组</div> : null}
      </div>
    </div>
  )
}

function SubstituteOperator({
  operator,
}: {
  operator: OperationShareOperator
}) {
  return (
    <div className="flex w-[148px] items-center gap-3">
      <ShareOperatorAvatar
        className="h-14 w-14 shrink-0 border-2 border-white bg-white object-cover shadow-sm"
        operator={operator}
        size={56}
      />
      <div className="min-w-0 text-left">
        <div className="break-words text-base font-bold leading-tight">
          {operator.name}
        </div>
        <div className="mt-1 text-xs" style={{ color: palette.muted }}>
          {operator.skill ? `技能 ${operator.skill}` : '可替换'}
        </div>
      </div>
    </div>
  )
}

const operationShareActionStyle: CSSProperties = { color: '#293633' }

export function getOperationShareActionStyle(): CSSProperties {
  return operationShareActionStyle
}

function ActionList({ actions }: { actions: OperationShareAction[] }) {
  if (actions.length === 0) {
    return (
      <span className="text-lg" style={{ color: '#a7b0ad' }}>
        —
      </span>
    )
  }

  return (
    <div
      className="text-center text-[22px] font-bold leading-[1.25]"
      style={operationShareActionStyle}
    >
      {actions.map((action, index) => (
        <span key={`${action.raw}-${index}`}>
          {getOperationShareActionLabel(action)}
          <wbr />
        </span>
      ))}
    </div>
  )
}

export function OperationShareCard({
  model,
  cardRef,
  qrDataUrl,
  config = defaultCardConfig,
}: {
  model: OperationShareModel
  cardRef?: Ref<HTMLDivElement>
  qrDataUrl: string
  config?: OperationShareCardConfig
}) {
  return (
    <ShareCardFrame
      cardRef={cardRef}
      eyebrow="MaaYuan · 作业分享"
      model={model}
      qrDataUrl={qrDataUrl}
    >
      <section className="mt-10">
        <ShareSectionTitle>作战编排</ShareSectionTitle>
        <table
          className="mt-5 w-full table-fixed border-collapse text-center"
          style={{ borderColor: palette.border }}
        >
          <thead>
            <tr>
              <th
                className="w-[110px] border-2 px-3 text-[21px] font-bold"
                style={{
                  borderColor: palette.border,
                  background: tableHeaderBackground,
                }}
              >
                回合
              </th>
              {model.actionSlots.map((slot) => (
                <th
                  key={slot}
                  className="border-2 p-0 align-top"
                  style={{
                    borderColor: palette.border,
                    background: tableHeaderBackground,
                  }}
                >
                  <OperatorColumn
                    operator={model.operators[slot - 1]}
                    slot={slot}
                  />
                </th>
              ))}
              {config.showOtherActions ? (
                <th
                  className="w-[118px] border-2 px-3 text-lg font-bold"
                  style={{
                    borderColor: palette.border,
                    background: tableHeaderBackground,
                  }}
                >
                  其他动作
                </th>
              ) : null}
              {config.showNotes ? (
                <th
                  className="w-[168px] border-2 px-3 text-lg font-bold"
                  style={{
                    borderColor: palette.border,
                    background: tableHeaderBackground,
                  }}
                >
                  备注
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {model.rounds.length > 0 ? (
              model.rounds.map((round) => (
                <tr
                  key={round.round}
                  style={{ background: tableBodyBackground }}
                >
                  <th
                    className="border-2 px-3 py-3 text-[19px] leading-tight"
                    style={{ borderColor: palette.border }}
                  >
                    <span className="block text-[28px] font-bold">
                      {round.round}
                    </span>
                    <span className="mt-1 block text-sm font-semibold">
                      回合
                    </span>
                  </th>
                  {model.actionSlots.map((slot) => (
                    <td
                      key={slot}
                      className="border-2 px-1.5 py-2 align-middle"
                      style={{
                        borderColor: palette.border,
                        background: getOperationShareActionCellBackground(
                          config.cellColors,
                          round.round,
                          slot,
                        ),
                      }}
                    >
                      <ActionList actions={round.slots[slot] ?? []} />
                    </td>
                  ))}
                  {config.showOtherActions ? (
                    <td
                      className="border-2 px-1.5 py-2 align-middle"
                      style={{
                        borderColor: palette.border,
                        background: tableBodyBackground,
                      }}
                    >
                      <ActionList
                        actions={filterOperationShareActions(
                          round.others,
                          config.showTargetSwitches,
                        )}
                      />
                    </td>
                  ) : null}
                  {config.showNotes ? (
                    <td
                      className="whitespace-pre-wrap break-words border-2 px-3 py-3 text-left text-[17px] font-medium leading-6 align-middle"
                      style={{
                        borderColor: palette.border,
                        background: tableBodyBackground,
                        color: config.notes[round.round]
                          ? palette.ink
                          : '#a7b0ad',
                      }}
                    >
                      {config.notes[round.round] || '—'}
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr style={{ background: tableBodyBackground }}>
                <td
                  className="border-2 px-4 py-8 text-base font-medium"
                  colSpan={
                    model.actionSlots.length +
                    1 +
                    (config.showOtherActions ? 1 : 0) +
                    (config.showNotes ? 1 : 0)
                  }
                  style={{ borderColor: palette.border, color: palette.muted }}
                >
                  此作业未定义动作序列
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {model.groups.length > 0 ? (
        <section className="mt-9">
          <ShareSectionTitle>可替换密探</ShareSectionTitle>
          <div className="mt-4 border-y" style={{ borderColor: '#b9c4c0' }}>
            {model.groups.map((group, index) => (
              <div
                key={`${group.name}-${index}`}
                className="flex min-h-[92px] items-center gap-6 px-4 py-4"
                style={{
                  background: index % 2 === 0 ? palette.panel : '#eee8dc',
                }}
              >
                <h3
                  className="w-[150px] shrink-0 border-r pr-5 text-lg font-bold"
                  style={{ borderColor: '#b9c4c0' }}
                >
                  {group.name}
                </h3>
                {group.operators.length > 0 ? (
                  <div className="flex flex-1 flex-wrap gap-x-5 gap-y-3">
                    {group.operators.map((operator, operatorIndex) => (
                      <SubstituteOperator
                        key={`${operator.rawName}-${operatorIndex}`}
                        operator={operator}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: palette.muted }}>
                    该密探组未配置可替换密探
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </ShareCardFrame>
  )
}
