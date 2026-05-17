package tasks

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"backend/internal/db/sqlc"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) UpdateTask(
	w http.ResponseWriter,
	r *http.Request,
) {

	idStr := chi.URLParam(r, "id")

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var body UpdateTaskBody

	err = json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var parsedDueDate time.Time
	var dueDateValid bool
	if body.DueDate != "" {
		t, err := time.Parse(time.RFC3339, body.DueDate)
		if err != nil {
			t, err = time.Parse("2006-01-02T15:04:05", body.DueDate)
			if err != nil {
				t, err = time.Parse("2006-01-02", body.DueDate)
			}
		}
		if err == nil {
			parsedDueDate = t
			dueDateValid = true
		}
	}

	task, err := h.q.GetTaskByID(r.Context(), int32(id))
	if err != nil {
		http.Error(w, "task not found", http.StatusNotFound)
		return
	}

	userRole, _ := r.Context().Value("role").(string)
	userIDStr, _ := r.Context().Value("userID").(string)

	// Authorization check: Only admin, creator, or assignee can edit
	if userRole != "admin" {
		parsedUserID, err := uuid.Parse(userIDStr)
		if err == nil {
			uid := pgtype.UUID{Bytes: parsedUserID, Valid: true}
			isCreator := task.CreatedBy.Valid && task.CreatedBy.Bytes == uid.Bytes
			isAssignee := task.AssignedTo.Valid && task.AssignedTo.Bytes == uid.Bytes

			if !isCreator && !isAssignee {
				http.Error(w, "you do not have permission to edit this task", http.StatusForbidden)
				return
			}

			if isAssignee && !isCreator {
				// Assignee who is not the creator cannot modify metadata, only status!
				titleChanged := body.Title != "" && body.Title != task.Title
				descChanged := body.Description != "" && (!task.Description.Valid || body.Description != task.Description.String)
				priorityChanged := body.Priority != "" && sqlc.Priority(body.Priority) != task.Priority
				
				var taskDueDate time.Time
				if task.DueDate.Valid {
					taskDueDate = task.DueDate.Time
				}
				dueDateChanged := dueDateValid && !parsedDueDate.Equal(taskDueDate)
				
				var taskAssignedTo uuid.UUID
				if task.AssignedTo.Valid {
					taskAssignedTo = task.AssignedTo.Bytes
				}
				assignedToParsed, _ := uuid.Parse(body.AssignedTo)
				assigneeChanged := body.AssignedTo != "" && assignedToParsed != taskAssignedTo

				if titleChanged || descChanged || priorityChanged || dueDateChanged || assigneeChanged {
					http.Error(w, "assignees are only allowed to update the task status", http.StatusForbidden)
					return
				}
			}
		}
	}

	// convert string status to sqlc.Status where applicable
	var status sqlc.NullStatus
	if body.Status != "" {
		status = sqlc.NullStatus{Status: sqlc.Status(body.Status), Valid: true}
	} else {
		status = sqlc.NullStatus{Valid: false}
	}

	var dueDate pgtype.Timestamp
	if dueDateValid {
		dueDate.Time = parsedDueDate
		dueDate.Valid = true
	} else {
		dueDate.Valid = false
	}

	// convert to uuid
	assignedto_str, err := uuid.Parse(body.AssignedTo)
	assignedTo := pgtype.UUID{Bytes: assignedto_str, Valid: err == nil}

	task, err = h.q.UpdateTask(
		r.Context(),
		sqlc.UpdateTaskParams{
			ID:          int32(id),
			Title:       body.Title,
			Description: pgtype.Text{String: body.Description, Valid: true},
			Status:      status,
			Priority:    sqlc.Priority(body.Priority),
			DueDate:     dueDate,
			AssignedTo:  assignedTo,
		},
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(task)
}
