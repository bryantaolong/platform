package response

// Result unified API response
type Result[T any] struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

// PageResult paginated response
type PageResult[T any] struct {
	Rows     []T   `json:"rows"`
	Total    int64 `json:"total"`
	PageNum  int64 `json:"pageNum"`
	PageSize int64 `json:"pageSize"`
	Pages    int64 `json:"pages"`
}

// Code constants matching Java HttpStatus enum
const (
	CodeSuccess      = 200
	CodeBadRequest   = 400
	CodeUnauthorized = 401
	CodeForbidden    = 403
	CodeNotFound     = 404
	CodeConflict     = 409
	CodeInternalErr  = 500
)

func Success[T any](data T) Result[T] {
	return Result[T]{Code: CodeSuccess, Message: "成功", Data: data}
}

func Error(code int, message string) Result[any] {
	return Result[any]{Code: code, Message: message, Data: nil}
}

func ErrorWithData[T any](code int, message string, data T) Result[T] {
	return Result[T]{Code: code, Message: message, Data: data}
}

func NewPageResult[T any](rows []T, total, pageNum, pageSize int64) PageResult[T] {
	pages := int64(0)
	if total > 0 && pageSize > 0 {
		pages = (total + pageSize - 1) / pageSize
	}
	return PageResult[T]{
		Rows:     rows,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
		Pages:    pages,
	}
}

func EmptyPageResult[T any]() PageResult[T] {
	return PageResult[T]{Rows: []T{}, Total: 0, PageNum: 1, PageSize: 10, Pages: 0}
}
