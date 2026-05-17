package tasks

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/db/sqlc"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) CreateTask(
	w http.ResponseWriter,
	r *http.Request,
) {

	var body CreateTaskBody

	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var createdBy pgtype.UUID
	switch v := r.Context().Value("userID").(type) {
	case string:
		parsed, err := uuid.Parse(v)
		if err == nil {
			createdBy = pgtype.UUID{Bytes: parsed, Valid: true}
		}
	case uuid.UUID:
		createdBy = pgtype.UUID{Bytes: v, Valid: true}
	}

	// convert string status to sqlc.Status where applicable
	var status sqlc.NullStatus
	if body.Status != "" {
		status = sqlc.NullStatus{Status: sqlc.Status(body.Status), Valid: true}
	} else {
		status = sqlc.NullStatus{Valid: false}
	}

	var dueDate pgtype.Timestamp
	if body.DueDate != "" {
		// Try multiple parsing layouts
		t, err := time.Parse(time.RFC3339, body.DueDate)
		if err != nil {
			t, err = time.Parse("2006-01-02T15:04:05", body.DueDate)
			if err != nil {
				t, err = time.Parse("2006-01-02", body.DueDate)
			}
		}
		if err == nil {
			dueDate.Time = t
			dueDate.Valid = true
		} else {
			dueDate.Valid = false
		}
	} else {
		dueDate.Valid = false
	}

	// convert to uuid
	assignedto_str, err := uuid.Parse(body.AssignedTo)
	assignedTo := pgtype.UUID{Bytes: assignedto_str, Valid: err == nil}

	task, err := h.q.CreateTask(
		r.Context(),
		sqlc.CreateTaskParams{
			Title:       body.Title,
			Description: pgtype.Text{String: body.Description, Valid: true},
			Status:      status,
			Priority:    sqlc.Priority(body.Priority),
			DueDate:     dueDate,
			AssignedTo:  assignedTo,
			CreatedBy:   createdBy,
		},
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(task)
}
