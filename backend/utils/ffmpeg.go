package utils

import (
	"bytes"
	"context"
	"errors"
	"os/exec"
	"strings"
	"time"
)

func GetFFmpegPath() string {
	path, err := exec.LookPath("ffmpeg")
	if err != nil {
		return ""
	}
	return path
}

func GetFFmpegVersion() (string, error) {
	cmd := exec.Command("ffmpeg", "-version")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	firstLine := strings.Split(string(output),"\n")[0]
	return firstLine, nil
}

func ExtractAudioWithFFmpeg(videoPath string, audioPath string) error{
	ffmpegPath := GetFFmpegPath()
	if(ffmpegPath==""){
		return errors.New("ffmpeg not found")
	}
	ctx,cancel := context.WithTimeout(context.Background(),5*time.Minute)
	defer cancel()

	cmd:=exec.CommandContext(
		ctx,
		ffmpegPath,
		"-y",
		"-i", videoPath,
		"-q:a", "0",
		"-map", "a",
		audioPath,
	)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		return errors.New(stderr.String())
	}
	return nil
}