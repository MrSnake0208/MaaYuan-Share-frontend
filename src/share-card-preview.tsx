import QRCode from 'qrcode'
import ReactDOM from 'react-dom/client'

import { OperationShareCard } from './components/viewer/OperationShareCard'
import type { OperationShareModel } from './components/viewer/operationShareModel'
import './styles/blueprint.less'

const operators = [
  ['杨修', 'char_001_yangxiu'],
  ['贾诩', 'char_002_jiaxu'],
  ['孙尚香', 'char_003_sunshangxiang'],
  ['郭嘉', 'char_004_guojia'],
  ['鲁肃', 'char_005_lusu'],
] as const

async function render() {
  const maayuanUrl = 'https://share.maayuan.top/?op=29533'
  const originalUrl = 'https://www.bilibili.com/read/cv29533'
  const qrDataUrl = await QRCode.toDataURL(originalUrl)
  const model: OperationShareModel = {
    title: '22 期地宫 40 层张郃稳定通关作业',
    stage: '地宫 40 层',
    author: 'MaaYuan 作者',
    originalAuthor: '原作者昵称',
    source: {
      type: 'repost',
      strategyAuthor: '原作者昵称',
      sharer: 'MaaYuan 作者',
      platform: '哔哩哔哩',
      originalUrl,
    },
    shortCode: '29533',
    maayuanUrl,
    qrTargetUrl: originalUrl,
    qrLabel: '扫码查看原贴',
    operators: operators.map(([name, avatarId], index) => ({
      slot: index + 1,
      name,
      rawName: name,
      avatarId,
      starLevel: index + 1,
      skill: 2,
    })),
    groups: [],
    actionSlots: [1, 2, 3, 4, 5],
    rounds: [{ round: 1, slots: { 1: [{ raw: '1普', label: '1A' }] }, others: [] }],
  }
  document.body.style.cssText = 'padding:40px;background:#dfe4e2'
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <OperationShareCard model={model} qrDataUrl={qrDataUrl} />,
  )
}

void render()
