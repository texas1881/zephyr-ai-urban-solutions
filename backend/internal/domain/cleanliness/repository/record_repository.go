package repository

import (
	"context"

	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"
)

// RecordRepository defines the persistence port for cleanliness analyses.
type RecordRepository interface {
	// Save persists a record (assigns an ID/timestamp when missing).
	Save(ctx context.Context, record *model.Record) error

	// List returns all records, newest first.
	List(ctx context.Context) ([]*model.Record, error)

	// Stats returns the aggregate summary over all records.
	Stats(ctx context.Context) (*model.Stats, error)

	// Delete removes a single record by ID.
	Delete(ctx context.Context, id string) error

	// Clear removes all records.
	Clear(ctx context.Context) error

	// Assign dispatches a team to a record (sets status to assigned).
	Assign(ctx context.Context, id, team string) (*model.Record, error)

	// UpdateStatus updates the dispatch status of a record.
	UpdateStatus(ctx context.Context, id, status string) (*model.Record, error)
}
