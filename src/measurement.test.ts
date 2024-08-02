import { test } from 'tap'
import { Measurement } from './measurement'

const statsPattern = '[0-9\\.]+(k|m|b|t)? i\\/s \\(±[0-9\\.]+\\%\\) \\([0-9\\.]+(ns|us|ms|s)\\/i\\)'

test('Measurement', async t => {
  const measurement = new Measurement('test')
  t.equal(measurement.name, 'test')
  t.equal(measurement.stats.total, 0)

  const result = measurement.run(() => {
    // Do nothing
  }, 1000)
  t.match(result, new RegExp(statsPattern))
  t.ok(measurement.stats.total > 0)
})
