package users

import (
	"net/http"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) DeleteUser(
	w http.ResponseWriter,
	r *http.Request,
) {
	// Authorization check: Only admin can delete users
	userRole, _ := r.Context().Value("role").(string)
	if userRole != "admin" {
		http.Error(w, "only admin can delete users", http.StatusForbidden)
		return
	}

	idStr := chi.URLParam(r, "id")

	parsedUUID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "invalid uuid", http.StatusBadRequest)
		return
	}

	uid := pgtype.UUID{Bytes: parsedUUID, Valid: true}

	err = h.q.DeleteUser(r.Context(), uid)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
