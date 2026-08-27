/**
 * Option C migration: seeds the exam-platform catalog and maps ALL legacy
 * data (boards, standards, subjects, chapters, topics, patterns, schools,
 * students, test papers) onto the new exam-first entities.
 *
 * Idempotent: safe to re-run. Never deletes or mutates legacy rows.
 *
 * Run: node scripts/migrate-to-option-c.js
 */
require('dotenv').config();
const { PrismaClient } = require('../dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// 1. Exam categories
// ---------------------------------------------------------------------------
async function seedCategories() {
  const categories = [
    { code: 'BOARD', name: 'School Board Exams', description: 'State/central school board exams (Class 1-12)' },
    { code: 'ENTRANCE', name: 'Entrance Exams', description: 'College/university entrance exams (CET, JEE, NEET)' },
    { code: 'COMPETITIVE', name: 'Competitive Exams', description: 'Government recruitment & civil services (UPSC, MPSC, Banking)' },
  ];
  const result = {};
  for (const c of categories) {
    result[c.code] = await prisma.exam_Category.upsert({
      where: { code: c.code },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }
  console.log('✔ Exam categories seeded');
  return result;
}

// ---------------------------------------------------------------------------
// 2. Competitive / entrance catalog (bodies, programs, stages, syllabus)
// ---------------------------------------------------------------------------
async function upsertBody(categoryId, name, abbreviation) {
  return prisma.exam_Body.upsert({
    where: { abbreviation },
    update: { name, exam_category_id: categoryId },
    create: { name, abbreviation, exam_category_id: categoryId },
  });
}

async function upsertProgram(bodyId, data) {
  return prisma.exam_Program.upsert({
    where: { code: data.code },
    update: { ...data, exam_body_id: bodyId },
    create: { ...data, exam_body_id: bodyId },
  });
}

async function upsertStage(programId, name, seq, extra = {}) {
  return prisma.exam_Stage.upsert({
    where: { exam_program_id_name: { exam_program_id: programId, name } },
    update: { sequence_number: seq, ...extra },
    create: { exam_program_id: programId, name, sequence_number: seq, ...extra },
  });
}

async function upsertSectionNodes(programId, stageId, names) {
  const nodes = [];
  for (let i = 0; i < names.length; i++) {
    const existing = await prisma.syllabus_Node.findFirst({
      where: { exam_program_id: programId, exam_stage_id: stageId, name: names[i], node_type: 'SECTION', parent_id: null },
    });
    nodes.push(
      existing ||
        (await prisma.syllabus_Node.create({
          data: { exam_program_id: programId, exam_stage_id: stageId, name: names[i], node_type: 'SECTION', sequence_number: i + 1 },
        })),
    );
  }
  return nodes;
}

async function seedCompetitiveCatalog(categories) {
  // ---- UPSC (primary focus) ----
  const upsc = await upsertBody(categories.COMPETITIVE.id, 'Union Public Service Commission', 'UPSC');
  const cse = await upsertProgram(upsc.id, {
    name: 'Civil Services Examination',
    code: 'UPSC_CSE',
    description: 'UPSC Civil Services Examination (IAS/IPS/IFS)',
    default_duration_minutes: 120,
    has_negative_marking: true,
    negative_marks_ratio: 1 / 3,
  });
  const gsStage = await upsertStage(cse.id, 'Prelims - GS Paper I', 1);
  const csatStage = await upsertStage(cse.id, 'Prelims - CSAT Paper II', 2, { is_qualifying: true, qualifying_pct: 33.0 });
  await upsertStage(cse.id, 'Mains', 3);
  await upsertSectionNodes(cse.id, gsStage.id, [
    'Current Events of National and International Importance',
    'History of India and Indian National Movement',
    'Indian and World Geography',
    'Indian Polity and Governance',
    'Economic and Social Development',
    'Environmental Ecology, Biodiversity and Climate Change',
    'General Science',
  ]);
  await upsertSectionNodes(cse.id, csatStage.id, [
    'Comprehension',
    'Interpersonal Skills and Communication',
    'Logical Reasoning and Analytical Ability',
    'Decision Making and Problem Solving',
    'General Mental Ability',
    'Basic Numeracy and Data Interpretation',
  ]);

  // ---- MPSC ----
  const mpsc = await upsertBody(categories.COMPETITIVE.id, 'Maharashtra Public Service Commission', 'MPSC');
  const rajyaseva = await upsertProgram(mpsc.id, {
    name: 'Rajyaseva (State Services)',
    code: 'MPSC_RAJYASEVA',
    default_duration_minutes: 120,
    has_negative_marking: true,
    negative_marks_ratio: 0.25,
  });
  const mpscPre = await upsertStage(rajyaseva.id, 'Prelims - GS Paper I', 1);
  await upsertStage(rajyaseva.id, 'Prelims - CSAT Paper II', 2, { is_qualifying: true, qualifying_pct: 33.0 });
  await upsertStage(rajyaseva.id, 'Mains', 3);
  await upsertSectionNodes(rajyaseva.id, mpscPre.id, [
    'Current Affairs (Maharashtra, National, International)',
    'History of India with Special Reference to Maharashtra',
    'Geography of Maharashtra, India and the World',
    'Indian Polity and Governance',
    'Economic and Social Development',
    'Environment and Ecology',
    'General Science',
  ]);

  // ---- Banking: IBPS & SBI ----
  const ibps = await upsertBody(categories.COMPETITIVE.id, 'Institute of Banking Personnel Selection', 'IBPS');
  const ibpsPo = await upsertProgram(ibps.id, {
    name: 'Probationary Officer (PO)',
    code: 'IBPS_PO',
    default_duration_minutes: 60,
    has_negative_marking: true,
    negative_marks_ratio: 0.25,
  });
  const ibpsPoPre = await upsertStage(ibpsPo.id, 'Prelims', 1);
  await upsertStage(ibpsPo.id, 'Mains', 2);
  await upsertSectionNodes(ibpsPo.id, ibpsPoPre.id, ['English Language', 'Quantitative Aptitude', 'Reasoning Ability']);
  const ibpsClerk = await upsertProgram(ibps.id, {
    name: 'Clerk',
    code: 'IBPS_CLERK',
    default_duration_minutes: 60,
    has_negative_marking: true,
    negative_marks_ratio: 0.25,
  });
  const ibpsClerkPre = await upsertStage(ibpsClerk.id, 'Prelims', 1);
  await upsertStage(ibpsClerk.id, 'Mains', 2);
  await upsertSectionNodes(ibpsClerk.id, ibpsClerkPre.id, ['English Language', 'Numerical Ability', 'Reasoning Ability']);

  const sbi = await upsertBody(categories.COMPETITIVE.id, 'State Bank of India', 'SBI');
  const sbiPo = await upsertProgram(sbi.id, {
    name: 'Probationary Officer (PO)',
    code: 'SBI_PO',
    default_duration_minutes: 60,
    has_negative_marking: true,
    negative_marks_ratio: 0.25,
  });
  const sbiPoPre = await upsertStage(sbiPo.id, 'Prelims', 1);
  await upsertStage(sbiPo.id, 'Mains', 2);
  await upsertSectionNodes(sbiPo.id, sbiPoPre.id, ['English Language', 'Quantitative Aptitude', 'Reasoning Ability']);

  // ---- NTA: JEE & NEET (entrance) ----
  const nta = await upsertBody(categories.ENTRANCE.id, 'National Testing Agency', 'NTA');
  const jee = await upsertProgram(nta.id, {
    name: 'JEE Main',
    code: 'JEE_MAIN',
    default_duration_minutes: 180,
    has_negative_marking: true,
    negative_marks_ratio: 0.25,
  });
  const jeeStage = await upsertStage(jee.id, 'Paper 1 (B.E./B.Tech)', 1);
  await upsertSectionNodes(jee.id, jeeStage.id, ['Physics', 'Chemistry', 'Mathematics']);

  const neet = await upsertProgram(nta.id, {
    name: 'NEET UG',
    code: 'NEET_UG',
    default_duration_minutes: 180,
    has_negative_marking: true,
    negative_marks_ratio: 0.25,
  });
  const neetStage = await upsertStage(neet.id, 'Single Paper', 1);
  await upsertSectionNodes(neet.id, neetStage.id, ['Physics', 'Chemistry', 'Botany', 'Zoology']);

  // ---- State CET ----
  const cetCell = await upsertBody(categories.ENTRANCE.id, 'Maharashtra State CET Cell', 'MH-CET-CELL');
  const mhtCet = await upsertProgram(cetCell.id, {
    name: 'MHT-CET',
    code: 'MHT_CET',
    default_duration_minutes: 180,
    has_negative_marking: false,
  });
  const cetStage = await upsertStage(mhtCet.id, 'PCM Group', 1);
  const cetPcbStage = await upsertStage(mhtCet.id, 'PCB Group', 2);
  await upsertSectionNodes(mhtCet.id, cetStage.id, ['Physics', 'Chemistry', 'Mathematics']);
  await upsertSectionNodes(mhtCet.id, cetPcbStage.id, ['Physics (PCB)', 'Chemistry (PCB)', 'Biology']);

  console.log('✔ Competitive/entrance catalog seeded (UPSC, MPSC, IBPS, SBI, NTA, CET)');
  return { cse, gsStage, csatStage, ibpsPo, ibpsPoPre, jee, jeeStage, neet, neetStage, mhtCet, cetStage, cetPcbStage };
}

// ---------------------------------------------------------------------------
// 3. NAT question type (for JEE numeric answers)
// ---------------------------------------------------------------------------
async function seedNatQuestionType() {
  let nat = await prisma.question_Type.findFirst({ where: { type_name: 'Numerical Answer Type (NAT)' } });
  if (!nat) {
    nat = await prisma.question_Type.create({ data: { type_name: 'Numerical Answer Type (NAT)' } });
  }
  console.log('✔ NAT question type ready (id ' + nat.id + ')');
  return nat;
}

// ---------------------------------------------------------------------------
// 4. Paper templates for competitive/entrance mocks
// ---------------------------------------------------------------------------
async function upsertTemplate(programId, data, sections) {
  let template = await prisma.paper_Template.findUnique({
    where: { exam_program_id_name: { exam_program_id: programId, name: data.name } },
  });
  if (!template) {
    template = await prisma.paper_Template.create({ data: { ...data, exam_program_id: programId } });
    for (let i = 0; i < sections.length; i++) {
      await prisma.template_Section.create({
        data: { ...sections[i], paper_template_id: template.id, sequence_number: i + 1 },
      });
    }
  }
  return template;
}

async function seedTemplates(catalog, natTypeId) {
  const mcqTypeId = 1; // seeded MCQ type

  await upsertTemplate(
    catalog.cse.id,
    {
      exam_stage_id: catalog.gsStage.id,
      name: 'UPSC Prelims GS Paper I - Standard Mock',
      total_marks: 200,
      total_questions: 100,
      duration_minutes: 120,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: true,
      negative_marks_ratio: 1 / 3,
    },
    [{ name: 'General Studies', total_questions: 100, mandatory_questions: 100, marks_per_question: 2, answer_format: 'MCQ' }],
  );

  await upsertTemplate(
    catalog.cse.id,
    {
      exam_stage_id: catalog.csatStage.id,
      name: 'UPSC Prelims CSAT Paper II - Standard Mock',
      total_marks: 200,
      total_questions: 80,
      duration_minutes: 120,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: true,
      negative_marks_ratio: 1 / 3,
    },
    [{ name: 'CSAT', total_questions: 80, mandatory_questions: 80, marks_per_question: 2.5, answer_format: 'MCQ', qualifying_marks: 66.67 }],
  );

  // Short practice mock for coaching QA / mini assignments (8 × 2.5 = 20).
  await upsertTemplate(
    catalog.cse.id,
    {
      exam_stage_id: catalog.csatStage.id,
      name: 'UPSC Prelims CSAT Paper II - Mini Mock (20)',
      total_marks: 20,
      total_questions: 8,
      duration_minutes: 30,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: true,
      negative_marks_ratio: 1 / 3,
    },
    [{ name: 'CSAT', total_questions: 8, mandatory_questions: 8, marks_per_question: 2.5, answer_format: 'MCQ', qualifying_marks: 6.67 }],
  );

  await upsertTemplate(
    catalog.ibpsPo.id,
    {
      exam_stage_id: catalog.ibpsPoPre.id,
      name: 'IBPS PO Prelims - Standard Mock',
      total_marks: 100,
      total_questions: 100,
      duration_minutes: 60,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: true,
      negative_marks_ratio: 0.25,
    },
    [
      { name: 'English Language', total_questions: 30, mandatory_questions: 30, marks_per_question: 1, answer_format: 'MCQ', time_limit_minutes: 20 },
      { name: 'Quantitative Aptitude', total_questions: 35, mandatory_questions: 35, marks_per_question: 1, answer_format: 'MCQ', time_limit_minutes: 20 },
      { name: 'Reasoning Ability', total_questions: 35, mandatory_questions: 35, marks_per_question: 1, answer_format: 'MCQ', time_limit_minutes: 20 },
    ],
  );

  // Official JEE Main (2024+): NAT answers are integers (no tolerance) and
  // NAT wrong answers carry -1 like MCQs (ratio 0.25 × 4 marks).
  await upsertTemplate(
    catalog.jee.id,
    {
      exam_stage_id: catalog.jeeStage.id,
      name: 'JEE Main Paper 1 - Standard Mock',
      total_marks: 300,
      total_questions: 75,
      duration_minutes: 180,
      delivery_mode: 'ONLINE_MIXED',
      negative_marking: true,
      negative_marks_ratio: 0.25,
      nat_tolerance: null,
    },
    [
      { name: 'Physics - MCQ', total_questions: 20, mandatory_questions: 20, marks_per_question: 4, answer_format: 'MCQ' },
      { name: 'Physics - Numerical', total_questions: 5, mandatory_questions: 5, marks_per_question: 4, answer_format: 'NUMERIC' },
      { name: 'Chemistry - MCQ', total_questions: 20, mandatory_questions: 20, marks_per_question: 4, answer_format: 'MCQ' },
      { name: 'Chemistry - Numerical', total_questions: 5, mandatory_questions: 5, marks_per_question: 4, answer_format: 'NUMERIC' },
      { name: 'Mathematics - MCQ', total_questions: 20, mandatory_questions: 20, marks_per_question: 4, answer_format: 'MCQ' },
      { name: 'Mathematics - Numerical', total_questions: 5, mandatory_questions: 5, marks_per_question: 4, answer_format: 'NUMERIC' },
    ],
  );

  await upsertTemplate(
    catalog.neet.id,
    {
      exam_stage_id: catalog.neetStage.id,
      name: 'NEET UG - Standard Mock',
      total_marks: 720,
      total_questions: 180,
      duration_minutes: 180,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: true,
      negative_marks_ratio: 0.25,
    },
    [
      { name: 'Physics', total_questions: 45, mandatory_questions: 45, marks_per_question: 4, answer_format: 'MCQ' },
      { name: 'Chemistry', total_questions: 45, mandatory_questions: 45, marks_per_question: 4, answer_format: 'MCQ' },
      { name: 'Botany', total_questions: 45, mandatory_questions: 45, marks_per_question: 4, answer_format: 'MCQ' },
      { name: 'Zoology', total_questions: 45, mandatory_questions: 45, marks_per_question: 4, answer_format: 'MCQ' },
    ],
  );

  await upsertTemplate(
    catalog.mhtCet.id,
    {
      exam_stage_id: catalog.cetStage.id,
      name: 'MHT-CET PCM - Standard Mock',
      total_marks: 200,
      total_questions: 150,
      duration_minutes: 180,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: false,
    },
    [
      { name: 'Physics', total_questions: 50, mandatory_questions: 50, marks_per_question: 1, answer_format: 'MCQ' },
      { name: 'Chemistry', total_questions: 50, mandatory_questions: 50, marks_per_question: 1, answer_format: 'MCQ' },
      { name: 'Mathematics', total_questions: 50, mandatory_questions: 50, marks_per_question: 2, answer_format: 'MCQ' },
    ],
  );

  // MHT-CET PCB group (Biology 100 Q × 1 mark, official pattern)
  await upsertTemplate(
    catalog.mhtCet.id,
    {
      exam_stage_id: catalog.cetPcbStage.id,
      name: 'MHT-CET PCB - Standard Mock',
      total_marks: 200,
      total_questions: 200,
      duration_minutes: 180,
      delivery_mode: 'ONLINE_MCQ',
      negative_marking: false,
    },
    [
      { name: 'Physics', total_questions: 50, mandatory_questions: 50, marks_per_question: 1, answer_format: 'MCQ' },
      { name: 'Chemistry', total_questions: 50, mandatory_questions: 50, marks_per_question: 1, answer_format: 'MCQ' },
      { name: 'Biology', total_questions: 100, mandatory_questions: 100, marks_per_question: 1, answer_format: 'MCQ' },
    ],
  );

  console.log('✔ Standard mock paper templates seeded');
}

// ---------------------------------------------------------------------------
// 4b. Template upgrades for existing databases (idempotent corrections)
//     - JEE: integer NAT comparison + NAT negative marking (-1) per 2024+ rules
//     - Scope each subject section to its syllabus node so mocks draw the
//       right questions per section
// ---------------------------------------------------------------------------
async function upgradeTemplates() {
  // JEE corrections (template may pre-exist with old values)
  const jeeTemplate = await prisma.paper_Template.findFirst({
    where: { name: 'JEE Main Paper 1 - Standard Mock' },
    include: { sections: true },
  });
  if (jeeTemplate) {
    await prisma.paper_Template.update({
      where: { id: jeeTemplate.id },
      data: { nat_tolerance: null },
    });
    for (const section of jeeTemplate.sections) {
      if (section.answer_format === 'NUMERIC' && section.negative_marks_per_question !== null) {
        await prisma.template_Section.update({
          where: { id: section.id },
          data: { negative_marks_per_question: null },
        });
      }
    }
  }

  // Scope template sections to matching syllabus SECTION nodes by name prefix
  // (e.g. "Physics - MCQ" → node "Physics"). Sections without a match keep
  // program/stage-wide scope.
  const templates = await prisma.paper_Template.findMany({
    where: { legacy_pattern_id: null },
    include: { sections: true, exam_program: true },
  });
  let scoped = 0;
  for (const template of templates) {
    const nodes = await prisma.syllabus_Node.findMany({
      where: { exam_program_id: template.exam_program_id, node_type: 'SECTION', parent_id: null },
    });
    for (const section of template.sections) {
      if (section.syllabus_node_id) continue;
      const match = nodes.find(
        (n) =>
          section.name === n.name ||
          section.name.startsWith(n.name + ' -') ||
          section.name.startsWith(n.name + ' –'),
      );
      if (match) {
        await prisma.template_Section.update({
          where: { id: section.id },
          data: { syllabus_node_id: match.id },
        });
        scoped++;
      }
    }
  }
  console.log('✔ Template upgrades applied (JEE NAT rules, ' + scoped + ' sections scoped to syllabus nodes)');
}

// ---------------------------------------------------------------------------
// 4c. Open Learning virtual school (aspirant → Student bridge)
// ---------------------------------------------------------------------------
async function seedOpenLearning() {
  let board = await prisma.board.findUnique({ where: { abbreviation: 'TV-OPEN' } });
  if (!board) {
    let city = await prisma.city.findFirst();
    if (!city) {
      const country = await prisma.country.create({ data: { name: 'India' } });
      const state = await prisma.state.create({ data: { country_id: country.id, name: 'Maharashtra' } });
      city = await prisma.city.create({ data: { state_id: state.id, name: 'Pune' } });
    }
    const address = await prisma.address.create({
      data: { city_id: city.id, postal_code: '000000', street: 'Virtual Campus' },
    });
    board = await prisma.board.create({
      data: { name: 'Test Vista Open Learning', abbreviation: 'TV-OPEN', address_id: address.id },
    });
  }
  await prisma.instruction_Medium.upsert({
    where: { board_id_instruction_medium: { board_id: board.id, instruction_medium: 'English' } },
    update: {},
    create: { board_id: board.id, instruction_medium: 'English' },
  });

  let standard = await prisma.standard.findFirst({ where: { board_id: board.id, name: 'Aspirant' } });
  if (!standard) {
    standard = await prisma.standard.create({
      data: { board_id: board.id, name: 'Aspirant', sequence_number: 1 },
    });
  }

  let school = await prisma.school.findFirst({
    where: { board_id: board.id, name: 'Test Vista Open Learning' },
  });
  if (!school) {
    const city = await prisma.city.findFirst();
    const address = await prisma.address.create({
      data: { city_id: city.id, postal_code: '000000', street: 'Virtual Campus' },
    });
    school = await prisma.school.create({
      data: {
        board_id: board.id,
        name: 'Test Vista Open Learning',
        address_id: address.id,
        principal_name: 'Test Vista',
        email: 'open-learning@testvista.in',
        contact_number: '0000000000',
      },
    });
  }

  await prisma.school_Standard.upsert({
    where: { school_id_standard_id: { school_id: school.id, standard_id: standard.id } },
    update: {},
    create: { school_id: school.id, standard_id: standard.id },
  });

  const institution = await prisma.institution.findUnique({ where: { school_id: school.id } });
  if (!institution) {
    await prisma.institution.create({
      data: {
        institution_type: 'VIRTUAL',
        name: 'Test Vista Open Learning',
        email: 'open-learning@testvista.in',
        school_id: school.id,
      },
    });
  }
  console.log('✔ Open Learning virtual school ready (aspirant bridge)');
}

// ---------------------------------------------------------------------------
// 4d. Auto-tag legacy questions onto board syllabus nodes
//     Question_Topic (board taxonomy) → Question_Syllabus_Node (exam platform)
// ---------------------------------------------------------------------------
async function autoTagQuestions() {
  const tagged = await prisma.$executeRawUnsafe(`
    INSERT INTO "Question_Syllabus_Node" (question_id, syllabus_node_id, created_at)
    SELECT qt.question_id, sn.id, NOW()
    FROM "Question_Topic" qt
    JOIN "Syllabus_Node" sn ON sn.legacy_topic_id = qt.topic_id
    ON CONFLICT (question_id, syllabus_node_id) DO NOTHING
  `);
  const total = await prisma.question_Syllabus_Node.count();
  console.log('✔ Auto-tagged ' + tagged + ' new question↔syllabus links (total ' + total + ')');
}

// ---------------------------------------------------------------------------
// 5. Legacy board data → BOARD category entities
// ---------------------------------------------------------------------------
async function migrateLegacyBoards(categories) {
  const boards = await prisma.board.findMany({ include: { standards: true, subjects: true } });
  const stats = { bodies: 0, programs: 0, stages: 0, subjectNodes: 0, chapterNodes: 0, topicNodes: 0 };

  for (const board of boards) {
    // Board → Exam_Body (BOARD category)
    let body = await prisma.exam_Body.findUnique({ where: { board_id: board.id } });
    if (!body) {
      body = await prisma.exam_Body.upsert({
        where: { abbreviation: board.abbreviation },
        update: { board_id: board.id, exam_category_id: categories.BOARD.id },
        create: {
          name: board.name,
          abbreviation: board.abbreviation,
          exam_category_id: categories.BOARD.id,
          board_id: board.id,
        },
      });
      stats.bodies++;
    }

    // One program per board: its curriculum
    const programCode = 'BOARD_' + board.abbreviation.replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
    const program = await prisma.exam_Program.upsert({
      where: { code: programCode },
      update: { exam_body_id: body.id },
      create: {
        exam_body_id: body.id,
        name: board.abbreviation + ' Board Curriculum',
        code: programCode,
        description: 'School board curriculum for ' + board.name,
      },
    });
    stats.programs++;

    // Standards → Exam_Stages
    const stageByStandard = {};
    for (const std of board.standards) {
      let stage = await prisma.exam_Stage.findUnique({ where: { standard_id: std.id } });
      if (!stage) {
        stage = await prisma.exam_Stage.upsert({
          where: { exam_program_id_name: { exam_program_id: program.id, name: std.name } },
          update: { standard_id: std.id },
          create: {
            exam_program_id: program.id,
            name: std.name,
            sequence_number: std.sequence_number,
            standard_id: std.id,
          },
        });
        stats.stages++;
      }
      stageByStandard[std.id] = stage;
    }

    // Subjects → SUBJECT syllabus nodes
    const subjectNodeBySubject = {};
    for (let i = 0; i < board.subjects.length; i++) {
      const subject = board.subjects[i];
      let node = await prisma.syllabus_Node.findFirst({
        where: { exam_program_id: program.id, legacy_subject_id: subject.id, node_type: 'SUBJECT' },
      });
      if (!node) {
        node = await prisma.syllabus_Node.create({
          data: {
            exam_program_id: program.id,
            node_type: 'SUBJECT',
            name: subject.name,
            sequence_number: i + 1,
            legacy_subject_id: subject.id,
          },
        });
        stats.subjectNodes++;
      }
      subjectNodeBySubject[subject.id] = node;
    }

    // Chapters → CHAPTER nodes (under subject node, linked to stage)
    const chapters = await prisma.chapter.findMany({
      where: { subject: { board_id: board.id } },
      include: { topics: true },
    });
    for (const chapter of chapters) {
      const parent = subjectNodeBySubject[chapter.subject_id];
      const stage = stageByStandard[chapter.standard_id];
      if (!parent) continue;
      let chapterNode = await prisma.syllabus_Node.findFirst({
        where: { exam_program_id: program.id, legacy_chapter_id: chapter.id, node_type: 'CHAPTER' },
      });
      if (!chapterNode) {
        chapterNode = await prisma.syllabus_Node.create({
          data: {
            exam_program_id: program.id,
            exam_stage_id: stage ? stage.id : null,
            parent_id: parent.id,
            node_type: 'CHAPTER',
            name: chapter.name,
            sequence_number: chapter.sequential_chapter_number,
            legacy_chapter_id: chapter.id,
          },
        });
        stats.chapterNodes++;
      }
      for (const topic of chapter.topics) {
        const exists = await prisma.syllabus_Node.findFirst({
          where: { exam_program_id: program.id, legacy_topic_id: topic.id, node_type: 'TOPIC' },
        });
        if (!exists) {
          await prisma.syllabus_Node.create({
            data: {
              exam_program_id: program.id,
              exam_stage_id: stage ? stage.id : null,
              parent_id: chapterNode.id,
              node_type: 'TOPIC',
              name: topic.name,
              sequence_number: topic.sequential_topic_number,
              legacy_topic_id: topic.id,
            },
          });
          stats.topicNodes++;
        }
      }
    }
  }
  console.log('✔ Legacy boards migrated:', JSON.stringify(stats));
}

// ---------------------------------------------------------------------------
// 6. Legacy patterns → Paper templates (BOARD programs)
// ---------------------------------------------------------------------------
async function migratePatterns() {
  const patterns = await prisma.pattern.findMany({
    include: {
      board: { include: { exam_body: { include: { exam_programs: true } } } },
      sections: { include: { subsection_question_types: true }, orderBy: { sequence_number: 'asc' } },
    },
  });
  let created = 0;
  for (const pattern of patterns) {
    const body = pattern.board.exam_body;
    if (!body) continue;
    const program = body.exam_programs.find((p) => p.code.startsWith('BOARD_'));
    if (!program) continue;

    const existing = await prisma.paper_Template.findUnique({ where: { legacy_pattern_id: pattern.id } });
    if (existing) continue;

    const stage = await prisma.exam_Stage.findUnique({ where: { standard_id: pattern.standard_id } });

    // MCQ-only patterns can run online; mixed patterns are printable
    const allMcq =
      pattern.sections.length > 0 &&
      pattern.sections.every((s) => s.subsection_question_types.every((sq) => sq.question_type_id === 1));

    const uniqueName = pattern.pattern_name + ' [#' + pattern.id + ']';
    const template = await prisma.paper_Template.create({
      data: {
        exam_program_id: program.id,
        exam_stage_id: stage ? stage.id : null,
        name: uniqueName,
        total_marks: pattern.total_marks,
        delivery_mode: allMcq ? 'ONLINE_MCQ' : 'OFFLINE_PDF',
        legacy_pattern_id: pattern.id,
      },
    });

    for (const section of pattern.sections) {
      const ts = await prisma.template_Section.create({
        data: {
          paper_template_id: template.id,
          name: section.section_name,
          sequence_number: section.sequence_number,
          total_questions: section.total_questions,
          mandatory_questions: section.mandotory_questions,
          marks_per_question: section.marks_per_question,
          answer_format: 'MCQ',
        },
      });
      for (const sq of section.subsection_question_types) {
        await prisma.template_Section_Question_Type.create({
          data: {
            template_section_id: ts.id,
            question_type_id: sq.question_type_id,
            sequence_number: sq.seqencial_subquestion_number,
          },
        });
      }
    }
    created++;
  }
  console.log('✔ Legacy patterns migrated to paper templates: ' + created + ' created');
}

// ---------------------------------------------------------------------------
// 7. Schools → Institutions, Students → Participants
// ---------------------------------------------------------------------------
async function migrateSchoolsAndStudents() {
  const schools = await prisma.school.findMany();
  let institutions = 0;
  for (const school of schools) {
    const exists = await prisma.institution.findUnique({ where: { school_id: school.id } });
    if (!exists) {
      await prisma.institution.create({
        data: {
          institution_type: 'SCHOOL',
          name: school.name,
          email: school.email,
          contact_number: school.contact_number,
          principal_name: school.principal_name,
          school_id: school.id,
        },
      });
      institutions++;
    }
  }

  const students = await prisma.student.findMany({
    include: { school_standard: true },
  });
  let participants = 0;
  for (const student of students) {
    const exists = await prisma.participant.findUnique({ where: { student_id: student.id } });
    if (exists) continue;
    const institution = await prisma.institution.findUnique({
      where: { school_id: student.school_standard.school_id },
    });
    await prisma.participant.create({
      data: {
        user_id: student.user_id,
        participant_type: 'SCHOOL_STUDENT',
        institution_id: institution ? institution.id : null,
        registration_code: 'S-' + student.school_standard.school_id + '-' + student.student_id,
        status: student.status,
        student_id: student.id,
      },
    });
    participants++;
  }
  console.log('✔ Schools → institutions: ' + institutions + ' | Students → participants: ' + participants);
}

// ---------------------------------------------------------------------------
// 8. Test papers → exam-platform links
// ---------------------------------------------------------------------------
async function migrateTestPapers() {
  const papers = await prisma.test_Paper.findMany({
    where: { exam_program_id: null },
    include: { pattern: true },
  });
  let updated = 0;
  for (const paper of papers) {
    if (!paper.pattern) continue; // school-less competitive mocks are already linked at creation
    const template = await prisma.paper_Template.findUnique({
      where: { legacy_pattern_id: paper.pattern_id },
    });
    const stage = await prisma.exam_Stage.findUnique({ where: { standard_id: paper.pattern.standard_id } });
    const institution = paper.school_id
      ? await prisma.institution.findUnique({ where: { school_id: paper.school_id } })
      : null;
    if (!template) continue;
    await prisma.test_Paper.update({
      where: { id: paper.id },
      data: {
        exam_program_id: template.exam_program_id,
        exam_stage_id: stage ? stage.id : null,
        institution_id: institution ? institution.id : null,
        paper_template_id: template.id,
        delivery_mode: paper.is_online ? 'ONLINE_MCQ' : 'OFFLINE_PDF',
      },
    });
    updated++;
  }
  console.log('✔ Test papers linked to exam platform: ' + updated);
}

// ---------------------------------------------------------------------------
// 9. Verification
// ---------------------------------------------------------------------------
async function verify() {
  const [boards, bodies, programs, stages, nodes, templates, schools, institutions, students, participants, papers, linkedPapers] =
    await Promise.all([
      prisma.board.count(),
      prisma.exam_Body.count(),
      prisma.exam_Program.count(),
      prisma.exam_Stage.count(),
      prisma.syllabus_Node.count(),
      prisma.paper_Template.count(),
      prisma.school.count(),
      prisma.institution.count(),
      prisma.student.count(),
      prisma.participant.count(),
      prisma.test_Paper.count(),
      prisma.test_Paper.count({ where: { exam_program_id: { not: null } } }),
    ]);
  console.log('\n=== VERIFICATION ===');
  console.log('Boards: ' + boards + ' → Exam bodies: ' + bodies);
  console.log('Exam programs: ' + programs + ' | stages: ' + stages);
  console.log('Syllabus nodes: ' + nodes + ' | Paper templates: ' + templates);
  console.log('Schools: ' + schools + ' → Institutions: ' + institutions);
  console.log('Students: ' + students + ' → Participants: ' + participants);
  console.log('Test papers: ' + papers + ' (linked: ' + linkedPapers + ')');
  if (institutions < schools) throw new Error('Institution count mismatch!');
  if (participants < students) throw new Error('Participant count mismatch!');
  console.log('All integrity checks passed ✔');
}

async function main() {
  console.log('=== Option C Migration ===\n');
  const categories = await seedCategories();
  const catalog = await seedCompetitiveCatalog(categories);
  const nat = await seedNatQuestionType();
  await seedTemplates(catalog, nat.id);
  await upgradeTemplates();
  await seedOpenLearning();
  await migrateLegacyBoards(categories);
  await migratePatterns();
  await migrateSchoolsAndStudents();
  await migrateTestPapers();
  await autoTagQuestions();
  await verify();
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
