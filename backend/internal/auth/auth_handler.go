package auth

import (
	"backend/internal/config"
	"backend/internal/db/sqlc"
	"backend/middleware"

	"github.com/go-chi/chi"
)

type Handler struct {
	q   *sqlc.Queries
	cfg *config.Config
}

func NewHandler(db *sqlc.Queries, cfg *config.Config) *Handler {
	return &Handler{
		q:   db,
		cfg: cfg,
	}
}

func (h *Handler) Router() *chi.Mux {
	r := chi.NewRouter()

	r.Post("/login", h.Login)
	r.Post("/register", h.Register)

	// r.Get()

	// protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.Authenticate(func(token string) (*middleware.Claims, error) {

			claims, err := h.VerifyToken(token)
			if err != nil {
				return nil, err
			}

			return &middleware.Claims{
				UserID: claims.UserID,
				Role:   claims.Role,
			}, nil
		}))



		// r.Use(middleware)
	})

	return r
}
