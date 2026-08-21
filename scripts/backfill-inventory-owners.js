#!/usr/bin/env node
/**
 * Report (and optionally repair) inventories that have no owner.
 *
 * Why these exist: POST /api/inventories used to create Inventory rows without
 * setting userId or companyId. Nothing recorded who submitted them. Now that
 * list and detail queries are scoped to the caller, those rows are visible only
 * to platform admins.
 *
 * Ownership cannot be inferred from the data, so this script never guesses.
 * By default it only reports. Pass --assign-to=<email> to attribute the
 * orphans to a specific existing user, and --commit to actually write.
 *
 *   node scripts/backfill-inventory-owners.js
 *   node scripts/backfill-inventory-owners.js --assign-to=ops@example.com
 *   node scripts/backfill-inventory-owners.js --assign-to=ops@example.com --commit
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = { assignTo: null, commit: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--commit') args.commit = true;
    else if (arg.startsWith('--assign-to=')) args.assignTo = arg.slice('--assign-to='.length);
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return args;
}

async function main() {
  const { assignTo, commit } = parseArgs(process.argv);

  const orphans = await prisma.inventory.findMany({
    where: { userId: null },
    select: {
      id: true,
      title: true,
      createdAt: true,
      companyId: true,
      salesUserId: true,
      assignedSalesRepId: true,
      _count: { select: { items: true, photos: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (orphans.length === 0) {
    console.log('No inventories are missing an owner. Nothing to do.');
    return;
  }

  console.log(`Found ${orphans.length} inventor${orphans.length === 1 ? 'y' : 'ies'} with no userId:\n`);
  for (const inv of orphans) {
    const hints = [
      inv.salesUserId ? `salesUserId=${inv.salesUserId}` : null,
      inv.assignedSalesRepId ? `assignedSalesRepId=${inv.assignedSalesRepId}` : null,
      inv.companyId ? `companyId=${inv.companyId}` : null,
    ].filter(Boolean);

    console.log(
      `  ${inv.id}  ${inv.createdAt.toISOString().slice(0, 10)}  ` +
      `${inv._count.items} items, ${inv._count.photos} photos  ` +
      `"${inv.title}"${hints.length ? `  [${hints.join(', ')}]` : ''}`
    );
  }

  // Rows that already name a sales user or company can be attributed with
  // confidence; the rest genuinely have no signal.
  const attributable = orphans.filter((o) => o.salesUserId || o.assignedSalesRepId);
  if (attributable.length) {
    console.log(
      `\n${attributable.length} of these reference a sales user and could be ` +
      `attributed to that rep's customer instead - review them individually.`
    );
  }

  if (!assignTo) {
    console.log(
      '\nReporting only. Re-run with --assign-to=<email> to choose an owner, ' +
      'then add --commit to write.'
    );
    return;
  }

  const owner = await prisma.user.findUnique({
    where: { email: assignTo },
    select: { id: true, email: true, companyId: true, role: true },
  });

  if (!owner) {
    console.error(`\nNo user found with email ${assignTo}. Aborting without changes.`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nWould assign all ${orphans.length} orphaned inventories to ` +
    `${owner.email} (id=${owner.id}, role=${owner.role})` +
    `${owner.companyId ? `, companyId=${owner.companyId}` : ''}.`
  );

  if (!commit) {
    console.log('Dry run - no changes written. Add --commit to apply.');
    return;
  }

  const result = await prisma.inventory.updateMany({
    where: { userId: null },
    data: { userId: owner.id },
  });

  console.log(`Updated ${result.count} inventories.`);

  if (owner.companyId) {
    const companyResult = await prisma.inventory.updateMany({
      where: { userId: owner.id, companyId: null },
      data: { companyId: owner.companyId },
    });
    console.log(`Set companyId on ${companyResult.count} of them.`);
  }
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
