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

// Limiter allows up to Burst events at once and refills at Rate events per
// second. The zero value is not usable; construct one with New.
type Limiter struct {
	mu     sync.Mutex
	rate   float64
	burst  float64
	tokens float64
	last   time.Time
	now    func() time.Time
}

// New returns a Limiter that starts full.
func New(ratePerSecond float64, burst int) *Limiter {
	return &Limiter{
		rate:   ratePerSecond,
		burst:  float64(burst),
		tokens: float64(burst),
		last:   time.Now(),
		now:    time.Now,
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

// refill adds the tokens earned since the last call, capped at burst.
func (l *Limiter) refill() {
	now := l.now()
	elapsed := now.Sub(l.last).Seconds()
	l.last = now
	l.tokens = min(l.burst, l.tokens+elapsed*l.rate)
}
```
