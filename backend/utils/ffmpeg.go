package utils

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

func GetFFmpegPath() string {
	if envPath := strings.TrimSpace(os.Getenv("AI_VIEWNOTE_FFMPEG_PATH")); envPath != "" {
		if fileExists(envPath) {
			return envPath
		}
	}

	exePath, err := os.Executable()
	if err == nil {
		exeDir := filepath.Dir(exePath)
		if path := ffmpegPathInDir(exeDir); path != "" {
			return path
		}
		resourcesDir := filepath.Clean(filepath.Join(exeDir, "..", "Resources"))
		if path := ffmpegPathInDir(resourcesDir); path != "" {
			return path
		}
	}

	path, err := exec.LookPath("ffmpeg")
	if err != nil {
		return ""
	}
	return path
}

func ffmpegPathInDir(dir string) string {
	name := "ffmpeg"
	if runtime.GOOS == "windows" {
		name = "ffmpeg.exe"
	}
	candidate := filepath.Join(dir, name)
	if fileExists(candidate) {
		return candidate
	}
	return ""
}

func fileExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

func GetFFmpegVersion() (string, error) {
	cmd := exec.Command("ffmpeg", "-version")

	// 在Windows上隐藏控制台窗口
	setHideWindowAttr(cmd)

	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	firstLine := strings.Split(string(output), "\n")[0]
	return firstLine, nil
}

func ExtractAudioWithFFmpeg(videoPath string, audioPath string) error {
	ffmpegPath := GetFFmpegPath()
	if ffmpegPath == "" {
		return errors.New("ffmpeg not found")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(
		ctx,
		ffmpegPath,
		"-y",
		"-i", videoPath,
		"-q:a", "0",
		"-map", "a",
		audioPath,
	)

	// 在Windows上隐藏控制台窗口
	setHideWindowAttr(cmd)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return errors.New(stderr.String())
	}
	return nil
}

// CaptureScreenshot 从视频中截取指定时间戳的帧，保存为 JPEG 图片。
// timestamp 单位为秒，outputPath 应以 .jpg 结尾。
func CaptureScreenshot(videoPath string, timestamp int, outputPath string) error {
	ffmpegPath := GetFFmpegPath()
	if ffmpegPath == "" {
		return errors.New("ffmpeg not found")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(
		ctx,
		ffmpegPath,
		"-y",
		"-ss", fmt.Sprintf("%d", timestamp),
		"-i", videoPath,
		"-vframes", "1",
		"-q:v", "5",
		outputPath,
	)

	// 在Windows上隐藏控制台窗口
	setHideWindowAttr(cmd)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return errors.New(stderr.String())
	}
	return nil
}
