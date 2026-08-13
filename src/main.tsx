import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css'
import '@blueprintjs/select/lib/css/blueprint-select.css'

import 'normalize.css'
import React, { lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { Route, Routes } from 'react-router-dom'

import { withSuspensable } from 'components/Suspensable'
import { ViewPage } from 'pages/view'
import { clearOutdatedSwrCache } from 'utils/swr'

import { App } from './App'
import { AppLayout } from './layouts/AppLayout'
import { NotFoundPage } from './pages/404'
import { IndexPage } from './pages/index'
import './styles/blueprint.less'

import './styles/index.css'

// add platform class to root element
if (navigator.userAgent.includes('Win')) {
  document.documentElement.classList.add('platform--windows')
} else {
  document.documentElement.classList.add('platform--non-windows')
}

clearOutdatedSwrCache()

const CreatePageLazy = withSuspensable(
  lazy(() => import('./pages/create').then((m) => ({ default: m.CreatePage }))),
)
const EditorPageLazy = withSuspensable(
  lazy(() => import('./pages/editor').then((m) => ({ default: m.EditorPage }))),
)
const OperatorRecorderPageLazy = withSuspensable(
  lazy(() =>
    import('./pages/operator-recorder').then((m) => ({
      default: m.OperatorRecorderPage,
    })),
  ),
)
const AboutPageLazy = withSuspensable(
  lazy(() => import('./pages/about').then((m) => ({ default: m.AboutPage }))),
)
const ProfilePageLazy = withSuspensable(
  lazy(() =>
    import('./pages/profile').then((m) => ({ default: m.ProfilePage })),
  ),
)
const AdminPageLazy = withSuspensable(
  lazy(() => import('./pages/admin').then((m) => ({ default: m.AdminPage }))),
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App>
      <AppLayout>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/create/:id" element={<CreatePageLazy />} />
          <Route path="/create" element={<CreatePageLazy />} />
          <Route path="/about" element={<AboutPageLazy />} />
          <Route path="/profile/:id" element={<ProfilePageLazy />} />
          <Route path="/operation/:id" element={<ViewPage />} />
          <Route path="/editor" element={<EditorPageLazy />} />
          <Route path="/editor/:id" element={<EditorPageLazy />} />
          <Route
            path="/operator-recorder"
            element={<OperatorRecorderPageLazy />}
          />
          <Route path="/admin" element={<AdminPageLazy />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </App>
  </React.StrictMode>,
)
