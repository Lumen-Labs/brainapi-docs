#!/usr/bin/env python3
"""Export a deterministic, documentation-ready BrainAPI V2 OpenAPI snapshot."""

from __future__ import annotations

import argparse
import importlib
import json
import os
import sys
from pathlib import Path


EXCLUDED_PATHS = {
    "/system/brains/{brain_id}/reset",
    "/system/brains/{brain_id}/delete",
    "/system/brains/{brain_id}/create-backup",
}
CORE_TAGS = {"ingest", "retrieve", "model", "meta", "tasks", "system"}


def load_schema(source: Path) -> dict:
    sys.path.insert(0, str(source))
    os.environ.setdefault("BRAINPAT_TOKEN", "documentation-export")
    os.environ.setdefault("MODELS_MODE", "local")
    os.environ.setdefault("LLM_SMALL_PROVIDER", "ollama")
    os.environ.setdefault("LLM_LARGE_PROVIDER", "ollama")
    os.environ.setdefault("EMBEDDINGS_PROVIDER", "ollama")
    os.environ.setdefault("OLLAMA_HOST", "localhost")
    os.environ.setdefault("OLLAMA_PORT", "11434")
    os.environ.setdefault("OLLAMA_LLM_SMALL_MODEL", "documentation-model")
    os.environ.setdefault("OLLAMA_LLM_LARGE_MODEL", "documentation-model")
    os.environ.setdefault("EMBEDDINGS_LOCAL_MODEL", "documentation-embeddings")
    os.environ.setdefault("EMBEDDINGS_SMALL_MODEL", "documentation-embeddings")
    for key in (
        "EMBEDDING_NODES_DIMENSION",
        "EMBEDDING_TRIPLETS_DIMENSION",
        "EMBEDDING_OBSERVATIONS_DIMENSION",
        "EMBEDDING_DATA_DIMENSION",
        "EMBEDDING_RELATIONSHIPS_DIMENSION",
    ):
        os.environ.setdefault(key, "768")
    app = importlib.import_module("src.services.api.app").app
    schema = app.openapi()
    schema["info"] = {
        **schema.get("info", {}),
        "title": "BrainAPI V2 Core API",
        "version": "2.17.0-dev",
        "description": "Core BrainAPI HTTP API. Official plugin routes are documented separately.",
    }
    schema["servers"] = [{"url": "http://localhost:8000", "description": "Local BrainAPI"}]
    schema["tags"] = [
        {"name": name, "description": f"BrainAPI {name} operations."}
        for name in ("ingest", "retrieve", "model", "meta", "tasks", "system")
    ]

    filtered: dict[str, dict] = {}
    for route, path_item in schema.get("paths", {}).items():
        if route in EXCLUDED_PATHS:
            continue
        operations = {}
        for method, operation in path_item.items():
            if not isinstance(operation, dict):
                continue
            if not CORE_TAGS.intersection(operation.get("tags", [])):
                continue
            operation["security"] = [{"BrainPAT": []}, {"BearerAuth": []}]
            if not route.startswith("/system") and route != "/meta/login-info":
                params = operation.setdefault("parameters", [])
                if not any(p.get("name") == "X-Brain-ID" for p in params if isinstance(p, dict)):
                    params.append({
                        "name": "X-Brain-ID",
                        "in": "header",
                        "required": False,
                        "schema": {"type": "string"},
                        "description": "Preferred brain scope. Query/body/multipart fallbacks remain supported.",
                    })
            operations[method] = operation
        if operations:
            filtered[route] = operations
    schema["paths"] = filtered
    components = schema.setdefault("components", {})
    components["securitySchemes"] = {
        "BrainPAT": {"type": "apiKey", "in": "header", "name": "BrainPAT"},
        "BearerAuth": {"type": "http", "scheme": "bearer"},
    }
    return schema


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("schemas/brainapi-v2.openapi.json"))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    rendered = json.dumps(load_schema(args.source.resolve()), indent=2, sort_keys=True) + "\n"
    if args.check:
        if not args.output.exists() or args.output.read_text() != rendered:
            print(f"OpenAPI snapshot is stale: {args.output}", file=sys.stderr)
            return 1
        print(f"OpenAPI snapshot is current: {args.output}")
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered)
    print(f"Wrote {len(json.loads(rendered)['paths'])} documented paths to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
