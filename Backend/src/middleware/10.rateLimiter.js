// the rate limiter properly — you actually need two different limiters with different strictness, since login and general auth endpoints face different threat models.

// npm install express-rate-limit

/*
Why two separate limiters, not one
Login needs to be strict and targeted — brute-forcing a specific password is the real threat, so you want to limit attempts per account being attacked, not just per IP (an attacker could rotate IPs, but they can't rotate the email they're targeting).
Register / resend-verification / forgot-password face a different threat — spam and enumeration, not credential brute-forcing. A looser, purely IP-based limit is sufficient and doesn't need the same per-account precision.
*/

import {rateLimit,ipKeyGenerator} from "express-rate-limit";
import config from "../config/config.js"

/**
 * Why Number()?
Environment variables are strings.
 */
// Count requests within a 15-minute window.
const windowMin = Number(config.loginratelimitwindowmin) || 15;
// This particular client/key can make at most 5 requests during the configured window.
const maxAttempts = Number(config.loginratelimitmax) || 5;;

const loginLimiter = rateLimit({
  windowMs: windowMin * 60 * 1000,
  max: maxAttempts,
  /**
   * standardHeaders: true,
   * This tells the rate limiter to send standard rate-limit information in HTTP headers.
    For example, the response may contain information about:

    how many requests remain
    when the limit resets

    This can help the frontend/client understand the rate limit.
   */
  standardHeaders: true, 
  legacyHeaders: false,  // disables the older X-RateLimit-* headers, redundant with standardHeaders
  /**
   keyGenerator: (req) =>
    `${req.ip}:${req.body?.email || "unknown"}`,

        This determines:
        Who are we counting requests for?
        This is extremely important.
        The limiter needs some kind of key.

        For example, if the key is only: req.ip
        then:
        IP 192.168.1.10
            ↓
        5 attempts
            ↓
        blocked

        But your code uses:
        req.ip + email

        So imagine:
        IP = 10.0.0.5
        Email = alice@gmail.com

        The key becomes roughly:
        10.0.0.5:alice@gmail.com

        Now another user:
        IP = 10.0.0.5
        Email = bob@gmail.com

        gets a different key:
        10.0.0.5:bob@gmail.com

        Therefore:
        10.0.0.5 + alice@gmail.com
                ↓
        5 attempts

        10.0.0.5 + bob@gmail.com
                ↓
        separate 5 attempts

        That's useful because many people can share one public IP—for example at a university, office, or through NAT.
   */
  // What is ?. ?  This is optional chaining.
  // "If req.body exists, get email; otherwise don't crash."
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${req.body?.email || "unknown"}`,
  handler: (req, res) => {
    /**
     * 429, specifically — this is the correct HTTP status for rate limiting: "Too Many Requests." Worth knowing explicitly, since it's a status code people often forget exists and default to 400 or 403 instead, which is technically wrong here.
     */
    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
    });
  },
});


const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests. Please try again later.",
    });
  },
});

export { loginLimiter, generalAuthLimiter };