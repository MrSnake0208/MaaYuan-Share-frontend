import { lazy } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { withSuspensable } from 'components/Suspensable'

const OperationViewer = withSuspensable(
  lazy(() =>
    import('components/viewer/OperationViewer').then((module) => ({
      default: module.OperationViewer,
    })),
  ),
)

export const ViewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) {
    navigate('/')
    return null
  }

  return (
    <div className="pb-16">
      <OperationViewer operationId={+id} onCloseDrawer={() => {}} />
    </div>
  )
}
