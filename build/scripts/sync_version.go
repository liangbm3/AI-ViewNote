package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func main() {
	root := "."
	version, err := readVersion(filepath.Join(root, "VERSION"))
	if err != nil {
		exitWithError(err)
	}

	if err := updateWindowsInfo(filepath.Join(root, "build", "windows", "info.json"), version); err != nil {
		exitWithError(err)
	}
	if err := updatePlist(filepath.Join(root, "build", "darwin", "Info.plist"), version); err != nil {
		exitWithError(err)
	}
	if err := updateNfpm(filepath.Join(root, "build", "linux", "nfpm", "nfpm.yaml"), version); err != nil {
		exitWithError(err)
	}
	if err := updateNfpm(filepath.Join(root, "build", "linux", "nfpm", "nfpm-with-ffmpeg.yaml"), version); err != nil {
		exitWithError(err)
	}
	if err := updateBuildConfig(filepath.Join(root, "build", "config.yml"), version); err != nil {
		exitWithError(err)
	}
	if err := updatePackageJSON(filepath.Join(root, "frontend", "package.json"), version); err != nil {
		exitWithError(err)
	}

	fmt.Printf("Synced version to %s\n", version)
}

func exitWithError(err error) {
	fmt.Fprintln(os.Stderr, "sync-version:", err)
	os.Exit(1)
}

func readVersion(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	version := strings.TrimSpace(string(data))
	if version == "" {
		return "", errors.New("VERSION is empty")
	}
	return version, nil
}

func updateWindowsInfo(path, version string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var info map[string]any
	if err := json.Unmarshal(data, &info); err != nil {
		return err
	}

	fixed, ok := info["fixed"].(map[string]any)
	if !ok {
		fixed = map[string]any{}
		info["fixed"] = fixed
	}
	fixed["file_version"] = version

	blocks, ok := info["info"].(map[string]any)
	if !ok {
		blocks = map[string]any{}
		info["info"] = blocks
	}
	for key, value := range blocks {
		block, ok := value.(map[string]any)
		if !ok {
			continue
		}
		block["ProductVersion"] = version
		blocks[key] = block
	}

	updated, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		return err
	}
	updated = append(updated, '\n')

	return os.WriteFile(path, updated, 0o644)
}

func updatePlist(path, version string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	text := string(data)

	reVersion := regexp.MustCompile(`(?s)(<key>CFBundleVersion</key>\s*<string>)([^<]*)(</string>)`)
	if !reVersion.MatchString(text) {
		return errors.New("CFBundleVersion not found")
	}
	text = reVersion.ReplaceAllString(text, `${1}`+version+`${3}`)

	reShort := regexp.MustCompile(`(?s)(<key>CFBundleShortVersionString</key>\s*<string>)([^<]*)(</string>)`)
	if !reShort.MatchString(text) {
		return errors.New("CFBundleShortVersionString not found")
	}
	text = reShort.ReplaceAllString(text, `${1}`+version+`${3}`)

	return os.WriteFile(path, []byte(text), 0o644)
}

func updateNfpm(path, version string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var lines []string
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	replaced := false
	reVersion := regexp.MustCompile(`^(\s*)version:\s*.*$`)

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if !replaced && !strings.HasPrefix(trimmed, "#") && reVersion.MatchString(line) {
			matches := reVersion.FindStringSubmatch(line)
			indent := matches[1]
			line = indent + "version: \"" + version + "\""
			replaced = true
		}
		lines = append(lines, line)
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if !replaced {
		return errors.New("version field not found")
	}

	output := strings.Join(lines, "\n") + "\n"
	return os.WriteFile(path, []byte(output), 0o644)
}

func updateBuildConfig(path, version string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var lines []string
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	inInfo := false
	replaced := false
	reVersion := regexp.MustCompile(`^(\s*)version:\s*[^#]*`)

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		if isTopLevelKey(line) {
			inInfo = strings.HasPrefix(trimmed, "info:")
		}

		if inInfo && !replaced && !strings.HasPrefix(trimmed, "#") && strings.HasPrefix(trimmed, "version:") {
			indent := ""
			if m := reVersion.FindStringSubmatch(line); len(m) > 1 {
				indent = m[1]
			}
			comment := ""
			if idx := strings.Index(line, "#"); idx >= 0 {
				comment = strings.TrimSpace(line[idx:])
			}
			line = indent + "version: \"" + version + "\""
			if comment != "" {
				line += " " + comment
			}
			replaced = true
		}

		lines = append(lines, line)
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if !replaced {
		return errors.New("info.version not found")
	}

	output := strings.Join(lines, "\n") + "\n"
	return os.WriteFile(path, []byte(output), 0o644)
}

func updatePackageJSON(path, version string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var lines []string
	scanner := bufio.NewScanner(strings.NewReader(string(data)))
	replaced := false
	reVersion := regexp.MustCompile(`^(\s*)"version"\s*:\s*"[^"]*"(\s*,?)\s*$`)

	for scanner.Scan() {
		line := scanner.Text()
		if !replaced && reVersion.MatchString(line) {
			matches := reVersion.FindStringSubmatch(line)
			indent := matches[1]
			suffix := matches[2]
			line = indent + "\"version\": \"" + version + "\"" + suffix
			replaced = true
		}
		lines = append(lines, line)
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if !replaced {
		return errors.New("package.json version not found")
	}

	output := strings.Join(lines, "\n") + "\n"
	return os.WriteFile(path, []byte(output), 0o644)
}

func isTopLevelKey(line string) bool {
	trimmed := strings.TrimSpace(line)
	if trimmed == "" || strings.HasPrefix(trimmed, "#") {
		return false
	}
	if len(line) > 0 && (line[0] == ' ' || line[0] == '\t') {
		return false
	}
	return strings.Contains(trimmed, ":")
}
