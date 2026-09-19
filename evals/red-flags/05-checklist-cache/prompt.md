---
max_turns: 8
timeout_seconds: 240
allowed_tools: [Read, Grep, Skill]
model: opus
runs: 3
---
Check cache.go against a design smell checklist.

```go
// cache.go
package cache

import "sync"

type Cache struct {
	mu      sync.Mutex
	shards  []map[string][]byte
	size    int
	policy  string
	seed    uint64
	lf      float64
	pending map[string][]byte
}

// NewCache creates a cache holding at most size entries.
func NewCache(size, shards int, evictionPolicy string, hashSeed uint64, bucketLoadFactor float64) *Cache {
	c := &Cache{size: size, policy: evictionPolicy, seed: hashSeed, lf: bucketLoadFactor}
	c.shards = make([]map[string][]byte, shards)
	for i := range c.shards {
		c.shards[i] = make(map[string][]byte, int(float64(size/shards)/bucketLoadFactor))
	}
	return c
}

// Prepare stages a write.
func (c *Cache) Prepare(key string, val []byte) {
	c.mu.Lock()
	if c.pending == nil {
		c.pending = map[string][]byte{}
	}
	c.pending[key] = val
}

// Commit applies staged writes.
func (c *Cache) Commit() {
	for k, v := range c.pending {
		c.shards[c.shardFor(k)][k] = v
	}
	c.pending = nil
	c.mu.Unlock()
}

func (c *Cache) Get(key string) ([]byte, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	v, ok := c.shards[c.shardFor(key)][key]
	return v, ok
}

func (c *Cache) shardFor(key string) int {
	h := c.seed
	for i := 0; i < len(key); i++ {
		h = h*31 + uint64(key[i])
	}
	return int(h % uint64(len(c.shards)))
}
```

A typical call site:

```go
c := cache.NewCache(10000, 16, "lru", 0x9e3779b9, 0.75)
c.Prepare(k, v)
c.Commit()
```
