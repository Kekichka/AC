# MCP Transports
Supported transports:
1. stdio: Child process communication via newline-delimited JSON-RPC on stdin/stdout. Stderr is reserved strictly for logging.
2. SSE over HTTP: For remote servers via Server-Sent Events GET text/event-stream and POST.
