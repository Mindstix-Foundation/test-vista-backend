/**
 * Seeds MCQ (and a few NAT) questions tagged to competitive/entrance syllabus
 * nodes so Option C mock-test creation has a usable pool.
 *
 * Primary target: UPSC Prelims GS (100) + CSAT (80).
 * Also tops up other non-board programs to their largest single-section need.
 *
 * Idempotent: skips when a program already has enough tagged MCQs for its
 * hungriest template section.
 *
 * Run: node scripts/seed-competitive-mock-questions.js
 */
require('dotenv').config();
const { PrismaClient } = require('../dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MCQ = 'Multiple Choice Question (MCQ)';
const NAT = 'Numerical Answer Type (NAT)';
const MARKER = '[Phase6 Mock Seed]';

async function collectSubtree(rootId) {
  const ids = [rootId];
  let frontier = [rootId];
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

async function countTagged(typeId, nodeIds) {
  return prisma.question.count({
    where: {
      question_type_id: typeId,
      syllabus_node_links: { some: { syllabus_node_id: { in: nodeIds } } },
      question_texts: { some: {} },
    },
  });
}

async function leafNodesForStage(examProgramId, examStageId) {
  const roots = await prisma.syllabus_Node.findMany({
    where: {
      exam_program_id: examProgramId,
      parent_id: null,
      ...(examStageId ? { exam_stage_id: examStageId } : {}),
    },
    select: { id: true },
  });
  const allIds = [];
  for (const r of roots) {
    allIds.push(...(await collectSubtree(r.id)));
  }
  const nodes = await prisma.syllabus_Node.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name: true, node_type: true, parent_id: true },
  });
  const parentIds = new Set(nodes.filter((n) => n.parent_id).map((n) => n.parent_id));
  const leaves = nodes.filter((n) => !parentIds.has(n.id));
  return leaves.length ? leaves : nodes;
}

async function createMcq(text, nodeId, typeId) {
  const q = await prisma.question.create({
    data: {
      question_type_id: typeId,
      board_question: false,
      question_texts: {
        create: {
          question_text: text,
          mcq_options: {
            create: [
              { option_text: 'Option A', is_correct: true },
              { option_text: 'Option B', is_correct: false },
              { option_text: 'Option C', is_correct: false },
              { option_text: 'Option D', is_correct: false },
            ],
          },
        },
      },
      syllabus_node_links: {
        create: { syllabus_node_id: nodeId },
      },
    },
  });
  return q.id;
}

async function createNat(text, correctValue, nodeId, typeId) {
  const q = await prisma.question.create({
    data: {
      question_type_id: typeId,
      board_question: false,
      question_texts: {
        create: {
          question_text: text,
          mcq_options: {
            create: [{ option_text: String(correctValue), is_correct: true }],
          },
        },
      },
      syllabus_node_links: {
        create: { syllabus_node_id: nodeId },
      },
    },
  });
  return q.id;
}

async function ensurePool({ program, stage, section, format, need, mcqTypeId, natTypeId }) {
  const sectionNodeIds = section.syllabus_node_id
    ? await collectSubtree(section.syllabus_node_id)
    : (
        await (async () => {
          const roots = await prisma.syllabus_Node.findMany({
            where: {
              exam_program_id: program.id,
              parent_id: null,
              ...(stage?.id ? { exam_stage_id: stage.id } : {}),
            },
            select: { id: true },
          });
          const ids = [];
          for (const r of roots) ids.push(...(await collectSubtree(r.id)));
          return ids;
        })()
      );

  if (!sectionNodeIds.length) {
    console.warn(`  ⚠ No syllabus nodes for ${program.code} / ${section.name} — skip`);
    return;
  }

  const typeId = format === 'NUMERIC' ? natTypeId : mcqTypeId;
  const have = await countTagged(typeId, sectionNodeIds);
  const missing = need - have;
  if (missing <= 0) {
    console.log(`  ✔ ${program.code} "${section.name}" ${format}: have ${have}/${need}`);
    return;
  }

  const leaves = await leafNodesForStage(program.id, stage?.id ?? null);
  if (!leaves.length) {
    console.warn(`  ⚠ No leaf nodes for ${program.code} — skip`);
    return;
  }

  console.log(`  → Seeding ${missing} ${format} for ${program.code} "${section.name}"…`);
  for (let i = 0; i < missing; i++) {
    const leaf = leaves[i % leaves.length];
    if (format === 'NUMERIC') {
      const value = (i % 50) + 1;
      await createNat(
        `${MARKER} ${program.code} NAT #${have + i + 1} (${leaf.name}): what is ${value}?`,
        value,
        leaf.id,
        typeId,
      );
    } else {
      await createMcq(
        `${MARKER} ${program.code} MCQ #${have + i + 1} on ${leaf.name}. Choose the correct option.`,
        leaf.id,
        typeId,
      );
    }
  }
  console.log(`  ✔ Added ${missing} ${format} → ${program.code} "${section.name}"`);
}

async function main() {
  const mcqType = await prisma.question_Type.findFirst({ where: { type_name: MCQ } });
  const natType = await prisma.question_Type.findFirst({ where: { type_name: NAT } });
  if (!mcqType || !natType) {
    throw new Error('MCQ/NAT question types missing');
  }

  const templates = await prisma.paper_Template.findMany({
    where: {
      is_active: true,
      exam_program: { code: { not: { startsWith: 'BOARD_' } } },
    },
    include: {
      exam_program: true,
      exam_stage: true,
      sections: true,
    },
  });

  // Prefer smaller UPSC mock first in logs; process all sections by max need per (program,stage,format,node scope)
  const jobs = [];
  for (const t of templates) {
    for (const s of t.sections) {
      jobs.push({
        program: t.exam_program,
        stage: t.exam_stage,
        section: s,
        format: s.answer_format,
        need: s.total_questions,
      });
    }
  }

  // Deduplicate overlapping pools: keep the max need per program+stage+format+syllabus_node_id
  const keyOf = (j) =>
    `${j.program.id}|${j.stage?.id ?? 'none'}|${j.format}|${j.section.syllabus_node_id ?? 'all'}`;
  const best = new Map();
  for (const j of jobs) {
    const k = keyOf(j);
    const prev = best.get(k);
    if (!prev || j.need > prev.need) best.set(k, j);
  }

  console.log(`Seeding competitive mock pools (${best.size} unique pools)…`);
  for (const j of best.values()) {
    await ensurePool({
      ...j,
      mcqTypeId: mcqType.id,
      natTypeId: natType.id,
    });
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
