package repository

import (
	"context"

	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"
)

// BenchmarkRepository persists benchmark run reports.
type BenchmarkRepository interface {
	Save(ctx context.Context, run *model.BenchmarkRun) error
	List(ctx context.Context) ([]*model.BenchmarkRun, error)
	Latest(ctx context.Context) (*model.BenchmarkRun, error)
}
