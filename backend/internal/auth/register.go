package auth

import (
	"backend/internal/db/sqlc"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Name     string `json:"name,omitempty"`
	Email    string `json:"email,omitempty"`
	Password string `json:"password,omitempty"`
}

type Claims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Generate JWT Token
func (h *Handler) GenerateToken(userID string, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(h.cfg.JWT_SECRET))
}

func (h *Handler) VerifyToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("invalid signing method")
			}

			return []byte(h.cfg.JWT_SECRET), nil
		},
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {

	ctx := r.Context()

	var data User

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, fmt.Sprint("missing types"), http.StatusBadRequest)
		return
	}

	password, err := bcrypt.GenerateFromPassword([]byte(data.Password), 10)
	if err != nil {
		http.Error(w, fmt.Sprint("not able to hash password"), http.StatusBadRequest)
		return
	}

	user, err := h.q.CreateUser(ctx, sqlc.CreateUserParams{
		Name:     data.Name,
		Email:    data.Email,
		Password: string(password),
	})
	if err != nil {
		http.Error(w, fmt.Sprint("not able to create user"), http.StatusBadRequest)
		return
	}
	response := map[string]interface{}{
		"success": true,
		"message": "user registered successfully",
		"user": map[string]interface{}{
			"id":    user.ID,
			"name":  user.Name,
			"email": user.Email,
			"role":  user.Role.Role,
		},
	}

	w.Header().Set("Content-type", "application/json")
	w.WriteHeader(http.StatusCreated);
	json.NewEncoder(w).Encode(response)

}
