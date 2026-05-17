package main

import (
	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/connectors"
	"backend/internal/db/sqlc"
	"backend/internal/routes"
	"backend/internal/tasks"
	users "backend/internal/user"
	"fmt"
	"net/http"

	"github.com/sirupsen/logrus"
)

func main() {

	cfg, err := config.Load()
	if err != nil {
		logrus.Error(err)
	}

	fmt.Println(cfg.DB_URL)

	db := connectors.CreatePostgresSession(cfg.DB_URL)

	defer db.Close()

	queries := sqlc.New(db)

	authHandler := auth.NewHandler(queries, cfg)
	tasksHandler := tasks.NewHandler(queries, cfg)
	usersHandler := users.NewHandler(queries, cfg)

	r := routes.SetupRoutes(authHandler, tasksHandler, usersHandler)

	portAddr := fmt.Sprintf(":%d", cfg.PORT)

	

	fmt.Println("connected to port ", portAddr)

	err = http.ListenAndServe(portAddr, r)
	if err != nil {
		logrus.Fatal(err)
	}

}
