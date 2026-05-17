package tasks


import (
	"backend/internal/config"
	"backend/internal/db/sqlc"
)

type Handler struct {
	q   *sqlc.Queries
	cfg *config.Config
}

func NewHandler(
	q *sqlc.Queries,
	cfg *config.Config,
) *Handler {

	return &Handler{
		q:   q,
		cfg: cfg,
	}
}