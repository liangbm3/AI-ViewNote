package main

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"AI-ViewNote/backend/service"
	"embed"
	"log"
	"os"
	"path/filepath"
	"runtime"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
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

//go:embed build/appicon.png
var trayIconPNG []byte

//go:embed build/windows/icon.ico
var trayIconICO []byte

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

	taskService := service.NewTaskService(taskRepo, confRepo, wailsEmitter)
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
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
		Windows: application.WindowsOptions{
			DisableQuitOnLastWindowClosed: true,
		},
		Linux: application.LinuxOptions{
			DisableQuitOnLastWindowClosed: true,
		},
	})

	mainWindow := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title: "AI-ViewNote - AI Powered Video Note Taking",
		Mac: application.MacWindow{
			InvisibleTitleBarHeight: 50,
			Backdrop:                application.MacBackdropTranslucent,
			TitleBar:                application.MacTitleBarHiddenInset,
		},
		BackgroundColour: application.NewRGB(27, 38, 54),
		URL:              "/",
		Width:            1200,
		Height:           800,
		MinWidth:        800,
		MinHeight:       600,
	})

	// 托盘模式下拦截关闭按钮，改为隐藏窗口。
	mainWindow.RegisterHook(events.Common.WindowClosing, func(event *application.WindowEvent) {
		event.Cancel()
		mainWindow.Hide()
	})

	setupSystemTray(app, mainWindow)

	// 运行应用程序。此操作会阻塞，直到应用退出。
	err = app.Run()

	// 如果运行应用时发生错误，则记录日志并退出。
	if err != nil {
		log.Fatal(err)
	}
}

func setupSystemTray(app *application.App, mainWindow application.Window) {
	trayMenu := application.NewMenu()

	showMainWindow := func() {
		mainWindow.Show()
		mainWindow.UnMinimise()
		mainWindow.Focus()
	}

	trayMenu.Add("显示主窗口").OnClick(func(_ *application.Context) {
		showMainWindow()
	})

	trayMenu.Add("隐藏主窗口").OnClick(func(_ *application.Context) {
		mainWindow.Hide()
	})

	trayMenu.AddSeparator()

	trayMenu.Add("退出").OnClick(func(_ *application.Context) {
		app.Quit()
	})

	tray := app.SystemTray.New().
		SetMenu(trayMenu).
		AttachWindow(mainWindow).
		WindowOffset(8)

	tray.SetTooltip("AI-ViewNote")

	if runtime.GOOS == "windows" && len(trayIconICO) > 0 {
		tray.SetIcon(trayIconICO)
	} else if len(trayIconPNG) > 0 {
		tray.SetIcon(trayIconPNG)
	}

	tray.OnRightClick(func() {
		tray.OpenMenu()
	})

	tray.OnClick(func() {
		showMainWindow()
	})
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
