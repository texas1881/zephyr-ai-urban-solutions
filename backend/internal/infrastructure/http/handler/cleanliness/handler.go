// Package cleanliness exposes the Cleanliness data-accumulation API over HTTP,
// wiring application use cases to chi routes using the shared response helpers.
package cleanliness

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/masterfabric-go/masterfabric/internal/application/cleanliness/dto"
	"github.com/masterfabric-go/masterfabric/internal/application/cleanliness/usecase"
	"github.com/masterfabric-go/masterfabric/internal/shared/response"
	"github.com/masterfabric-go/masterfabric/internal/shared/validator"
)

// Teams is the static list of municipal field teams.
var Teams = []string{"Temizlik Ekibi", "Yol Bakım Ekibi"}

// Handler provides Cleanliness HTTP handlers.
type Handler struct {
	saveUC   *usecase.SaveRecordUseCase
	listUC   *usecase.ListRecordsUseCase
	statsUC  *usecase.GetStatsUseCase
	deleteUC *usecase.DeleteRecordUseCase
	clearUC  *usecase.ClearRecordsUseCase
	assignUC *usecase.AssignTeamUseCase
	statusUC *usecase.UpdateStatusUseCase
}

// NewHandler creates a new Cleanliness handler.
func NewHandler(
	saveUC *usecase.SaveRecordUseCase,
	listUC *usecase.ListRecordsUseCase,
	statsUC *usecase.GetStatsUseCase,
	deleteUC *usecase.DeleteRecordUseCase,
	clearUC *usecase.ClearRecordsUseCase,
	assignUC *usecase.AssignTeamUseCase,
	statusUC *usecase.UpdateStatusUseCase,
) *Handler {
	return &Handler{
		saveUC:   saveUC,
		listUC:   listUC,
		statsUC:  statsUC,
		deleteUC: deleteUC,
		clearUC:  clearUC,
		assignUC: assignUC,
		statusUC: statusUC,
	}
}

// Routes returns a chi router for the records resource (mount under /api/v1).
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/records", h.Create)
	r.Get("/records", h.List)
	r.Get("/records/stats", h.Stats)
	r.Delete("/records", h.Clear)
	r.Delete("/records/{id}", h.Delete)
	r.Post("/records/{id}/assign", h.Assign)
	r.Post("/records/{id}/status", h.UpdateStatus)
	r.Get("/teams", h.ListTeams)
	return r
}

// Create persists a new analysis record.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateRecordRequest
	if err := validator.DecodeAndValidate(r, &req); err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	record, err := h.saveUC.Execute(r.Context(), req)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.Created(w, record)
}

// List returns all stored analyses, newest first.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	records, err := h.listUC.Execute(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, records)
}

// Stats returns aggregate statistics over the stored analyses.
func (h *Handler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.statsUC.Execute(r.Context())
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, stats)
}

// Delete removes a single analysis by ID.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.deleteUC.Execute(r.Context(), id); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"id": id})
}

// Clear removes all stored analyses.
func (h *Handler) Clear(w http.ResponseWriter, r *http.Request) {
	if err := h.clearUC.Execute(r.Context()); err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, map[string]bool{"cleared": true})
}

// Assign dispatches a team to a record.
func (h *Handler) Assign(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req dto.AssignTeamRequest
	if err := validator.DecodeAndValidate(r, &req); err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	record, err := h.assignUC.Execute(r.Context(), id, req.Team)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, record)
}

// UpdateStatus updates the dispatch status of a record.
func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req dto.UpdateStatusRequest
	if err := validator.DecodeAndValidate(r, &req); err != nil {
		response.JSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	record, err := h.statusUC.Execute(r.Context(), id, req.Status)
	if err != nil {
		response.Error(w, err)
		return
	}
	response.JSON(w, http.StatusOK, record)
}

// ListTeams returns the static list of municipal field teams.
func (h *Handler) ListTeams(w http.ResponseWriter, _ *http.Request) {
	response.JSON(w, http.StatusOK, Teams)
}
