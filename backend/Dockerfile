FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git

WORKDIR /src/backend

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend ./

RUN go install github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.0
RUN go install github.com/swaggo/swag/cmd/swag@v1.16.6
RUN /go/bin/swag init -g cmd/server/main.go -o docs
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.20

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /out/server /app/server
COPY --from=builder /go/bin/migrate /usr/local/bin/migrate
COPY --from=builder /src/backend/migrations /app/migrations
COPY --from=builder /src/backend/docker/start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
