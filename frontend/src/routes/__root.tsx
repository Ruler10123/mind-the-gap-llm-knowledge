import { Outlet, createRootRouteWithContext, useLocation } from '@tanstack/react-router'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

function RootComponent() {
  return (
    <>
      <Outlet />
    </>
  ) 
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})
