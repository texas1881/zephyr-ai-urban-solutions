// Package store provides infrastructure adapters for the Zephyr domain.
package store

import (
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/masterfabric-go/masterfabric/internal/zephyr/domain"
)

// Memory is a thread-safe in-memory implementation of domain.Repository.
// It keeps the demo runnable without Postgres; swap for a pgx-backed
// repository to align with the full masterfabric-go infrastructure layer.
type Memory struct {
	mu      sync.RWMutex
	records []domain.Record
}

func NewMemory() *Memory {
	return &Memory{records: make([]domain.Record, 0, 64)}
}

func (m *Memory) Save(r domain.Record) (domain.Record, error) {
	if r.ID == "" {
		r.ID = uuid.NewString()
	}
	if r.CreatedAt.IsZero() {
		r.CreatedAt = time.Now().UTC()
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.records = append(m.records, r)
	return r, nil
}

func (m *Memory) List() ([]domain.Record, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	out := make([]domain.Record, len(m.records))
	copy(out, m.records)
	sort.Slice(out, func(i, j int) bool {
		return out[i].CreatedAt.After(out[j].CreatedAt)
	})
	return out, nil
}

func (m *Memory) Stats() (domain.Stats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := domain.Stats{
		ByPriority: map[string]int{"low": 0, "medium": 0, "high": 0, "critical": 0},
	}
	densitySum := 0
	for _, r := range m.records {
		stats.Total++
		densitySum += r.DensityScore
		stats.TotalObjects += len(r.Objects)
		stats.ByPriority[r.Priority]++
	}
	if stats.Total > 0 {
		stats.AvgDensity = densitySum / stats.Total
	}
	return stats, nil
}
