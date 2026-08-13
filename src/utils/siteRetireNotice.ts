// 域名迁移提示（弹窗一次）配置与纯逻辑
//
// 仅当当前访问的 host 命中 VITE_SITE_RETIRE_HOST（如 share.maayuan.fun:16666）时，
// 才向用户展示"本域名将保留至 XX，请尽快使用新地址"的一次性弹窗；
// 其他域名（如新地址）部署的同一份代码不会弹出。
//
// 相关环境变量：
// - VITE_SITE_RETIRE_HOST   需要展示迁移提示的域名（空 = 关闭该功能）
// - VITE_SITE_RETIRE_DATE   域名保留截止日期（展示文案用，如 2025年12月31日）
// - VITE_SITE_RETIRE_TARGET 建议用户使用的新地址（如 https://maayuan.top）

const SITE_RETIRE_STORAGE_KEY = 'maa-copilot-site-retire-dismissed'

export const siteRetireConfig = {
  host: import.meta.env.VITE_SITE_RETIRE_HOST as string | undefined,
  date: import.meta.env.VITE_SITE_RETIRE_DATE as string | undefined,
  target: import.meta.env.VITE_SITE_RETIRE_TARGET as string | undefined,
}

const hostnameOf = (host: string) => host.split(':')[0]

/** 当前 host 是否命中需要展示迁移提示的域名（忽略端口差异，如 fun 域 16666/443 端口均命中） */
export const isRetiringHost = (currentHost: string, retireHost?: string) => {
  if (!retireHost || !currentHost) {
    return false
  }
  return hostnameOf(currentHost) === hostnameOf(retireHost)
}

/** 是否已在本浏览器关闭过该提示（localStorage，maa-copilot-* 前缀） */
export const isRetireNoticeDismissed = () => {
  try {
    return window.localStorage.getItem(SITE_RETIRE_STORAGE_KEY) === '1'
  } catch {
    // 忽略存储不可用的情况
    return false
  }
}

/** 记录"已关闭"，之后不再弹出 */
export const dismissRetireNotice = () => {
  try {
    window.localStorage.setItem(SITE_RETIRE_STORAGE_KEY, '1')
  } catch {
    // 忽略存储不可用的情况
  }
}
