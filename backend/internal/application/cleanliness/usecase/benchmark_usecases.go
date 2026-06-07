package usecase

import (
	"context"
	"strings"

	"github.com/masterfabric-go/masterfabric/internal/application/cleanliness/dto"
	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"
	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/repository"
	domainErr "github.com/masterfabric-go/masterfabric/internal/shared/errors"
)

// SaveBenchmarkRunUseCase persists a benchmark execution report.
type SaveBenchmarkRunUseCase struct {
	repo repository.BenchmarkRepository
}

func NewSaveBenchmarkRunUseCase(repo repository.BenchmarkRepository) *SaveBenchmarkRunUseCase {
	return &SaveBenchmarkRunUseCase{repo: repo}
}

func (uc *SaveBenchmarkRunUseCase) Execute(ctx context.Context, req dto.CreateBenchmarkRunRequest) (*model.BenchmarkRun, error) {
	if strings.TrimSpace(req.RunID) == "" {
		return nil, domainErr.New(domainErr.ErrValidation, "runId zorunludur", nil)
	}
	run := req.ToModel()
	if err := uc.repo.Save(ctx, run); err != nil {
		return nil, domainErr.New(domainErr.ErrInternal, "benchmark kaydedilemedi", err)
	}
	return run, nil
}

// ListBenchmarkRunsUseCase returns stored benchmark runs.
type ListBenchmarkRunsUseCase struct {
	repo repository.BenchmarkRepository
}

func NewListBenchmarkRunsUseCase(repo repository.BenchmarkRepository) *ListBenchmarkRunsUseCase {
	return &ListBenchmarkRunsUseCase{repo: repo}
}

func (uc *ListBenchmarkRunsUseCase) Execute(ctx context.Context) ([]*model.BenchmarkRun, error) {
	return uc.repo.List(ctx)
}

// LatestBenchmarkRunUseCase returns the most recent benchmark run.
type LatestBenchmarkRunUseCase struct {
	repo repository.BenchmarkRepository
}

func NewLatestBenchmarkRunUseCase(repo repository.BenchmarkRepository) *LatestBenchmarkRunUseCase {
	return &LatestBenchmarkRunUseCase{repo: repo}
}

func (uc *LatestBenchmarkRunUseCase) Execute(ctx context.Context) (*model.BenchmarkRun, error) {
	run, err := uc.repo.Latest(ctx)
	if err != nil {
		return nil, domainErr.New(domainErr.ErrInternal, "benchmark okunamadı", err)
	}
	if run == nil {
		return nil, domainErr.New(domainErr.ErrNotFound, "benchmark kaydı yok", nil)
	}
	return run, nil
}
