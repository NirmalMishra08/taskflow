package users

import (
	"backend/internal/config"
	"backend/internal/db/sqlc"

	"github.com/go-chi/chi"
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

func (h *Handler) Router() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/", h.GetUsers)
	r.Post("/", h.CreateUser)

	r.Route("/{id}", func(r chi.Router) {
		r.Put("/", h.UpdateUser)
		r.Delete("/", h.DeleteUser)
	})

	return r
}
