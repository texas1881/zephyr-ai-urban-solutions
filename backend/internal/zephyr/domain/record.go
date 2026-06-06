// Package domain holds the Zephyr "detections" bounded context entities.
// It follows the clean-architecture layering used across masterfabric-go:
// the domain layer has no external dependencies.
package domain

import "time"

// DetectedObject is a single object returned by the AI detection step.
type DetectedObject struct {
	Label string  `json:"label"`
	Score float64 `json:"score"`
}

// Record is a persisted litter-density analysis for a location (data accumulation).
type Record struct {
	ID            string           `json:"id"`
	Address       string           `json:"address"`
	Lat           float64          `json:"lat"`
	Lng           float64          `json:"lng"`
	LitterCount   int              `json:"litterCount"`
	DensityScore  int              `json:"densityScore"`
	Priority      string           `json:"priority"`
	StreetViewURL string           `json:"streetViewUrl"`
	Objects       []DetectedObject `json:"objects"`
	CreatedAt     time.Time        `json:"createdAt"`
}

// Stats is an aggregate summary over the accumulated records.
type Stats struct {
	Total        int            `json:"total"`
	AvgDensity   int            `json:"avgDensity"`
	TotalObjects int            `json:"totalObjects"`
	ByPriority   map[string]int `json:"byPriority"`
}

// Repository abstracts record persistence (clean-architecture port).
type Repository interface {
	Save(r Record) (Record, error)
	List() ([]Record, error)
	Stats() (Stats, error)
	Delete(id string) error
	Clear() error
}
