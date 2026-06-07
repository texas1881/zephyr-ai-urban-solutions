package model

import "time"

// BenchmarkCaseResult is the outcome of a single benchmark location.
type BenchmarkCaseResult struct {
	CaseID    string   `json:"caseId"`
	Address   string   `json:"address"`
	Pass      bool     `json:"pass"`
	Reasons   []string `json:"reasons,omitempty"`
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

// BenchmarkRun is a persisted benchmark execution report.
type BenchmarkRun struct {
	ID          string                `json:"id"`
	RunID       string                `json:"runId"`
	StartedAt   time.Time             `json:"startedAt"`
	CompletedAt time.Time             `json:"completedAt"`
	BaseURL     string                `json:"baseUrl"`
	ImageSize   string                `json:"imageSize"`
	Total       int                   `json:"total"`
	Passed      int                   `json:"passed"`
	Failed      int                   `json:"failed"`
	Score       float64               `json:"score"`
	Precision   float64               `json:"precision"`
	Cases       []BenchmarkCaseResult `json:"cases"`
	CreatedAt   time.Time             `json:"createdAt"`
}
