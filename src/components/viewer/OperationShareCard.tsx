import type { CSSProperties, Ref } from 'react'

import type {
  OperationShareAction,
  OperationShareModel,
  OperationShareOperator,
} from './operationShareModel'

const cardStyle: CSSProperties = {
  width: 1080,
  boxSizing: 'border-box',
  background: '#f8fafc',
  color: '#172033',
  padding: 56,
  fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
}

function OperatorItem({ operator }: { operator: OperationShareOperator }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <img
        alt={operator.name}
        className="h-28 w-28 rounded-md border-2 border-slate-200 bg-white object-cover"
        height={112}
        loading="eager"
        onError={(event) => {
          const image = event.currentTarget
          if (image.dataset.fallbackApplied === 'true') return
          image.dataset.fallbackApplied = 'true'
          image.src = '/assets/operator-avatars/404.webp'
        }}
        src={
          operator.avatarId
            ? `/assets/operator-avatars/webp96/${operator.avatarId}.webp`
            : '/assets/operator-avatars/404.webp'
        }
        width={112}
      />
      <div className="mt-3 text-xl font-bold leading-tight">
        {operator.name}
      </div>
      <div className="mt-1 text-sm text-slate-500">
        {operator.slot ? `${operator.slot} 号位` : '可替换密探'}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-slate-700">
        {operator.skill ? <span>技能 {operator.skill}</span> : null}
        {operator.elite !== undefined && operator.level !== undefined ? (
          <span>
            精英 {operator.elite} · Lv.{operator.level}
          </span>
        ) : null}
        {operator.module ? <span>{operator.module}模组</span> : null}
      </div>
    </div>
  )
}

function actionColors(raw: string) {
  if (raw.includes('sp') || raw.includes('大'))
    return 'bg-rose-100 text-rose-800'
  if (raw.includes('下')) return 'bg-amber-100 text-amber-800'
  if (raw.includes('等待')) return 'bg-slate-200 text-slate-700'
  return 'bg-sky-100 text-sky-800'
}

function ActionList({ actions }: { actions: OperationShareAction[] }) {
  if (actions.length === 0)
    return <span className="text-sm text-slate-400">暂无动作</span>
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {actions.map((action, index) => (
        <span
          key={`${action.raw}-${index}`}
          className={`inline-flex rounded px-2 py-1 text-sm font-semibold ${actionColors(action.raw)}`}
        >
          {action.label}
        </span>
      ))}
    </div>
  )
}

export function OperationShareCard({
  model,
  cardRef,
}: {
  model: OperationShareModel
  cardRef?: Ref<HTMLDivElement>
}) {
  return (
    <div ref={cardRef} style={cardStyle}>
      <header className="border-b-4 border-cyan-600 pb-8">
        <div className="text-lg font-bold uppercase text-cyan-700">
          MaaYuan Share
        </div>
        <h1 className="mt-3 text-5xl font-bold leading-tight text-slate-950">
          {model.title}
        </h1>
        <div className="mt-5 flex gap-8 text-xl text-slate-600">
          <span>关卡：{model.stage}</span>
          <span>作者：{model.author}</span>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">密探阵容</h2>
        {model.operators.length > 0 ? (
          <div className="mt-6 grid grid-cols-5 gap-6">
            {model.operators.map((operator) => (
              <OperatorItem
                key={`${operator.slot}-${operator.rawName}`}
                operator={operator}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded border border-dashed border-slate-300 p-8 text-center text-slate-500">
            此作业未配置密探
          </div>
        )}
      </section>

      {model.groups.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">可替换密探</h2>
          <div className="mt-5 space-y-5">
            {model.groups.map((group, index) => (
              <div
                key={`${group.name}-${index}`}
                className="rounded border border-slate-200 bg-white p-5"
              >
                <h3 className="text-xl font-bold">{group.name}</h3>
                {group.operators.length > 0 ? (
                  <div className="mt-5 grid grid-cols-5 gap-6">
                    {group.operators.map((operator, operatorIndex) => (
                      <OperatorItem
                        key={`${operator.rawName}-${operatorIndex}`}
                        operator={operator}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-slate-500">
                    该密探组未配置可替换密探
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">动作序列</h2>
        {model.rounds.length > 0 ? (
          <table className="mt-5 w-full table-fixed border-collapse overflow-hidden rounded bg-white text-center">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="w-28 border border-slate-300 px-3 py-4">回合</th>
                {model.actionSlots.map((slot) => (
                  <th key={slot} className="border border-slate-300 px-3 py-4">
                    {model.operators[slot - 1]?.name || `密探 ${slot}`}
                    <div className="mt-1 text-xs font-normal text-slate-300">
                      {slot} 号位
                    </div>
                  </th>
                ))}
                <th className="border border-slate-300 px-3 py-4">其他动作</th>
              </tr>
            </thead>
            <tbody>
              {model.rounds.map((round) => (
                <tr key={round.round}>
                  <th className="border border-slate-200 bg-slate-100 px-3 py-5 text-lg">
                    第 {round.round} 回合
                  </th>
                  {model.actionSlots.map((slot) => (
                    <td
                      key={slot}
                      className="border border-slate-200 px-3 py-5 align-top"
                    >
                      <ActionList actions={round.slots[slot] ?? []} />
                    </td>
                  ))}
                  <td className="border border-slate-200 px-3 py-5 align-top">
                    <ActionList actions={round.others} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-5 rounded border border-dashed border-slate-300 p-8 text-center text-slate-500">
            此作业未定义动作序列
          </div>
        )}
      </section>

      <footer className="mt-10 border-t border-slate-300 pt-5 text-right text-sm text-slate-500">
        由 MaaYuan Share 生成
      </footer>
    </div>
  )
}
