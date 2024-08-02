export const NANOS = 1
export const MICROS = NANOS * 1000
export const MILLIS = MICROS * 1000
export const SECONDS = MILLIS * 1000

export function humanNumber(value: number, isTime = false) {
  const levelCap = isTime ? 3 : 4
  const threshold = 1000
  let level = 0

  while (value >= threshold && ++level <= levelCap) {
    value /= threshold
  }

  return value.toFixed(2) + (
    isTime
      ? ['ns', 'us', 'ms', 's'][level] ?? 's'
      : ['', 'k', 'm', 'b', 't'][level] ?? 't'
  )
}

export class Stats {
  constructor(
    public count = 0,
    public total = 0,
    public mean = 0,
    public dSquared = 0
  ) {
    this.count = count
    this.total = total
    this.mean = mean
    this.dSquared = dSquared
  }

  get humanOpsPerSecond() {
    return `${humanNumber(this.opsPerSecond, false)} i/s`
  }

  get humanStdDev() {
    return `(±${this.stdDev.toFixed(2)}%)`
  }

  get humanMean() {
    return `(${humanNumber(this.mean, true)}/i)`
  }

  get opsPerSecond() {
    return this.count / this.total * SECONDS
  }

  get variance() {
    return this.dSquared / this.count
  }

  get stdDev() {
    return Math.sqrt(this.variance)
  }

  push(value: number) {
    this.count++
    this.total += value

    const newMean = this.mean + (value - this.mean) / this.count
    const dSquaredIncrement = (value - newMean) * (value - this.mean)

    this.mean = newMean
    this.dSquared += dSquaredIncrement
  }

  toString() {
    return `${this.humanOpsPerSecond} ${this.humanStdDev} ${this.humanMean}`
  }
}

Object.defineProperty(Stats.prototype, 'opsPerSecond', { enumerable: true })
Object.defineProperty(Stats.prototype, 'variance', { enumerable: true })
Object.defineProperty(Stats.prototype, 'stddev', { enumerable: true })
