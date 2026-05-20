package exception

import "net/http"

// AppError custom application error
type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Err     error  `json:"-"`
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewAppError(code int, message string) *AppError {
	return &AppError{Code: code, Message: message}
}

func NewAppErrorWithCause(code int, message string, err error) *AppError {
	return &AppError{Code: code, Message: message, Err: err}
}

// Predefined application errors
func NewBusinessError(message string) *AppError {
	return NewAppError(http.StatusBadRequest, message)
}

func NewNotFoundError(message string) *AppError {
	return NewAppError(http.StatusNotFound, message)
}

func NewUnauthorizedError(message string) *AppError {
	return NewAppError(http.StatusUnauthorized, message)
}

func NewForbiddenError(message string) *AppError {
	return NewAppError(http.StatusForbidden, message)
}

func NewConflictError(message string) *AppError {
	return NewAppError(http.StatusConflict, message)
}

func NewInternalError(message string) *AppError {
	return NewAppError(http.StatusInternalServerError, message)
}
