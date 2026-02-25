import { expect } from "chai";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/user.js";
import Post from "../models/post.js";
function getAuthToken(userId, email = "test@example.com") {
  return jwt.sign(
    { email, userId },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

describe("Feed", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
  });

  describe("GET /feed/posts", () => {
    it("returns 401 without Authorization header", async () => {
      const res = await request(app).get("/feed/posts");
      expect(res.status).to.equal(401);
    });

    it("returns 200 with valid token and empty list when no posts", async () => {
      const hash = await bcrypt.hash("password123", 12);
      const user = await User.create({
        email: "feed@example.com",
        password: hash,
        name: "Feed User",
      });
      const token = getAuthToken(user._id.toString(), user.email);

      const res = await request(app)
        .get("/feed/posts")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body.posts).to.be.an("array").that.is.empty;
      expect(res.body.totalItems).to.equal(0);
    });

    it("returns posts with pagination (page and limit)", async () => {
      const hash = await bcrypt.hash("password123", 12);
      const user = await User.create({
        email: "feed@example.com",
        password: hash,
        name: "Feed User",
      });
      const token = getAuthToken(user._id.toString(), user.email);

      await Post.create([
        { title: "Post 1", content: "Content 1", imageUrl: "http://x.com/1", imagePublicId: "id1", creator: user._id },
        { title: "Post 2", content: "Content 2", imageUrl: "http://x.com/2", imagePublicId: "id2", creator: user._id },
      ]);

      const res = await request(app)
        .get("/feed/posts?page=1&limit=1")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).to.equal(200);
      expect(res.body.posts).to.have.lengthOf(1);
      expect(res.body.totalItems).to.equal(2);
    });
  });
});
