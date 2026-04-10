"""Tests for deployment configuration files (render.yaml, .gitignore)."""

import pathlib

import yaml
import pytest


REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPO_ROOT / "backend"
FRONTEND_ROOT = REPO_ROOT / "frontend"
RENDER_YAML = REPO_ROOT / "render.yaml"


# ── render.yaml ──────────────────────────────────────────────────────


class TestRenderYaml:

    @pytest.fixture(autouse=True)
    def _load(self):
        assert RENDER_YAML.exists(), "render.yaml not found at repo root"
        self.cfg = yaml.safe_load(RENDER_YAML.read_text(encoding="utf-8"))

    def test_yaml_is_valid_with_services_key(self):
        assert "services" in self.cfg
        assert isinstance(self.cfg["services"], list)
        assert len(self.cfg["services"]) >= 1

    def test_health_check_path_is_set(self):
        svc = self.cfg["services"][0]
        assert svc.get("healthCheckPath") == "/health"

    def test_health_check_path_matches_fastapi_route(self):
        from app.main import app

        registered = {r.path for r in app.routes}
        health_path = self.cfg["services"][0]["healthCheckPath"]
        assert health_path in registered, (
            f"healthCheckPath '{health_path}' is not a registered FastAPI route"
        )

    def test_start_command_uses_uvicorn(self):
        svc = self.cfg["services"][0]
        assert "uvicorn app.main:app" in svc.get("startCommand", "")

    def test_python_version_env_var(self):
        svc = self.cfg["services"][0]
        env_vars = {e["key"]: e.get("value") for e in svc.get("envVars", [])}
        assert env_vars.get("PYTHON_VERSION") == "3.11"


# ── frontend/.gitignore ─────────────────────────────────────────────


class TestFrontendGitignore:

    def test_vercel_is_in_gitignore(self):
        gitignore = FRONTEND_ROOT / ".gitignore"
        assert gitignore.exists(), "frontend/.gitignore not found"
        entries = [
            line.strip()
            for line in gitignore.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
        assert ".vercel" in entries
