package utils

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"io"
	"net"
	"net/http"
)

func GenerateLocalUUID() string {
	mac := ""
	interfaces, _ := net.Interfaces()
	for _, iface := range interfaces {
		if len(iface.HardwareAddr) > 0 {
			mac = iface.HardwareAddr.String()
			break
		}
	}
	if mac == "" {
		mac = "00:00:00:00:00:00"
	}
	checksum := md5.Sum([]byte(mac))
	return hex.EncodeToString(checksum[:])
}

func PostJSON(url string, payload interface{}, token string) ([]byte, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}

	authHeader := "Bearer; " + token
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	return respBody, nil
}

