# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies manifest
COPY frontend/package*.json ./
RUN npm ci --silent

# Copy source code and build
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build the Go Backend
# ==========================================
FROM golang:alpine AS backend-builder
WORKDIR /app/backend

# Enable automatic toolchain upgrades for newer package requirements
ENV GOTOOLCHAIN=auto

# Install build dependencies
RUN apk add --no-cache git

# Copy dependencies manifests and download
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source code and build statically
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server/main.go

# ==========================================
# STAGE 3: Final Runner Container
# ==========================================
FROM alpine:latest
WORKDIR /app

# Install standard ca-certificates for external https calls (e.g. Supabase, oauth)
RUN apk add --no-cache ca-certificates

# Copy compiled Go server binary
COPY --from=backend-builder /app/backend/server .

# Copy built React frontend static files to ./static folder
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose Go application port
EXPOSE 8080

# Run the single unified server
CMD ["./server"]
