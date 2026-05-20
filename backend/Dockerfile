FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o platform .

FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/platform .
COPY --from=builder /app/config.yaml .
COPY --from=builder /app/migrations ./migrations

RUN mkdir -p /app/uploads /app/logs

EXPOSE 8080

CMD ["./platform"]
