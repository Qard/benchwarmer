import { test } from 'tap'
import { humanNumber, Stats } from './stats'

test('humanNumber', (t) => {
  t.equal(humanNumber(0), '0.00', 'no unit when less than 1000')
  t.equal(humanNumber(1234), '1.23k', 'k for thousands')
  t.equal(humanNumber(1234567), '1.23m', 'm for millions')
  t.equal(humanNumber(1234567890), '1.23b', 'b for billions')
  t.equal(humanNumber(1234567890123), '1.23t', 't for trillions')
  t.equal(humanNumber(1234567890123456), '1234.57t', 'continue trillions after 999t')

  t.equal(humanNumber(0, true), '0.00ns', 'ns for time less than one microsecond')
  t.equal(humanNumber(1234, true), '1.23us', 'us for time less than one millisecond')
  t.equal(humanNumber(1234567, true), '1.23ms', 'ms for time less than one second')
  t.equal(humanNumber(1234567890, true), '1.23s', 's for time of one second or more')
  t.equal(humanNumber(1234567890123, true), '1234.57s', 'continue seconds beyond 1s')

  t.end()
})

test('Stats', (t) => {
  const stats = new Stats(3, 6, 2, 2)

  t.equal(stats.opsPerSecond, 500000000, 'opsPerSecond')
  t.equal(stats.variance, 0.6666666666666666, 'variance')
  t.equal(stats.stdDev, 0.816496580927726, 'stdDev')

  stats.push(4)
  t.equal(stats.count, 4, 'count')
  t.equal(stats.total, 10, 'total')
  t.equal(stats.mean, 2.5, 'mean')
  t.equal(stats.dSquared, 5, 'dSquared')

  t.equal(stats.toString(), '400.00m i/s (±1.12%) (2.50ns/i)')

  t.end()
})
