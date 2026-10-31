import request from "supertest";
import app from "../src/app.js";
import prisma from "../prismaClient.js";

const testUser = {
    email: "bhabanaagrawal1111@gmail.com",
    password: "NewPass@123",
    registrationId: "STU001",
};

describe("Authentication API", () => {

    // REGISTER

    test("should reject registration with missing fields", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(response.status).toBe(400);
    });

    test("should reject invalid email", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "not-an-email",
                password: "Test@1234",
                registrationId: "STU001",
            });

        expect(response.status).toBe(400);
    });

    test("should reject weak password", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "test@example.com",
                password: "123",
                registrationId: "STU001",
            });

        expect(response.status).toBe(400);
    });

    test("should reject duplicate email", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            "An account with this email already exists"
        );
    });


    // LOGIN

    test("should reject login with missing fields", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({});

        expect(response.status).toBe(400);
    });

    test("should reject login with invalid email", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "not-an-email",
                password: "NewPass@123",
            });

        expect(response.status).toBe(400);
    });

    test("should reject login with wrong password", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: "WrongPassword@123",
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "Invalid email or password"
        );
    });

    test("should reject login for a non-existent account", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "doesnotexist@example.com",
                password: "NewPass@123",
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "Invalid email or password"
        );
    });

    test("should login successfully", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(response.status).toBe(200);

        expect(response.body.accessToken).toBeDefined();

        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);

        expect(response.headers["set-cookie"]).toBeDefined();
    });


    // REFRESH TOKEN

    test("should reject refresh when no refresh token is provided", async () => {
        const response = await request(app)
            .post("/api/auth/refresh");

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            "No refresh token provided"
        );
    });

    test("should refresh tokens after successful login", async () => {
        const agent = request.agent(app);

        // Login first.
        const loginResponse = await agent
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(loginResponse.status).toBe(200);

        expect(loginResponse.body.accessToken).toBeDefined();

        // Agent automatically keeps the refresh cookie.
        const refreshResponse = await agent
            .post("/api/auth/refresh");

        expect(refreshResponse.status).toBe(200);

        expect(refreshResponse.body.accessToken).toBeDefined();

        expect(refreshResponse.headers["set-cookie"]).toBeDefined();
    });


    // LOGOUT

    test("should reject logout without authentication", async () => {
        const response = await request(app)
            .post("/api/auth/logout");

        expect(response.status).toBe(401);
    });

    test("should logout successfully after login", async () => {
        const agent = request.agent(app);

        const loginResponse = await agent
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(loginResponse.status).toBe(200);

        const accessToken = loginResponse.body.accessToken;

        const logoutResponse = await agent
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(logoutResponse.status).toBe(200);

        expect(logoutResponse.body.message).toBe(
            "Logged out successfully"
        );
    });


    // CURRENT USER

    test("should reject /me without authentication", async () => {
        const response = await request(app)
            .get("/api/auth/me");

        expect(response.status).toBe(401);
    });

    test("should return current user after authentication", async () => {
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(loginResponse.status).toBe(200);

        const accessToken = loginResponse.body.accessToken;

        const response = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
    });


    // CHANGE PASSWORD

    test("should reject change-password without authentication", async () => {
        const response = await request(app)
            .post("/api/auth/change-password")
            .send({
                currentPassword: testUser.password,
                newPassword: "AnotherPass@123",
            });

        expect(response.status).toBe(401);
    });

    test("should reject change-password with incorrect current password", async () => {
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password,
            });

        expect(loginResponse.status).toBe(200);

        const accessToken = loginResponse.body.accessToken;

        const response = await request(app)
            .post("/api/auth/change-password")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                currentPassword: "WrongPassword@123",
                newPassword: "AnotherPass@123",
            });

        expect(response.status).toBe(401);

        expect(response.body.message).toBe(
            "Current password is incorrect"
        );
    });


    
    // FORGOT PASSWORD

    test("should return generic response for unknown email", async () => {
        const response = await request(app)
            .post("/api/auth/forgot-password")
            .send({
                email: "doesnotexist@example.com",
            });

        expect(response.status).toBe(200);

        expect(response.body.message).toBe(
            "If an account with that email exists, a password reset link has been sent."
        );
    });

    test("should reject forgot-password with invalid email", async () => {
        const response = await request(app)
            .post("/api/auth/forgot-password")
            .send({
                email: "invalid-email",
            });

        expect(response.status).toBe(400);
    });


    // RESET PASSWORD

    test("should reject reset-password without token", async () => {
        const response = await request(app)
            .post("/api/auth/reset-password")
            .send({
                newPassword: "NewPassword@123",
            });

        expect(response.status).toBe(400);
    });

    test("should reject reset-password with invalid token", async () => {
        const response = await request(app)
            .post("/api/auth/reset-password")
            .send({
                token: "completely-invalid-token",
                newPassword: "NewPassword@123",
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
            "Invalid or expired reset token"
        );
    });


    // EMAIL VERIFICATION

    test("should reject verify-email without token", async () => {
        const response = await request(app)
            .post("/api/auth/verify-email")
            .send({});

        expect(response.status).toBe(400);
    });

    test("should reject verify-email with invalid token", async () => {
        const response = await request(app)
            .post("/api/auth/verify-email")
            .send({
                token: "invalid-verification-token",
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe(
            "Invalid or expired verification token"
        );
    });


    // RESEND VERIFICATION

    test("should return generic response for unknown verification email", async () => {
        const response = await request(app)
            .post("/api/auth/resend-verification")
            .send({
                email: "doesnotexist@example.com",
            });

        expect(response.status).toBe(200);

        expect(response.body.message).toBe(
            "If an account with that email exists and isn't verified, a new verification link has been sent."
        );
    });

    test("should reject resend-verification with invalid email", async () => {
        const response = await request(app)
            .post("/api/auth/resend-verification")
            .send({
                email: "invalid-email",
            });

        expect(response.status).toBe(400);
    });


    // PRISMA CLEANUP

    afterAll(async () => {
        await prisma.$disconnect();
    });

});