package redis

import (
	"context"

	redislib "github.com/redis/go-redis/v9"
)

func NewClient(ctx context.Context, redisURL string) (*redislib.Client, error) {
	options, err := redislib.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redislib.NewClient(options)
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return client, nil
}
