// Shared Neon PostgreSQL Database Client
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set. Database operations will fail unless configured.");
}

const sql = connectionString ? neon(connectionString) : null;

// Initialize tables if they do not exist
async function ensureTables() {
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS art_config (
      key VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS art_accounts (
      username VARCHAR(50) PRIMARY KEY,
      display_name VARCHAR(100) NOT NULL,
      password_hash VARCHAR(100) NOT NULL,
      role VARCHAR(50) DEFAULT 'ครูผู้สอน',
      created_at VARCHAR(50),
      is_primary BOOLEAN DEFAULT FALSE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS art_students (
      id VARCHAR(100) PRIMARY KEY,
      grade_id VARCHAR(20) NOT NULL,
      room_id VARCHAR(50) NOT NULL,
      no INT NOT NULL,
      name VARCHAR(150) NOT NULL,
      nickname VARCHAR(50),
      avatar TEXT DEFAULT '🎨',
      scores JSONB DEFAULT '{}'::jsonb,
      feedback TEXT,
      portfolio JSONB DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Auto-migrate avatar to TEXT and add portfolio column if not exist
  try {
    await sql`ALTER TABLE art_students ALTER COLUMN avatar TYPE TEXT;`;
  } catch (err) {}
  try {
    await sql`ALTER TABLE art_students ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '[]'::jsonb;`;
  } catch (err) {}

  // Check if art_config has default config or needs migration to ป.4 - ม.3 and 5 tasks
  const existingConfig = await sql`SELECT * FROM art_config WHERE key = 'app_config'`;
  let needsConfigUpdate = false;
  if (existingConfig.length > 0) {
    const curCfg = existingConfig[0].data || {};
    if (curCfg.grades && curCfg.grades.some(g => g.id === 'p1')) {
      needsConfigUpdate = true;
    }
    if (!curCfg.assignments || curCfg.assignments.length < 5) {
      needsConfigUpdate = true;
    }
    if (!curCfg.schoolName || curCfg.schoolName === 'โรงเรียนสาธิตศิลปวัฒนธรรม') {
      needsConfigUpdate = true;
    }
  }

  if (existingConfig.length === 0 || needsConfigUpdate) {
    const defaultCfg = {
      grades: [
        { id: 'p4', name: 'ชั้นประถมศึกษาปีที่ 4 (ป.4)' },
        { id: 'p5', name: 'ชั้นประถมศึกษาปีที่ 5 (ป.5)' },
        { id: 'p6', name: 'ชั้นประถมศึกษาปีที่ 6 (ป.6)' },
        { id: 'm1', name: 'ชั้นมัธยมศึกษาปีที่ 1 (ม.1)' },
        { id: 'm2', name: 'ชั้นมัธยมศึกษาปีที่ 2 (ม.2)' },
        { id: 'm3', name: 'ชั้นมัธยมศึกษาปีที่ 3 (ม.3)' }
      ],
      rooms: {
        'p4': ['1', '2', '3'],
        'p5': ['1', '2', '3'],
        'p6': ['1', '2', '3'],
        'm1': ['1', '2', '3'],
        'm2': ['1', '2', '3'],
        'm3': ['1', '2', '3']
      },
      assignments: [
        { id: 'task_1', title: 'งาน 1: การไล่เฉดสีน้ำและเทคนิคเปียกบนเปียก', maxScore: 25 },
        { id: 'task_2', title: 'งาน 2: วาดภาพสัตว์ในจินตนาการ (สีโปสเตอร์)', maxScore: 25 },
        { id: 'task_3', title: 'งาน 3: ภาพพิมพ์และงานสร้างสรรค์คอลลาจ', maxScore: 25 },
        { id: 'task_4', title: 'งาน 4: การแรเงาเส้นและน้ำหนักแสงเงา', maxScore: 25 },
        { id: 'task_5', title: 'งาน 5: ออกแบบประติมากรรมสร้างสรรค์', maxScore: 20 }
      ],
      schoolName: "โรงเรียนบริษัทไทยกสิกรสงเคราะห์",
      schoolLogo: "assets/school_logo.png",
      semester: "1",
      academicYear: "2567",
      roomPasscodes: {
        "p4_1": "1234",
        "p4_2": "1234",
        "p4_3": "1234",
        "default": "1234"
      }
    };
    if (existingConfig.length === 0) {
      await sql`INSERT INTO art_config (key, data) VALUES ('app_config', ${JSON.stringify(defaultCfg)})`;
    } else {
      await sql`UPDATE art_config SET data = ${JSON.stringify(defaultCfg)} WHERE key = 'app_config'`;
    }
  }

  // Check if admin account exists
  const existingAdmin = await sql`SELECT * FROM art_accounts WHERE username = 'admin'`;
  if (existingAdmin.length === 0) {
    await sql`
      INSERT INTO art_accounts (username, display_name, password_hash, role, created_at, is_primary)
      VALUES (
        'admin',
        'ครูผู้ดูแลระบบ (Admin)',
        'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270',
        'ผู้ดูแลระบบ',
        '2026-10-28',
        TRUE
      )
    `;
  }

  // Check if default students exist
  const existingStudents = await sql`SELECT count(*) as count FROM art_students`;
  if (parseInt(existingStudents[0].count, 10) === 0) {
    const defaultStudents = [
      { id: "p4_1_01", grade_id: "p4", room_id: "1", no: 1, name: "ด.ช. ธนกร ศิลป์เลิศ", nickname: "อาร์ต", avatar: "👦", scores: { task_1: 24, task_2: 25, task_3: 24, task_4: 25 }, feedback: "ส่งงานตรงเวลาครบทุกชิ้น มีความรับผิดชอบและทักษะการคุมสีน้ำยอดเยี่ยม" },
      { id: "p4_1_02", grade_id: "p4", room_id: "1", no: 2, name: "ด.ญ. พิมพ์มาดา วาดวิจิตร", nickname: "พู่กัน", avatar: "👧", scores: { task_1: 24, task_2: 25, task_3: 23, task_4: 24 }, feedback: "งานสร้างสรรค์สัตว์ในจินตนาการไอเดียแปลกใหม่มาก ลายเส้นสดใส" },
      { id: "p4_1_03", grade_id: "p4", room_id: "1", no: 3, name: "ด.ญ. กัญญาพัชร สีสันดี", nickname: "สายรุ้ง", avatar: "🦄", scores: { task_1: 23, task_2: 24, task_3: 24, task_4: 23 }, feedback: "การเลือกคู่สีพาสเทลลงตัว ชิ้นงานคอลลาจมีความละเอียดประณีต" },
      { id: "p4_1_04", grade_id: "p4", room_id: "1", no: 4, name: "ด.ช. ปัณณธร ลายเส้นทอง", nickname: "วินเนอร์", avatar: "🦁", scores: { task_1: 22, task_2: 24, task_3: 23, task_4: 24 }, feedback: "การแรเงาแสงเงามีมิติชัดเจนมาก กล้าใช้น้ำหนักเข้ม" },
      { id: "p4_1_05", grade_id: "p4", room_id: "1", no: 5, name: "ด.ญ. อลินดา มโนภาพ", nickname: "ลินิน", avatar: "🐱", scores: { task_1: 23, task_2: 22, task_3: 23, task_4: 22 }, feedback: "มีพัฒนาการที่ดีขึ้นต่อเนื่อง การเกลี่ยสีน้ำเริ่มนุ่มนวล" },
      { id: "p4_1_06", grade_id: "p4", room_id: "1", no: 6, name: "ด.ช. ชนนนท์ นักวาด", nickname: "นนท์", avatar: "🦊", scores: { task_1: 21, task_2: 23, task_3: 24, task_4: 20 }, feedback: "งานภาพพิมพ์ทำออกมาได้น่าสนใจมาก ไอเดียสร้างสรรค์ไม่ซ้ำใคร" },
      { id: "p4_1_07", grade_id: "p4", room_id: "1", no: 7, name: "ด.ญ. รินรดา สดใสศิลป์", nickname: "มินนี่", avatar: "👧", scores: { task_1: 22, task_2: 21, task_3: 21, task_4: 22 }, feedback: "ตั้งใจทำงานอย่างสม่ำเสมอ ฝึกการเน้นขอบเส้นจะช่วยให้ภาพคมชัดยิ่งขึ้น" },
      { id: "p4_1_08", grade_id: "p4", room_id: "1", no: 8, name: "ด.ช. ภัทรดนัย จินตนาการ", nickname: "ข้าวกล้อง", avatar: "🐼", scores: { task_1: 20, task_2: 22, task_3: 21, task_4: 21 }, feedback: "รายละเอียดในชิ้นงานดีมาก รักษาความสะอาดของกระดาษได้ดี" },
      { id: "p4_1_09", grade_id: "p4", room_id: "1", no: 9, name: "ด.ช. วชิรวิทย์ ประณีตงาม", nickname: "เต้", avatar: "👦", scores: { task_1: 20, task_2: 20, task_3: 21, task_4: 20 }, feedback: "งานเรียบร้อย ส่งตรงเวลา ควรฝึกเรื่องการผสมคู่สีตรงข้ามเพิ่มเติม" },
      { id: "p4_1_10", grade_id: "p4", room_id: "1", no: 10, name: "ด.ญ. ณิชาภัทร อารมณ์ศิลป์", nickname: "ณิชา", avatar: "👧", scores: { task_1: 19, task_2: 21, task_3: 20, task_4: 19 }, feedback: "เส้นร่างบางเบาสะอาดตา เพิ่มความกล้าในการลงสีเข้มจะสมบูรณ์แบบ" },
      { id: "p4_1_11", grade_id: "p4", room_id: "1", no: 11, name: "ด.ช. กิตติพงษ์ มือศิลป์", nickname: "กาย", avatar: "🦖", scores: { task_1: 18, task_2: 20, task_3: 19, task_4: 19 }, feedback: "มีความกล้าแสดงออกในการลงสี ควรเพิ่มความใจเย็นในขั้นตอนเก็บรายละเอียด" },
      { id: "p4_1_12", grade_id: "p4", room_id: "1", no: 12, name: "ด.ญ. วรินทร สุขภาพใจ", nickname: "เอย", avatar: "🐰", scores: { task_1: 18, task_2: 19, task_3: 18, task_4: 18 }, feedback: "ส่งงานครบทุกชิ้น มีความพยายามที่ดีมาก ขอให้ฝึกฝนบ่อย ๆ นะครับ" },
      { id: "p4_2_01", grade_id: "p4", room_id: "2", no: 1, name: "ด.ช. ปิติพล แต้มสี", nickname: "มิกซ์", avatar: "👦", scores: { task_1: 23, task_2: 24, task_3: 24, task_4: 24 }, feedback: "งานสวยสดใส มีพลังและส่งงานตรงเวลา" },
      { id: "p4_2_02", grade_id: "p4", room_id: "2", no: 2, name: "ด.ญ. ชนิกานต์ ดวงดาว", nickname: "ดาว", avatar: "🦄", scores: { task_1: 22, task_2: 23, task_3: 22, task_4: 23 }, feedback: "ระบายสีได้กลมกลืนและสะอาดตามาก" },
      { id: "p5_1_01", grade_id: "p5", room_id: "1", no: 1, name: "ด.ญ. ศศิธร แสงจันทร์", nickname: "จันทร์เจ้า", avatar: "👧", scores: { task_1: 25, task_2: 25, task_3: 25, task_4: 24 }, feedback: "ผลงานดีเด่นทุกชิ้น ความคิดสร้างสรรค์ระดับยอดเยี่ยม" }
    ];

    for (const s of defaultStudents) {
      await sql`
        INSERT INTO art_students (id, grade_id, room_id, no, name, nickname, avatar, scores, feedback)
        VALUES (${s.id}, ${s.grade_id}, ${s.room_id}, ${s.no}, ${s.name}, ${s.nickname}, ${s.avatar}, ${JSON.stringify(s.scores)}, ${s.feedback})
        ON CONFLICT (id) DO NOTHING;
      `;
    }
  }
}

module.exports = {
  sql,
  ensureTables
};
