import { Stats } from './stats'

export type MeasureFn = () => void

export class Measurement {
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
