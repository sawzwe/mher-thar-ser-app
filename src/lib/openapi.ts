export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mher Thar Ser API",
    version: "0.1.0",
    description:
      "Restaurant booking platform API. Admin users have full access to all routes (including vendor routes). Vendor users can manage their own restaurants. Public routes require no auth.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Public", description: "No authentication required" },
    { name: "Vendor", description: "Requires vendor or admin role" },
    { name: "Admin", description: "Requires admin role" },
    { name: "Admin – Superadmin", description: "Requires superadmin access level" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey" as const,
        in: "cookie" as const,
        name: "sb-access-token",
        description: "Supabase session cookie (set after sign-in)",
      },
    },
    schemas: {
      Error: {
        type: "object" as const,
        properties: { error: { type: "string" } },
      },
      Success: {
        type: "object" as const,
        properties: { success: { type: "boolean" } },
      },
      Restaurant: {
        type: "object" as const,
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          area: { type: "string" },
          address: { type: "string" },
          cuisine_tags: { type: "array", items: { type: "string" } },
          price_tier: { type: "integer", minimum: 1, maximum: 4 },
          image_url: { type: "string", nullable: true },
          open_time: { type: "string", nullable: true },
          close_time: { type: "string", nullable: true },
          status: { type: "string", enum: ["draft", "active", "paused", "archived"] },
          phone: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          facebook_url: { type: "string", nullable: true },
          instagram_url: { type: "string", nullable: true },
          postal_code: { type: "string", nullable: true },
          logo_url: { type: "string", nullable: true },
          street_view_url: { type: "string", nullable: true },
          restaurant_type: { type: "string", nullable: true },
          attributes: { type: "object", nullable: true },
          google_place_id: { type: "string", nullable: true },
          google_maps_url: { type: "string", nullable: true },
          google_rating: { type: "number", nullable: true },
          google_review_count: { type: "integer", nullable: true },
        },
      },
      Deal: {
        type: "object" as const,
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          restaurant_id: { type: "string", format: "uuid" },
          price: { type: "number", nullable: true },
          discount: { type: "number", nullable: true },
          discount_pct: { type: "number", nullable: true },
          conditions: { type: "string", nullable: true },
        },
      },
      Slot: {
        type: "object" as const,
        properties: {
          id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          date: { type: "string", format: "date" },
          time: { type: "string" },
          capacity: { type: "integer" },
          remaining: { type: "integer" },
        },
      },
      Booking: {
        type: "object" as const,
        properties: {
          id: { type: "string", format: "uuid" },
          booking_ref: { type: "string" },
          restaurant_id: { type: "string", format: "uuid" },
          customer_name: { type: "string" },
          contact: { type: "string" },
          date: { type: "string", format: "date" },
          time: { type: "string" },
          party_size: { type: "integer" },
          status: { type: "string", enum: ["confirmed", "cancelled", "completed", "no_show", "rescheduled"] },
        },
      },
      Review: {
        type: "object" as const,
        properties: {
          id: { type: "string", format: "uuid" },
          restaurant_id: { type: "string", format: "uuid" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
        },
      },
      User: {
        type: "object" as const,
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", nullable: true },
          name: { type: "string" },
          created_at: { type: "string", format: "date-time" },
          banned_until: { type: "string", nullable: true },
          roles: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
  paths: {
    // ─── Public ───
    "/api/restaurants": {
      get: {
        tags: ["Public"],
        summary: "List active restaurants",
        description: "Returns all restaurants with status=active, including deals.",
        responses: {
          "200": {
            description: "Array of restaurants",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } } } },
          },
        },
      },
    },
    "/api/restaurants/{id}": {
      get: {
        tags: ["Public"],
        summary: "Get restaurant detail",
        description: "Returns full restaurant info including deals, menu, and reviews.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Restaurant object", content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/chat": {
      post: {
        tags: ["Public"],
        summary: "Chat – restaurant recommendations",
        description: "Send conversation messages to get AI-powered restaurant recommendations. Falls back to keyword-based demo when API is unavailable.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  messages: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        role: { type: "string", enum: ["user", "assistant"] },
                        content: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Chat response", content: { "application/json": { schema: { type: "object", properties: { text: { type: "string" } } } } } },
        },
      },
    },

    // ─── Vendor (admin also allowed) ───
    "/api/vendor/claim": {
      post: {
        tags: ["Vendor"],
        summary: "Claim a restaurant",
        description: "Any authenticated user can claim a restaurant to become its vendor. Creates vendor_restaurants and vendor_profiles entries.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId"],
                properties: { restaurantId: { type: "string", format: "uuid" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success", content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } } },
          "401": { description: "Unauthenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/vendor/restaurants": {
      get: {
        tags: ["Vendor"],
        summary: "List vendor's restaurants",
        description: "Vendors see their own restaurants. Admins see all restaurants.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Array of restaurants", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } } } } },
          "401": { description: "Unauthenticated" },
        },
      },
    },
    "/api/vendor/restaurants/{id}": {
      get: {
        tags: ["Vendor"],
        summary: "Get vendor restaurant detail",
        description: "Vendor must own the restaurant. Admin can access any.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Restaurant object", content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
          "403": { description: "Forbidden" },
        },
      },
      patch: {
        tags: ["Vendor"],
        summary: "Update vendor restaurant",
        description: "Update restaurant fields. Vendor must own it; admin can update any.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
        responses: {
          "200": { description: "Updated restaurant" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/vendor/restaurants/{id}/deals": {
      get: {
        tags: ["Vendor"],
        summary: "List deals for restaurant",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Array of deals", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Deal" } } } } },
        },
      },
      post: {
        tags: ["Vendor"],
        summary: "Create a deal",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Deal" } } } },
        responses: {
          "201": { description: "Created deal", content: { "application/json": { schema: { $ref: "#/components/schemas/Deal" } } } },
        },
      },
    },
    "/api/vendor/restaurants/{id}/deals/{dealId}": {
      patch: {
        tags: ["Vendor"],
        summary: "Update a deal",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "dealId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Deal" } } } },
        responses: {
          "200": { description: "Updated deal" },
          "403": { description: "Deal does not belong to this restaurant" },
        },
      },
      delete: {
        tags: ["Vendor"],
        summary: "Delete a deal",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "dealId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Success", content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } } },
          "403": { description: "Deal does not belong to this restaurant" },
        },
      },
    },
    "/api/vendor/restaurants/{id}/slots": {
      get: {
        tags: ["Vendor"],
        summary: "List slots for restaurant",
        description: "Returns availability slots from today (or ?from=YYYY-MM-DD) onward.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "from", in: "query", required: false, schema: { type: "string", format: "date" }, description: "Start date filter" },
        ],
        responses: {
          "200": { description: "Array of slots", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Slot" } } } } },
        },
      },
      patch: {
        tags: ["Vendor"],
        summary: "Bulk update slots",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Updated slots" } },
      },
    },
    "/api/vendor/restaurants/{id}/slots/generate": {
      post: {
        tags: ["Vendor"],
        summary: "Auto-generate slots for 60 days",
        description: "Provide a weekly schedule (keyed by day name) and slots are generated for the next 60 days.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string", example: "18:00" },
                      capacity: { type: "integer", example: 20 },
                    },
                  },
                },
                example: { monday: [{ time: "18:00", capacity: 20 }, { time: "20:00", capacity: 15 }] },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success with count", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, count: { type: "integer" } } } } } },
        },
      },
    },
    "/api/vendor/restaurants/{id}/bookings": {
      get: {
        tags: ["Vendor"],
        summary: "List bookings for restaurant",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Array of bookings", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Booking" } } } } },
        },
      },
      patch: {
        tags: ["Vendor"],
        summary: "Update booking status",
        description: "Mark a booking as completed or no_show.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["bookingId", "status"],
                properties: {
                  bookingId: { type: "string", format: "uuid" },
                  status: { type: "string", enum: ["completed", "no_show"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated booking", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
          "400": { description: "Invalid status" },
          "403": { description: "Booking does not belong to this restaurant" },
        },
      },
    },

    // ─── Admin ───
    "/api/admin/overview": {
      get: {
        tags: ["Admin"],
        summary: "Dashboard overview",
        description: "Stats, top restaurants, and recent activity for the admin dashboard.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Overview payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    stats: {
                      type: "object",
                      properties: {
                        totalUsers: { type: "integer" },
                        customers: { type: "integer" },
                        vendors: { type: "integer" },
                        admins: { type: "integer" },
                        pendingVendors: { type: "integer" },
                        todayBookings: { type: "integer" },
                      },
                    },
                    restaurantCount: { type: "integer" },
                    topRestaurants: { type: "array", items: { type: "object" } },
                    activity: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Platform statistics",
        description: "Counts of users by role, pending vendors, and today's bookings.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Stats object",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalUsers: { type: "integer" },
                    customers: { type: "integer" },
                    vendors: { type: "integer" },
                    admins: { type: "integer" },
                    pendingVendors: { type: "integer" },
                    todayBookings: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users",
        description: "Returns users with roles. Supports ?q= for filtering by name/email.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" }, description: "Search by name or email" }],
        responses: {
          "200": {
            description: "Users list",
            content: { "application/json": { schema: { type: "object", properties: { users: { type: "array", items: { $ref: "#/components/schemas/User" } }, total: { type: "integer" } } } } },
          },
        },
      },
    },
    "/api/admin/users/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete a user",
        description: "Permanently delete a user. Cannot delete yourself.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Success", content: { "application/json": { schema: { $ref: "#/components/schemas/Success" } } } },
          "400": { description: "Cannot delete own account" },
        },
      },
    },
    "/api/admin/users/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Suspend or reactivate a user",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["active", "suspended"] } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success" },
          "400": { description: "Invalid status" },
        },
      },
    },
    "/api/admin/users/{id}/roles": {
      patch: {
        tags: ["Admin – Superadmin"],
        summary: "Add or remove a role from a user",
        description: "Superadmin only. Add or remove customer/vendor/admin role.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role", "action"],
                properties: {
                  role: { type: "string", enum: ["customer", "vendor", "admin"] },
                  action: { type: "string", enum: ["add", "remove"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success" },
          "403": { description: "Superadmin only" },
        },
      },
    },
    "/api/admin/restaurants": {
      post: {
        tags: ["Admin"],
        summary: "Create a restaurant",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  slug: { type: "string" },
                  description: { type: "string" },
                  area: { type: "string" },
                  address: { type: "string" },
                  cuisine_tags: { type: "array", items: { type: "string" } },
                  price_tier: { type: "integer", minimum: 1, maximum: 4 },
                  image_url: { type: "string" },
                  open_time: { type: "string" },
                  close_time: { type: "string" },
                  status: { type: "string", enum: ["draft", "active", "paused", "archived"] },
                  phone: { type: "string" },
                  website: { type: "string" },
                  email: { type: "string" },
                  facebook_url: { type: "string" },
                  instagram_url: { type: "string" },
                  postal_code: { type: "string" },
                  logo_url: { type: "string" },
                  street_view_url: { type: "string" },
                  restaurant_type: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Created restaurant (id, name, slug, area, status)" },
          "400": { description: "Name required" },
        },
      },
    },
    "/api/admin/restaurants/import": {
      post: {
        tags: ["Admin"],
        summary: "Import restaurants from CSV/XLSX",
        description: "Upload a CSV or XLSX file to bulk import restaurants. Rows are validated then upserted (by slug). Returns imported count, skipped count, and errors.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "CSV, XLSX, or XLS file" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Import result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    imported: { type: "integer" },
                    skipped: { type: "integer" },
                    errors: { type: "array", items: { type: "object", properties: { row: { type: "integer" }, field: { type: "string" }, message: { type: "string" } } } },
                  },
                },
              },
            },
          },
          "400": { description: "No file uploaded or empty" },
          "422": { description: "Validation errors (all rows failed)" },
        },
      },
    },
    "/api/admin/restaurants/list": {
      get: {
        tags: ["Admin"],
        summary: "List all restaurants (summary)",
        description: "Returns id, name, slug, area, status for all restaurants.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Restaurant list",
            content: { "application/json": { schema: { type: "object", properties: { restaurants: { type: "array", items: { $ref: "#/components/schemas/Restaurant" } } } } } },
          },
        },
      },
    },
    "/api/admin/restaurants/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Get restaurant by ID (full)",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Full restaurant object" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Admin"],
        summary: "Update a restaurant",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Restaurant" } } } },
        responses: {
          "200": { description: "Updated restaurant" },
          "400": { description: "Name required" },
        },
      },
    },
    "/api/admin/restaurants/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Change restaurant status",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: { status: { type: "string", enum: ["draft", "active", "paused", "archived"] } },
              },
            },
          },
        },
        responses: { "200": { description: "Updated restaurant" } },
      },
    },
    "/api/admin/restaurants/{id}/vendors": {
      get: {
        tags: ["Admin"],
        summary: "List vendors linked to a restaurant",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Vendors list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    vendors: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          vendor_id: { type: "string", format: "uuid" },
                          role: { type: "string" },
                          email: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Link a vendor to a restaurant",
        description: "Find user by email and assign them as a vendor for this restaurant.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                  role: { type: "string", default: "owner" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Success with vendor_id" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/admin/vendors": {
      get: {
        tags: ["Admin"],
        summary: "List pending vendor claims",
        description: "Returns vendor profiles where verified_at is null.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Pending list",
            content: { "application/json": { schema: { type: "object", properties: { pending: { type: "array", items: { type: "object", properties: { user_id: { type: "string" } } } } } } } },
          },
        },
      },
    },
    "/api/admin/vendors/{id}/verify": {
      post: {
        tags: ["Admin"],
        summary: "Approve a vendor claim",
        description: "Sets verified_at, assigns vendor role, activates claimed restaurants.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Vendor user ID" }],
        responses: {
          "200": { description: "Success" },
        },
      },
    },
    "/api/admin/vendors/{id}/reject": {
      post: {
        tags: ["Admin"],
        summary: "Reject a vendor claim",
        description: "Deletes vendor_restaurants and vendor_profiles for this user.",
        security: [{ cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "Vendor user ID" }],
        responses: {
          "200": { description: "Success" },
        },
      },
    },
    "/api/admin/bookings": {
      get: {
        tags: ["Admin"],
        summary: "List all bookings",
        description: "Returns up to 100 most recent bookings.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Bookings list",
            content: { "application/json": { schema: { type: "object", properties: { bookings: { type: "array", items: { $ref: "#/components/schemas/Booking" } } } } } },
          },
        },
      },
    },
    "/api/admin/reviews": {
      get: {
        tags: ["Admin"],
        summary: "List reviews for moderation",
        description: "Returns up to 100 reviews ordered by lowest rating first.",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": {
            description: "Reviews list",
            content: { "application/json": { schema: { type: "object", properties: { reviews: { type: "array", items: { $ref: "#/components/schemas/Review" } } } } } },
          },
        },
      },
    },
  },
} as const;
