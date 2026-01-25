import { Outlet, createRootRouteWithContext, useLocation } from '@tanstack/react-router'
import { ToastContainer } from '@/components/Toast'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})
