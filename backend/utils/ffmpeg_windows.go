//go:build windows

package utils

import (
	"os/exec"
	"syscall"
)

func setHideWindowAttr(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}
}