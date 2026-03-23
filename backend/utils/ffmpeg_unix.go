//go:build !windows

package utils

import (
	"os/exec"
)

func setHideWindowAttr(cmd *exec.Cmd) {
	// No-op for Unix systems
}