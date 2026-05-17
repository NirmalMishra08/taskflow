package users

import (
	"backend/internal/db/sqlc"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type UpdateUserBody struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (h *Handler) UpdateUser(
	w http.ResponseWriter,
	r *http.Request,
) {
	// Authorization check: Only admin can edit users
	userRole, _ := r.Context().Value("role").(string)
	if userRole != "admin" {
		http.Error(w, "only admin can update user details", http.StatusForbidden)
		return
	}

	idStr := chi.URLParam(r, "id")
	parsedUUID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid uuid", http.StatusBadRequest)
		return
	}

	var body UpdateUserBody
	err = json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	uid := pgtype.UUID{Bytes: parsedUUID, Valid: true}

	user, err := h.q.UpdateUser(
		r.Context(),
		sqlc.UpdateUserParams{
			ID:    uid,
			Name:  body.Name,
			Email: body.Email,
			Role:  sqlc.NullRole{Role: sqlc.Role(body.Role), Valid: true},
		},
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}
