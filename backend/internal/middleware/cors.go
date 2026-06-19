package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

var corsAllowedHeaders = "Accept, Authorization, Content-Type, Origin"
var corsAllowedMethods = "GET, POST, PUT, PATCH, DELETE, OPTIONS"

func NewCORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		allowed[origin] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}

		if _, ok := allowed[origin]; !ok {
			if c.Request.Method == http.MethodOptions {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}

			c.Next()
			return
		}

		headers := c.Writer.Header()
		headers.Set("Access-Control-Allow-Origin", origin)
		headers.Set("Access-Control-Allow-Headers", corsAllowedHeaders)
		headers.Set("Access-Control-Allow-Methods", corsAllowedMethods)
		headers.Set("Access-Control-Max-Age", "43200")
		headers.Set("Vary", "Origin")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
