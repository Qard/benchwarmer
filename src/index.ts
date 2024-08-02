import type { Writable } from 'stream'

const NANOS = 1
const MICROS = NANOS * 1000
const MILLIS = MICROS * 1000
const SECONDS = MILLIS * 1000

type GroupFn = (bench: Bench) => void
type MeasureFn = () => void

function humanNumber(value: number, isTime = false) {
  const levelCap = isTime ? 3 : 4
  const threshold = 1000
  let level = 0

  while (value >= threshold && ++level <= levelCap) {
    value /= threshold
  }

  return value.toFixed(2) + (
    isTime
      ? ['ns', 'us', 'ms', 's'][level] || 's'
      : ['', 'k', 'm', 'b', 't'][level] || 't'
  )
}

class Stats {
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

class Measurement {
  public stats: Stats

  constructor(public readonly name: string) {
    this.name = name
    this.stats = new Stats()
  }

  run(fn: MeasureFn, targetTime: number) {
    let start
    let end

    while (this.stats.total < targetTime) {
      start = process.hrtime.bigint()
      fn()
      end = process.hrtime.bigint()
      this.stats.push(Number(end - start))
    }

    // TODO: detect TTY and print continuously rather than only after completion
    return this.stats.toString()
  }
}

function compareMeasurements(a: Measurement, b: Measurement) {
  const current = a.stats.opsPerSecond
  const next = b.stats.opsPerSecond
  if (current > next) return -1
  if (current < next) return 1
  return 0
}

export interface BenchOptions {
  targetTime?: number
  output?: Writable
  indent?: number
}

export class Bench {
  #output: Writable
  #indent: number
  #targetTime: number
  #measurements: Array<Measurement> = []

  constructor(
    public readonly name: string,
    options: BenchOptions = {}
  ) {
    this.name = name
    this.#indent = options.indent ?? 0
    this.#targetTime = options.targetTime ?? SECONDS
    this.#output = options.output ?? process.stdout

    this.#measurements = []

    this.#output.write(" ".repeat(this.#indent))
    this.#output.write(`# ${name}\n`)
  }

  measure(name: string, fn: MeasureFn) {
    const measurement = new Measurement(name)
    this.#measurements.push(measurement)

    this.#output.write(" ".repeat(this.#indent))
    this.#output.write(`${name} - `)
    this.#output.write(measurement.run(fn, this.#targetTime))
    this.#output.write("\n")
  }

  group(name: string, fn: GroupFn) {
    const bench = new Bench(name, {
      indent: this.#indent + 2,
      targetTime: this.#targetTime,
      output: this.#output
    })
    bench.run(fn)
  }

  run(fn: GroupFn) {
    fn(this)

    // Only show comparison if there's more than one measurement.
    if (this.#measurements.length > 1) {
      // Sort the order of the measurements by the number of operations per second
      const sorted = this.#measurements.sort(compareMeasurements)

      this.#output.write(" ".repeat(this.#indent))
      this.#output.write("Comparing...\n")

      let first
      for (const measurement of sorted) {
        const { stats } = measurement
        this.#output.write(" ".repeat(this.#indent))
        if (first == undefined) {
          this.#output.write(`  - ${measurement.name} (fastest)\n`)
          first = stats
        } else {
          const percent = (stats.mean / first.mean) * 100 - 100
          this.#output.write(`  - ${measurement.name} `)
          this.#output.write(`(${percent.toFixed(2)}% slower)\n`)
        }
      }
    }
  }
}

export function bench(name: string, options: BenchOptions, fn: GroupFn): void
export function bench(name: string, fn: GroupFn): void
export function bench(name: string, options: GroupFn | BenchOptions, fn?: GroupFn) {
  if (typeof options === 'function') {
    fn = options
    options = {}
  }

  const bench = new Bench(name, options)
  bench.run(fn)
}
