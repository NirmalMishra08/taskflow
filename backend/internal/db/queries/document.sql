-- name: CreateTaskDocument :one
INSERT INTO task_documents (
    task_id,
    file_name,
    file_path
)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetTaskDocuments :many
SELECT * FROM task_documents
WHERE task_id = $1;

-- name: GetTaskDocumentByID :one
SELECT * FROM task_documents
WHERE id = $1;

-- name: DeleteTaskDocument :exec
DELETE FROM task_documents
WHERE id = $1;