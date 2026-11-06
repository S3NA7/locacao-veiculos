import { describe, expect, it } from "vitest";
import request from "supertest";
import { criarApp } from "../src/app.js";

describe("GET /saude", () => {
  it("responde que a API está no ar", async () => {
    const resposta = await request(criarApp()).get("/saude");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({ ok: true });
  });
});
