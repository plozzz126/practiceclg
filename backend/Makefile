SWAG=go run github.com/swaggo/swag/cmd/swag@v1.16.6

.PHONY: run build swagger tidy

run:
	go run ./cmd/server

build:
	go build ./cmd/server

swagger:
	$(SWAG) init -g cmd/server/main.go -o docs

tidy:
	go mod tidy
