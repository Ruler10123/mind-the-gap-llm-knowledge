import { Outlet, createRootRouteWithContext, useLocation } from '@tanstack/react-router'

import AssistantMenu from '../components/AssistantMenu'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

function RootComponent() {
  const location = useLocation()
  const isKiosk = location.pathname === '/kiosk'

  return (
    <>
      {!isKiosk && <AssistantMenu />}
      <Outlet />
    </>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})
