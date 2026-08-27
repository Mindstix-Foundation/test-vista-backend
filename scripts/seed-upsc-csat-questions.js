/**
 * Seed real UPSC CSAT (Paper II) MCQs from data/CSAT_Questions.xlsx.
 *
 * - Idempotent via Question_Group.external_key / question text marker + external year/serial.
 * - Builds passage groups (2+ linked MCQs) when a Passage row is followed by
 *   "above/the passage" follow-ups.
 * - Years 2023 and 2024 are skipped by default because many rows reference a
 *   missing passage. Set CSAT_INCLUDE_INCOMPLETE=1 after providing corrected data.
 *
 * Usage:
 *   node scripts/seed-upsc-csat-questions.js
 *   CSAT_XLSX_PATH=/path/to/file.xlsx node scripts/seed-upsc-csat-questions.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ZipFile } = require('./_xlsx-reader');
// Prefer compiled CJS client used by other seed scripts; fall back to src if present.
let PrismaClient;
try {
  ({ PrismaClient } = require('../dist/generated/prisma/client'));
} catch {
  ({ PrismaClient } = require('../src/generated/prisma/client'));
}
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const MCQ = 'Multiple Choice Question (MCQ)';
const MARKER = '[CSAT PYQ Seed]';
const INCOMPLETE_YEARS = new Set(['2023', '2024']);
const INCLUDE_INCOMPLETE = process.env.CSAT_INCLUDE_INCOMPLETE === '1';
const DRY_RUN = process.env.CSAT_DRY_RUN === '1';

const DEFAULT_XLSX = path.resolve(
  __dirname,
  '../../../data/CSAT_Questions.xlsx',
);
const XLSX_PATH = process.env.CSAT_XLSX_PATH || DEFAULT_XLSX;

const THEME_TO_SECTION = {
  1: 'Comprehension',
  2: 'Logical Reasoning and Analytical Ability',
  3: 'Basic Numeracy and Data Interpretation',
  4: 'General Mental Ability',
};

/**
 * Official UPSC CSAT Paper II areas (notification):
 * Comprehension, Interpersonal Skills, Logical Reasoning,
 * Decision Making, General Mental Ability, Basic Numeracy & DI.
 *
 * Workbook Segregation themes map to the four areas that appear in PYQs.
 * Interpersonal Skills / Decision Making stay empty for these years
 * (rarely tested as standalone modern CSAT items).
 */

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseAnswerLetter(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  const m = s.match(/^\(?([a-d])\)?/);
  return m ? m[1] : null;
}

