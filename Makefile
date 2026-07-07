REPO_PATH    := /home/untilov/Projects/payroll-smb/

# To slow
# PROVIDER     := ollama
# MODEL        := nomic-embed-text
# BASE_URL     := http://localhost:11434

# Faster than ollama
PROVIDER     := lmstudio
MODEL        := text-embedding-nomic-embed-text-v1.5
BASE_URL     := http://localhost:1234/v1

.PHONY: install build start ingest mcp init qdrant-up qdrant-down qdrant-logs clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install npm dependencies
	npm install

build: ## Compile TypeScript to dist/
	npm run build

start: build ## Build and start MCP server (stdio)
	npm run start

mcp: build ## Build and start MCP server (stdio)
	npm run mcp

ingest: ## Ingest the configured repo
	npm run ingest -- $(REPO_PATH) --provider $(PROVIDER) --model $(MODEL) --base-url $(BASE_URL)

init: ## Create .code-rag.jsonc config file
	npx code-rag init

qdrant-up: ## Start Qdrant via Docker Compose
	docker compose up -d

qdrant-down: ## Stop Qdrant
	docker compose down

qdrant-logs: ## Show Qdrant logs
	docker compose logs -f qdrant

clean: ## Remove build artifacts
	rm -rf dist