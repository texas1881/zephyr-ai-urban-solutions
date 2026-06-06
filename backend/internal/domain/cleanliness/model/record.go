// Package model holds the Cleanliness bounded-context domain entities.
// Following masterfabric-go clean architecture, the domain layer has no
// framework or infrastructure dependencies.
package model

import "time"

// DetectedObject is a single object returned by the AI image-analysis step.
type DetectedObject struct {
	Label string  `json:"label"`
	Score float64 `json:"score"`
}

// Record is a persisted cleanliness/litter analysis for a location
// (the data-accumulation aggregate of the Cleanliness context).
type Record struct {
	ID            string           `json:"id"`
	Address       string           `json:"address"`
	Lat           float64          `json:"lat"`
	Lng           float64          `json:"lng"`
	LitterCount   int              `json:"litterCount"`
	DensityScore  int              `json:"densityScore"`
	Priority      string           `json:"priority"`
	Cleanliness   string           `json:"cleanliness"`
	StreetViewURL string           `json:"streetViewUrl"`
	Objects       []DetectedObject `json:"objects"`
	CreatedAt     time.Time        `json:"createdAt"`
}

// Stats is an aggregate summary computed over the accumulated records.
type Stats struct {
	Total        int            `json:"total"`
	AvgDensity   int            `json:"avgDensity"`
	TotalObjects int            `json:"totalObjects"`
	ByPriority   map[string]int `json:"byPriority"`
}
