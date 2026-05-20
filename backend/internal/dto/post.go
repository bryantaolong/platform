package dto

// CreatePostRequest create post request
type CreatePostRequest struct {
	Title            string   `json:"title" binding:"required,min=1,max=200"`
	Content          string   `json:"content" binding:"required"`
	CategoryID       *int64   `json:"categoryId"`
	Tags             []string `json:"tags"`
	CommentAreaStatus int     `json:"commentAreaStatus"`
	Status           int      `json:"status"`
}

// PostUpdateDTO post update request
type PostUpdateDTO struct {
	Title            *string   `json:"title"`
	Content          *string   `json:"content"`
	Status           *int      `json:"status"`
	CategoryID       *int64    `json:"categoryId"`
	Tags             []string  `json:"tags"`
	CommentAreaStatus *int     `json:"commentAreaStatus"`
}

// CreateCommentRequest create comment request
type CreateCommentRequest struct {
	Content         string `json:"content" binding:"required,min=1,max=5000"`
	RootID          *int64 `json:"rootId"`
	ParentID        *int64 `json:"parentId"`
	ReplyToUserID   *int64 `json:"replyToUserId"`
}

// CreateCollectionRequest create collection folder request
type CreateCollectionRequest struct {
	FolderName string `json:"folderName" binding:"required,min=1,max=50"`
}

// AddToCollectionRequest add post to collection request
type AddToCollectionRequest struct {
	PostID       int64  `json:"postId" binding:"required"`
	CollectionID int64  `json:"collectionId"`
}

// PostQueryParams post list query params
type PostQueryParams struct {
	PageNum   int    `form:"pageNum"`
	PageSize  int    `form:"pageSize"`
	Status    *int   `form:"status"`
	UserID    *int64 `form:"userId"`
	Keyword   string `form:"keyword"`
	Tag       string `form:"tag"`
	SortBy    string `form:"sortBy"`    // latest, hot
	SortOrder string `form:"sortOrder"` // asc, desc
}

// CommentQueryParams comment query params
type CommentQueryParams struct {
	PostID   int64  `form:"postId" binding:"required"`
	PageNum  int    `form:"pageNum"`
	PageSize int    `form:"pageSize"`
	SortBy   string `form:"sortBy"`
}

func DefaultPageParams(pageNum, pageSize int) (int64, int64) {
	pn := int64(pageNum)
	ps := int64(pageSize)
	if pn <= 0 {
		pn = 1
	}
	if ps <= 0 || ps > 100 {
		ps = 10
	}
	return pn, ps
}
