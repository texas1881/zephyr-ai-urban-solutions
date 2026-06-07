// Package model holds the Cleanliness bounded-context domain entities.
// Following masterfabric-go clean architecture, the domain layer has no
// framework or infrastructure dependencies.
package model

import "time"

// Dispatch status values for a record.
const (
	StatusPending  = "pending"
	StatusAssigned = "assigned"
	StatusResolved = "resolved"
)

// DetectedObject is a single object returned by the AI image-analysis step.
type DetectedObject struct {
	Label string  `json:"label"`
	Score float64 `json:"score"`
}

// Situation is a single field situation detected by the vision model
// (litter, road damage, extreme dirt, ...).
type Situation struct {
	Type              string  `json:"type"`
	Severity          string  `json:"severity"`
	Confidence        float64 `json:"confidence"`
	Description       string  `json:"description"`
	Direction         string  `json:"direction"`
	RecommendedAction string  `json:"recommendedAction,omitempty"`
	Location          string  `json:"location,omitempty"`
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
	// Field-management state
	Situations      []Situation `json:"situations"`
	SafetyRisk       string   `json:"safetyRisk,omitempty"`
	RecommendedTeam  string   `json:"recommendedTeam"`
	RecommendedTeams []string `json:"recommendedTeams,omitempty"`
	AnalysisModel    string   `json:"analysisModel,omitempty"`
	ImageSize        string   `json:"imageSize,omitempty"`
	Status           string   `json:"status"`
	AssignedTeam    string      `json:"assignedTeam"`
	Note            string      `json:"note"`
	CreatedAt       time.Time   `json:"createdAt"`
}

// Stats is an aggregate summary computed over the accumulated records.
type Stats struct {
	Total        int            `json:"total"`
	AvgDensity   int            `json:"avgDensity"`
	TotalObjects int            `json:"totalObjects"`
	ByPriority   map[string]int `json:"byPriority"`
}
