import { expect } from "chai";
import request from "supertest";
import app from "../app.js";

describe("Health routes", () => {
  describe("GET /health", () => {
    it("returns 200 and status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("status", "ok");
    });
  });

  describe("GET /health/ready", () => {
    it("returns 200 when server is up (db may or may not be connected)", async () => {
      const res = await request(app).get("/health/ready");
      expect([200, 503]).to.include(res.status);
      expect(res.body).to.have.property("status");
    });
  });
});
