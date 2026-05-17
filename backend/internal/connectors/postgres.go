package connectors

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func CreatePostgresSession(connString string) *pgxpool.Pool {

	count := 0

	fmt.Println(connString)

	for {
		ctx := context.Background()
		db, err := pgxpool.New(context.Background(), connString)
		if err == nil {
			err = db.Ping(ctx)
		}

		if err == nil {
			fmt.Println("connected to postgres!")
			return db
		}

		count++
		if count == 5 {
			fmt.Println("postgres connection error:", err)
			fmt.Println("retrying in 5 seconds...")
			time.Sleep(5 * time.Second)
			count = 0

		}

	}

}
