package tasks

import (
	"encoding/json"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"backend/internal/db/sqlc"
	"backend/internal/storage"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) UploadTaskDocuments(
	w http.ResponseWriter,
	r *http.Request,
) {

	// task id
	taskID := chi.URLParam(r, "id")
	taskIDint, err := strconv.Atoi(taskID)
	if err != nil {
		http.Error(w, "invalid task id", http.StatusBadRequest)
		return
	}

	task, err := h.q.GetTaskByID(r.Context(), int32(taskIDint))
	if err != nil {
		http.Error(w, "task not found", http.StatusNotFound)
		return
	}

	userRole, _ := r.Context().Value("role").(string)
	userIDStr, _ := r.Context().Value("userID").(string)

	// Authorization check: Only admin, creator, or assignee can upload
	if userRole != "admin" {
		parsedUserID, err := uuid.Parse(userIDStr)
		if err == nil {
			uid := pgtype.UUID{Bytes: parsedUserID, Valid: true}
			isCreator := task.CreatedBy.Valid && task.CreatedBy.Bytes == uid.Bytes
			isAssignee := task.AssignedTo.Valid && task.AssignedTo.Bytes == uid.Bytes

			if !isCreator && !isAssignee {
				http.Error(w, "you do not have permission to upload documents to this task", http.StatusForbidden)
				return
			}
		}
	}

	// Parse multipart form
	err = r.ParseMultipartForm(20 << 20)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	files := r.MultipartForm.File["documents"]

	// max 3 documents
	if len(files) > 3 {
		http.Error(
			w,
			"maximum 3 documents allowed",
			http.StatusBadRequest,
		)
		return
	}

	var uploadedDocuments []sqlc.TaskDocument

	for _, fileHeader := range files {

		// validate pdf
		contentType := fileHeader.Header.Get("Content-Type")

		if contentType != "application/pdf" {
			http.Error(
				w,
				"only pdf files are allowed",
				http.StatusBadRequest,
			)
			return
		}

		file, err := fileHeader.Open()
		if err != nil {
			http.Error(
				w,
				err.Error(),
				http.StatusInternalServerError,
			)
			return
		}

		fileBytes, err := io.ReadAll(file)
		file.Close()

		if err != nil {
			http.Error(
				w,
				err.Error(),
				http.StatusInternalServerError,
			)
			return
		}

		// unique file name
		ext := filepath.Ext(fileHeader.Filename)

		remoteFilePath := "tasks/" +
			time.Now().Format("20060102150405") +
			"_" +
			uuid.NewString() +
			ext

		// upload using your helper
		fileURL, err := storage.UploadBytes(
			fileBytes,
			contentType,
			h.cfg.SUPABASE_URL,
			h.cfg.SUPABASE_KEY,
			"task-documents",
			remoteFilePath,
		)

		if err != nil {
			http.Error(
				w,
				err.Error(),
				http.StatusInternalServerError,
			)
			return
		}

		// save metadata in db
		doc, err := h.q.CreateTaskDocument(
			r.Context(),
			sqlc.CreateTaskDocumentParams{
				TaskID:  int32(taskIDint),
				FileName:    fileHeader.Filename,
				FilePath: fileURL,
			},
		)

		if err != nil {
			http.Error(
				w,
				err.Error(),
				http.StatusInternalServerError,
			)
			return
		}

		uploadedDocuments = append(
			uploadedDocuments,
			doc,
		)
	}

	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(uploadedDocuments)
}
