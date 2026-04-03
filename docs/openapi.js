const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Node REST API Project",
    version: "1.0.0",
    description: "API documentation for auth, feed, and profile modules.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Server status endpoints" },
    { name: "Auth", description: "Authentication and password flows" },
    { name: "Feed", description: "Post management endpoints" },
    { name: "Profile", description: "User profile endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Validation failed" },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 5, example: "secret123" },
          name: { type: "string", example: "Mahesh" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 5, example: "secret123" },
        },
      },
      ForgetPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["newPassword", "confirmPassword"],
        properties: {
          newPassword: { type: "string", minLength: 5, example: "newSecret123" },
          confirmPassword: { type: "string", minLength: 5, example: "newSecret123" },
        },
      },
      PostCreateRequest: {
        type: "object",
        required: ["title", "content", "image"],
        properties: {
          title: { type: "string", minLength: 3, example: "My first post" },
          content: { type: "string", minLength: 3, example: "This is post content." },
          isPostMark: { type: "boolean", example: false },
          image: { type: "string", format: "binary" },
        },
      },
      PostUpdateRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 5, example: "Updated title" },
          content: { type: "string", minLength: 5, example: "Updated content body." },
          image: { type: "string", format: "binary" },
        },
      },
      UpdateMarkRequest: {
        type: "object",
        required: ["postIds", "isPostMark"],
        properties: {
          postIds: {
            type: "array",
            items: { type: "string", example: "6610c780f8dd9ce6c22ac111" },
          },
          isPostMark: { type: "boolean", example: true },
        },
      },
      DeleteManyPostsRequest: {
        type: "object",
        required: ["postIds"],
        properties: {
          postIds: {
            type: "array",
            items: { type: "string", example: "6610c780f8dd9ce6c22ac111" },
          },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Mahesh Kumar" },
          email: { type: "string", format: "email", example: "user@example.com" },
          phone: { type: "string", example: "+91-9999999999" },
          location: { type: "string", example: "Bengaluru" },
          dob: { type: "string", example: "2000-01-01" },
          bio: { type: "string", example: "Node.js developer" },
          status: { type: "string", example: "Building cool APIs" },
          image: { type: "string", format: "binary" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check endpoint",
        responses: {
          200: {
            description: "Server is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "OK" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/signup": {
      put: {
        tags: ["Auth"],
        summary: "Create a user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          201: { description: "User created successfully" },
          409: { description: "Email already exists" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in and receive JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout endpoint",
        responses: {
          200: { description: "User logged out successfully" },
        },
      },
    },
    "/auth/forget-password": {
      post: {
        tags: ["Auth"],
        summary: "Start password reset flow",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgetPasswordRequest" },
            },
          },
        },
        responses: {
          200: { description: "Password reset initiated" },
          401: { description: "User not found" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/auth/reset-password/{token}": {
      post: {
        tags: ["Auth"],
        summary: "Reset user password with token",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: { description: "Password updated successfully" },
          400: { description: "Invalid or expired token / bad input" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/feed/posts": {
      get: {
        tags: ["Feed"],
        summary: "Get paginated posts",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
          {
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string", example: "travel" },
          },
          {
            name: "sort",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["newest", "oldest"], default: "newest" },
          },
        ],
        responses: {
          200: { description: "Posts fetched successfully" },
          401: { description: "Unauthorized" },
        },
      },
      delete: {
        tags: ["Feed"],
        summary: "Delete many posts by IDs",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DeleteManyPostsRequest" },
            },
          },
        },
        responses: {
          200: { description: "Selected posts deleted successfully" },
          400: { description: "Invalid post IDs" },
          403: { description: "Not authorized for one or more posts" },
        },
      },
    },
    "/feed/post": {
      post: {
        tags: ["Feed"],
        summary: "Create a post",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/PostCreateRequest" },
            },
          },
        },
        responses: {
          201: { description: "Post created successfully" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/feed/post/{postId}": {
      get: {
        tags: ["Feed"],
        summary: "Get a single post by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Post fetched by ID" },
          404: { description: "Post not found" },
        },
      },
      put: {
        tags: ["Feed"],
        summary: "Update a post by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/PostUpdateRequest" },
            },
          },
        },
        responses: {
          200: { description: "Post updated successfully" },
          403: { description: "Not authorized" },
          404: { description: "Post not found" },
        },
      },
      delete: {
        tags: ["Feed"],
        summary: "Delete a post by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Post deleted successfully" },
          403: { description: "Not authorized" },
          404: { description: "Post not found" },
        },
      },
    },
    "/feed/post/{postId}/comments": {
      get: {
        tags: ["Feed"],
        summary: "Get comments for a post (paginated)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          200: { description: "Comments fetched successfully" },
        },
      },
      post: {
        tags: ["Feed"],
        summary: "Create a comment on a post",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", minLength: 1, maxLength: 500, example: "Nice post!" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Comment created successfully" },
          404: { description: "Post not found" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/feed/post/{postId}/comments/{commentId}": {
      delete: {
        tags: ["Feed"],
        summary: "Delete a comment (author only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Comment deleted successfully" },
          404: { description: "Comment not found" },
        },
      },
    },
    "/feed/post/{postId}/like": {
      post: {
        tags: ["Feed"],
        summary: "Toggle like/unlike for a post",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          201: { description: "Post liked" },
          200: { description: "Like removed" },
          404: { description: "Post not found" },
        },
      },
    },
    "/feed/post/{postId}/likes": {
      get: {
        tags: ["Feed"],
        summary: "Get like summary for a post",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Like summary returned" },
        },
      },
    },
    "/feed/posts/update-mark": {
      patch: {
        tags: ["Feed"],
        summary: "Mark or unmark posts in bulk",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMarkRequest" },
            },
          },
        },
        responses: {
          200: { description: "Posts updated successfully" },
          400: { description: "Invalid input" },
          403: { description: "Not authorized for one or more posts" },
        },
      },
    },
    "/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Profile returned successfully" },
          404: { description: "User not found" },
        },
      },
    },
    "/profile/update/{postId}": {
      put: {
        tags: ["Profile"],
        summary: "Update current user profile",
        description: "Path uses {postId} in current code, though update targets authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "postId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/ProfileUpdateRequest" },
            },
          },
        },
        responses: {
          200: { description: "Profile updated successfully" },
          404: { description: "User not found" },
          422: { description: "Validation failed" },
        },
      },
    },
    "/profile/delete": {
      delete: {
        tags: ["Profile"],
        summary: "Delete current user profile and related posts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Profile deleted successfully" },
          404: { description: "User not found" },
        },
      },
    },
  },
};

export default openApiSpec;
