package main

import (
	"embed"
	_ "embed"
	"log"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// Wails 使用 Go 的 `embed` 包将前端文件嵌入到二进制文件中。
// frontend/dist 文件夹中的所有文件都会被嵌入到二进制中，
// 并可供前端访问。
// 详细信息见：https://pkg.go.dev/embed

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	// 注册一个自定义事件，关联的数据类型为 string。
	// 这不是必须的，但绑定生成器会自动识别已注册的事件，
	// 并为其生成强类型的 JS/TS API。
	application.RegisterEvent[string]("time")
}

// main 函数是应用程序的入口。它初始化应用、创建窗口，
// 并启动一个 goroutine 每秒发送一次时间事件。随后运行应用，
// 并记录可能发生的任何错误。
func main() {

	// 创建一个新的 Wails 应用，并提供必要的选项。
	// 'Name' 和 'Description' 用于应用元数据。
	// 'Assets' 配置资源服务器，'FS' 指向前端文件。
	// 'Bind' 是 Go 结构体实例的列表，前端可访问这些实例的方法。
	// 'Mac' 选项用于 macOS 下的应用定制。
	app := application.New(application.Options{
		Name:        "AI-ViewNote",
		Description: "A demo of using raw HTML & CSS",
		Services: []application.Service{
			application.NewService(&GreetService{}),
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

	// 启动一个 goroutine，每秒发送一次包含当前时间的事件。
	// 前端可监听该事件并相应更新 UI。
	go func() {
		for {
			now := time.Now().Format(time.RFC1123)
			app.Event.Emit("time", now)
			time.Sleep(time.Second)
		}
	}()

	// 运行应用程序。此操作会阻塞，直到应用退出。
	err := app.Run()

	// 如果运行应用时发生错误，则记录日志并退出。
	if err != nil {
		log.Fatal(err)
	}
}
