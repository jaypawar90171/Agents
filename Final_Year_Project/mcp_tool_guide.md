# MCP Tool Guide — Final Year Project

## What is MCP?

**Model Context Protocol (MCP)** is an open standard by Anthropic that lets AI assistants (Claude, Copilot, etc.) securely connect to **your own tools, APIs, and data sources** — just like plugins, but standardized.

Think of it like this:

```
AI Client (Claude / VS Code Copilot)
        │
        │  MCP Protocol (JSON-RPC over stdio / SSE)
        ▼
  Your MCP Server  ←──► Your FastAPI Backend / MongoDB / Groq
```

Once you expose your project's capabilities as MCP tools, **any MCP-compatible AI can call them** — Claude Desktop, VS Code Copilot, Cursor, etc.

---

## What Your Project Can Expose as MCP Tools

Based on your project (FastAPI + Groq + MongoDB + RAG), here are the ideal tools to expose:

| Tool Name | What it does |
|---|---|
| [generate_roadmap](file:///f:/LangGraph/Final_Year_Project/Backend/app/services/roadmap_service.py#347-373) | Generate a skill-based learning roadmap for a target company |
| `search_jobs` | Search jobs from MongoDB by query/company |
| `chat_with_rag` | Ask questions and get answers using your RAG pipeline |
| `get_job_details` | Get detailed job info for a specific listing |

---

## Step 1 — Install the MCP SDK

```bash
cd f:\LangGraph\Final_Year_Project\Backend
.\venv\Scripts\activate
pip install mcp
```

> [!NOTE]
> The `mcp` package is Anthropic's official Python SDK for building MCP servers. It handles the protocol transport so you focus only on your tool logic.

---

## Step 2 — Create the MCP Server File

Create a new file: `f:\LangGraph\Final_Year_Project\Backend\mcp_server.py`

```python
import asyncio
import logging
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

# Import your existing services
from app.services.roadmap_service import generate_roadmap, RoadmapValidationError, RoadmapNotFoundError, RoadmapServiceError
from app.db.connection import jobs_collection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Create the MCP server instance ──────────────────────────────────────────
server = Server("final-year-project")


# ── Tool 1: Generate Roadmap ─────────────────────────────────────────────────
@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="generate_roadmap",
            description=(
                "Generate a personalized, week-by-week skill learning roadmap "
                "for a target company based on real job postings scraped from "
                "Naukri and Foundit. Returns markdown formatted roadmap."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "company_name": {
                        "type": "string",
                        "description": "Name of the company to generate roadmap for (e.g. 'TCS', 'Infosys', 'Google India')"
                    }
                },
                "required": ["company_name"]
            }
        ),
        types.Tool(
            name="search_jobs",
            description=(
                "Search job listings from the database by company name or keyword. "
                "Returns a list of matching jobs with title, skills, location and URL."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Company name or job keyword to search for"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max number of results to return (default: 10)",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        ),
    ]


# ── Tool Handlers ────────────────────────────────────────────────────────────
@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:

    if name == "generate_roadmap":
        company_name = arguments.get("company_name", "").strip()
        try:
            result = generate_roadmap(company_name)
            roadmap_text = result["roadmap"]
            jobs_count = len(result.get("jobs_used", []))
            return [types.TextContent(
                type="text",
                text=f"✅ Roadmap generated using {jobs_count} job listings:\n\n{roadmap_text}"
            )]
        except RoadmapValidationError as e:
            return [types.TextContent(type="text", text=f"❌ Validation Error: {e}")]
        except RoadmapNotFoundError as e:
            return [types.TextContent(type="text", text=f"❌ Not Found: {e}")]
        except RoadmapServiceError as e:
            return [types.TextContent(type="text", text=f"❌ Service Error: {e}")]

    elif name == "search_jobs":
        query = arguments.get("query", "")
        limit = arguments.get("limit", 10)
        try:
            pipeline = [
                {"$match": {"company": {"$regex": query, "$options": "i"}}},
                {"$project": {
                    "_id": 0,
                    "company": 1,
                    "job_title": 1,
                    "location": 1,
                    "skills_required": 1,
                    "job_url": 1
                }},
                {"$limit": limit}
            ]
            jobs = list(jobs_collection.aggregate(pipeline))
            if not jobs:
                return [types.TextContent(type="text", text=f"No jobs found for '{query}'.")]

            lines = [f"Found {len(jobs)} jobs for '{query}':\n"]
            for i, job in enumerate(jobs, 1):
                skills = ", ".join(job.get("skills_required", [])[:5])
                lines.append(
                    f"{i}. **{job.get('job_title')}** @ {job.get('company')}\n"
                    f"   📍 {job.get('location')} | 🛠 {skills}\n"
                    f"   🔗 {job.get('job_url')}\n"
                )
            return [types.TextContent(type="text", text="\n".join(lines))]
        except Exception as e:
            return [types.TextContent(type="text", text=f"❌ Database error: {e}")]

    return [types.TextContent(type="text", text=f"Unknown tool: {name}")]


# ── Entry point ──────────────────────────────────────────────────────────────
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
```

> [!IMPORTANT]
> The MCP server uses **stdio transport** — meaning the AI client launches it as a subprocess and communicates over stdin/stdout. Your FastAPI server can keep running independently on port 8000.

---

## Step 3 — Register It with Claude Desktop

Open Claude Desktop's config file:

**Windows path**: `%APPDATA%\Claude\claude_desktop_config.json`

Add your server:

```json
{
  "mcpServers": {
    "final-year-project": {
      "command": "f:\\LangGraph\\Final_Year_Project\\Backend\\venv\\Scripts\\python.exe",
      "args": ["f:\\LangGraph\\Final_Year_Project\\Backend\\mcp_server.py"],
      "env": {
        "GROQ_API_KEY": "your_groq_api_key_here",
        "MONGO_URI": "your_mongodb_uri_here"
      }
    }
  }
}
```

Restart Claude Desktop → your tools will appear as a 🔌 plugin icon.

---

## Step 4 — Register It with VS Code (GitHub Copilot)

In VS Code, open **Settings JSON** (`Ctrl+Shift+P` → "Open User Settings JSON") and add:

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "mcp": {
    "servers": {
      "final-year-project": {
        "type": "stdio",
        "command": "f:\\LangGraph\\Final_Year_Project\\Backend\\venv\\Scripts\\python.exe",
        "args": ["f:\\LangGraph\\Final_Year_Project\\Backend\\mcp_server.py"],
        "env": {
          "GROQ_API_KEY": "your_groq_api_key_here",
          "MONGO_URI": "your_mongodb_uri_here"
        }
      }
    }
  }
}
```

> [!TIP]
> Alternatively, create a `.vscode/mcp.json` file in your workspace root for project-level MCP config that can be committed to Git.

---

## Step 5 — Test It Without Any AI Client

Use the official MCP Inspector to test your server directly:

```bash
npx @modelcontextprotocol/inspector python mcp_server.py
```

This opens a local web UI where you can call [generate_roadmap](file:///f:/LangGraph/Final_Year_Project/Backend/app/services/roadmap_service.py#347-373) and `search_jobs` and see the raw tool outputs — great for debugging before connecting to Claude.

---

## How It Works End-to-End

```
You (in Claude / Copilot chat):
  "Generate a roadmap for TCS"
         │
         ▼
