# MCP Lifecycle
1. Initialization: client sends initialize (protocolVersion, capabilities), server responds with serverInfo and capabilities.
2. Initialized: client confirms with notifications/initialized.
3. Normal operation & ping: bidirectional requests and periodic ping messages.
