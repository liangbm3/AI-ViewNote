package main

import (
	"AI-ViewNote/backend/repository"
	"AI-ViewNote/backend/service"
	"embed"
	_ "embed"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

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

	taskRepo := repository.NewTaskRepository(db)
	taskService := service.NewTaskService(taskRepo)

	confRepo := repository.NewConfigRepository(db)
	confService := service.NewConfigService(confRepo)

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

	// 启动一个 goroutine，每分钟获取一次任务列表并通过事件通知前端。
	go func() {
		ticker := time.NewTicker(time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			resp := taskService.GetTaskList()
			app.Event.Emit("task_list_update", resp)
		}
	}()

	// 运行应用程序。此操作会阻塞，直到应用退出。
	err = app.Run()

	// 如果运行应用时发生错误，则记录日志并退出。
	if err != nil {
		log.Fatal(err)
	}
}
