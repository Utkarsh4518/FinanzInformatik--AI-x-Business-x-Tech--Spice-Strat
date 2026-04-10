"""Tests for deployment endpoints introduced in commit b05b773."""

import pytest
from httpx import AsyncClient


# ── GET / (root endpoint) ────────────────────────────────────────────


class TestRootEndpoint:

    async def test_root_returns_200(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.status_code == 200

    async def test_root_content_type_json(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.headers["content-type"] == "application/json"

    async def test_root_response_body(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.json() == {"service": "synapse API", "status": "ok"}

    async def test_root_service_field(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.json()["service"] == "synapse API"

    async def test_root_status_field(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.json()["status"] == "ok"

    async def test_root_no_extra_keys(self, client: AsyncClient):
        resp = await client.get("/")
        assert set(resp.json().keys()) == {"service", "status"}

    @pytest.mark.parametrize("method", ["post", "put", "delete"])
    async def test_root_disallows_other_methods(self, client: AsyncClient, method: str):
        resp = await getattr(client, method)("/")
        assert resp.status_code == 405

    async def test_root_head_returns_200(self, client: AsyncClient):
        resp = await client.head("/")
        assert resp.status_code == 200

    async def test_root_and_health_both_return_200(self, client: AsyncClient):
        root = await client.get("/")
        health = await client.get("/health")
        assert root.status_code == 200
        assert health.status_code == 200
        assert root.json() != health.json()


# ── GET /health (regression guard) ──────────────────────────────────


class TestHealthEndpoint:

    async def test_health_returns_200(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200

    async def test_health_response_body(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.json() == {"status": "ok"}

    async def test_health_has_no_service_key(self, client: AsyncClient):
        resp = await client.get("/health")
        assert "service" not in resp.json()

    async def test_health_head_returns_200(self, client: AsyncClient):
        resp = await client.head("/health")
        assert resp.status_code == 200
