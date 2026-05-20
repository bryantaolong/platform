package service

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type LogService struct {
	logDir string
}

func NewLogService() *LogService {
	return &LogService{
		logDir: "logs",
	}
}

func (s *LogService) ListLogFiles() ([]string, error) {
	entries, err := os.ReadDir(s.logDir)
	if err != nil {
		return nil, err
	}

	var files []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".log") {
			files = append(files, entry.Name())
		}
	}
	sort.Sort(sort.Reverse(sort.StringSlice(files)))
	return files, nil
}

func (s *LogService) ListLatestLogs(file string, lines int) ([]string, error) {
	if file == "" {
		files, err := s.ListLogFiles()
		if err != nil || len(files) == 0 {
			return nil, err
		}
		file = files[0]
	}

	if lines <= 0 || lines > 2000 {
		lines = 200
	}

	logPath := filepath.Join(s.logDir, file)
	data, err := os.ReadFile(logPath)
	if err != nil {
		return nil, err
	}

	allLines := strings.Split(string(data), "\n")
	if len(allLines) > lines {
		allLines = allLines[len(allLines)-lines:]
	}
	return allLines, nil
}
