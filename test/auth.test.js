import { expect } from "chai";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";

describe("Auth", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("PUT /auth/signup", () => {
    it("rejects invalid email with 422", async () => {
      const res = await request(app)
        .put("/auth/signup")
        .send({ email: "not-an-email", password: "12345", name: "Test User" });
      expect(res.status).to.equal(422);
    });

    it("rejects short password with 422", async () => {
      const res = await request(app)
        .put("/auth/signup")
        .send({ email: "test@example.com", password: "1234", name: "Test User" });
      expect(res.status).to.equal(422);
    });

    it("creates user and returns 201 with userId", async () => {
      const res = await request(app)
        .put("/auth/signup")
        .send({ email: "test@example.com", password: "password123", name: "Test User" });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property("userId");
      const user = await User.findOne({ email: "test@example.com" });
      expect(user).to.exist;
      expect(user.name).to.equal("Test User");
      expect(await bcrypt.compare("password123", user.password)).to.be.true;
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      const hash = await bcrypt.hash("password123", 12);
      await User.create({
        email: "login@example.com",
        password: hash,
        name: "Login User",
      });
    });

    it("returns 401 for unknown email", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "unknown@example.com", password: "password123" });
      expect(res.status).to.equal(401);
    });

    it("returns 401 for wrong password", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "login@example.com", password: "wrongpassword" });
      expect(res.status).to.equal(401);
    });

    it("returns 200 and JWT for valid credentials", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "login@example.com", password: "password123" });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("token");
      expect(res.body).to.have.property("userId");
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded.email).to.equal("login@example.com");
      expect(decoded.userId).to.equal(res.body.userId);
    });
  });
});
