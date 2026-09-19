---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Do a design review of ratelimit.go.

```go
// Package ratelimit provides a token-bucket rate limiter that is safe for
// concurrent use.
package ratelimit

import (
	"sync"
	"time"
)

// Limiter allows up to burst events at once and refills at ratePerSecond
// events per second. The zero value is not usable; construct one with New.
type Limiter struct {
	mu     sync.Mutex
	rate   float64
	burst  float64
	tokens float64
	last   time.Time
	now    func() time.Time
}

// New returns a Limiter that starts full. It panics if ratePerSecond is not
// positive or burst is less than 1.
func New(ratePerSecond float64, burst int) *Limiter {
	return newWithClock(ratePerSecond, burst, time.Now)
}

// newWithClock is New with an injectable clock, for tests in this package.
func newWithClock(ratePerSecond float64, burst int, now func() time.Time) *Limiter {
	if !(ratePerSecond > 0) || burst < 1 {
		panic("ratelimit: ratePerSecond must be > 0 and burst >= 1")
	}
	return &Limiter{
		rate:   ratePerSecond,
		burst:  float64(burst),
		tokens: float64(burst),
		last:   now(),
		now:    now,
	}
}

// Allow reports whether one event may happen now, consuming a token if so.
func (l *Limiter) Allow() bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.refill()
	if l.tokens < 1 {
		return false
	}
	l.tokens--
	return true
}

// refill adds the tokens earned since the last call, capped at burst. A clock
// that moves backwards earns nothing.
func (l *Limiter) refill() {
	now := l.now()
	if elapsed := now.Sub(l.last).Seconds(); elapsed > 0 {
		l.tokens = min(l.burst, l.tokens+elapsed*l.rate)
		l.last = now
	}
}
```
