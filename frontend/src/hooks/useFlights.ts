import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/utils/api'
import type { Flight, FlightCreatePayload, FlightUpdatePayload } from '@/types/flight'

const FLIGHTS_KEY = ['flights']

export function useFlights() {
  return useQuery<Flight[]>({
    queryKey: FLIGHTS_KEY,
    queryFn: () => api.get<Flight[]>('/flights'),
  })
}

export function useCreateFlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FlightCreatePayload) => api.post<Flight>('/flights', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLIGHTS_KEY }),
  })
}

export function useUpdateFlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlightUpdatePayload }) =>
      api.put<Flight>(`/flights/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLIGHTS_KEY }),
  })
}

export function useDeleteFlight() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/flights/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FLIGHTS_KEY }),
  })
}
