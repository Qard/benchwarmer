# benchwarmer

A lightweight benchmarking tool for Node.js.

## Installation

```bash
npm install benchwarmer
```

## Usage

```javascript
import { bench } from 'benchwarmer'

bench('my group', (b) => {
  b.measure('fast', () => {
    // do some fast things...
  })

  b.measure('slow', () => {
    // do some slow things...
  })
})
```

Output:

```
# my group
fast - 9.15m i/s (±1088.20%) (109.24ns/i)
slow - 7.89m i/s (±884.15%) (126.79ns/i)
Comparing...
  - fast (fastest)
  - slow (16.06% slower)
```
