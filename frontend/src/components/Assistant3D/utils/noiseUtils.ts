import { createNoise3D } from 'simplex-noise'

export const noise3D = createNoise3D()

export function average(array: Uint8Array | Array<number>): number {
  let sum = 0
  for (const value of array) {
    sum += value
  }
  return sum / array.length
}
