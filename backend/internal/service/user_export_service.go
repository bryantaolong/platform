package service

import (
	"fmt"
	"time"
)

// Note: The user exporter needs the excelize library
// We provide a simplified CSV-based implementation as fallback

type UserExportService struct {
}

func NewUserExportService() *UserExportService {
	return &UserExportService{}
}

type ExportUserData struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Status    int       `json:"status"`
	Roles     string    `json:"roles"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *UserExportService) ExportToCSV(users []ExportUserData) ([]byte, string, error) {
	var csv string
	csv = "ID,用户名,邮箱,手机号,状态,角色,创建时间\n"
	for _, u := range users {
		statusStr := "正常"
		switch u.Status {
		case 1:
			statusStr = "禁用"
		case 2:
			statusStr = "锁定"
		}
		csv += fmt.Sprintf("%d,%s,%s,%s,%s,%s,%s\n",
			u.ID, u.Username, u.Email, u.Phone, statusStr, u.Roles,
			u.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	filename := fmt.Sprintf("users_%s.csv", time.Now().Format("20060102_150405"))
	return []byte(csv), filename, nil
}
