export enum LuggageState {
  UNLOADING = "Unloading luggage",
  LOADING = "Loading luggage",
  IDLE = "Idle",
}

export enum FlightStatus {
  ARRIVING = "Arriving",
  LANDING = "Landing",
  TAXIING = "Taxiing",
  BOARDING_GROUP_A = "Boarding Group A",
  BOARDING_GROUP_B = "Boarding Group B",
  BOARDING_GROUP_C = "Boarding Group C",
  BOARDING = "Boarding",
  DELAYED = "Delayed",
  DEPARTED = "Departed",
  CANCELLED = "Cancelled",
  ON_TIME = "On Time",
}

export interface Flight {
  id: string
  flight_number: string
  departure_time: string  // ISO datetime
  arrival_time: string    // ISO datetime
  departure_location: string
  destination: string
  origin_city?: string
  origin_gate?: string
  destination_city?: string
  boarding_group?: string
  boarding_time?: string  // ISO datetime
  seat?: string
  bags_checked: number
  luggage_state: LuggageState
  flight_status: FlightStatus
}

export interface FlightCreatePayload {
  flight_number: string
  departure_time: string
  arrival_time: string
  departure_location: string
  destination: string
  origin_city?: string
  origin_gate?: string
  destination_city?: string
  boarding_group?: string
  boarding_time?: string
  seat?: string
  bags_checked?: number
  luggage_state?: LuggageState
  flight_status?: FlightStatus
}

export interface FlightUpdatePayload {
  flight_number?: string
  departure_time?: string
  arrival_time?: string
  departure_location?: string
  destination?: string
  origin_city?: string
  origin_gate?: string
  destination_city?: string
  boarding_group?: string
  boarding_time?: string
  seat?: string
  bags_checked?: number
  luggage_state?: LuggageState
  flight_status?: FlightStatus
}
