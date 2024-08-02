import { test } from 'tap'
import { Transform } from 'stream'
import { bench, Measurement, Stats } from './index'
import { WriteStream } from 'tty'

function fibo(n: number): number {
  if (n < 2) return n
  return fibo(n - 1) + fibo(n - 2)
}

const statsPattern = '[0-9\\.]+(k|m|b|t)? i\\/s \\(±[0-9\\.]+\\%\\) \\([0-9\\.]+(ns|us|ms|s)\\/i\\)'
const resultPattern = '\\([0-9\\.]+\\% slower\\)'

test('has correctly formatted output', async t => {
  const stream = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk, encoding)
      callback()
    }
  })

  bench('something', {
    output: stream,
    targetTime: 1e6
  }, (b) => {
    b.measure('fast', () => {
      fibo(1)
    })

    b.measure('slow', () => {
      fibo(6)
    })

    b.group('group', (b) => {
      b.measure('fast', () => {
        fibo(1)
      })

      b.measure('slow', () => {
        fibo(6)
      })
    })
  })

  stream.end()

  const result = Buffer.concat(await stream.toArray()).toString('utf8')
  t.match(result, new RegExp(
    '# something\\n' +
    `fast - ${statsPattern}\\n` +
    `slow - ${statsPattern}\\n` +
    '  # group\\n' +
    `  fast - ${statsPattern}\\n` +
    `  slow - ${statsPattern}\\n` +
    '  Comparing\\.\\.\\.\\n' +
    `    - fast \\(fastest\\)\\n` +
    `    - slow ${resultPattern}\\n` +
    'Comparing\\.\\.\\.\\n' +
    `  - fast \\(fastest\\)\\n` +
    `  - slow ${resultPattern}\\n`
  ))
})

test('has reasonable defaults', async t => {
  // Create test stream
  const stream = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk, encoding)
      callback()
    }
  })

  // Patch stdout with test stream
  const desc = Object.getOwnPropertyDescriptor(process, 'stdout')
  t.teardown(() => {
    Object.defineProperty(process, 'stdout', desc)
  })
  Object.defineProperty(process, 'stdout', {
    value: stream as unknown as (WriteStream & { fd: 1; }),
    configurable: true
  })

  // Run benchmark
  bench('something', (b) => {
    b.measure('thing', () => {
      fibo(1)
    })
  })

  stream.end()

  const result = Buffer.concat(await stream.toArray()).toString('utf8')
  t.match(result, new RegExp(
    '# something\\n' +
    `thing - ${statsPattern}\\n`
  ))
})

test('exposes Measurement and Stats', t => {
  t.ok(typeof Measurement === 'function')
  t.ok(typeof Stats === 'function')
  t.end()
})
