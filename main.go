package main

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"AI-ViewNote/backend/service"
	"embed"
	_ "embed"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type WailsEventEmitter struct{}

func (w *WailsEventEmitter) Emit(eventName string, data any) {
	app := application.Get()
	if app != nil {
		app.Event.Emit(eventName, data)
	}
}

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	application.RegisterEvent[string]("time")
}

func main() {
	configDir, _ := os.UserConfigDir()
	dBPath := filepath.Join(configDir, "AI-ViewNote", "data.db")
	db, err := repository.InitDB(dBPath)
	if err != nil {
		log.Fatal("Failed to initialize database: ", err)
	}
	defer db.Close()

	wailsEmitter := &WailsEventEmitter{}

	taskRepo := repository.NewTaskRepository(db)
	confRepo := repository.NewConfigRepository(db)

	taskService := service.NewTaskService(taskRepo,confRepo, wailsEmitter)
	confService := service.NewConfigService(confRepo)

	// 确保默认配置项存在
	ensureConfigExists(confService, "run_in_background", "false")
	ensureConfigExists(confService, "desktop_notifications", "false")

	app := application.New(application.Options{
		Name:        "AI-ViewNote",
		Description: "A demo of using raw HTML & CSS",
		Services: []application.Service{
			application.NewService(taskService),
			application.NewService(confService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// 创建一个新窗口并设置相关选项。
	// 'Title' 是窗口标题。
	// 'Mac' 选项用于 macOS 下的窗口定制。
	// 'BackgroundColour' 是窗口背景色。
	// 'URL' 是加载到 webview 的地址。
	app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "Window 1",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
	})

	// 运行应用程序。此操作会阻塞，直到应用退出。
	err = app.Run()

	// 如果运行应用时发生错误，则记录日志并退出。
	if err != nil {
		log.Fatal(err)
	}
}

func ensureConfigExists(service *service.ConfigService, key string, defaultValue string) {
	resp := service.ConfigExists(models.ConfigKey(key))
	if !resp.Success {
		log.Printf("Config '%s' does not exist, creating with default value.\n", key)
		saveResp := service.SaveConfig(models.ConfigKey(key), defaultValue)
		if !saveResp.Success {
			log.Printf("Failed to create config '%s': %s\n", key, saveResp.Message)
		} else {
			log.Printf("Config '%s' created successfully.\n", key)
		}
	} else {
		log.Printf("Config '%s' already exists.\n", key)
	}
}
