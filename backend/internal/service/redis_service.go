package service

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	client *redis.Client
}

func NewRedisService(client *redis.Client) *RedisService {
	return &RedisService{client: client}
}

// String operations
func (s *RedisService) Set(key string, value interface{}, expiration time.Duration) error {
	return s.client.Set(context.Background(), key, value, expiration).Err()
}

func (s *RedisService) Get(key string) (string, error) {
	return s.client.Get(context.Background(), key).Result()
}

func (s *RedisService) Delete(key string) error {
	return s.client.Del(context.Background(), key).Err()
}

func (s *RedisService) Exists(key string) (bool, error) {
	n, err := s.client.Exists(context.Background(), key).Result()
	return n > 0, err
}

func (s *RedisService) SetExpire(key string, expiration time.Duration) error {
	return s.client.Expire(context.Background(), key, expiration).Err()
}

func (s *RedisService) Incr(key string) (int64, error) {
	return s.client.Incr(context.Background(), key).Result()
}

// Hash operations
func (s *RedisService) HSet(key string, values map[string]interface{}) error {
	return s.client.HSet(context.Background(), key, values).Err()
}

func (s *RedisService) HGet(key, field string) (string, error) {
	return s.client.HGet(context.Background(), key, field).Result()
}

func (s *RedisService) HGetAll(key string) (map[string]string, error) {
	return s.client.HGetAll(context.Background(), key).Result()
}

func (s *RedisService) HDel(key string, fields ...string) error {
	return s.client.HDel(context.Background(), key, fields...).Err()
}

// List operations
func (s *RedisService) LPush(key string, values ...interface{}) error {
	return s.client.LPush(context.Background(), key, values...).Err()
}

func (s *RedisService) RPush(key string, values ...interface{}) error {
	return s.client.RPush(context.Background(), key, values...).Err()
}

func (s *RedisService) LRange(key string, start, stop int64) ([]string, error) {
	return s.client.LRange(context.Background(), key, start, stop).Result()
}

func (s *RedisService) LTrim(key string, start, stop int64) error {
	return s.client.LTrim(context.Background(), key, start, stop).Err()
}

// Sorted Set operations
func (s *RedisService) ZAddScore(key string, score float64, member interface{}) error {
	return s.client.ZAdd(context.Background(), key, redis.Z{Score: score, Member: member}).Err()
}

func (s *RedisService) ZRevRange(key string, start, stop int64) ([]string, error) {
	return s.client.ZRevRange(context.Background(), key, start, stop).Result()
}

func (s *RedisService) ZRem(key string, members ...interface{}) error {
	return s.client.ZRem(context.Background(), key, members...).Err()
}
