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

// MemoryBenchmarkRepository is an in-memory BenchmarkRepository.
type MemoryBenchmarkRepository struct {
	mu   sync.RWMutex
	runs []*model.BenchmarkRun
}

var _ repository.BenchmarkRepository = (*MemoryBenchmarkRepository)(nil)

func NewMemoryBenchmarkRepository() *MemoryBenchmarkRepository {
	return &MemoryBenchmarkRepository{runs: make([]*model.BenchmarkRun, 0, 16)}
}

func (m *MemoryBenchmarkRepository) Save(_ context.Context, run *model.BenchmarkRun) error {
	if run.ID == "" {
		run.ID = uuid.NewString()
	}
	if run.CreatedAt.IsZero() {
		run.CreatedAt = time.Now().UTC()
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	m.runs = append(m.runs, run)
	return nil
}

func (m *MemoryBenchmarkRepository) List(_ context.Context) ([]*model.BenchmarkRun, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]*model.BenchmarkRun, len(m.runs))
	copy(out, m.runs)
	sort.Slice(out, func(i, j int) bool {
		return out[i].CreatedAt.After(out[j].CreatedAt)
	})
	return out, nil
}

func (m *MemoryBenchmarkRepository) Latest(_ context.Context) (*model.BenchmarkRun, error) {
	runs, err := m.List(context.Background())
	if err != nil || len(runs) == 0 {
		return nil, err
	}
	return runs[0], nil
}
