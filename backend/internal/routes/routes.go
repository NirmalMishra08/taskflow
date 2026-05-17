package routes

import (
	"backend/internal/auth"
	"backend/internal/tasks"
	users "backend/internal/user"
	"backend/middleware"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/go-chi/render"
)

func DefaultRouter(middlewares ...func(http.Handler) http.Handler) *chi.Mux {
	router := chi.NewRouter()
	router.Use(
		render.SetContentType(render.ContentTypeJSON),
		// loggerMiddleware,
		cors.Handler(cors.Options{
			AllowedOrigins:   []string{"https://*", "http://*"},
			AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
			AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
			ExposedHeaders:   []string{"Link"},
			AllowCredentials: true,
			MaxAge:           300,
		}),
	)

	for _, middleware := range middlewares {
		router.Use(middleware)
	}

	return router
}

func ServeStaticFiles(r *chi.Mux, staticDir string) {
	fs := http.FileServer(http.Dir(staticDir))

	r.HandleFunc("/*", func(w http.ResponseWriter, req *http.Request) {
		if strings.HasPrefix(req.URL.Path, "/api") {
			http.NotFound(w, req)
			return
		}

		filePath := filepath.Join(staticDir, req.URL.Path)
		fileInfo, err := os.Stat(filePath)
		if err != nil || fileInfo.IsDir() {
			// Fallback to index.html for SPA routing
			http.ServeFile(w, req, filepath.Join(staticDir, "index.html"))
			return
		}

		fs.ServeHTTP(w, req)
	})
}

func SetupRoutes(
	authHandler *auth.Handler,
	tasksHandler *tasks.Handler,
	usersHandler *users.Handler,
) *chi.Mux {
	r := DefaultRouter()

	authMiddleware := middleware.Authenticate(func(token string) (*middleware.Claims, error) {
		claims, err := authHandler.VerifyToken(token)
		if err != nil {
			return nil, err
		}
		return &middleware.Claims{
			UserID: claims.UserID,
			Role:   claims.Role,
		}, nil
	})

	r.Route("/api", func(r chi.Router) {
		r.Mount("/auth", authHandler.Router())

		// Protected Routes
		r.Group(func(r chi.Router) {
			r.Use(authMiddleware)
			r.Mount("/tasks", tasksHandler.Router())
			r.Mount("/users", usersHandler.Router())
		})
	})

	// Serve static files from "./static"
	ServeStaticFiles(r, "./static")

	return r
}
