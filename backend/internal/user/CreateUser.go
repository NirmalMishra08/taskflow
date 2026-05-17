package users

import (
	"backend/internal/db/sqlc"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type CreateUserBody struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func (h *Handler) CreateUser(
	w http.ResponseWriter,
	r *http.Request,
) {
	// Authorization check: Only admin can create users
	userRole, _ := r.Context().Value("role").(string)
	if userRole != "admin" {
		http.Error(w, "only admin can create users", http.StatusForbidden)
		return
	}

	var body CreateUserBody

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(body.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	user, err := h.q.CreateUserByAdmin(
		r.Context(),
		 sqlc.CreateUserByAdminParams{
			Name:     body.Name,
			Email:    body.Email,
			Password: string(hashedPassword),
			Role:     sqlc.NullRole{Role: sqlc.Role(body.Role), Valid: true},
		 },
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}
