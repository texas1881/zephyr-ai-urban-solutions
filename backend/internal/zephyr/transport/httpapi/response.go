// Package httpapi exposes the Zephyr records API over HTTP using the
// consistent { "success": bool, ... } envelope shared with the frontend.
package httpapi

import (
	"encoding/json"
	"net/http"
)

type successEnvelope struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

type errorEnvelope struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func writeSuccess(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(successEnvelope{Success: true, Data: data})
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(errorEnvelope{Success: false, Message: message})
}
