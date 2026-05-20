package service

import "platform/pkg/exception"

type PostSecurityService struct {
	bannedWords []string
}

func NewPostSecurityService() *PostSecurityService {
	return &PostSecurityService{
		bannedWords: []string{},
	}
}

func (s *PostSecurityService) CheckContent(title, content string) error {
	if title == "" && content == "" {
		return nil
	}

	// Basic content validation
	if len(title) > 200 {
		return exception.NewBusinessError("标题过长")
	}
	if len(content) > 50000 {
		return exception.NewBusinessError("内容过长")
	}

	// Check banned words
	for _, word := range s.bannedWords {
		if contains(title, word) || contains(content, word) {
			return exception.NewBusinessError("内容包含违规信息")
		}
	}

	return nil
}

func (s *PostSecurityService) AddBannedWord(word string) {
	s.bannedWords = append(s.bannedWords, word)
}

func contains(s, substr string) bool {
	if len(substr) == 0 {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
