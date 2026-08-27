/**
 * Seed Demo MSBSHSE Class 12 Physics & Chemistry chapters, topics, and minimal
 * verified MCQs so Create Test Paper → Chapter Selection works (mirrors Math).
 *
 * IDs (existing catalog):
 *   board 50001, Class 12 50002, Physics 50004, Chem 50005, English medium 50001
 *
 * Idempotent: skips chapters that already exist for subject+standard+seq.
 *
 * Usage: node scripts/seed-demo-physics-chem.js
 */
require('dotenv').config();
const { PrismaClient } = require('../dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const BOARD_ID = 50001;
const STANDARD_ID = 50002;
const PHYSICS_ID = 50004;
const CHEM_ID = 50005;
const MEDIUM_ID = 50001;
const MCQ_TYPE_ID = 1;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PHYSICS_CHAPTERS = [
  {
    seq: 1,
    name: 'Electric Charges and Fields',
    topics: ['Coulomb’s Law', 'Electric Field'],
    question: {
      text: 'What is the SI unit of electric charge?',
      options: [
        { text: 'Coulomb', correct: true },
        { text: 'Volt', correct: false },
        { text: 'Ampere', correct: false },
        { text: 'Ohm', correct: false },
      ],
    },
  },
  {
    seq: 2,
    name: 'Electrostatic Potential and Capacitance',
    topics: ['Potential Difference', 'Capacitors'],
    question: {
      text: 'Capacitance of a parallel plate capacitor increases when:',
      options: [
        { text: 'Plate area increases', correct: true },
        { text: 'Plate separation increases', correct: false },
        { text: 'Charge decreases', correct: false },
        { text: 'Voltage becomes zero', correct: false },
      ],
    },
  },
  {
    seq: 3,
    name: 'Current Electricity',
    topics: ['Ohm’s Law', 'Kirchhoff’s Laws'],
    question: {
      text: 'Ohm’s law relates which quantities?',
      options: [
        { text: 'Voltage, current and resistance', correct: true },
        { text: 'Force and acceleration', correct: false },
        { text: 'Mass and energy', correct: false },
        { text: 'Charge and mass', correct: false },
      ],
    },
  },
  {
    seq: 4,
    name: 'Moving Charges and Magnetism',
    topics: ['Magnetic Field', 'Lorentz Force'],
    question: {
      text: 'A charged particle moving parallel to a uniform magnetic field experiences:',
      options: [
        { text: 'Zero magnetic force', correct: true },
        { text: 'Maximum magnetic force', correct: false },
        { text: 'Only electric force', correct: false },
        { text: 'Centripetal force always', correct: false },
      ],
    },
  },
];

const CHEM_CHAPTERS = [
  {
    seq: 1,
    name: 'Solid State',
    topics: ['Crystal Lattices', 'Unit Cells'],
    question: {
      text: 'Which of the following is an amorphous solid?',
      options: [
        { text: 'Glass', correct: true },
        { text: 'NaCl', correct: false },
        { text: 'Diamond', correct: false },
        { text: 'Quartz', correct: false },
      ],
    },
  },
  {
    seq: 2,
    name: 'Solutions',
    topics: ['Concentration Terms', 'Colligative Properties'],
    question: {
      text: 'Molarity is defined as:',
      options: [
        { text: 'Moles of solute per litre of solution', correct: true },
        { text: 'Moles of solute per kg of solvent', correct: false },
        { text: 'Grams of solute per litre', correct: false },
        { text: 'Volume of solute per litre', correct: false },
      ],
    },
  },
  {
    seq: 3,
    name: 'Electrochemistry',
    topics: ['Galvanic Cells', 'Nernst Equation'],
    question: {
      text: 'In a galvanic cell, oxidation occurs at the:',
      options: [
        { text: 'Anode', correct: true },
        { text: 'Cathode', correct: false },
        { text: 'Salt bridge', correct: false },
        { text: 'Voltmeter', correct: false },
      ],
    },
  },
  {
    seq: 4,
    name: 'Chemical Kinetics',
    topics: ['Rate of Reaction', 'Order of Reaction'],
    question: {
      text: 'Unit of first-order rate constant is:',
      options: [
        { text: 's⁻¹', correct: true },
        { text: 'mol L⁻¹ s⁻¹', correct: false },
        { text: 'L mol⁻¹ s⁻¹', correct: false },
        { text: 'mol s⁻¹', correct: false },
      ],
    },
  },
];

async function ensureChapter(subjectId, def) {
  let chapter = await prisma.chapter.findFirst({
    where: {
      subject_id: subjectId,
      standard_id: STANDARD_ID,
      sequential_chapter_number: def.seq,
    },
  });
  if (!chapter) {
    chapter = await prisma.chapter.create({
      data: {
        name: def.name,
        sequential_chapter_number: def.seq,
        subject_id: subjectId,
        standard_id: STANDARD_ID,
      },
    });
    console.log(`  + Chapter ${def.seq}: ${def.name}`);
  } else {
    console.log(`  = Chapter ${def.seq} exists: ${chapter.name}`);
  }

  const topics = [];
  for (let i = 0; i < def.topics.length; i++) {
    let topic = await prisma.topic.findFirst({
      where: { chapter_id: chapter.id, sequential_topic_number: i + 1 },
    });
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          chapter_id: chapter.id,
          sequential_topic_number: i + 1,
          name: def.topics[i],
        },
      });
    }
    topics.push(topic);
  }
  return { chapter, topic: topics[0], def };
}