function looksLikePassageStart(text) {
  const t = String(text || '').trim();
  return /^(passage(\s*[-–]?\s*\d+)?\s*[:.]|\bpassage\s+\d+\s*[:.]|passage\s*\(\s*continued)/i.test(t);
}

function looksLikePassageContinued(text) {
  return /\bpassage\b.+\(continued\)/i.test(String(text || '')) ||
    /^passage\s*\d*\s*\(continued\)/i.test(String(text || '').trim());
}

function looksLikeSyllogism(text) {
  const t = String(text || '');
  const categorical =
    t.match(/\b(?:all|some|no|every)\s+\w+\s+(?:are|is)\s+\w+/gi) || [];
  return (
    /\bconclusion-?\s*[ivx\d]/i.test(t) ||
    /\bstatement\s*:\s*some\b/i.test(t) ||
    categorical.length >= 2
  );
}

function looksLikeQuantPuzzle(text) {
  const t = String(text || '');
  if (/\bpassage\b/i.test(t)) return false;
  return (
    /[₹]/.test(t) ||
    /\bhow many (times|words|ways|persons)\b/i.test(t) ||
    /\bsit around\b/i.test(t) ||
    /\bjumps? (forward|backward)\b/i.test(t) ||
    /\balloy\b/i.test(t) ||
    /\bsequence of numbers\b/i.test(t) ||
    /\btwo-digit\b/i.test(t) ||
    /\bdigits?\b.+\brevers/i.test(t) ||
    /\b(ranked|rank of)\b/i.test(t) ||
    /\bpersons?\s+[A-Z](?:\s*,\s*[A-Z])+/i.test(t) ||
    /\bP,\s*Q,\s*R\b/.test(t) ||
    /\bexplosion takes place\b/i.test(t) ||
    /\bpattern formed by two characters\b/i.test(t) ||
    /\bthere are two classes\b/i.test(t) ||
    /\bin a group of \d+ persons\b/i.test(t) ||
    /\bsolid cube\b/i.test(t) ||
    /\bpainted\b.+\bfaces\b/i.test(t) ||
    /\bif\s+\d+\s*\*/i.test(t) ||
    /\bequal to\b/i.test(t) ||
    /\bremainder\b/i.test(t) ||
    /\bdivisible by\b/i.test(t)
  );
}

function looksLikeRcFollowUp(text) {
  const t = String(text || '');
  if (!t.trim()) return false;
  if (looksLikePassageStart(t) && !looksLikePassageContinued(t)) return false;
  if (looksLikePassageContinued(t)) return true;
  if (looksLikeSyllogism(t) || looksLikeQuantPuzzle(t)) return false;
  if (/\bpassage\b/i.test(t)) return true;
  if (/\bwith reference to\b/i.test(t)) return true;
  if (/\b(inferred|inferences?|intent of the writer|crux of the|most logical|corollary)\b/i.test(t)) {
    return true;
  }
  if (/\bthe following assumptions have been made\b/i.test(t)) return true;
  if (/\b(assumptions?|conclusions?)\b/i.test(t) && /\b(valid|made|drawn)\b/i.test(t) && /\bpassage\b/i.test(t)) {
    return true;
  }
  // CSAT RC items often omit the word "passage" on intermediate items.
  if (/\bwhich (one )?of the following\b/i.test(t)) return true;
  if (/\bselect the answer using the code given below\b/i.test(t)) return true;
  // Follow-up stems that continue a passage without saying "passage".
  if (/\bconsider the following statements\b/i.test(t)) return true;
  return false;
}

function looksLikeNonRcBreak(text) {
  const t = String(text || '');
  if (looksLikePassageStart(t) && !looksLikePassageContinued(t)) return true;
  if (/\bpassage\b/i.test(t)) return false;
  return looksLikeSyllogism(t) || looksLikeQuantPuzzle(t);
}

function extractPassageAndStem(text) {
  const raw = String(text || '').trim();
  if (!looksLikePassageStart(raw) && !looksLikePassageContinued(raw)) {
    return { passage: null, stem: raw };
  }
  // Split on "Question N:" or first trailing question cue after the passage body.
  const qMatch = raw.match(/\bQuestion\s*\d*\s*[:.]?\s*/i);
  if (qMatch && qMatch.index != null && qMatch.index > 20) {
    return {
      passage: raw.slice(0, qMatch.index).trim(),
      stem: raw.slice(qMatch.index + qMatch[0].length).trim() || raw,
    };
  }
  const stemMatchers = [
    /\bWhich of the following\b/i,
    /\bWith reference to\b/i,
    /\bWhich one of the following\b/i,
  ];
  for (const re of stemMatchers) {
    const m = raw.match(re);
    if (m && m.index != null && m.index > 40) {
      return {
        passage: raw.slice(0, m.index).trim(),
        stem: raw.slice(m.index).trim(),
      };
    }
  }
  return { passage: raw, stem: raw };
}

function parseSegregation(sheetRows) {
  // Returns Map year -> Map serial -> themeIndex (1..4)
  // First theme wins when ranges overlap (e.g. 2026 Theme1 39–40 vs Theme3 37–43).
  const map = new Map();
  let currentYear = null;
  for (const row of sheetRows) {
    const a = String(row.A || '').trim();
    const b = String(row.B || '').trim();
    if (/^\d{4}$/.test(a)) {
      currentYear = a;
      if (!map.has(currentYear)) map.set(currentYear, new Map());
      continue;
    }
    if (!currentYear || !/^Theme\s*(\d)/i.test(a)) continue;
    const themeNum = Number(RegExp.$1);
    const yearMap = map.get(currentYear);
    const ranges = b.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    for (const token of ranges) {
      const m = token.match(/^(\d+)\s*[–-]\s*(\d+)$/);
      if (m) {
        const from = Number(m[1]);
        const to = Number(m[2]);
        for (let n = from; n <= to; n++) {
          if (!yearMap.has(n)) yearMap.set(n, themeNum);
        }
      } else if (/^\d+$/.test(token)) {
        const n = Number(token);
        if (!yearMap.has(n)) yearMap.set(n, themeNum);
      }
    }
  }
  return map;
}

function buildGroups(rows) {
  // rows: [{serial, text, options, answer, rowIndex}]
  const units = [];
  let i = 0;
  while (i < rows.length) {
    const row = rows[i];
    if (looksLikePassageStart(row.text) || looksLikePassageContinued(row.text)) {
      const { passage, stem } = extractPassageAndStem(row.text);
      const linked = [{ ...row, text: stem || row.text, isAnchor: true }];
      let sharedPassage = passage || row.text;
      let j = i + 1;
      while (j < rows.length) {
        const next = rows[j];
        if (looksLikeNonRcBreak(next.text)) break;
        if (looksLikePassageStart(next.text) && !looksLikePassageContinued(next.text)) break;
        if (looksLikeRcFollowUp(next.text) || looksLikePassageContinued(next.text)) {
          const extracted = extractPassageAndStem(next.text);
          if (looksLikePassageContinued(next.text) && extracted.passage) {
            // Append continued passage body, keep stem as the question.
            sharedPassage = `${sharedPassage}\n\n${extracted.passage}`.trim();
            linked.push({
              ...next,
              text: extracted.stem !== extracted.passage ? extracted.stem : next.text,
              isAnchor: false,
            });
          } else {
            linked.push({ ...next, text: next.text, isAnchor: false });
          }
          j++;
          continue;
        }
        break;
      }
      if (linked.length >= 2 && sharedPassage) {
        units.push({ kind: 'group', passage: sharedPassage, children: linked });
        i = j;
        continue;
      }
      // Single MCQ that embeds its own passage text.
      units.push({
        kind: 'single',
        row: {
          ...row,
          text: passage && stem && stem !== passage ? `${passage}\n\n${stem}` : row.text,
        },
      });
      i++;
      continue;
    }
    units.push({ kind: 'single', row });
    i++;
  }
  return units;
}

/**
 * Resolve existing official CSAT TOPIC nodes (section → chapter → topic).
 * Does not create new syllabus nodes.
 */
async function resolveOfficialTopicNodes(programId, stageId) {
  const sections = await prisma.syllabus_Node.findMany({
    where: {
      exam_program_id: programId,
      exam_stage_id: stageId,
      parent_id: null,
      node_type: 'SECTION',
    },
    orderBy: { sequence_number: 'asc' },
  });
  if (!sections.length) {
    throw new Error('No CSAT SECTION nodes found — seed the UPSC syllabus catalog first');
  }

  const themeToTopic = new Map();
  for (const [themeNum, sectionName] of Object.entries(THEME_TO_SECTION)) {
    const section = sections.find(
      (s) => s.name.toLowerCase() === sectionName.toLowerCase(),
    );
    if (!section) {
      throw new Error(`CSAT section not found: ${sectionName}`);
    }

    // Prefer TOPIC under matching chapter; fall back to any TOPIC under the section tree.
    const chapters = await prisma.syllabus_Node.findMany({
      where: {
        exam_program_id: programId,
        exam_stage_id: stageId,
        parent_id: section.id,
        node_type: 'CHAPTER',
      },
    });
    let topic = null;
    for (const chapter of chapters) {
      // Prefer chapter with the same name as the section (your current simplified tree).
      if (chapter.name.toLowerCase() !== section.name.toLowerCase() && chapters.length > 1) {
        // Skip orphan theme chapters previously created under Comprehension.
        if (/reading comprehension|quantitative aptitude|mathematical reasoning/i.test(chapter.name)) {
          continue;
        }
      }
      topic = await prisma.syllabus_Node.findFirst({
        where: {
          exam_program_id: programId,
          exam_stage_id: stageId,
          parent_id: chapter.id,
          node_type: 'TOPIC',
        },
        orderBy: { sequence_number: 'asc' },
      });
      if (topic && chapter.name.toLowerCase() === section.name.toLowerCase()) break;
    }
    if (!topic) {
      throw new Error(`CSAT TOPIC node missing under section: ${sectionName}`);
    }
    themeToTopic.set(Number(themeNum), topic);
    console.log(
      `  Theme ${themeNum} → TOPIC [${topic.id}] ${section.name} > … > ${topic.name}`,
    );
  }

  // Default fallback: Comprehension topic
  const defaultTopic = themeToTopic.get(1);
  return { themeToTopic, defaultTopicId: defaultTopic.id, sections };
}

async function createSingleMcq({ text, options, answer, typeId, nodeId, externalKey }) {
  const existingLink = await prisma.question.findFirst({
    where: {
      question_texts: { some: { question_text: { startsWith: `${MARKER} ${externalKey}` } } },
    },
    select: { id: true },
  });
  if (existingLink) return { id: existingLink.id, created: false };

  const letter = parseAnswerLetter(answer);
  const correctIndex = letter ? letter.charCodeAt(0) - 97 : 0;
  const q = await prisma.question.create({
    data: {
      question_type_id: typeId,
      board_question: true,
      question_texts: {
        create: {
          question_text: `${MARKER} ${externalKey}\n${text}`,
          mcq_options: {
            create: options.map((opt, idx) => ({
              option_text: opt,
              is_correct: idx === correctIndex,
            })),
          },
        },
      },
      syllabus_node_links: { create: { syllabus_node_id: nodeId } },
    },
  });
  return { id: q.id, created: true };
}

async function createPassageGroup({
  passage,
  children,
  typeId,
  nodeId,
  externalKey,
}) {
  const existing = await prisma.question_Group.findUnique({
    where: { external_key: externalKey },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  const group = await prisma.$transaction(async (tx) => {
    const g = await tx.question_Group.create({
      data: {
        group_kind: 'PASSAGE_MCQ',
        passage_text: passage,
        external_key: externalKey,
      },
    });
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const letter = parseAnswerLetter(child.answer);
      const correctIndex = letter ? letter.charCodeAt(0) - 97 : 0;
      const question = await tx.question.create({
        data: {
          question_type_id: typeId,
          board_question: true,
          question_group_id: g.id,
          group_order: i + 1,
        },
      });
      const qt = await tx.question_Text.create({
        data: {
          question_id: question.id,
          question_text: `${MARKER} ${externalKey}#${i + 1}\n${child.text}`,
        },
      });
      for (let idx = 0; idx < child.options.length; idx++) {
        await tx.mcq_Option.create({
          data: {
            question_text_id: qt.id,
            option_text: child.options[idx],
            is_correct: idx === correctIndex,
          },
        });
      }
      await tx.question_Syllabus_Node.create({
        data: { question_id: question.id, syllabus_node_id: nodeId },
      });
    }
    return g;
  });
  return { id: group.id, created: true };
}

async function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    throw new Error(`Workbook not found: ${XLSX_PATH}`);
  }

  const mcqType = await prisma.question_Type.findFirst({ where: { type_name: MCQ } });
  if (!mcqType) throw new Error('MCQ question type missing');

  const program = await prisma.exam_Program.findFirst({ where: { code: 'UPSC_CSE' } });
  if (!program) throw new Error('UPSC_CSE program not seeded — run migrate-to-option-c.js first');

  const stage = await prisma.exam_Stage.findFirst({
    where: { exam_program_id: program.id, name: { contains: 'CSAT', mode: 'insensitive' } },
  });
  if (!stage) throw new Error('UPSC CSAT stage not found');

  console.log('\nResolving official CSAT TOPIC nodes…');
  const { themeToTopic, defaultTopicId } = await resolveOfficialTopicNodes(program.id, stage.id);

  const xlsx = ZipFile.open(XLSX_PATH);
  const sheets = xlsx.sheetNames();
  const segregationSheet = sheets.find((s) => /segregation/i.test(s));
  const themeByYear = segregationSheet
    ? parseSegregation(xlsx.readSheetRows(segregationSheet))
    : new Map();
  if (!themeByYear.size) {
    throw new Error('Segregation sheet missing or empty — cannot map questions to topics');
  }

  // Write human-readable topic mapping report (no DB writes).
  const reportPath = path.resolve(__dirname, 'csat-topic-mapping-report.json');
  const report = {
    generated_at: new Date().toISOString(),
    mapping_rule: {
      theme_1: 'Comprehension (TOPIC under Comprehension section)',
      theme_2: 'Logical Reasoning and Analytical Ability',
      theme_3: 'Basic Numeracy and Data Interpretation',
      theme_4: 'General Mental Ability',
      note:
        'Source: workbook Segregation sheet, cross-checked against official UPSC CSAT Paper II syllabus areas. Interpersonal Skills and Decision Making have no PYQ ranges in Segregation for these years.',
    },
    topic_node_ids: Object.fromEntries(
      [...themeToTopic.entries()].map(([theme, node]) => [
        `theme_${theme}`,
        { id: node.id, name: node.name },
      ]),
    ),
    years: {},
  };
  for (const [year, serialMap] of themeByYear) {
    const byTopic = {};
    for (const [serial, theme] of serialMap) {
      const section = THEME_TO_SECTION[theme] || 'UNKNOWN';
      if (!byTopic[section]) byTopic[section] = [];
      byTopic[section].push(serial);
    }
    for (const key of Object.keys(byTopic)) byTopic[key].sort((a, b) => a - b);
    report.years[year] = byTopic;
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nWrote topic mapping report: ${reportPath}`);

  let createdQuestions = 0;
  let createdGroups = 0;
  let skipped = 0;
  const unmapped = [];

  for (const sheetName of sheets) {
    if (!/^\d{4}$/.test(sheetName)) continue;
    if (INCOMPLETE_YEARS.has(sheetName) && !INCLUDE_INCOMPLETE) {
      console.warn(`⚠ Skipping ${sheetName} (incomplete passages). Set CSAT_INCLUDE_INCOMPLETE=1 after fixing workbook.`);
      continue;
    }

    const rowsRaw = xlsx.readSheetRows(sheetName);
    const questions = [];
    const seenSerials = new Set();
    for (let r = 1; r < rowsRaw.length; r++) {
      const row = rowsRaw[r];
      const serialRaw = String(row.A || '').trim();
      const text = String(row.B || '').trim();
      if (!text) continue;
      let serial = serialRaw;
      if (!serial || seenSerials.has(`${sheetName}:${serial}`)) {
        serial = `${serialRaw || 'row'}-${r + 1}`;
      }
      seenSerials.add(`${sheetName}:${serial}`);
      const options = [row.C, row.D, row.E, row.F].map((x) => String(x || '').trim());
      if (options.some((o) => !o)) {
        console.warn(`  skip ${sheetName} serial ${serial}: missing options`);
        skipped++;
        continue;
      }
      questions.push({
        serial,
        text,
        options,
        answer: row.G,
        rowIndex: r + 1,
      });
    }

    const units = buildGroups(questions);
    const groupCount = units.filter((u) => u.kind === 'group').length;
    const groupChildren = units
      .filter((u) => u.kind === 'group')
      .reduce((sum, u) => sum + u.children.length, 0);
    console.log(
      `\n${sheetName}: ${questions.length} rows → ${units.length} units ` +
        `(${groupCount} passage groups / ${groupChildren} linked children)`,
    );

    const resolveNodeId = (serial) => {
      const serialNum = Number(String(serial).replace(/-.*/, ''));
      const theme = themeByYear.get(sheetName)?.get(serialNum);
      if (!theme) {
        unmapped.push(`${sheetName}#${serial}`);
        return defaultTopicId;
      }
      return themeToTopic.get(theme)?.id || defaultTopicId;
    };

    if (DRY_RUN) {
      createdGroups += groupCount;
      createdQuestions += units.reduce(
        (sum, u) => sum + (u.kind === 'group' ? u.children.length : 1),
        0,
      );
      // Validate every serial has a theme.
      for (const q of questions) {
        const serialNum = Number(String(q.serial).replace(/-.*/, ''));
        if (!themeByYear.get(sheetName)?.has(serialNum)) {
          unmapped.push(`${sheetName}#${q.serial}`);
        }
      }
      continue;
    }

    for (const unit of units) {
      if (unit.kind === 'group') {
        const firstSerial = unit.children[0].serial;
        const nodeId = resolveNodeId(firstSerial);
        const externalKey = `CSAT-${sheetName}-G-${firstSerial}`;
        const result = await createPassageGroup({
          passage: unit.passage,
          children: unit.children,
          typeId: mcqType.id,
          nodeId,
          externalKey,
        });
        if (result.created) {
          createdGroups++;
          createdQuestions += unit.children.length;
        } else {
          skipped += unit.children.length;
        }
      } else {
        const nodeId = resolveNodeId(unit.row.serial);
        const externalKey = `CSAT-${sheetName}-Q-${unit.row.serial}`;
        const result = await createSingleMcq({
          text: unit.row.text,
          options: unit.row.options,
          answer: unit.row.answer,
          typeId: mcqType.id,
          nodeId,
          externalKey,
        });
        if (result.created) createdQuestions++;
        else skipped++;
      }
    }
  }

  if (unmapped.length) {
    console.warn(`\n⚠ Unmapped serials (defaulted to Comprehension): ${unmapped.join(', ')}`);
  }

  console.log(DRY_RUN ? '\nDry run complete (no DB writes).' : '\nDone.');
  console.log(`  Created questions: ${createdQuestions}`);
  console.log(`  Created passage groups: ${createdGroups}`);
  console.log(`  Skipped (existing/incomplete/invalid): ${skipped}`);
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
