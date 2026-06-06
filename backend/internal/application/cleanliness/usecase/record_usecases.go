// Package usecase contains the application-layer use cases for the
// Cleanliness context, orchestrating the domain repository port.
package usecase

import (
	"context"
	"strings"

	"github.com/masterfabric-go/masterfabric/internal/application/cleanliness/dto"
	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"
	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/repository"
	domainErr "github.com/masterfabric-go/masterfabric/internal/shared/errors"
)

// SaveRecordUseCase persists a new cleanliness analysis.
type SaveRecordUseCase struct {
	repo repository.RecordRepository
}

func NewSaveRecordUseCase(repo repository.RecordRepository) *SaveRecordUseCase {
	return &SaveRecordUseCase{repo: repo}
}

func (uc *SaveRecordUseCase) Execute(ctx context.Context, req dto.CreateRecordRequest) (*model.Record, error) {
	if strings.TrimSpace(req.Address) == "" {
		return nil, domainErr.New(domainErr.ErrValidation, "address zorunludur", nil)
	}
	record := req.ToModel()
	if err := uc.repo.Save(ctx, record); err != nil {
		return nil, domainErr.New(domainErr.ErrInternal, "kayıt oluşturulamadı", err)
	}
	return record, nil
}

// ListRecordsUseCase returns all stored analyses (newest first).
type ListRecordsUseCase struct {
	repo repository.RecordRepository
}

func NewListRecordsUseCase(repo repository.RecordRepository) *ListRecordsUseCase {
	return &ListRecordsUseCase{repo: repo}
}

func (uc *ListRecordsUseCase) Execute(ctx context.Context) ([]*model.Record, error) {
	return uc.repo.List(ctx)
}

// GetStatsUseCase returns aggregate statistics over the stored analyses.
type GetStatsUseCase struct {
	repo repository.RecordRepository
}

func NewGetStatsUseCase(repo repository.RecordRepository) *GetStatsUseCase {
	return &GetStatsUseCase{repo: repo}
}

func (uc *GetStatsUseCase) Execute(ctx context.Context) (*model.Stats, error) {
	return uc.repo.Stats(ctx)
}

// DeleteRecordUseCase removes one analysis by ID.
type DeleteRecordUseCase struct {
	repo repository.RecordRepository
}

func NewDeleteRecordUseCase(repo repository.RecordRepository) *DeleteRecordUseCase {
	return &DeleteRecordUseCase{repo: repo}
}

func (uc *DeleteRecordUseCase) Execute(ctx context.Context, id string) error {
	if strings.TrimSpace(id) == "" {
		return domainErr.New(domainErr.ErrBadRequest, "id zorunludur", nil)
	}
	return uc.repo.Delete(ctx, id)
}

// ClearRecordsUseCase removes all analyses.
type ClearRecordsUseCase struct {
	repo repository.RecordRepository
}

func NewClearRecordsUseCase(repo repository.RecordRepository) *ClearRecordsUseCase {
	return &ClearRecordsUseCase{repo: repo}
}

func (uc *ClearRecordsUseCase) Execute(ctx context.Context) error {
	return uc.repo.Clear(ctx)
}
