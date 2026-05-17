package users

import (
	"backend/internal/db/sqlc"
	"encoding/json"
	"net/http"
	"strconv"
)

func (h *Handler) GetUsers(
	w http.ResponseWriter,
	r *http.Request,
) {

	pageStr := r.URL.Query().Get("page")

	page := 1

	if pageStr != "" {
		p, _ := strconv.Atoi(pageStr)
		page = p
	}

	limit := int32(10)
	offset := int32((page - 1) * 10)

	users, err := h.q.GetAllUsers(
		r.Context(),
		sqlc.GetAllUsersParams{
			Limit:  limit,
			Offset: offset,
		},
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}