package config

import (
	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

type Config struct {
	PORT         int    `env:"PORT" env-default:"8080"`
	DB_URL       string `env:"DB_URL"`
	JWT_SECRET   string `env:"JWT_SECRET"`
	SUPABASE_URL string `env:"SUPABASE_URL"`
	SUPABASE_KEY string `env:"SUPABASE_KEY"`
}

func Load() (*Config, error) {
	// Try loading .env from current directory or relative paths
	_ = godotenv.Load()
	_ = godotenv.Load("cmd/server/.env")

	var cfg Config
	err := cleanenv.ReadEnv(&cfg)
	if err != nil {
		return nil, err
	}

	return &cfg, nil

}