AI detects → calls generate_roadmap(company_name="TCS")
         │
         ▼
mcp_server.py receives the call
         │
         ▼
Calls generate_roadmap() from roadmap_service.py
  ├── embed_query() → Ollama (local)
  ├── retrieve_documents() → MongoDB vector search
  └── generate_answer() → Groq LLaMA 3.3 70B
         │
         ▼
Returns markdown roadmap back to Claude
         │
         ▼
Claude renders the roadmap in your chat
```

---

## Using It Anywhere — Key Insight

Since MCP is a **standard protocol**, the same `mcp_server.py` works across:

| Client | How to configure |
|---|---|
| **Claude Desktop** | `claude_desktop_config.json` |
| **VS Code Copilot** | `.vscode/mcp.json` or user settings |
| **Cursor IDE** | `~/.cursor/mcp.json` |
| **Continue.dev** | `config.json` mcp section |
| **Your own app** | Use `mcp` Python client SDK |

You write the tool **once** — any MCP client can use it.

---

## Folder Structure After Setup

```
Backend/
├── app/
│   ├── services/
│   │   ├── roadmap_service.py   ← existing (unchanged)
│   │   └── ...
│   └── ...
├── mcp_server.py                ← NEW: your MCP server
├── requirements.txt             ← add: mcp
└── .env                         ← GROQ_API_KEY, MONGO_URI
```

---

## Quick Reference: Key MCP Concepts

| Concept | What it means |
|---|---|
| **Tool** | A function the AI can call (like [generate_roadmap](file:///f:/LangGraph/Final_Year_Project/Backend/app/services/roadmap_service.py#347-373)) |
| **Resource** | Static data the AI can read (like a file or DB record) |
| **Prompt** | Pre-built prompt templates the AI can use |
| **Transport** | How data moves — `stdio` (subprocess) or `SSE` (HTTP) |
| **Server** | Your Python file that hosts tools/resources |
| **Client** | The AI app (Claude Desktop, VS Code Copilot, etc.) |
