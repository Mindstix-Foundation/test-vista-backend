/**
 * Delete Phase6 / competitive-mock placeholder questions tagged under UPSC CSAT,
 * plus orphan theme chapters previously created under Comprehension.
 *
 * Does NOT delete real CSAT PYQ seed rows ([CSAT PYQ Seed]).
 *
 * Usage:
 *   node scripts/cleanup-upsc-csat-dummy-questions.js
 *   CONFIRM_DELETE=1 node scripts/cleanup-upsc-csat-dummy-questions.js
 */
require('dotenv').config();
const { PrismaClient } = require('../dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const CONFIRM = process.env.CONFIRM_DELETE === '1';
const DUMMY_MARKERS = ['[Phase6 Mock Seed]', '[Phase6'];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function collectSubtreeIds(rootIds) {
  const ids = [...rootIds];
  let frontier = [...rootIds];
  while (frontier.length) {
    const children = await prisma.syllabus_Node.findMany({
      where: { parent_id: { in: frontier } },
      select: { id: true },
    });
    frontier = children.map((c) => c.id);
    ids.push(...frontier);
  }
  return ids;
}

async function main() {
  const program = await prisma.exam_Program.findFirst({ where: { code: 'UPSC_CSE' } });
  if (!program) throw new Error('UPSC_CSE program not found');

  const stage = await prisma.exam_Stage.findFirst({
    where: { exam_program_id: program.id, name: { contains: 'CSAT', mode: 'insensitive' } },
  });
  if (!stage) throw new Error('CSAT stage not found');

  const sections = await prisma.syllabus_Node.findMany({
    where: {
      exam_program_id: program.id,
      exam_stage_id: stage.id,
      parent_id: null,
    },
    select: { id: true, name: true },
  });
  const nodeIds = await collectSubtreeIds(sections.map((s) => s.id));

  const links = await prisma.question_Syllabus_Node.findMany({
    where: { syllabus_node_id: { in: nodeIds } },
    include: {
      question: {
        select: {
          id: true,
          question_group_id: true,
          question_texts: { select: { question_text: true }, take: 1 },
        },
      },
    },
  });

  const dummyIds = new Set();
  for (const link of links) {
    const text = link.question.question_texts[0]?.question_text || '';
    if (DUMMY_MARKERS.some((m) => text.includes(m))) {
      dummyIds.add(link.question.id);
    }
  }

  console.log(`CSAT syllabus nodes: ${nodeIds.length}`);
  console.log(`Dummy Phase6 questions linked under CSAT: ${dummyIds.size}`);

  // Orphan theme chapters under Comprehension (created by old seed helper).
  const comprehension = sections.find((s) => /comprehension/i.test(s.name));
  let orphanChapters = [];
  if (comprehension) {
    orphanChapters = await prisma.syllabus_Node.findMany({
      where: {
        parent_id: comprehension.id,
        node_type: 'CHAPTER',
        OR: [
          { name: { contains: 'Reading Comprehension', mode: 'insensitive' } },
          { name: { contains: 'Logical Reasoning & Analytical', mode: 'insensitive' } },
          { name: { contains: 'Quantitative Aptitude', mode: 'insensitive' } },
          { name: { contains: 'Mathematical Reasoning', mode: 'insensitive' } },
        ],
      },
    });
  }
  console.log(`Orphan theme chapters under Comprehension: ${orphanChapters.length}`);
  for (const c of orphanChapters) console.log(`  [${c.id}] ${c.name}`);

  if (!CONFIRM) {
    console.log('\nDry preview only. Re-run with CONFIRM_DELETE=1 to delete.');
    return;
  }

  if (dummyIds.size) {
    const ids = [...dummyIds];
    // Delete questions; cascades remove texts/options/links. Groups only if orphaned.
    const deleted = await prisma.question.deleteMany({ where: { id: { in: ids } } });
    console.log(`Deleted dummy questions: ${deleted.count}`);
  }

  for (const chapter of orphanChapters) {
    const childTopics = await prisma.syllabus_Node.findMany({
      where: { parent_id: chapter.id },
      select: { id: true },
    });
    const topicIds = childTopics.map((t) => t.id);
    const stillLinked = await prisma.question_Syllabus_Node.count({
      where: { syllabus_node_id: { in: [chapter.id, ...topicIds] } },
    });
    if (stillLinked > 0) {
      console.warn(`  skip chapter ${chapter.id} — still has ${stillLinked} question link(s)`);
      continue;
    }
    if (topicIds.length) {
      await prisma.syllabus_Node.deleteMany({ where: { id: { in: topicIds } } });
    }
    await prisma.syllabus_Node.delete({ where: { id: chapter.id } });
    console.log(`  deleted orphan chapter [${chapter.id}] ${chapter.name}`);
  }

  console.log('\nCleanup complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
