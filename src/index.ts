import type { Writable } from 'stream'

import { Measurement, MeasureFn } from './measurement'
import { SECONDS } from './stats'

export { Measurement, MeasureFn }
export { Stats } from './stats'

export type GroupFn = (bench: Bench) => void

function compareMeasurements(a: Measurement, b: Measurement) {
  return b.stats.opsPerSecond - a.stats.opsPerSecond
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
  #endStream: boolean
  #measurements: Array<Measurement> = []

  constructor(
    public readonly name: string,
    options: BenchOptions = {}
  ) {
    this.name = name
    this.#indent = options.indent ?? 0
    this.#targetTime = options.targetTime ?? SECONDS
    this.#output = options.output ?? process.stdout
    this.#endStream = options.output ? true : false

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
    bench(name, {
      indent: this.#indent + 2,
      targetTime: this.#targetTime,
      output: this.#output
    }, fn)
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

    if (this.#indent === 0 && this.#endStream) {
      this.#output.end()
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
