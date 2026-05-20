package service

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"platform/internal/config"
	"strings"
	"time"

	"github.com/google/uuid"
)

type FileService struct {
	uploadDir string
}

func NewFileService(cfg config.FileConfig) *FileService {
	dir := cfg.UploadDir
	if dir == "" {
		dir = "./uploads"
	}
	os.MkdirAll(filepath.Join(dir, "post-images"), 0755)
	os.MkdirAll(filepath.Join(dir, "avatars"), 0755)
	return &FileService{uploadDir: dir}
}

func (s *FileService) UploadFile(file *multipart.FileHeader, subDir string) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("open file failed: %w", err)
	}
	defer src.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	dir := filepath.Join(s.uploadDir, subDir)
	os.MkdirAll(dir, 0755)

	dstPath := filepath.Join(dir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return "", fmt.Errorf("create file failed: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("write file failed: %w", err)
	}

	relativePath := filepath.Join(subDir, filename)
	return "/uploads/" + filepath.ToSlash(relativePath), nil
}

func (s *FileService) UploadImage(file *multipart.FileHeader) (string, error) {
	return s.UploadFile(file, "post-images")
}

func (s *FileService) UploadAvatar(file *multipart.FileHeader) (string, error) {
	return s.UploadFile(file, "avatars")
}

// CleanOrphanImages removes image files that are older than the specified days
func (s *FileService) CleanOrphanImages(dir string, days int) error {
	imageDir := filepath.Join(s.uploadDir, dir)
	cutoff := time.Now().AddDate(0, 0, -days)

	return filepath.Walk(imageDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if info.ModTime().Before(cutoff) {
			os.Remove(path)
		}
		return nil
	})
}
