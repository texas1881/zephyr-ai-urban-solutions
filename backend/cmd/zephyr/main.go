// Command zephyr is a lightweight entrypoint that runs ONLY the Cleanliness
// data-accumulation API from the masterfabric-go stack, backed by the
// in-memory repository. It reuses the same domain/application/infrastructure
// layers as the full server (cmd/server) but boots without Postgres/Redis,
// which is convenient for the hackathon demo and frontend development.
package main

import (
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	cleanlinessUC "github.com/masterfabric-go/masterfabric/internal/application/cleanliness/usecase"
	cleanlinessHandler "github.com/masterfabric-go/masterfabric/internal/infrastructure/http/handler/cleanliness"
	memCleanliness "github.com/masterfabric-go/masterfabric/internal/infrastructure/memory/cleanliness"
	"github.com/masterfabric-go/masterfabric/internal/shared/middleware"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	recordRepo := memCleanliness.NewMemoryRecordRepository()
	benchmarkRepo := memCleanliness.NewMemoryBenchmarkRepository()
	handler := cleanlinessHandler.NewHandler(
		cleanlinessUC.NewSaveRecordUseCase(recordRepo),
		cleanlinessUC.NewListRecordsUseCase(recordRepo),
		cleanlinessUC.NewGetStatsUseCase(recordRepo),
		cleanlinessUC.NewDeleteRecordUseCase(recordRepo),
		cleanlinessUC.NewClearRecordsUseCase(recordRepo),
		cleanlinessUC.NewAssignTeamUseCase(recordRepo),
		cleanlinessUC.NewUpdateStatusUseCase(recordRepo),
		cleanlinessUC.NewSaveBenchmarkRunUseCase(benchmarkRepo),
		cleanlinessUC.NewListBenchmarkRunsUseCase(benchmarkRepo),
		cleanlinessUC.NewLatestBenchmarkRunUseCase(benchmarkRepo),
	)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logging(logger))
	r.Use(middleware.Recoverer(logger))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	r.Get("/health/live", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"alive"}`))
	})
	r.Mount("/api/v1/cleanliness/benchmark", handler.BenchmarkRoutes())
	r.Mount("/api/v1/cleanliness", handler.Routes())

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Zephyr Cleanliness API listening on :%s", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
