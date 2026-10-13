const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'docs', 'lab2', 'corpus');
fs.mkdirSync(targetDir, { recursive: true });

const docs = {
  'mcp-arch-01.md': `# MCP Architecture & Roles\nModel Context Protocol (MCP) standardizes how AI applications interact with data and tools.\nArchitecture: MCP Host (Claude Code/Cursor), MCP Client, MCP Server.\nCommunication: Peer-to-peer over JSON-RPC 2.0 messages.`,
  'mcp-trans-02.md': `# MCP Transports\nSupported transports:\n1. stdio: Child process communication via newline-delimited JSON-RPC on stdin/stdout. Stderr is reserved strictly for logging.\n2. SSE over HTTP: For remote servers via Server-Sent Events GET text/event-stream and POST.`,
  'mcp-proto-03.md': `# MCP Lifecycle\n1. Initialization: client sends initialize (protocolVersion, capabilities), server responds with serverInfo and capabilities.\n2. Initialized: client confirms with notifications/initialized.\n3. Normal operation & ping: bidirectional requests and periodic ping messages.`,
  'mcp-res-04.md': `# MCP Resources\nRead-only data endpoints exposed via URIs (e.g. file:///path).\nSupports dynamic URI templates (RFC 6570) and subscriptions. Client reads via resources/read. Resources have no external side-effects.`,
  'mcp-tools-05.md': `# MCP Tools\nExecutable actions exposed to LLMs. Declared with name, description, and inputSchema (JSON Schema).\nExecuted via tools/call with arguments. Returns content and isError boolean. Tools may perform side-effects.`,
  'mcp-prompts-06.md': `# MCP Prompts\nReusable server-managed prompt templates discovered via prompts/list and fetched via prompts/get with arguments.\nReturns structured messages with dynamic context.`,
  'mcp-sampl-07.md': `# MCP Sampling\nAllows MCP server to request LLM completions back from host client (sampling/createMessage).\nEnables LLM inversion without server needing API keys.`,
  'mcp-roots-08.md': `# MCP Roots\nDefines directory boundaries of filesystem exposed to MCP server via roots/list and notifications/roots/list_changed.\nCompliant servers must refuse paths outside roots.`,
  'mcp-sec-09.md': `# MCP Security\nLeast privilege principle. Destructive tools require human-in-the-loop approval. Sandboxing, sanitization of inputs against traversal (../), secret scrubbing.`,
  'mcp-err-10.md': `# MCP Error Handling\nStandard JSON-RPC 2.0 codes: Parse Error (-32700), Invalid Request (-32600), Method Not Found (-32601), Invalid Params (-32602), Internal Error (-32603).\nApplication errors inside tools return isError: true.`,
  'agent-loop-11.md': `# Agent Execution Loops\nReAct cycle: Observation -> Reasoning -> Action (tool call) -> Observation feedback. Loops until final response or maxIterations.`,
  'agent-ctx-12.md': `# Context Window Management\nAvoid context bloat. Use sliding window, context compaction, and grounded retrieval of 200-500 token chunks instead of full documents.`,
  'agent-sub-13.md': `# Read-Only vs Read-Write Subagents\nSubagents isolate cognitive context. Read-only subagents (spec-auditor, explorer) have Read/Grep tools. Read-write must remain single-threaded.`,
  'agent-eval-14.md': `# Evaluation Metrics\nRAG evaluation: Correctness (percentage of golden queries answered), Groundedness (derived from context), Citation Coverage (must_cite IDs), Refusal Precision.`,
  'agent-inj-15.md': `# Prompt Injection Defenses\nDirect overrides vs indirect injection in documents. Defenses: strict JSON schemas, XML boundary tags, read-only permissions, verifier gate.`,
  'agent-cost-16.md': `# Cost Optimization\nModel routing: small/fast models for exploration, strong reasoning models for synthesis. Tracking tokens and cost per 100 queries via src/cost.ts.`
};

for (const [filename, content] of Object.entries(docs)) {
  fs.writeFileSync(path.join(targetDir, filename), content.trim() + '\n', 'utf8');
}
console.log('Successfully created 16 corpus documents in docs/lab2/corpus/!');