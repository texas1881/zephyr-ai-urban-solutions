package dto

import "github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"

// CreateRecordRequest is the payload accepted when persisting an analysis.
type CreateRecordRequest struct {
	ID              string                 `json:"id"`
	Address         string                 `json:"address" validate:"required"`
	Lat             float64                `json:"lat"`
	Lng             float64                `json:"lng"`
	LitterCount     int                    `json:"litterCount"`
	DensityScore    int                    `json:"densityScore"`
	Priority        string                 `json:"priority"`
	Cleanliness     string                 `json:"cleanliness"`
	StreetViewURL   string                 `json:"streetViewUrl"`
	Objects         []model.DetectedObject `json:"objects"`
	Situations      []model.Situation      `json:"situations"`
	RecommendedTeam string                 `json:"recommendedTeam"`
	Status          string                 `json:"status"`
	AssignedTeam    string                 `json:"assignedTeam"`
}

// ToModel maps the request to a domain record.
func (r CreateRecordRequest) ToModel() *model.Record {
	status := r.Status
	if status == "" {
		status = model.StatusPending
	}
	return &model.Record{
		ID:              r.ID,
		Address:         r.Address,
		Lat:             r.Lat,
		Lng:             r.Lng,
		LitterCount:     r.LitterCount,
		DensityScore:    r.DensityScore,
		Priority:        r.Priority,
		Cleanliness:     r.Cleanliness,
		StreetViewURL:   r.StreetViewURL,
		Objects:         r.Objects,
		Situations:      r.Situations,
		RecommendedTeam: r.RecommendedTeam,
		Status:          status,
		AssignedTeam:    r.AssignedTeam,
	}
}

// AssignTeamRequest is the payload for dispatching a team to a record.
type AssignTeamRequest struct {
	Team string `json:"team" validate:"required"`
}

// UpdateStatusRequest is the payload for updating a record's dispatch status.
type UpdateStatusRequest struct {
	Status string `json:"status" validate:"required"`
}
