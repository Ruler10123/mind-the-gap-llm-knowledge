import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import AssistantMenu from '../components/AssistantMenu'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <AssistantMenu />
      <Outlet />
    </>
  ),
})
