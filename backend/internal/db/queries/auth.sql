
-- name: GetUserById :one
select * from users where id = $1;

-- name: CreateUser :one
INSERT into users ( name, email, password) VALUES ($1  , $2, $3) RETURNING *;


-- name: CreateUserByAdmin :one
INSERT into users ( name, email, password, role) VALUES ($1  , $2, $3, $4) RETURNING *;

-- name: GetUserByEmail :one
select * from users where email = $1;

-- name: GetAllUsers :many
SELECT *
FROM users
LIMIT $1
OFFSET $2;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: UpdateUser :one
UPDATE users
SET
    name = $2,
    email = $3,
    role = $4
WHERE id = $1
RETURNING *;


