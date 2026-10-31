/*
🧠 Dependency on which files : auth.controller.js and validate.js -> middleware
 */

// Router is something provided by Express that allows us to create a separate group of routes.
// Instead of putting everything inside server.js: keep authentication routes inside auth.routes.js
import { Router } from "express";
// body() is used to validate something coming from: req.body
import {body} from "express-validator";
// The controller is responsible for actually handling registration.
import {register,verifyEmail,login,refresh,logout,me,changePassword,forgotPasswordHandler,resetPasswordHandler,resendVerification } from "../controllers/8.auth.controller.js";
// custom middleware
import validate from "../middleware/6.validate.js";
import { authenticate } from "../middleware/11.authenticate.js";
import { loginLimiter,generalAuthLimiter } from "../middleware/10.rateLimiter.js";

// This creates a router object.
const router = Router();

/**
 * general syntax:-
router.post(
    "/path",
    middleware1,
    middleware2,
    controller
);

For my code:
router.post(
    "/register",
    validationRules,
    validate, -> middleware
    register -> controller
);
 */

/**
 * 
 * 429, specifically — this is the correct HTTP status for rate limiting: "Too Many Requests." Worth knowing explicitly, since it's a status code people often forget exists and default to 400 or 403 instead, which is technically wrong here.
 * 
 */
router.post("/register",generalAuthLimiter,[
    body("email")
        .isEmail() // If invalid, an error is added to the validation result.
        .withMessage("Must be a valid email") // If the previous validation fails, use this error message.
        .normalizeEmail(), // This tries to normalize the email into a consistent format. For example, some email inputs may have formatting/casing differences.

    body("password")
        .isLength({min: 8})
        .withMessage("Password must be at least 8 chararcters")
        .matches(/\d/) // \d -> any digit from 0 to 9
        .withMessage("Password must contain a number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage("Password must contain a special character"),
    
    body("registrationId")
      .notEmpty()
      .withMessage("Registration ID is required"),
    ],
        validate, // This collects all validation errors.
        register  // controller
)

router.post(
  "/verify-email",generalAuthLimiter,
  [body("token").notEmpty().withMessage("Token is required")],
  validate,
  verifyEmail
);

router.post(
  "/resend-verification",  generalAuthLimiter,
  [body("email").isEmail().withMessage("Must be a valid email").normalizeEmail()],
  validate,
  resendVerification
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Must be a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.post("/refresh", refresh);
router.post("/logout",authenticate,logout);

router.get("/me", authenticate, me);

router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
        .isLength({min: 8})
        .withMessage("Password must be at least 8 chararcters")
        .matches(/\d/) // \d -> any digit from 0 to 9
        .withMessage("Password must contain a number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage("Password must contain a special character"),
  ],
  validate,
  changePassword
);

router.post(
  "/forgot-password",
  generalAuthLimiter,
  [body("email").isEmail().withMessage("Must be a valid email").normalizeEmail()],
  validate,
  forgotPasswordHandler
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("newPassword")
        .isLength({min: 8})
        .withMessage("Password must be at least 8 chararcters")
        .matches(/\d/) // \d -> any digit from 0 to 9
        .withMessage("Password must contain a number")
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage("Password must contain a special character"),
  ],
  validate,
  resetPasswordHandler
);
 
export default router;