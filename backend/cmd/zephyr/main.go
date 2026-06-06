// Command zephyr is a lightweight entrypoint for the Zephyr records API.
// It reuses the masterfabric-go stack (chi router, clean-architecture
// layering) but uses an in-memory store so the data-accumulation backend
// runs without Postgres/Docker for the hackathon demo.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/masterfabric-go/masterfabric/internal/zephyr/store"
	"github.com/masterfabric-go/masterfabric/internal/zephyr/transport/httpapi"
)

func main() {
	repo := store.NewMemory()
	handler := httpapi.NewHandler(repo)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	r.Get("/health/live", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"alive"}`))
	})
	r.Mount("/api/v1", handler.Routes())

	port := os.Getenv("ZEPHYR_PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Zephyr records API listening on :%s", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
