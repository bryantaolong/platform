package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Security SecurityConfig `mapstructure:"security"`
	CORS     CORSConfig     `mapstructure:"cors"`
	File     FileConfig     `mapstructure:"file"`
	Async    AsyncConfig    `mapstructure:"async"`
	LLM      LLMConfig      `mapstructure:"llm"`
	Job      JobConfig      `mapstructure:"job"`
}

type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
	Host                  string `mapstructure:"host"`
	Port                  int    `mapstructure:"port"`
	User                  string `mapstructure:"user"`
	Password              string `mapstructure:"password"`
	DBName                string `mapstructure:"dbname"`
	SSLMode               string `mapstructure:"sslmode"`
	MaxOpenConns          int    `mapstructure:"max_open_conns"`
	MaxIdleConns          int    `mapstructure:"max_idle_conns"`
	ConnMaxLifetimeMin    int    `mapstructure:"conn_max_lifetime_minutes"`
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode)
}

type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

type JWTConfig struct {
	SecretKey    string `mapstructure:"secret_key"`
	ExpirationMs int64  `mapstructure:"expiration_ms"`
	TokenPrefix  string `mapstructure:"token_prefix"`
}

type SecurityConfig struct {
	LoginFailLimit         int `mapstructure:"login_fail_limit"`
	LoginFailResetMinutes  int `mapstructure:"login_fail_reset_minutes"`
	AccountLockDurationMin int `mapstructure:"account_lock_duration_minutes"`
}

type CORSConfig struct {
	AllowedOrigins string `mapstructure:"allowed_origins"`
}

type FileConfig struct {
	UploadDir string `mapstructure:"upload_dir"`
}

type AsyncConfig struct {
	CorePoolSize  int `mapstructure:"core_pool_size"`
	MaxPoolSize   int `mapstructure:"max_pool_size"`
	QueueCapacity int `mapstructure:"queue_capacity"`
}

type LLMConfig struct {
	API LLMAPIConfig `mapstructure:"api"`
}

type LLMAPIConfig struct {
	DefaultProvider string                `mapstructure:"default_provider"`
	Providers       map[string]LLMProvider `mapstructure:"providers"`
}

type LLMProvider struct {
	Key   string `mapstructure:"key"`
	URL   string `mapstructure:"url"`
	Model string `mapstructure:"model"`
}

type JobConfig struct {
	UserProfileUpdate   UserProfileUpdateJobConfig `mapstructure:"user_profile_update"`
	OrphanImageCleanup  OrphanImageCleanupJobConfig `mapstructure:"orphan_image_cleanup"`
}

type UserProfileUpdateJobConfig struct {
	Cron           string `mapstructure:"cron"`
	Enabled        bool   `mapstructure:"enabled"`
	ActiveUserDays int    `mapstructure:"active_user_days"`
	BatchSize      int    `mapstructure:"batch_size"`
}

type OrphanImageCleanupJobConfig struct {
	Cron             string `mapstructure:"cron"`
	Enabled          bool   `mapstructure:"enabled"`
	OrphanFileAgeDays int   `mapstructure:"orphan_file_age_days"`
	UploadDir        string `mapstructure:"upload_dir"`
}

var AppConfig *Config

func LoadConfig(configPath string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(configPath)
	v.SetConfigType("yaml")

	// Support environment variable overrides
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Override from env vars
	if env := v.GetString("DB_HOST"); env != "" { cfg.Database.Host = env }
	if env := v.GetString("DB_USERNAME"); env != "" { cfg.Database.User = env }
	if env := v.GetString("DB_PASSWORD"); env != "" { cfg.Database.Password = env }
	if env := v.GetString("REDIS_PASSWORD"); env != "" { cfg.Redis.Password = env }
	if env := v.GetString("JWT_SECRET_KEY"); env != "" { cfg.JWT.SecretKey = env }
	if env := v.GetString("CORS_ALLOWED_ORIGINS"); env != "" { cfg.CORS.AllowedOrigins = env }
	if env := v.GetString("DEEPSEEK_API_KEY"); env != "" {
		if p, ok := cfg.LLM.API.Providers["deepseek"]; ok {
			p.Key = env
			cfg.LLM.API.Providers["deepseek"] = p
		}
	}
	if env := v.GetString("MOONSHOT_API_KEY"); env != "" {
		if p, ok := cfg.LLM.API.Providers["moonshot"]; ok {
			p.Key = env
			cfg.LLM.API.Providers["moonshot"] = p
		}
	}
	if env := v.GetString("MINIMAX_API_KEY"); env != "" {
		if p, ok := cfg.LLM.API.Providers["minimax"]; ok {
			p.Key = env
			cfg.LLM.API.Providers["minimax"] = p
		}
	}

	AppConfig = &cfg
	log.Printf("Config loaded from: %s", configPath)
	return &cfg, nil
}
