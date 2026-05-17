-- name: CreateTask :one
INSERT INTO tasks (
    title,
    description,
    status,
    priority,
    due_date,
    assigned_to,
    created_by
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: GetTaskByID :one
SELECT * FROM tasks
WHERE id = $1;

-- name: GetTasks :many
SELECT * FROM tasks
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetTasksByUser :many
SELECT * FROM tasks
WHERE assigned_to = $1 OR created_by = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;

-- name: UpdateTask :one
UPDATE tasks
SET
    title = $2,
    description = $3,
    status = $4,
    priority = $5,
    due_date = $6,
    assigned_to = $7,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1;