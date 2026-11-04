// Run from Backend/:  node scripts/syncCodingNow.js
// Runs the real sync job once for every linked account (no queue, no worker) and prints what happens.
import "dotenv/config";
import { prisma } from "../src/config/coding.prisma.js";
import { syncAccount } from "../src/services/codingProfiles/sync/codingSync.service.js";

const accounts = await prisma.codingAccount.findMany({
  select: { id: true, platform: true, handle: true },
});
console.log(`Found ${accounts.length} linked account(s)`);

for (const account of accounts) {
  console.log(`\n--- ${account.platform} / ${account.handle}`);
  try {
    console.log("result:", await syncAccount(account.id));
  } catch (error) {
    console.error("FAILED:", error);
  }

  const row = await prisma.codingAccount.findUnique({
    where: { id: account.id },
    select: {
      syncStatus: true,
      lastError: true,
      problemsSolved: true,
      contestsAttended: true,
      currentRating: true,
      lastSyncedAt: true,
    },
  });
  console.log("database row:", row);
}

await prisma.$disconnect();
process.exit(0);