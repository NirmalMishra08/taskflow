package tasks

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/internal/db/sqlc"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) Router() *chi.Mux {
	r := chi.NewRouter()

	r.Get("/", h.GetTasks)
	r.Post("/", h.CreateTask)

	r.Route("/{id}", func(r chi.Router) {
		r.Get("/", h.GetTaskByID)
		r.Put("/", h.UpdateTask)
		r.Delete("/", h.DeleteTask)
		r.Post("/upload", h.UploadTaskDocuments)
	})

	return r
}

func (h *Handler) GetTasks(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	page := 1
	if pageStr != "" {
		p, err := strconv.Atoi(pageStr)
		if err == nil && p > 0 {
			page = p
		}
	}

	limit := int32(10)
	offset := int32((page - 1) * 10)

	var userID pgtype.UUID
	userRole, _ := r.Context().Value("role").(string)
	userIDStr, _ := r.Context().Value("userID").(string)

	parsedUserID, err := uuid.Parse(userIDStr)
	if err == nil {
		userID = pgtype.UUID{Bytes: parsedUserID, Valid: true}
	}

	var tasksList []sqlc.Task
	var getErr error

	if userRole == "admin" {
		tasksList, getErr = h.q.GetTasks(r.Context(), sqlc.GetTasksParams{
			Limit:  limit,
			Offset: offset,
		})
	} else {
		tasksList, getErr = h.q.GetTasksByUser(r.Context(), sqlc.GetTasksByUserParams{
			AssignedTo: userID,
			CreatedBy:  userID,
			Limit:      limit,
			Offset:     offset,
		})
	}

	if getErr != nil {
		http.Error(w, getErr.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasksList)
}

type TaskDetails struct {
	sqlc.Task
	Documents []sqlc.TaskDocument `json:"documents"`
}

func (h *Handler) GetTaskByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid task id", http.StatusBadRequest)
		return
	}

	task, err := h.q.GetTaskByID(r.Context(), int32(id))
	if err != nil {
		http.Error(w, "task not found", http.StatusNotFound)
		return
	}

	userRole, _ := r.Context().Value("role").(string)
	userIDStr, _ := r.Context().Value("userID").(string)

	// Authorization check: Only admin, creator, or assignee can view
	if userRole != "admin" {
		parsedUserID, err := uuid.Parse(userIDStr)
		if err == nil {
			uid := pgtype.UUID{Bytes: parsedUserID, Valid: true}
			isCreator := task.CreatedBy.Valid && task.CreatedBy.Bytes == uid.Bytes
			isAssignee := task.AssignedTo.Valid && task.AssignedTo.Bytes == uid.Bytes

			if !isCreator && !isAssignee {
				http.Error(w, "you do not have permission to view this task", http.StatusForbidden)
				return
			}
		}
	}

	docs, err := h.q.GetTaskDocuments(r.Context(), int32(id))
	if err != nil {
		// Non-blocking but log it
		docs = []sqlc.TaskDocument{}
	}

	response := TaskDetails{
		Task:      task,
		Documents: docs,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "invalid task id", http.StatusBadRequest)
		return
	}

	task, err := h.q.GetTaskByID(r.Context(), int32(id))
	if err != nil {
		http.Error(w, "task not found", http.StatusNotFound)
		return
	}

	userRole, _ := r.Context().Value("role").(string)
	userIDStr, _ := r.Context().Value("userID").(string)

	// Authorization check: Only admin, creator, or assignee can delete own tasks
	if userRole != "admin" {
		parsedUserID, err := uuid.Parse(userIDStr)
		if err == nil {
			uid := pgtype.UUID{Bytes: parsedUserID, Valid: true}
			isCreator := task.CreatedBy.Valid && task.CreatedBy.Bytes == uid.Bytes
			isAssignee := task.AssignedTo.Valid && task.AssignedTo.Bytes == uid.Bytes

			if !isCreator && !isAssignee {
				http.Error(w, "you do not have permission to delete this task", http.StatusForbidden)
				return
			}
		}
	}

	err = h.q.DeleteTask(r.Context(), int32(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
