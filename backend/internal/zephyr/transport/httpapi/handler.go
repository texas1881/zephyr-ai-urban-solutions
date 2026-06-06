package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/masterfabric-go/masterfabric/internal/zephyr/domain"
)

// Handler wires the Zephyr records use cases to HTTP routes.
type Handler struct {
	repo domain.Repository
}

func NewHandler(repo domain.Repository) *Handler {
	return &Handler{repo: repo}
}

// Routes returns a chi router mounted under /api/v1.
func (h *Handler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Post("/records", h.createRecord)
	r.Get("/records", h.listRecords)
	r.Get("/records/stats", h.recordStats)
	r.Delete("/records", h.clearRecords)
	r.Delete("/records/{id}", h.deleteRecord)
	return r
}

func (h *Handler) createRecord(w http.ResponseWriter, r *http.Request) {
	var rec domain.Record
	if err := json.NewDecoder(r.Body).Decode(&rec); err != nil {
		writeError(w, http.StatusBadRequest, "geçersiz istek gövdesi")
		return
	}
	if rec.Address == "" {
		writeError(w, http.StatusBadRequest, "address zorunludur")
		return
	}

	saved, err := h.repo.Save(rec)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, http.StatusCreated, saved)
}

func (h *Handler) listRecords(w http.ResponseWriter, _ *http.Request) {
	records, err := h.repo.List()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, http.StatusOK, records)
}

func (h *Handler) deleteRecord(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id zorunludur")
		return
	}
	if err := h.repo.Delete(id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, http.StatusOK, map[string]string{"id": id})
}

func (h *Handler) clearRecords(w http.ResponseWriter, _ *http.Request) {
	if err := h.repo.Clear(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, http.StatusOK, map[string]bool{"cleared": true})
}

func (h *Handler) recordStats(w http.ResponseWriter, _ *http.Request) {
	stats, err := h.repo.Stats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeSuccess(w, http.StatusOK, stats)
}
