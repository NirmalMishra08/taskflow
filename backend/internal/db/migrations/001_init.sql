


CREATE TYPE role as ENUM  ('admin', 'user');

ALTER TYPE role ADD VALUE 'instructor';
ALTER TYPE role ADD VALUE 'student';
ALTER TYPE role ADD VALUE 'moderator';


CREATE TYPE status as ENUM  ('pending', 'progress', 'completed');

CREATE TYPE priority as enum ('low', 'medium', 'high');

CREATE Table users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role role DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE Table tasks (      
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status status DEFAULT 'pending',
    priority priority NOT NULL DEFAULT 'medium',
    due_date TIMESTAMP,
    assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

 CREATE TABLE task_documents (
    id SERIAL PRIMARY KEY,

    task_id INTEGER NOT NULL REFERENCES tasks(id)
        ON DELETE CASCADE,

    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,

    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

