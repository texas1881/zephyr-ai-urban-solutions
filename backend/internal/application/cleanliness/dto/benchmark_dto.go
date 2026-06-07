package dto

import (
	"time"

	"github.com/masterfabric-go/masterfabric/internal/domain/cleanliness/model"
)

// BenchmarkCaseResultDTO mirrors a single benchmark case outcome from the web runner.
type BenchmarkCaseResultDTO struct {
	CaseID    string   `json:"caseId"`
	Address   string   `json:"address"`
	Pass      bool     `json:"pass"`
	Reasons   []string `json:"reasons"`
	LatencyMs int64    `json:"latencyMs"`
	Error     string   `json:"error,omitempty"`
	Actual    struct {
		SituationCount int      `json:"situationCount"`
		Types          []string `json:"types"`
		Teams          []string `json:"teams"`
		AnalysisModel  string   `json:"analysisModel"`
		Cleanliness    string   `json:"cleanliness"`
		DensityScore   int      `json:"densityScore"`
	} `json:"actual"`
}

// CreateBenchmarkRunRequest is the payload from the benchmark script.
type CreateBenchmarkRunRequest struct {
	RunID       string                   `json:"runId" validate:"required"`
	StartedAt   string                   `json:"startedAt"`
	CompletedAt string                   `json:"completedAt"`
	BaseURL     string                   `json:"baseUrl"`
	ImageSize   string                   `json:"imageSize"`
	Total       int                      `json:"total"`
	Passed      int                      `json:"passed"`
	Failed      int                      `json:"failed"`
	Score       float64                  `json:"score"`
	Precision   float64                  `json:"precision"`
	Cases       []BenchmarkCaseResultDTO `json:"cases"`
}

func (r CreateBenchmarkRunRequest) ToModel() *model.BenchmarkRun {
	started, _ := time.Parse(time.RFC3339, r.StartedAt)
	completed, _ := time.Parse(time.RFC3339, r.CompletedAt)
	if started.IsZero() {
		started = time.Now().UTC()
	}
	if completed.IsZero() {
		completed = time.Now().UTC()
	}

	cases := make([]model.BenchmarkCaseResult, 0, len(r.Cases))
	for _, c := range r.Cases {
		item := model.BenchmarkCaseResult{
			CaseID:    c.CaseID,
			Address:   c.Address,
			Pass:      c.Pass,
			Reasons:   c.Reasons,
			LatencyMs: c.LatencyMs,
			Error:     c.Error,
		}
		item.Actual.SituationCount = c.Actual.SituationCount
		item.Actual.Types = c.Actual.Types
		item.Actual.Teams = c.Actual.Teams
		item.Actual.AnalysisModel = c.Actual.AnalysisModel
		item.Actual.Cleanliness = c.Actual.Cleanliness
		item.Actual.DensityScore = c.Actual.DensityScore
		cases = append(cases, item)
	}

	return &model.BenchmarkRun{
		RunID:       r.RunID,
		StartedAt:   started,
		CompletedAt: completed,
		BaseURL:     r.BaseURL,
		ImageSize:   r.ImageSize,
		Total:       r.Total,
		Passed:      r.Passed,
		Failed:      r.Failed,
		Score:       r.Score,
		Precision:   r.Precision,
		Cases:       cases,
	}
}
