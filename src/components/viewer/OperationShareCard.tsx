import { Icon } from '@blueprintjs/core'

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

const palette = {
  accent: '#b85f3f',
  brand: '#176b64',
  border: '#49645c',
  ink: '#24312f',
  muted: '#63716d',
  paper: '#f6f3eb',
  panel: '#fffdf8',
  stripe: '#ebe1d2',
}

const cardStyle: CSSProperties = {
  width: 1080,
  boxSizing: 'border-box',
  background: palette.paper,
  color: palette.ink,
  padding: '52px 52px 40px',
  fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
}

const STAR_LEVELS = [1, 2, 3, 4, 5] as const
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

function OperatorStarLevel({ value }: { value: number }) {
  return (
    <div
      aria-label={`${value} 星`}
      className="mt-1 flex items-center justify-center gap-1 select-none"
    >
      {STAR_LEVELS.map((level) => (
        <Icon
          key={level}
          aria-hidden
          className={`h-4 w-4 ${
            level <= value
              ? 'text-yellow-500 opacity-100'
              : 'text-gray-500 opacity-40'
          }`}
          icon="star"
          iconSize={16}
        />
      ))}
    </div>
  )
}

function operatorAvatar(operator: OperationShareOperator) {
  return operator.avatarId
    ? `/assets/operator-avatars/webp96/${operator.avatarId}.webp`
    : '/assets/operator-avatars/404.webp'
}

function applyAvatarFallback(image: HTMLImageElement) {
  if (image.dataset.fallbackApplied === 'true') return
  image.dataset.fallbackApplied = 'true'
  image.src = '/assets/operator-avatars/404.webp'
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
        <img
          alt={operator.name}
          className="h-[118px] w-[118px] border-[3px] border-white bg-white object-cover shadow-sm"
          height={118}
          loading="eager"
          onError={(event) => applyAvatarFallback(event.currentTarget)}
          src={operatorAvatar(operator)}
          width={118}
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
          <OperatorStarLevel value={operator.starLevel} />
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
      <img
        alt={operator.name}
        className="h-14 w-14 shrink-0 border-2 border-white bg-white object-cover shadow-sm"
        height={56}
        loading="eager"
        onError={(event) => applyAvatarFallback(event.currentTarget)}
        src={operatorAvatar(operator)}
        width={56}
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

function actionStyle(raw: string): CSSProperties {
  if (raw.includes('sp') || raw.includes('大')) {
    return { background: '#f4d9d1', color: '#8d392c' }
  }
  if (raw.includes('下')) {
    return { background: '#f2dfb9', color: '#795410' }
  }
  if (raw.includes('等待')) {
    return { background: '#dfe4e2', color: '#4d5b57' }
  }
  return { background: '#d8e9e4', color: '#155d57' }
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
    <div className="flex flex-wrap justify-center gap-2">
      {actions.map((action, index) => (
        <span
          key={`${action.raw}-${index}`}
          className="inline-flex rounded-[3px] px-2.5 py-1.5 text-[24px] font-bold leading-tight"
          style={actionStyle(action.raw)}
        >
          {action.label}
        </span>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[22px] font-bold">{children}</h2>
      <div className="h-px flex-1" style={{ background: '#b9c4c0' }} />
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
  const sourceTag =
    model.source.type === 'repost'
      ? { label: '搬运', background: '#f2dfb9', color: '#795410' }
      : { label: '原创', background: '#d8e9e4', color: '#155d57' }

  return (
    <div ref={cardRef} style={cardStyle}>
      <header className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div
              className="text-[15px] font-bold uppercase tracking-[0.18em]"
              style={{ color: palette.brand }}
            >
              MaaYuan · 作业分享
            </div>
            <span
              className="inline-flex rounded-sm px-2.5 py-1 text-sm font-bold"
              style={{
                background: sourceTag.background,
                color: sourceTag.color,
              }}
            >
              {sourceTag.label}
            </span>
          </div>
          <h1
            className="mt-4 break-words text-[44px] font-bold leading-[1.18]"
            style={{ color: '#172522' }}
          >
            {model.title}
          </h1>
        </div>
        <div className="mt-1 flex w-[440px] shrink-0 items-start justify-end gap-4">
          <div
            className="min-w-0 flex-1 border-l-4 py-1 pl-4 text-right"
            style={{ borderColor: palette.accent }}
          >
            {/* <div
              className="text-sm font-semibold"
              style={{ color: palette.muted }}
            >
              关卡
            </div>
            <div className="mt-1 max-w-[260px] break-words text-[25px] font-bold leading-tight">
              {model.stage}
            </div> */}
            <div
              className="mt-4 text-sm font-semibold"
              style={{ color: palette.muted }}
            >
              攻略作者
            </div>
            <div className="mt-1 break-words text-[22px] font-bold leading-tight">
              {model.source.strategyAuthor}
            </div>
            {model.source.platform ? (
              <div
                className="mt-2 inline-flex whitespace-nowrap rounded-sm border px-2 py-1 text-xs font-semibold"
                style={{ borderColor: '#9aaba5', color: palette.muted }}
              >
                来源平台 · {model.source.platform}
              </div>
            ) : null}
            {model.source.sharer ? (
              <div className="mt-2 text-sm" style={{ color: palette.muted }}>
                本站分享 · {model.source.sharer}
              </div>
            ) : null}
          </div>
          <div className="w-[104px] shrink-0 text-center">
            <img
              alt={model.qrLabel}
              className="h-[104px] w-[104px] bg-white object-contain"
              height={104}
              src={qrDataUrl}
              width={104}
            />
            <div
              className="mt-2 text-xs font-semibold leading-4"
              style={{ color: palette.muted }}
            >
              {model.qrLabel}
            </div>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <SectionTitle>作战编排</SectionTitle>
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
                      className="border-2 px-2 py-3 align-middle"
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
                      className="border-2 px-2 py-3 align-middle"
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
          <SectionTitle>可替换密探</SectionTitle>
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

      <footer
        className="mt-9 flex items-end justify-between gap-8 border-t pt-5 text-sm"
        style={{ borderColor: '#b9c4c0', color: palette.muted }}
      >
        <div className="min-w-0">
          <div>
            MaaYuan 神秘代码 ·{' '}
            <span className="font-bold" style={{ color: palette.ink }}>
              {model.shortCode}
            </span>
          </div>
          <div className="mt-1 max-w-[760px] break-all text-xs">
            站内地址 · {model.maayuanUrl}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold">MAAYUAN SHARE</div>
          <div className="mt-1 text-xs">让每一步都清晰可见</div>
        </div>
      </footer>
    </div>
  )
}
