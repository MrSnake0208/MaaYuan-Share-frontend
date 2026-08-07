import { Icon } from '@blueprintjs/core'

import type { CSSProperties, Ref } from 'react'

import type {
  OperationShareAction,
  OperationShareCardConfig,
  OperationShareModel,
  OperationShareOperator,
  OperationShareRound,
} from './operationShareModel'
import {
  buildOperationShareCellKey,
  createOperationShareCardConfig,
  filterOperationShareActions,
} from './operationShareModel'
import {
  ShareCardFrame,
  ShareOperatorAvatar,
  ShareSectionTitle,
  shareCardPalette as palette,
} from './shareCardComponents'

const defaultCardConfig = createOperationShareCardConfig()
const tableBorderColor = '#78501f'
const tableHeaderBackground = '#f0dec1'
const tableBodyBackgrounds = ['#f3e3c9', '#ddc09e'] as const
const operationShareTextColor = '#624015'
const operationShareMutedTextColor = '#9a856d'

function getOperationShareRoundBackground(round: number) {
  return tableBodyBackgrounds[(round - 1) % tableBodyBackgrounds.length]
}

export function getOperationShareActionCellBackground(
  cellColors: OperationShareCardConfig['cellColors'],
  round: number,
  slot: number,
) {
  return (
    cellColors[buildOperationShareCellKey(round, `slot-${slot}`)] ??
    getOperationShareRoundBackground(round)
  )
}

export function getOperationShareActionLabel(
  action: OperationShareAction,
  displayOrder = action.order,
) {
  const starColor = action.raw.match(/^重开:无(.+)星$/)?.[1]

  if (starColor) {
    return `${displayOrder}无${starColor}星重开`
  }

  const fallenSlot = action.raw.match(/^重开:检测(\d+)号位阵亡$/)?.[1]
  if (fallenSlot) {
    return `${fallenSlot}号位阵亡就重开`
  }

  return `${displayOrder}${action.label}`
}

export function getOperationShareRoundDisplay(
  round: OperationShareRound,
  config: Pick<
    OperationShareCardConfig,
    'showOtherActions' | 'showTargetSwitches'
  >,
) {
  const otherActions = config.showOtherActions
    ? filterOperationShareActions(round.others, config.showTargetSwitches)
    : []
  const visibleActions = [...otherActions]

  Object.values(round.slots).forEach((actions) => {
    visibleActions.push(...actions)
  })
  visibleActions.sort((left, right) => left.order - right.order)

  return {
    otherActions,
    displayOrderByActionOrder: new Map(
      visibleActions.map((action, index) => [action.order, index + 1]),
    ),
  }
}

export function getOperationShareOperatorStarLabel(
  operator: Pick<OperationShareOperator, 'starLevel'>,
) {
  return operator.starLevel === undefined
    ? undefined
    : `${operator.starLevel} 星`
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
          style={{
            borderColor: '#9aaba5',
            color: operationShareMutedTextColor,
          }}
        >
          {slot} 号位
        </div>
        <div
          className="mt-4 text-base font-semibold"
          style={{ color: operationShareMutedTextColor }}
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
        {operator.starLevel !== undefined ? (
          <span
            aria-label={getOperationShareOperatorStarLabel(operator)}
            className="absolute -right-2 -top-2 flex h-8 min-w-10 items-center justify-center gap-1 rounded-sm border-2 border-white px-1.5 text-sm font-bold text-white"
            style={{ background: '#e96913' }}
          >
            <Icon aria-hidden icon="star" iconSize={14} />
            <span>{operator.starLevel}</span>
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-[21px] font-bold leading-tight">
        {operator.name}
      </div>
      <div
        className="mt-2 min-h-10 text-[13px] font-medium leading-5"
        style={{ color: operationShareMutedTextColor }}
      >
        {operator.skill ? <div>技能 {operator.skill}</div> : null}
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

const operationShareActionStyle: CSSProperties = {
  color: operationShareTextColor,
}

export function getOperationShareActionStyle(): CSSProperties {
  return operationShareActionStyle
}

function ActionList({
  actions,
  displayOrderByActionOrder,
}: {
  actions: OperationShareAction[]
  displayOrderByActionOrder: ReadonlyMap<number, number>
}) {
  if (actions.length === 0) {
    return (
      <span className="text-lg" style={{ color: operationShareMutedTextColor }}>
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
          {getOperationShareActionLabel(
            action,
            displayOrderByActionOrder.get(action.order),
          )}
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
      eyebrow="MaaYuan · 作业分享"
      hideQrCode={hideQrCode}
      model={model}
      qrDataUrl={qrDataUrl}
    >
      <section className="mt-10">
        <ShareSectionTitle>作战编排</ShareSectionTitle>
        <table
          className="mt-5 w-full table-fixed border-collapse text-center"
          style={{
            borderColor: tableBorderColor,
            color: operationShareTextColor,
          }}
        >
          <thead>
            <tr>
              <th
                className="w-[110px] border-2 px-3 text-[21px] font-bold"
                style={{
                  borderColor: tableBorderColor,
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
                    borderColor: tableBorderColor,
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
                    borderColor: tableBorderColor,
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
                    borderColor: tableBorderColor,
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
              model.rounds.map((round) => {
                const { otherActions, displayOrderByActionOrder } =
                  getOperationShareRoundDisplay(round, config)
                const rowBackground = getOperationShareRoundBackground(
                  round.round,
                )

                return (
                  <tr key={round.round} style={{ background: rowBackground }}>
                    <th
                      className="border-2 px-3 py-3 text-[19px] leading-tight"
                      style={{ borderColor: tableBorderColor }}
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
                          borderColor: tableBorderColor,
                          background: getOperationShareActionCellBackground(
                            config.cellColors,
                            round.round,
                            slot,
                          ),
                        }}
                      >
                        <ActionList
                          actions={round.slots[slot] ?? []}
                          displayOrderByActionOrder={displayOrderByActionOrder}
                        />
                      </td>
                    ))}
                    {config.showOtherActions ? (
                      <td
                        className="border-2 px-1.5 py-2 align-middle"
                        style={{
                          borderColor: tableBorderColor,
                          background: rowBackground,
                        }}
                      >
                        <ActionList
                          actions={otherActions}
                          displayOrderByActionOrder={displayOrderByActionOrder}
                        />
                      </td>
                    ) : null}
                    {config.showNotes ? (
                      <td
                        className="whitespace-pre-wrap break-words border-2 px-3 py-3 text-left text-[17px] font-medium leading-6 align-middle"
                        style={{
                          borderColor: tableBorderColor,
                          background: rowBackground,
                          color: config.notes[round.round]
                            ? operationShareTextColor
                            : operationShareMutedTextColor,
                        }}
                      >
                        {config.notes[round.round] || '—'}
                      </td>
                    ) : null}
                  </tr>
                )
              })
            ) : (
              <tr style={{ background: tableBodyBackgrounds[0] }}>
                <td
                  className="border-2 px-4 py-8 text-base font-medium"
                  colSpan={
                    model.actionSlots.length +
                    1 +
                    (config.showOtherActions ? 1 : 0) +
                    (config.showNotes ? 1 : 0)
                  }
                  style={{
                    borderColor: tableBorderColor,
                    color: operationShareMutedTextColor,
                  }}
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
