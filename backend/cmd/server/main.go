package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/edumatch/backend/configs"
	_ "github.com/edumatch/backend/docs"
	"github.com/edumatch/backend/internal/auth"
	"github.com/edumatch/backend/internal/middleware"
	"github.com/edumatch/backend/internal/project"
	"github.com/edumatch/backend/internal/shared"
	"github.com/edumatch/backend/internal/skill"
	"github.com/edumatch/backend/internal/user"
	jwtpkg "github.com/edumatch/backend/pkg/jwt"
	"github.com/edumatch/backend/pkg/logger"
	postgrespkg "github.com/edumatch/backend/pkg/postgres"
	redispkg "github.com/edumatch/backend/pkg/redis"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// @title EduMatch API
// @version 1.0
// @description Production-ready backend for the EduMatch educational project.
// @BasePath /api
// @schemes http https
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
func main() {
	cfg, err := configs.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	appLogger := logger.New(cfg.AppEnv)
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	dbPool, err := postgrespkg.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		appLogger.Error("postgres connection failed", "error", err.Error())
		log.Fatal(err)
	}
	defer dbPool.Close()

	redisClient, err := redispkg.NewClient(ctx, cfg.RedisURL)
	if err != nil {
		appLogger.Error("redis connection failed", "error", err.Error())
		log.Fatal(err)
	}
	defer redisClient.Close()

	jwtManager := jwtpkg.NewManager(
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		cfg.AccessTokenTTL,
		cfg.RefreshTokenTTL,
	)

	skillRepo := skill.NewRepository(dbPool)
	skillService := skill.NewService(skillRepo, redisClient, cfg.SkillsCacheTTL)
	skillHandler := skill.NewHandler(skillService, appLogger)

	userRepo := user.NewRepository(dbPool)
	userService := user.NewService(userRepo, skillService)
	userHandler := user.NewHandler(userService, appLogger)

	authRepo := auth.NewRepository(dbPool)
	authService := auth.NewService(authRepo, userRepo, skillService, jwtManager, redisClient)
	authHandler := auth.NewHandler(authService, appLogger)

	projectRepo := project.NewRepository(dbPool)
	projectService := project.NewService(projectRepo, skillService)
	projectHandler := project.NewHandler(projectService, appLogger)

	authMiddleware := middleware.NewAuthMiddleware(jwtManager, redisClient)

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.GET("/health", func(c *gin.Context) {
		shared.RespondSuccess(c, http.StatusOK, gin.H{
			"status":  "ok",
			"service": "edumatch-backend",
		})
	})

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))

	api := router.Group("/api")
	authHandler.RegisterRoutes(api, authMiddleware)
	userHandler.RegisterRoutes(api, authMiddleware)
	projectHandler.RegisterRoutes(api, authMiddleware)
	skillHandler.RegisterRoutes(api)

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	appLogger.Info("server started", "port", cfg.Port, "env", cfg.AppEnv)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		appLogger.Error("server stopped", "error", err.Error())
		log.Fatal(err)
	}
}