async function ensureMcq(topicId, q) {
  const existing = await prisma.question_Text.findFirst({
    where: { question_text: q.text },
  });
  if (existing) {
    console.log(`    = MCQ exists: ${q.text.slice(0, 50)}…`);
    return;
  }

  const question = await prisma.question.create({
    data: {
      question_type_id: MCQ_TYPE_ID,
      board_question: true,
    },
  });
  const qt = await prisma.question_Text.create({
    data: {
      question_id: question.id,
      question_text: q.text,
    },
  });
  for (const opt of q.options) {
    await prisma.mcq_Option.create({
      data: {
        question_text_id: qt.id,
        option_text: opt.text,
        is_correct: opt.correct,
      },
    });
  }
  const qTopic = await prisma.question_Topic.create({
    data: { question_id: question.id, topic_id: topicId },
  });
  await prisma.question_Text_Topic_Medium.create({
    data: {
      question_text_id: qt.id,
      question_topic_id: qTopic.id,
      instruction_medium_id: MEDIUM_ID,
      is_verified: true,
      translation_status: 'original',
    },
  });
  console.log(`    + MCQ: ${q.text.slice(0, 50)}…`);
}

async function linkSyllabusNodes(subjectId, subjectName) {
  // Board exam body for Demo MSBSHSE (migrated from board 50001)
  const body = await prisma.exam_Body.findFirst({
    where: { OR: [{ abbreviation: 'DEMO-MSBSHSE' }, { name: { contains: 'Demo Maharashtra' } }] },
  });
  if (!body) {
    console.log('  ! No Demo board exam body — skip syllabus sync (optional)');
    return;
  }
  const program = await prisma.exam_Program.findFirst({
    where: { exam_body_id: body.id },
  });
  if (!program) return;

  let subjectNode = await prisma.syllabus_Node.findFirst({
    where: {
      exam_program_id: program.id,
      node_type: 'SUBJECT',
      legacy_subject_id: subjectId,
    },
  });
  if (!subjectNode) {
    subjectNode = await prisma.syllabus_Node.findFirst({
      where: { exam_program_id: program.id, node_type: 'SUBJECT', name: subjectName },
    });
  }
  if (!subjectNode) {
    subjectNode = await prisma.syllabus_Node.create({
      data: {
        exam_program_id: program.id,
        name: subjectName,
        node_type: 'SUBJECT',
        sequence_number: subjectId === PHYSICS_ID ? 2 : 3,
        legacy_subject_id: subjectId,
      },
    });
  }

  const chapters = await prisma.chapter.findMany({
    where: { subject_id: subjectId, standard_id: STANDARD_ID },
    include: { topics: true },
    orderBy: { sequential_chapter_number: 'asc' },
  });
  for (const ch of chapters) {
    let chNode = await prisma.syllabus_Node.findFirst({
      where: {
        exam_program_id: program.id,
        parent_id: subjectNode.id,
        node_type: 'CHAPTER',
        legacy_chapter_id: ch.id,
      },
    });
    if (!chNode) {
      chNode = await prisma.syllabus_Node.create({
        data: {
          exam_program_id: program.id,
          parent_id: subjectNode.id,
          name: ch.name,
          node_type: 'CHAPTER',
          sequence_number: ch.sequential_chapter_number,
          legacy_subject_id: subjectId,
          legacy_chapter_id: ch.id,
        },
      });
    }
    for (const t of ch.topics) {
      const exists = await prisma.syllabus_Node.findFirst({
        where: {
          exam_program_id: program.id,
          parent_id: chNode.id,
          node_type: 'TOPIC',
          legacy_topic_id: t.id,
        },
      });
      if (!exists) {
        await prisma.syllabus_Node.create({
          data: {
            exam_program_id: program.id,
            parent_id: chNode.id,
            name: t.name,
            node_type: 'TOPIC',
            sequence_number: t.sequential_topic_number,
            legacy_subject_id: subjectId,
            legacy_chapter_id: ch.id,
            legacy_topic_id: t.id,
          },
        });
      }
    }
  }
  console.log(`  ✔ Syllabus nodes synced for ${subjectName}`);
}

async function seedSubject(subjectId, subjectName, defs) {
  console.log(`\n=== ${subjectName} ===`);
  const board = await prisma.board.findUnique({ where: { id: BOARD_ID } });
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!board || !subject) {
    throw new Error(`Missing board ${BOARD_ID} or subject ${subjectId}`);
  }

  for (const def of defs) {
    const { topic } = await ensureChapter(subjectId, def);
    await ensureMcq(topic.id, def.question);
  }
  await linkSyllabusNodes(subjectId, subjectName);
}

async function main() {
  console.log('Seed Demo Physics / Chemistry (board 50001, Class 12)…');
  await seedSubject(PHYSICS_ID, 'Physics', PHYSICS_CHAPTERS);
  await seedSubject(CHEM_ID, 'Chemistry', CHEM_CHAPTERS);

  const phys = await prisma.chapter.count({
    where: { subject_id: PHYSICS_ID, standard_id: STANDARD_ID },
  });
  const chem = await prisma.chapter.count({
    where: { subject_id: CHEM_ID, standard_id: STANDARD_ID },
  });
  console.log(`\nDone. Physics chapters=${phys}, Chemistry chapters=${chem}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
