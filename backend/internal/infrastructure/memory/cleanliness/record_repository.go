// Package cleanliness provides an in-memory implementation of the Cleanliness
// RecordRepository port. It lets the data-accumulation API run without
// Postgres for the hackathon demo; swap for a pgx-backed repository in
// production without touching the application or transport layers.
package cleanliness

import (
	"context"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"
	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/repository"
)

// MemoryRecordRepository is a thread-safe in-memory RecordRepository.
type MemoryRecordRepository struct {
	mu      sync.RWMutex
	records []*model.Record
}

// Ensure interface compliance at compile time.
var _ repository.RecordRepository = (*MemoryRecordRepository)(nil)

func NewMemoryRecordRepository() *MemoryRecordRepository {
	return &MemoryRecordRepository{records: make([]*model.Record, 0, 64)}
}

func (m *MemoryRecordRepository) Save(_ context.Context, record *model.Record) error {
	if record.ID == "" {
		record.ID = uuid.NewString()
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}

	m.mu.Lock()
	defer m.mu.Unlock()
	m.records = append(m.records, record)
	return nil
}

func (m *MemoryRecordRepository) List(_ context.Context) ([]*model.Record, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	out := make([]*model.Record, len(m.records))
	copy(out, m.records)
	sort.Slice(out, func(i, j int) bool {
		return out[i].CreatedAt.After(out[j].CreatedAt)
	})
	return out, nil
}

func (m *MemoryRecordRepository) Stats(_ context.Context) (*model.Stats, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := &model.Stats{
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

func (m *MemoryRecordRepository) Delete(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for i, r := range m.records {
		if r.ID == id {
			m.records = append(m.records[:i], m.records[i+1:]...)
			return nil
		}
	}
	return nil
}

func (m *MemoryRecordRepository) Clear(_ context.Context) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.records = m.records[:0]
	return nil
}
