import { cleanupExpiredTokens } from "../src/services/12.cleanup.service";

/**
 * Render Cron Jobs
Render's cron service literally runs node scripts/cleanup.js for you, on whatever schedule you set (0 3 * * *), inside its own isolated environment
It handles "did this run," "did it fail," retry/logging — you get a dashboard showing execution history for free
This is the standard, correct choice for your situation — no extra third-party service needed, works natively with the platform you're already using

You're used to the schedule being part of the program (like it is in the node-cron version) — a value your own code checks against. With Render Cron Jobs, the responsibility is inverted: your script knows nothing about when it runs. It's "dumb" on purpose — it just does the work when invoked. The when lives entirely in Render's platform, outside your codebase, the same way a Linux system's crontab file (a config file, not a program) tells the OS when to run a script, without the script itself containing any timing logic.

0 3 * * *
│ │ │ │ │
│ │ │ │ └─ day of week (* = any)
│ │ │ └─── month (* = any)
│ │ └───── day of month (* = any)
│ └─────── hour (3 = 3 AM)
└───────── minute (0 = on the hour)

Render's Cron Job creation form, as a dashboard setting, the one time you set it up. If you ever want to change the schedule later, you go back into that same dashboard field and edit it — no redeploy of your code required, since the schedule was never part of the code to begin with.

middleware protects HTTP routes. Your cleanup script isn't an HTTP route — it's a standalone process Render invokes directly. Different category of thing entirely, so the question "where does middleware go" doesn't apply here at all. You're set to just configure the Render Cron Job with node scripts/cleanup.js as the command, no further wiring needed in your Express app.

Q: Why a standalone script instead of an in-process scheduler like node-cron?
Decoupling — if the cleanup job ever hangs, throws, or has a bug, it can't take down or block the main API process, since it runs as a completely separate process, invoked and torn down by Render's own infrastructure on schedule.
 */
cleanupExpiredTokens()
    .then(() => process.exit(0)) // 0 = success, script terminates successfully
    .catch((err) => {
        console.error(err);
        process.exit(1); // 1 = failure
    });