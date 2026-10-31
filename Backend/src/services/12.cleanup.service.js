import prisma from "../../prismaClient.js";
import config from "../config/config.js";

// "How long should we wait before deleting an old token?"

/**
The flow

Suppose the refresh token is:

RT1

Initially:

RefreshToken table

tokenHash    revoked
RT1-hash     false
1. Token is used normally

RT1 → /refresh

Server validates it and rotates it:

RT1 → revoked = true
RT2 → created

Now:

RT1-hash    true
RT2-hash    false
2. Attacker tries to reuse RT1

The attacker somehow stole RT1 and sends it again:

POST /refresh
Authorization: RT1

Your server hashes the incoming token and finds:

stored = RT1-hash
stored.revoked = true

That is a very important signal:

"This token existed, but it has already been used/revoked."

So you can treat this as refresh-token reuse, potentially indicating token theft, and revoke the relevant token family/session.

3. What if you had deleted RT1?

After rotation:

RT1 → deleted
RT2 → active

Attacker sends RT1 again:

stored = null

Now the server cannot distinguish:

Case A: attacker reused an old revoked token
Case B: someone sent a completely random/invalid token

The security signal is gone.


Token expires
      ↓
KEEP it for 3 days
      ↓
Reuse detection still works
      ↓
After 3 days
      ↓
DELETE it

cleanup runs:
              expiresAt
                  ↓
        Is it before Sep 24?
              /       \
            YES        NO
             ↓          ↓
          DELETE       KEEP
 */
const GRACE_PERIOD = config.gracePeriodMs; // // 3 days past expiry before deletion

// Go to the database and remove old refresh-token records that we no longer need.
// Because otherwise your RefreshToken table will keep growing forever.
export async function cleanupExpiredTokens() {
    // Think of cutoff as a boundary date.
    const cutoff = new Date(Date.now() - GRACE_PERIOD);
    // Find all refreshToken rows matching the condition and delete them. Delete every refresh token whose expiresAt is less than the cutoff date.
    const result = await prisma.refreshToken.deleteMany({
        /**
        where: {
            OR: [
                { condition1 },
                { condition2 }
            ]
        }
        This means: Delete the row if condition 1 OR condition 2 is true.

        1. Why deleteMany with an OR condition covering both cases — a token could be stale for either reason independently: naturally expired without ever being revoked (a user who never logged out, just let their session time out), or revoked well before its natural expiry (a rotation from months ago). Both are equally safe to delete once the grace period has passed.
         */
        where: {
            OR: [
                { expiresAt: { lt: cutoff }}, // lt means: less than
                { revoked: true, revokedAt: { lt: cutoff }},
            ],
        },
    });

    console.log(`[Cleanup] Deleted ${result.count} stale refresh tokens`);
    return result.count;
}