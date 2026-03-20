package bindings

func successResponse(message string, data interface{}) Response {
	return Response{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func errorResponse(message string) Response {
	return Response{
		Success: false,
		Message: message,
	}
}
