import { test } from 'tap'
import { Transform } from 'stream'
import { bench } from './index'

function fibo(n: number): number {
  if (n < 2) return n
  return fibo(n - 1) + fibo(n - 2)
}

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
      fibo(5)
    })

    b.group('group', (b) => {
      b.measure('fast', () => {
        fibo(1)
      })

      b.measure('slow', () => {
        fibo(5)
      })
    })
  })

  stream.end()

  const statsPattern = '[0-9\\.]+(k|m|b|t)? i\\/s \\(±[0-9\\.]+\\%\\) \\([0-9\\.]+(ns|us|ms|s)\\/i\\)'
  const resultPattern = '\\([0-9\\.]+\\% slower\\)'

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
