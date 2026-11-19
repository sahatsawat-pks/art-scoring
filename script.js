/**
 * ART CLASSROOM LEADERBOARD & ASSIGNMENT-BASED SCORING SYSTEM
 * วิชาศิลปะ & ระบบบันทึกคะแนนเก็บตามชิ้นงานที่สั่ง
 */

// ==========================================
// 1. CONSTANTS & STORAGE KEYS
// ==========================================
const STORAGE_DATA_KEY = 'art_classroom_assignment_data_v3';
const STORAGE_CONFIG_KEY = 'art_classroom_assignment_config_v3';
const SOUND_KEY = 'art_classroom_sound_enabled';
const STORAGE_ACCOUNTS_KEY = 'art_teacher_accounts_secure_v1';
const SESSION_AUTH_KEY = 'art_teacher_session_user';

// Cryptographic SHA-256 hash of default admin password (ac9689... represents the secure hash)
// No plaintext credentials exist in the client DOM or source code!
const INITIAL_ADMIN_HASH = 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270';

const DEFAULT_ACCOUNTS = [
  {
    username: 'admin',
    displayName: 'ครูผู้ดูแลระบบ (Admin)',
    passwordHash: INITIAL_ADMIN_HASH,
    role: 'ผู้ดูแลระบบ',
    createdAt: '2026-10-28',
    isPrimary: true
  }
];

// Helper to compute SHA-256 hex string using browser Web Crypto API
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadAccounts() {
  const saved = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Corrupted accounts storage. Reinitializing.");
    }
  }
  localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  return [...DEFAULT_ACCOUNTS];
}

function saveAccounts(accounts) {
  localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getLoggedInTeacher() {
  const raw = sessionStorage.getItem(SESSION_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setLoggedInTeacher(userObj) {
  sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(userObj));
}

function clearLoggedInTeacher() {
  sessionStorage.removeItem(SESSION_AUTH_KEY);
}

// Default Configuration with Dynamic Assignments, Grades & Galleries
const DEFAULT_CONFIG = {
  schoolName: "โรงเรียนบริษัทไทยกสิกรสงเคราะห์",
  schoolLogo: "assets/school_logo.png",
  semester: "1",
  academicYear: "2567",
  bgTheme: "theme-pastel",
  customBgUrl: "",
  roomPasscodes: {
    "p4_1": "1234",
    "p4_2": "1234",
    "p4_3": "1234",
    "default": "1234"
  },
  roomSlogans: {
    "default": '👑 "มีแต่ลิฟต์เท่านั้นที่จะเอาหนูลงได้" 👑'
  },
  roomAssignments: {},
  grades: [
    { id: 'p4', name: 'ชั้นประถมศึกษาปีที่ 4' },
    { id: 'p5', name: 'ชั้นประถมศึกษาปีที่ 5' },
    { id: 'p6', name: 'ชั้นประถมศึกษาปีที่ 6' },
    { id: 'm1', name: 'ชั้นมัธยมศึกษาปีที่ 1' },
    { id: 'm2', name: 'ชั้นมัธยมศึกษาปีที่ 2' },
    { id: 'm3', name: 'ชั้นมัธยมศึกษาปีที่ 3' }
  ],
  rooms: {
    'p4': ['1', '2', '3'],
    'p5': ['1', '2', '3'],
    'p6': ['1', '2', '3'],
    'm1': ['1', '2', '3'],
    'm2': ['1', '2', '3'],
    'm3': ['1', '2', '3']
  },
  customFolders: [],
  // 5 Active Assignments as specified in briefs
  assignments: [
    { id: 'task_1', title: 'งาน 1: การไล่เฉดสีน้ำและเทคนิคเปียกบนเปียก', maxScore: 25 },
    { id: 'task_2', title: 'งาน 2: วาดภาพสัตว์ในจินตนาการ (สีโปสเตอร์)', maxScore: 25 },
    { id: 'task_3', title: 'งาน 3: ภาพพิมพ์และงานสร้างสรรค์คอลลาจ', maxScore: 25 },
    { id: 'task_4', title: 'งาน 4: การแรเงาเส้นและน้ำหนักแสงเงา', maxScore: 25 },
    { id: 'task_5', title: 'งาน 5: ออกแบบประติมากรรมสร้างสรรค์', maxScore: 20 }
  ],
  magazine: {
    issueDate: "ฉบับพิเศษ • ภาคเรียนที่ 1 ปีการศึกษา 2567",
    head1: "ศิลปะกับพลังแห่งจินตนาการ: ปล่อยหัวใจให้โบยบินบนแผ่นกระดาษ",
    copy1: "ในห้องเรียนศิลปะ ความผิดพลาดไม่มีอยู่จริง มีเพียงการค้นพบสิ่งใหม่ ทุกหยดสีน้ำที่ไหลรวมกัน และทุกรอยแรเงาของดินสอ คือเสียงสะท้อนจากโลกภายในของเด็กๆ ที่กำลังเปล่งประกายอย่างเสรี",
    pic1: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80",
    caption1: "🎨 การทดลองผสมสีน้ำสร้างโทนสีแห่งความสุข",
    pic2: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80",
    caption2: "🖼️ ศิลปะภาพพิมพ์และงานตัดแปะคอลลาจ",
    pic3: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
    caption3: "🦁 จินตนาการลายเส้นที่ไร้กรอบจำกัด",
    head2: "เทคนิคสีโปสเตอร์และคู่สีตรงข้าม: เปลี่ยนความกลัวเป็นความกล้า",
    copy2: "เด็กหลายคนมักกลัวการลงสีเข้ม แต่เมื่อได้เรียนรู้ที่จะก้าวข้ามความลังเล ภาพวาดธรรมดาก็กลับมีชีวิตและมิติที่น่าทึ่ง การฝึกฝนศิลปะจึงไม่ใช่แค่การวาดรูป แต่คือการฝึกความมั่นใจในตนเอง",
    pic4: "https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&auto=format&fit=crop&q=80",
    quote: "ศิลปะไม่ใช่แค่ผลงานที่แขวนบนผนัง แต่คือการเดินทางที่เด็กๆ ได้ค้นพบคุณค่าในตัวเอง"
  },
  galleries: {
    "task_1": [
      { id: "g1_1", title: "การทดลองหยดสีน้ำบนกระดาษเปียกชุ่ม", date: "15 มิ.ย.", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80" },
      { id: "g1_2", title: "เทคนิคการเว้นแสงเงาและเกลี่ยสีเรียบ", date: "18 มิ.ย.", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80" },
      { id: "g1_3", title: "บรรยากาศนักเรียนฝึกคุมน้ำหนักพู่กัน", date: "22 มิ.ย.", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80" },
      { id: "g1_4", title: "ผลงานชิ้นเอกการไล่สีท้องฟ้าอัสดง", date: "25 มิ.ย.", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80" }
    ],
    "task_2": [
      { id: "g2_1", title: "ร่างลายเส้นสัตว์วิเศษในจินตนาการ", date: "5 ก.ค.", url: "https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&auto=format&fit=crop&q=80" },
      { id: "g2_2", title: "การผสมสีโปสเตอร์โทนอุ่นและโทนเย็น", date: "8 ก.ค.", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80" },
      { id: "g2_3", title: "เก็บรายละเอียดลวดลายและแววตาสัตว์", date: "12 ก.ค.", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80" },
      { id: "g2_4", title: "ผลงานสัตว์แฟนตาซีพร้อมจัดแสดง", date: "15 ก.ค.", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80" }
    ],
    "task_3": [
      { id: "g3_1", title: "การแกะสลักแม่พิมพ์ฟองน้ำและใบไม้", date: "2 ส.ค.", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80" },
      { id: "g3_2", title: "การกดพิมพ์ลายซ้ำสร้างจังหวะภาพ", date: "5 ส.ค.", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80" },
      { id: "g3_3", title: "ตัดแปะคอลลาจผสมผสานสื่อผสม", date: "9 ส.ค.", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80" },
      { id: "g3_4", title: "ผลงานภาพพิมพ์นามธรรมสดใส", date: "12 ส.ค.", url: "https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&auto=format&fit=crop&q=80" }
    ],
    "task_4": [
      { id: "g4_1", title: "การแรเงาเส้นไขว้และไล่น้ำหนัก 7 ระดับ", date: "20 ส.ค.", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80" },
      { id: "g4_2", title: "สังเกตทิศทางแสงและเงาตกกระทบ", date: "24 ส.ค.", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80" },
      { id: "g4_3", title: "วาดหุ่นนิ่งรูปทรงเรขาคณิตสามมิติ", date: "28 ส.ค.", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80" },
      { id: "g4_4", title: "ผลงานแรเงาวัตถุมีมิติเสมือนจริง", date: "2 ก.ย.", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80" }
    ],
    "task_5": [
      { id: "g5_1", title: "ขึ้นโครงสร้างประติมากรรมกระดาษอัด", date: "10 ก.ย.", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80" },
      { id: "g5_2", title: "ปั้นแต่งพื้นผิวด้วยดินเยื่อกระดาษ", date: "14 ก.ย.", url: "https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&auto=format&fit=crop&q=80" },
      { id: "g5_3", title: "ลงสีอะคริลิกเคลือบเงาชิ้นงาน", date: "18 ก.ย.", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80" },
      { id: "g5_4", title: "นิทรรศการประติมากรรมสามมิติ", date: "22 ก.ย.", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80" }
    ]
  }
};

// Default Sample Student Dataset (Default Grade 4 Room 1 matching brief values)
const DEFAULT_STUDENTS_DATA = {
  "p4_1": [
    {
      id: "p4_1_01",
      no: 1,
      name: "ด.ช. ปัณณธร ลายเส้นทอง",
      nickname: "วินเนอร์",
      avatar: "🦁",
      scores: { task_1: 22, task_2: 24, task_3: 23, task_4: 24, task_5: 10, examScore: 20 },
      portfolio: [
        { id: "art_1", title: "พญาราชสีห์ในม่านหมอก", technique: "สีโปสเตอร์บนผ้าใบ", date: "2026-10-15", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80" }
      ]
    },
    {
      id: "p4_1_02",
      no: 2,
      name: "ด.ช. ธนกร ศิลป์เลิศ",
      nickname: "อาร์ต",
      avatar: "👦",
      scores: { task_1: 23, task_2: 25, task_3: 24, task_4: 25, task_5: 0, examScore: 20 },
      portfolio: [
        { id: "art_2", title: "ธารน้ำไหลใต้ร่มเงาไม้", technique: "สีน้ำเปียกบนเปียก", date: "2026-10-18", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80" }
      ]
    },
    {
      id: "p4_1_03",
      no: 3,
      name: "ด.ญ. พิมพ์มาดา วาดวิจิตร",
      nickname: "พู่กัน",
      avatar: "👧",
      scores: { task_1: 24, task_2: 25, task_3: 23, task_4: 24, task_5: 0, examScore: 19 },
      portfolio: [
        { id: "art_3", title: "มวลดอกไม้ในความฝัน", technique: "ภาพพิมพ์และคอลลาจ", date: "2026-10-20", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80" }
      ]
    },
    {
      id: "p4_1_04",
      no: 4,
      name: "ด.ญ. กัญญาพัชร สีสันดี",
      nickname: "สายรุ้ง",
      avatar: "🦄",
      scores: { task_1: 23, task_2: 24, task_3: 24, task_4: 23, task_5: 15, examScore: 18 },
      portfolio: []
    },
    {
      id: "p4_1_05",
      no: 5,
      name: "ด.ญ. อลินดา มโนภาพ",
      nickname: "ลินิน",
      avatar: "🐱",
      scores: { task_1: 23, task_2: 22, task_3: 23, task_4: 22, task_5: 14, examScore: 17 },
      portfolio: []
    },
    {
      id: "p4_1_06",
      no: 6,
      name: "ด.ช. ชนนนท์ นักวาด",
      nickname: "นนท์",
      avatar: "🦊",
      scores: { task_1: 21, task_2: 23, task_3: 24, task_4: 20, task_5: 12, examScore: 18 },
      portfolio: []
    },
    {
      id: "p4_1_07",
      no: 7,
      name: "ด.ญ. รินรดา สดใสศิลป์",
      nickname: "มินนี่",
      avatar: "👧",
      scores: { task_1: 22, task_2: 21, task_3: 21, task_4: 22, task_5: 15, examScore: 16 },
      portfolio: []
    },
    {
      id: "p4_1_08",
      no: 8,
      name: "ด.ช. ภัทรดนัย จินตนาการ",
      nickname: "ข้าวกล้อง",
      avatar: "🐼",
      scores: { task_1: 20, task_2: 22, task_3: 21, task_4: 21, task_5: 14, examScore: 17 },
      portfolio: []
    },
    {
      id: "p4_1_09",
      no: 9,
      name: "ด.ช. วชิรวิทย์ ประณีตงาม",
      nickname: "เต้",
      avatar: "👦",
      scores: { task_1: 20, task_2: 20, task_3: 21, task_4: 20, task_5: 10, examScore: 16 },
      portfolio: []
    },
    {
      id: "p4_1_10",
      no: 10,
      name: "ด.ญ. ณิชาภัทร อารมณ์ศิลป์",
      nickname: "ณิชา",
      avatar: "👧",
      scores: { task_1: 19, task_2: 21, task_3: 20, task_4: 19, task_5: 10, examScore: 15 },
      portfolio: []
    },
    {
      id: "p4_1_11",
      no: 11,
      name: "ด.ช. กิตติพงษ์ มือศิลป์",
      nickname: "กาย",
      avatar: "🦖",
      scores: { task_1: 18, task_2: 20, task_3: 19, task_4: 19, task_5: 8, examScore: 14 },
      portfolio: []
    },
    {
      id: "p4_1_12",
      no: 12,
      name: "ด.ญ. วรินทร สุขภาพใจ",
      nickname: "เอย",
      avatar: "🐰",
      scores: { task_1: 18, task_2: 19, task_3: 18, task_4: 18, task_5: 10, examScore: 13 },
      portfolio: []
    }
  ]
};

// Global App State
let appData = {};
let appConfig = {};
let currentGrade = 'p4';
let currentRoom = '1';
let currentView = 'home'; // Starts at Page 1 (THE ART TIME)
let soundEnabled = true;
let stagedImportStudents = [];
let unlockedRooms = new Set();
let activeGalleryTaskId = 'task_1';

// ==========================================
// 1.5 ART BADGES & CARDS DEFINITIONS (20 เหรียญตรา & 6 การ์ดพลัง)
// ==========================================
const ART_BADGES = [
  {
    id: 'fast_learner',
    title: 'Fast Learner: สงครามส่งด่วน',
    shortTitle: 'สงครามส่งด่วน',
    icon: '🚀',
    theme: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
    desc: 'ส่งงานเร็วกว่ากำหนดครบ 3 ครั้ง',
    field: 'early_submit',
    target: 3
  },
  {
    id: 'mission_complete',
    title: 'Mission Complete: มิชชั่นคอมพลีท',
    shortTitle: 'มิชชั่นคอมพลีท',
    icon: '✅',
    theme: 'linear-gradient(135deg, #10B981, #06B6D4)',
    desc: 'ส่งงานครบทุกชิ้นงานในภาคเรียน',
    field: 'all_submitted'
  },
  {
    id: 'beyond_the_future',
    title: 'Beyond the Future: ไอเดียหลุดโลก',
    shortTitle: 'ไอเดียหลุดโลก',
    icon: '🪐',
    theme: 'linear-gradient(135deg, #6366F1, #A855F7)',
    desc: 'มีไอเดียแปลกใหม่ไม่ซ้ำใครครบ 3 งาน',
    field: 'creative_idea',
    target: 3
  },
  {
    id: 'art_pro',
    title: 'Art Pro: ดาวรุ่งพุ่งแรง',
    shortTitle: 'ดาวรุ่งพุ่งแรง',
    icon: '⭐',
    theme: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    desc: 'ได้คะแนนเต็มครบ 3 งาน',
    field: 'perfect_score',
    target: 3
  },
  {
    id: 'master_of_god',
    title: 'Master of God: เทพเจ้าสายอาร์ต',
    shortTitle: 'เทพเจ้าสายอาร์ต',
    icon: '👑',
    theme: 'linear-gradient(135deg, #F59E0B, #FBBF24, #D97706)',
    desc: 'ได้คะแนนเต็มครบ 5 งาน',
    field: 'perfect_score',
    target: 5
  },
  {
    id: 'master_of_details',
    title: 'Master of Details: เป๊ะทุกกระเบียดนิ้ว',
    shortTitle: 'เป๊ะทุกกระเบียดนิ้ว',
    icon: '🔍',
    theme: 'linear-gradient(135deg, #3B82F6, #14B8A6)',
    desc: 'ผลงานสะอาดเรียบร้อยประณีตครบ 3 งาน',
    field: 'clean_neat',
    target: 3
  },
  {
    id: 'color_alchemist',
    title: 'Color Alchemist: เทพเจ้าเฉดสี',
    shortTitle: 'เทพเจ้าเฉดสี',
    icon: '🧪',
    theme: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    desc: 'มิติแสงเงาและเกลี่ยสีงดงามครบ 3 งาน',
    field: 'color_lighting',
    target: 3
  },
  {
    id: 'ultimate_effort',
    title: 'Ultimate Effort: หัวใจไม่ยอมแพ้',
    shortTitle: 'หัวใจไม่ยอมแพ้',
    icon: '💖',
    theme: 'linear-gradient(135deg, #F43F5E, #FB7185)',
    desc: 'มอบให้นักเรียนที่มีความพยายามยอดเยี่ยม (เด็กพิเศษ/ตั้งใจ)',
    field: 'manual'
  },
  {
    id: 'completionist',
    title: 'Completionist: รักษามาตรฐาน',
    shortTitle: 'รักษามาตรฐาน',
    icon: '⏳',
    theme: 'linear-gradient(135deg, #64748B, #94A3B8)',
    desc: 'ส่งงานตรงตามกำหนดครบ 3 งาน',
    field: 'on_time',
    target: 3
  },
  {
    id: 'the_minimalist',
    title: 'The Minimalist: มินิมอลตัวแม่',
    shortTitle: 'มินิมอลตัวแม่',
    icon: '🐱',
    theme: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    desc: 'งานน้อยแต่มาก สไตล์มินิมอลโดดเด่น',
    field: 'manual'
  },
  {
    id: 'the_cleanup_crew',
    title: 'The Cleanup Crew: หน่วยกู้ภัยทำความสะอาด',
    shortTitle: 'หน่วยกู้ภัยทำความสะอาด',
    icon: '🧼',
    theme: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    desc: 'มีจิตอาสาช่วยเก็บ/ล้างอุปกรณ์ หรือทำความสะอาดห้องศิลปะ 3 ครั้ง',
    field: 'clean_room',
    target: 3
  },
  {
    id: 'the_canvas_tank',
    title: 'The Canvas Tank: นักรบสายแทงค์',
    shortTitle: 'นักรบสายแทงค์',
    icon: '🛡️',
    theme: 'linear-gradient(135deg, #475569, #64748B)',
    desc: 'วาดเต็มแผ่น รายละเอียดแน่นไม่เว้นที่ว่างครบ 3 งาน',
    field: 'full_canvas',
    target: 3
  },
  {
    id: 'the_unique_soul',
    title: 'The Unique Soul: ศิลปินอินดี้',
    shortTitle: 'ศิลปินอินดี้',
    icon: '🎭',
    theme: 'linear-gradient(135deg, #A855F7, #EC4899)',
    desc: 'มีสไตล์และลายเส้นเป็นเอกลักษณ์เฉพาะตัว',
    field: 'manual'
  },
  {
    id: 'the_most_improved',
    title: 'The Most Improved: สุดยอดนักพัฒนา',
    shortTitle: 'สุดยอดนักพัฒนา',
    icon: '📈',
    theme: 'linear-gradient(135deg, #10B981, #34D399)',
    desc: 'มีพัฒนาการฝีมือดีขึ้นอย่างก้าวกระโดด',
    field: 'manual'
  },
  {
    id: 'never_give_up',
    title: 'Never Give Up: นักสู้ไม่ยอมแพ้',
    shortTitle: 'นักสู้ไม่ยอมแพ้',
    icon: '🪽',
    theme: 'linear-gradient(135deg, #0284C7, #38BDF8)',
    desc: 'แก้ไขและปรับปรุงชิ้นงานตามคำแนะนำครูจนสมบูรณ์',
    field: 'manual'
  },
  {
    id: 'focus_mode',
    title: 'Focus Mode: สมาธิขั้นสุด',
    shortTitle: 'สมาธิขั้นสุด',
    icon: '🧘',
    theme: 'linear-gradient(135deg, #4F46E5, #818CF8)',
    desc: 'ตั้งใจทำงานเงียบๆ ไม่วอกแวกตลอดทั้งคาบเรียนบ่อยครั้ง',
    field: 'manual'
  },
  {
    id: 'tiny_world',
    title: 'Tiny World: โลกใบจิ๋ว',
    shortTitle: 'โลกใบจิ๋ว',
    icon: '🌍',
    theme: 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
    desc: 'วาดรายละเอียดเล็กๆ ซ่อนไว้ในภาพได้อย่างน่าทึ่ง',
    field: 'manual'
  },
  {
    id: 'collector',
    title: 'Collector: นักสะสมเหรียญตรา',
    shortTitle: 'นักสะสมเหรียญตรา',
    icon: '🏆',
    theme: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    desc: 'สะสมเหรียญตราครบ 10 เหรียญ',
    field: 'badge_count',
    target: 10
  },
  {
    id: 'card_master',
    title: 'Card Master: เจ้าแม่การ์ดนางฟ้า',
    shortTitle: 'เจ้าแม่การ์ดนางฟ้า',
    icon: '🎴',
    theme: 'linear-gradient(135deg, #D946EF, #C084FC)',
    desc: 'แลกหรือสะสมการ์ดพลังไปแล้วอย่างน้อย 3 ใบ',
    field: 'card_count',
    target: 3
  },
  {
    id: 'echo_of_art',
    title: 'Echo of Art: เสียงสะท้อนแห่งศิลปะ',
    shortTitle: 'เสียงสะท้อนแห่งศิลปะ',
    icon: '🗣️',
    theme: 'linear-gradient(135deg, #F97316, #FB923C)',
    desc: 'มีส่วนร่วมในการตอบคำถามและแสดงความคิดเห็นในห้องเรียนบ่อยครั้ง',
    field: 'manual'
  }
];

const ART_CARDS = [
  {
    id: 'card_masterpiece',
    title: 'The Masterpiece',
    thaiTitle: 'มหาผลงานชิ้นเอก',
    rarity: 'legendary',
    rarityLabel: '🌟 ระดับตำนาน (Legendary)',
    power: 'พลังจินตนาการ +100',
    desc: 'ผลงานระดับมาสเตอร์พีซที่ตราตรึงใจ เปล่งประกายดั่งแสงดาวบนท้องฟ้า',
    gradient: 'linear-gradient(135deg, #B45309, #F59E0B, #EF4444)',
    icon: '👑'
  },
  {
    id: 'card_color_alchemist',
    title: 'Color Alchemist',
    thaiTitle: 'จอมเวทย์มนตร์เฉดสี',
    rarity: 'epic',
    rarityLabel: '💜 มหากาพย์ (Epic)',
    power: 'ความเชี่ยวชาญคู่สี +80',
    desc: 'ผู้ควบคุมแสงเงาและเกลี่ยสีได้อย่างมหัศจรรย์ ทุกหยดสีคือเวทมนตร์',
    gradient: 'linear-gradient(135deg, #6D28D9, #8B5CF6, #3B82F6)',
    icon: '🧪'
  },
  {
    id: 'card_speed_rush',
    title: 'Speed Rush',
    thaiTitle: 'พู่กันสายฟ้าส่งด่วน',
    rarity: 'rare',
    rarityLabel: '💙 หายาก (Rare)',
    power: 'ความคล่องแคล่ว +60',
    desc: 'ส่งงานตรงเวลาและรวดเร็วกว่ากำหนด ว่องไวดั่งสายฟ้าฟาด',
    gradient: 'linear-gradient(135deg, #0369A1, #0EA5E9, #10B981)',
    icon: '⚡'
  },
  {
    id: 'card_shield_of_focus',
    title: 'Shield of Focus',
    thaiTitle: 'โล่สมาธิไร้สิ่งรบกวน',
    rarity: 'rare',
    rarityLabel: '💙 หายาก (Rare)',
    power: 'สมาธิแน่วแน่ +60',
    desc: 'โฟกัสกับการสร้างสรรค์งานศิลปะอย่างสงบนิ่ง แม้มีเสียงรบกวนรอบตัว',
    gradient: 'linear-gradient(135deg, #4338CA, #6366F1, #A855F7)',
    icon: '🛡️'
  },
  {
    id: 'card_spark_creativity',
    title: 'Spark of Creativity',
    thaiTitle: 'ประกายจินตนาการ',
    rarity: 'common',
    rarityLabel: '💚 ทั่วไป (Common)',
    power: 'ความคิดริเริ่ม +40',
    desc: 'จุดประกายไอเดียใหม่ๆ ลงบนผืนผ้าใบและแผ่นกระดาษ',
    gradient: 'linear-gradient(135deg, #047857, #10B981, #F59E0B)',
    icon: '✨'
  },
  {
    id: 'card_spirit_cleaning',
    title: 'Spirit of Cleaning',
    thaiTitle: 'ภูติน้อยพิทักษ์ห้องศิลปะ',
    rarity: 'common',
    rarityLabel: '💚 ทั่วไป (Common)',
    power: 'จิตอาสาและความสะอาด +40',
    desc: 'ล้างพู่กัน เก็บจานสี และดูแลห้องเรียนศิลปะให้สะอาดสดใสอยู่เสมอ',
    gradient: 'linear-gradient(135deg, #0F766E, #06B6D4, #3B82F6)',
    icon: '🧹'
  }
];

const CHECKLIST_CRITERIA = [
  { key: 'on_time', label: '⏱️ ส่งงานตรงเวลา', badgeId: 'completionist', desc: 'ส่งตรงกำหนดครบ 3 งาน' },
  { key: 'early_submit', label: '🚀 ส่งงานเร็วกว่ากำหนด', badgeId: 'fast_learner', desc: 'ส่งเร็วครบ 3 งาน' },
  { key: 'clean_neat', label: '🧼 ผลงานสะอาดเรียบร้อย', badgeId: 'master_of_details', desc: 'ผลงานสะอาดประณีต 3 งาน' },
  { key: 'full_score', label: '💯 คะแนนเต็มในชิ้นงาน', badgeId: 'art_pro', desc: 'ได้คะแนนเต็มในงานนั้น (สะสม 3 งานรับเหรียญ Art Pro)' },
  { key: 'creative_idea', label: '🪐 ไอเดียแปลกใหม่', badgeId: 'beyond_the_future', desc: 'ไอเดียแปลกไม่ซ้ำใคร 3 งาน' },
  { key: 'color_lighting', label: '🧪 มิติแสงเงา/คู่สีงดงาม', badgeId: 'color_alchemist', desc: 'เกลี่ยสีสวยงาม 3 งาน' },
  { key: 'full_canvas', label: '🛡️ วาดเต็มแน่นทั้งแผ่น', badgeId: 'the_canvas_tank', desc: 'วาดเต็มแผ่น 3 งาน' },
  { key: 'clean_room', label: '🧹 จิตอาสาทำความสะอาด', badgeId: 'the_cleanup_crew', desc: 'ช่วยล้างอุปกรณ์/ห้อง 3 ครั้ง' }
];

function autoEvaluateStudentBadges(student) {
  if (!student) return;
  if (!student.badges) student.badges = [];
  const revoked = student.revoked_badges || [];
  const tasks = getActiveAssignments();
  let perfectCount = 0;
  let submittedCount = 0;

  tasks.forEach(t => {
    const sc = student.scores ? student.scores[t.id] : undefined;
    if (sc !== undefined && sc !== null && sc !== '') {
      submittedCount++;
      if (Number(sc) === t.maxScore) perfectCount++;
    }
  });

  if (perfectCount >= 3 && !student.badges.includes('art_pro') && !revoked.includes('art_pro')) {
    student.badges.push('art_pro');
  }
  if (perfectCount >= 5 && !student.badges.includes('master_of_god') && !revoked.includes('master_of_god')) {
    student.badges.push('master_of_god');
  }
  if (tasks.length > 0 && submittedCount === tasks.length && !student.badges.includes('mission_complete') && !revoked.includes('mission_complete')) {
    student.badges.push('mission_complete');
  }
  if (student.badges.length >= 10 && !student.badges.includes('collector') && !revoked.includes('collector')) {
    student.badges.push('collector');
  }
  if ((student.cards || []).length >= 3 && !student.badges.includes('card_master') && !revoked.includes('card_master')) {
    student.badges.push('card_master');
  }

  // Auto-grant badges when accumulated checklist criteria target is reached
  CHECKLIST_CRITERIA.forEach(crit => {
    if (crit.badgeId && !student.badges.includes(crit.badgeId) && !revoked.includes(crit.badgeId)) {
      const bDef = ART_BADGES.find(b => b.id === crit.badgeId);
      const target = (bDef && bDef.target) ? bDef.target : 3;
      let cnt = 0;
      tasks.forEach(t => {
        if (student.checklist && student.checklist[t.id] && student.checklist[t.id][crit.key]) {
          cnt++;
        }
      });
      if (cnt >= target) {
        student.badges.push(crit.badgeId);
      }
    }
  });
}

// ==========================================
// 2. AUDIO SYNTHESIS ENGINE (Web Audio API)
// ==========================================
class ArtSoundPlayer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  ensureActive() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playPop() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playWheelTick() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.025);
    } catch (e) {}
  }

  playChime() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.5, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playFanfare() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.1));

        gain.gain.setValueAtTime(0, this.ctx.currentTime + (idx * 0.1));
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + (idx * 0.1) + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (idx * 0.1) + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + (idx * 0.1));
        osc.stop(this.ctx.currentTime + (idx * 0.1) + 0.36);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playSaveChime() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const notes = [587.33, 880.00];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.08));

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime + (idx * 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (idx * 0.08) + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + (idx * 0.08));
        osc.stop(this.ctx.currentTime + (idx * 0.08) + 0.26);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playUnlock() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (idx * 0.06));

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + (idx * 0.06));
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (idx * 0.06) + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + (idx * 0.06));
        osc.stop(this.ctx.currentTime + (idx * 0.06) + 0.21);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playError() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.21);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playCamera() {
    if (!soundEnabled) return;
    this.ensureActive();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

const artSound = new ArtSoundPlayer();

// ==========================================
// 3. CONFETTI EFFECT ENGINE
// ==========================================
class ConfettiManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.colors = ['#FF5E7E', '#FFAA00', '#2FD0A5', '#5B6BF9', '#9D4EDD', '#FFD166', '#06D6A0'];
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  fire(count = 80) {
    this.resize();
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: window.innerWidth * (0.3 + Math.random() * 0.4),
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 14,
        size: Math.random() * 8 + 6,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        life: 1,
        decay: 0.012 + Math.random() * 0.008
      });
    }

    if (!this.animationId) {
      this.animate();
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rotation += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0 || p.y > window.innerHeight) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);

      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

let confettiEngine;

// ==========================================
// 4. DATA & STORAGE MANAGEMENT
// ==========================================
function loadStorage() {
  const savedConfig = localStorage.getItem(STORAGE_CONFIG_KEY);
  if (savedConfig) {
    try {
      appConfig = JSON.parse(savedConfig);
    } catch (e) {
      appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  } else {
    appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    saveConfigToStorage();
  }

  // Ensure assignments array exists
  if (!appConfig.assignments || !Array.isArray(appConfig.assignments) || appConfig.assignments.length === 0) {
    appConfig.assignments = JSON.parse(JSON.stringify(DEFAULT_CONFIG.assignments));
    saveConfigToStorage();
  }

  const savedData = localStorage.getItem(STORAGE_DATA_KEY);
  if (savedData) {
    try {
      appData = JSON.parse(savedData);
    } catch (e) {
      appData = JSON.parse(JSON.stringify(DEFAULT_STUDENTS_DATA));
    }
  } else {
    appData = JSON.parse(JSON.stringify(DEFAULT_STUDENTS_DATA));
    saveDataToStorage();
  }
}

function saveDataToStorage() {
  localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(appData));
}

function saveConfigToStorage() {
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(appConfig));
}

// Cloud Database (Neon PostgreSQL) Synchronization Layer
let isCloudDbConnected = false;

async function checkAndSyncCloudDb() {
  try {
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.dbConnected) {
        isCloudDbConnected = true;
        if (data.config && typeof data.config === 'object' && Object.keys(data.config).length > 2) {
          appConfig = { ...DEFAULT_CONFIG, ...data.config };
        }
        if (data.students) appData = data.students;
        if (data.accounts) saveAccounts(data.accounts);

        // Mirror to local cache
        saveDataToStorage();
        saveConfigToStorage();

        populateGradeDropdowns();
        if (currentView === 'teacher') renderTeacherView();
        else if (currentView === 'home') renderHomeView();
        else renderLeaderboardView();
        return;
      }
    }
  } catch (e) {
    // Serverless API not available (e.g. running via file:// or offline)
  }

  isCloudDbConnected = false;
}

async function apiPost(payload) {
  if (!isCloudDbConnected) return null;
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.warn("Neon Cloud DB sync error:", e);
    return null;
  }
}

function getClassKey(grade = currentGrade, room = currentRoom) {
  return `${grade}_${room}`;
}

function getStudentsList(grade = currentGrade, room = currentRoom) {
  const key = getClassKey(grade, room);
  if (!appData[key]) {
    appData[key] = [];
  }
  return appData[key];
}

// Assignments helpers - Scoped per year, semester, grade, and room
function getRoomAssignmentKey(grade = currentGrade, room = currentRoom) {
  const year = appConfig.academicYear || "2567";
  const sem = appConfig.semester || "1";
  return `${year}_${sem}_${grade}_${room}`;
}

function getActiveAssignments(grade = currentGrade, room = currentRoom) {
  if (!appConfig.roomAssignments) appConfig.roomAssignments = {};
  const termRoomKey = getRoomAssignmentKey(grade, room);
  const roomKey = `${grade}_${room}`;

  // 1. Check Year + Semester + Grade + Room specific
  if (Array.isArray(appConfig.roomAssignments[termRoomKey]) && appConfig.roomAssignments[termRoomKey].length > 0) {
    return appConfig.roomAssignments[termRoomKey];
  }

  // 2. Check Grade + Room fallback
  if (Array.isArray(appConfig.roomAssignments[roomKey]) && appConfig.roomAssignments[roomKey].length > 0) {
    return appConfig.roomAssignments[roomKey];
  }

  // 3. Fallback to global assignments
  if (Array.isArray(appConfig.assignments) && appConfig.assignments.length > 0) {
    return appConfig.assignments;
  }

  return DEFAULT_CONFIG.assignments;
}

function ensureRoomAssignmentsMutable(grade = currentGrade, room = currentRoom) {
  if (!appConfig.roomAssignments) appConfig.roomAssignments = {};
  const termRoomKey = getRoomAssignmentKey(grade, room);
  if (!Array.isArray(appConfig.roomAssignments[termRoomKey])) {
    const currentList = getActiveAssignments(grade, room);
    appConfig.roomAssignments[termRoomKey] = JSON.parse(JSON.stringify(currentList));
  }
  return appConfig.roomAssignments[termRoomKey];
}

function getTotalMaxScore(grade = currentGrade, room = currentRoom) {
  const tasks = getActiveAssignments(grade, room);
  return tasks.reduce((sum, t) => sum + (Number(t.maxScore) || 0), 0);
}

function calcStudentRawAssignmentScore(student, grade = currentGrade, room = currentRoom) {
  const tasks = getActiveAssignments(grade, room);
  const scores = student.scores || {};
  let total = 0;
  tasks.forEach(t => {
    const val = Number(scores[t.id]);
    if (!isNaN(val)) total += val;
  });
  return total;
}

function isPrimaryGrade(gradeId = currentGrade) {
  return ['p4', 'p5', 'p6'].includes(gradeId);
}

function getClassScoreScale(gradeId = currentGrade) {
  if (isPrimaryGrade(gradeId)) {
    return {
      maxAssignment: 40,
      maxExam: 10,
      maxTotal: 50,
      hasGrade: false
    };
  }
  return {
    maxAssignment: 80,
    maxExam: 20,
    maxTotal: 100,
    hasGrade: true
  };
}

function calcStudentAssignmentScore(student, gradeId = currentGrade, roomId = currentRoom) {
  const raw = calcStudentRawAssignmentScore(student, gradeId, roomId);
  const scale = getClassScoreScale(gradeId);
  return Math.min(scale.maxAssignment, Math.round(raw * 10) / 10);
}

function calcStudentAssignmentScore80(student) {
  return calcStudentAssignmentScore(student, currentGrade, currentRoom);
}

function calcStudentExamScore(student, gradeId = currentGrade) {
  const scores = student.scores || {};
  const rawExam = Number(scores.examScore ?? student.examScore ?? 0);
  const scale = getClassScoreScale(gradeId);
  return Math.min(scale.maxExam, Math.round(rawExam * 10) / 10);
}

function calcStudentTotalScore(student, gradeId = currentGrade, roomId = currentRoom) {
  const sc = calcStudentAssignmentScore(student, gradeId, roomId);
  const exam = calcStudentExamScore(student, gradeId);
  const scale = getClassScoreScale(gradeId);
  return Math.min(scale.maxTotal, Math.round((sc + exam) * 10) / 10);
}

function calcStudentTotal100(student) {
  return calcStudentTotalScore(student, currentGrade, currentRoom);
}

function calculateGrade(totalScore, gradeId = currentGrade) {
  const scale = getClassScoreScale(gradeId);
  if (!scale.hasGrade) return "";
  const s = Math.round(Number(totalScore || 0) * 10) / 10;
  if (s >= 80) return "4";
  if (s >= 75) return "3.5";
  if (s >= 70) return "3";
  if (s >= 65) return "2.5";
  if (s >= 60) return "2";
  if (s >= 55) return "1.5";
  if (s >= 50) return "1";
  return "0";
}

function getSubmittedTasksCount(student, grade = currentGrade, room = currentRoom) {
  const tasks = getActiveAssignments(grade, room);
  const scores = student.scores || {};
  let count = 0;
  tasks.forEach(t => {
    if (scores[t.id] !== undefined && scores[t.id] !== null && scores[t.id] !== '') {
      count++;
    }
  });
  return count;
}

function getRankedStudents(grade = currentGrade, room = currentRoom) {
  const list = [...getStudentsList(grade, room)];
  list.forEach(s => autoEvaluateStudentBadges(s));
  return list.sort((a, b) => {
    const scoreA = calcStudentTotalScore(a, grade, room);
    const scoreB = calcStudentTotalScore(b, grade, room);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    // Tie-breaker: submitted tasks count
    const submittedA = getSubmittedTasksCount(a, grade, room);
    const submittedB = getSubmittedTasksCount(b, grade, room);
    if (submittedB !== submittedA) {
      return submittedB - submittedA;
    }
    // Final tie-breaker: student number
    return (a.no || 0) - (b.no || 0);
  });
}

// 7 HILARIOUS RANK TIERS as specified in brief
function getArtRankTier(totalScore, gradeId = currentGrade) {
  const scale = getClassScoreScale(gradeId);
  const normalized = (Number(totalScore || 0) / scale.maxTotal) * 100;
  const s = Math.round(normalized * 10) / 10;
  if (s >= 100) {
    return {
      title: "มหาเทพไร้พ่าย ก็มาดิครับ",
      rankName: "แรงก์เลเจนดารี",
      label: "แรงก์เลเจนดารี - “มหาเทพไร้พ่าย ก็มาดิครับ”",
      class: "tier-legendary",
      icon: "👑"
    };
  }
  if (s >= 90) {
    return {
      title: "ร่างทรงแวนโก๊ะ",
      rankName: "แรงก์มาสเตอร์",
      label: "แรงก์มาสเตอร์ - “ร่างทรงแวนโก๊ะ”",
      class: "tier-master",
      icon: "🏆"
    };
  }
  if (s >= 80) {
    return {
      title: "มือขวาปีกัสโซ่",
      rankName: "แรงก์อีลิต",
      label: "แรงก์อีลิต - “มือขวาปีกัสโซ่”",
      class: "tier-elite",
      icon: "🎨"
    };
  }
  if (s >= 60) {
    return {
      title: "จิตรกรยุคฟื้นฟู",
      rankName: "แรงก์ไดม่อน",
      label: "แรงก์ไดม่อน - “จิตรกรยุคฟื้นฟู”",
      class: "tier-diamond",
      icon: "👨🏻‍🎨"
    };
  }
  if (s >= 40) {
    return {
      title: "เน้นส่ง ไม่เน้นสวย",
      rankName: "แรงก์โกลด์",
      label: "แรงก์โกลด์ - “เน้นส่ง ไม่เน้นสวย”",
      class: "tier-gold",
      icon: "🤦🏻‍♂️"
    };
  }
  if (s >= 20) {
    return {
      title: "เด็กล้างพู่กัน",
      rankName: "แรงก์ซิลเวอร์",
      label: "แรงก์ซิลเวอร์ - “เด็กล้างพู่กัน”",
      class: "tier-silver",
      icon: "🪣"
    };
  }
  return {
    title: "ทาสในเรือนเบี้ย",
    rankName: "แรงก์บรอนซ์",
    label: "แรงก์บรอนซ์ - “ทาสในเรือนเบี้ย”",
    class: "tier-bronze",
    icon: "🪠"
  };
}

function getGradeLabel(gradeKey) {
  const found = appConfig.grades.find(g => g.id === gradeKey);
  const raw = found ? found.name : gradeKey;
  // Always remove (ป.4), (ม.1) etc. as requested in brief
  return String(raw || '').replace(/\s*\([ปม]\.[0-9]\)/g, '').trim();
}

// ==========================================
// 5. DROPDOWN POPULATION & SYNC
// ==========================================
// ==========================================
// 5. HELPER: CLIENT-SIDE CANVAS IMAGE RESIZING
// ==========================================
function resizeImageToCanvas(file, maxWidth = 300, maxHeight = 300, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error("ไฟล์ที่เลือกไม่ใช่รูปภาพ"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error("ไม่สามารถอ่านรูปภาพได้"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("การอ่านไฟล์ล้มเหลว"));
    reader.readAsDataURL(file);
  });
}

function applyBackgroundTheme() {
  const customUrl = appConfig.customBgUrl || '';
  const theme = appConfig.bgTheme || 'theme-pastel';
  const bgCanvas = document.getElementById('artBgCanvas');

  if (customUrl.trim()) {
    document.body.style.backgroundImage = `linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.92)), url("${customUrl.trim()}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundPosition = 'center';
    if (bgCanvas) bgCanvas.style.opacity = '0.35';
  } else {
    document.body.style.backgroundImage = 'linear-gradient(rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.92)), url("assets/school_bg.jpg")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundPosition = '28% top';
    document.body.className = theme;
    if (bgCanvas) bgCanvas.style.opacity = '0.4';
  }
}

// ==========================================
// 6. DROPDOWN POPULATION & SYNC
// ==========================================
function populateGradeDropdowns() {
  const homeGradeSelect = document.getElementById('homeGradeSelect');
  const teacherGradeSelect = document.getElementById('teacherGradeSelect');
  const configNewRoomGrade = document.getElementById('configNewRoomGrade');
  const leaderboardGradeSelect = document.getElementById('leaderboardGradeSelect');

  const optionsHtml = (appConfig.grades || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');

  if (homeGradeSelect) homeGradeSelect.innerHTML = optionsHtml;
  if (teacherGradeSelect) teacherGradeSelect.innerHTML = optionsHtml;
  if (configNewRoomGrade) configNewRoomGrade.innerHTML = optionsHtml;
  if (leaderboardGradeSelect) leaderboardGradeSelect.innerHTML = optionsHtml;

  if (homeGradeSelect) homeGradeSelect.value = currentGrade;
  if (teacherGradeSelect) teacherGradeSelect.value = currentGrade;
  if (configNewRoomGrade) configNewRoomGrade.value = currentGrade;
  if (leaderboardGradeSelect) leaderboardGradeSelect.value = currentGrade;

  populateRoomDropdowns();
}

function populateRoomDropdowns() {
  const homeRoomSelect = document.getElementById('homeRoomSelect');
  const teacherRoomSelect = document.getElementById('teacherRoomSelect');
  const leaderboardRoomSelect = document.getElementById('leaderboardRoomSelect');

  const availableRooms = (appConfig.rooms && appConfig.rooms[currentGrade]) || ['1', '2', '3'];

  if (!availableRooms.includes(currentRoom)) {
    currentRoom = availableRooms[0] || '1';
  }

  const optionsHtml = availableRooms.map(r => {
    const isStandardNo = !isNaN(r);
    const label = isStandardNo ? `ห้อง ${r}` : r;
    return `<option value="${r}">${label}</option>`;
  }).join('');

  if (homeRoomSelect) {
    homeRoomSelect.innerHTML = optionsHtml;
    homeRoomSelect.value = currentRoom;
  }
  if (teacherRoomSelect) {
    teacherRoomSelect.innerHTML = optionsHtml;
    teacherRoomSelect.value = currentRoom;
  }
  if (leaderboardRoomSelect) {
    leaderboardRoomSelect.innerHTML = optionsHtml;
    leaderboardRoomSelect.value = currentRoom;
  }
}

// ==========================================
// 7. VIEW RENDERING: HOME & THE ART TIME MAGAZINE
// ==========================================
function renderHomeView() {
  const schoolName = appConfig.schoolName || "โรงเรียนบริษัทไทยกสิกรสงเคราะห์";
  const schoolLogo = appConfig.schoolLogo || "assets/school_logo.png";
  const semester = appConfig.semester || "1";
  const academicYear = appConfig.academicYear || "2567";

  const nameElem = document.getElementById('schoolNameDisplay');
  const footerNameElem = document.getElementById('footerSchoolName');
  const logoElem = document.getElementById('schoolLogoDisplay');
  const logoImg = document.getElementById('schoolLogoImg');
  const stripLogo = document.querySelector('.school-strip-logo');
  const termBadge = document.getElementById('semesterYearBadge');
  const magDate = document.getElementById('magazineIssueDate');

  if (nameElem) nameElem.textContent = schoolName;
  if (footerNameElem) footerNameElem.textContent = schoolName;

  const isImg = schoolLogo.includes('/') || schoolLogo.startsWith('data:image');
  if (isImg) {
    if (logoImg) {
      logoImg.src = schoolLogo;
      logoImg.classList.remove('hidden');
    }
    if (logoElem) logoElem.classList.add('hidden');
    if (stripLogo) stripLogo.src = schoolLogo;
  } else {
    if (logoElem) {
      logoElem.textContent = schoolLogo;
      logoElem.classList.remove('hidden');
    }
    if (logoImg) logoImg.classList.add('hidden');
  }

  if (termBadge) termBadge.textContent = `ภาคเรียนที่ ${semester} ปีการศึกษา ${academicYear}`;
  if (magDate) magDate.textContent = `ฉบับพิเศษ • ภาคเรียนที่ ${semester} ปีการศึกษา ${academicYear}`;

  // Populate Magazine from appConfig.magazine
  const mag = appConfig.magazine || {};
  if (mag.head1 && document.getElementById('magHead1')) document.getElementById('magHead1').textContent = mag.head1;
  if (mag.copy1 && document.getElementById('magCopy1')) document.getElementById('magCopy1').textContent = mag.copy1;
  if (mag.pic1 && document.getElementById('magPic1')) document.getElementById('magPic1').src = mag.pic1;
  if (document.getElementById('magPicCaption1')) {
    document.getElementById('magPicCaption1').textContent = mag.caption1 !== undefined ? mag.caption1 : DEFAULT_MAGAZINE_DATA.caption1;
  }
  if (mag.pic2 && document.getElementById('magPic2')) document.getElementById('magPic2').src = mag.pic2;
  if (document.getElementById('magPicCaption2')) {
    document.getElementById('magPicCaption2').textContent = mag.caption2 !== undefined ? mag.caption2 : DEFAULT_MAGAZINE_DATA.caption2;
  }
  if (mag.pic3 && document.getElementById('magPic3')) document.getElementById('magPic3').src = mag.pic3;
  if (document.getElementById('magPicCaption3')) {
    document.getElementById('magPicCaption3').textContent = mag.caption3 !== undefined ? mag.caption3 : DEFAULT_MAGAZINE_DATA.caption3;
  }
  if (mag.head2 && document.getElementById('magHead2')) document.getElementById('magHead2').textContent = mag.head2;
  if (mag.copy2 && document.getElementById('magCopy2')) document.getElementById('magCopy2').textContent = mag.copy2;
  if (mag.pic4 && document.getElementById('magPic4')) document.getElementById('magPic4').src = mag.pic4;
  if (mag.quote && document.getElementById('magQuoteText')) document.getElementById('magQuoteText').textContent = mag.quote;

  renderMagazinePhotoToggles();
  initMagazinePhotoLightbox();
  applyBackgroundTheme();
}

function renderMagazinePhotoToggles() {
  const mag = appConfig.magazine || {};
  const show1 = mag.showPic1 !== false;
  const show2 = mag.showPic2 !== false;
  const show3 = mag.showPic3 !== false;

  const box1 = document.getElementById('magBoxPic1');
  const wrap1 = document.getElementById('magWrapPic1');
  const teacherPlaceholder1 = document.getElementById('teacherPlaceholderPic1');

  const box2 = document.getElementById('magBoxPic2');
  const wrap2 = document.getElementById('magWrapPic2');
  const teacherPlaceholder2 = document.getElementById('teacherPlaceholderPic2');

  const box3 = document.getElementById('magBoxPic3');
  const wrap3 = document.getElementById('magWrapPic3');
  const teacherPlaceholder3 = document.getElementById('teacherPlaceholderPic3');

  const topLayout = document.getElementById('magLayoutTop');
  const isTeacher = !!getLoggedInTeacher();

  // Item 1 (Lead Story Hero Photo)
  if (box1 && wrap1) {
    if (show1) {
      box1.classList.remove('hidden');
      wrap1.classList.remove('hidden');
      if (teacherPlaceholder1) teacherPlaceholder1.classList.add('hidden');
      if (topLayout) topLayout.classList.remove('no-pic-1');
    } else {
      if (isTeacher) {
        box1.classList.remove('hidden');
        wrap1.classList.add('hidden');
        if (teacherPlaceholder1) teacherPlaceholder1.classList.remove('hidden');
        if (topLayout) topLayout.classList.remove('no-pic-1');
      } else {
        box1.classList.add('hidden');
        wrap1.classList.add('hidden');
        if (teacherPlaceholder1) teacherPlaceholder1.classList.add('hidden');
        if (topLayout) topLayout.classList.add('no-pic-1');
      }
    }
  }

  // Item 2 (Highlight Photo 2)
  if (box2 && wrap2) {
    if (show2) {
      box2.classList.remove('hidden');
      wrap2.classList.remove('hidden');
      if (teacherPlaceholder2) teacherPlaceholder2.classList.add('hidden');
    } else {
      if (isTeacher) {
        box2.classList.remove('hidden');
        wrap2.classList.add('hidden');
        if (teacherPlaceholder2) teacherPlaceholder2.classList.remove('hidden');
      } else {
        box2.classList.add('hidden');
        wrap2.classList.add('hidden');
        if (teacherPlaceholder2) teacherPlaceholder2.classList.add('hidden');
      }
    }
  }

  // Item 3 (Highlight Photo 3)
  if (box3 && wrap3) {
    if (show3) {
      box3.classList.remove('hidden');
      wrap3.classList.remove('hidden');
      if (teacherPlaceholder3) teacherPlaceholder3.classList.add('hidden');
    } else {
      if (isTeacher) {
        box3.classList.remove('hidden');
        wrap3.classList.add('hidden');
        if (teacherPlaceholder3) teacherPlaceholder3.classList.remove('hidden');
      } else {
        box3.classList.add('hidden');
        wrap3.classList.add('hidden');
        if (teacherPlaceholder3) teacherPlaceholder3.classList.add('hidden');
      }
    }
  }

  // Clean up existing quick-toggle pills
  document.querySelectorAll('.btn-mag-quick-toggle-wrap').forEach(el => el.remove());

  // If teacher is logged in and photos are shown, inject quick-toggle button into the photo cards
  if (isTeacher) {
    [1, 2, 3].forEach(num => {
      const isShown = (num === 1 && show1) || (num === 2 && show2) || (num === 3 && show3);
      const wrap = document.getElementById(`magWrapPic${num}`);
      if (wrap && isShown) {
        const toggleBtnWrap = document.createElement('div');
        toggleBtnWrap.className = 'btn-mag-quick-toggle-wrap';
        toggleBtnWrap.style.cssText = 'position: absolute; top: 10px; left: 10px; z-index: 5;';
        toggleBtnWrap.innerHTML = `
          <button type="button" class="btn-mag-quick-toggle" onclick="event.stopPropagation(); toggleMagazineImageVisibility(${num})" title="ปิด/ซ่อนการแสดงรูปภาพนี้">
            <span>🙈 ปิดรูป</span>
          </button>
        `;
        wrap.appendChild(toggleBtnWrap);
      }
    });
  }
}

function toggleMagazineImageVisibility(num) {
  if (!appConfig.magazine) appConfig.magazine = {};
  const key = `showPic${num}`;
  const current = appConfig.magazine[key] !== false;
  appConfig.magazine[key] = !current;

  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  artSound.playPop();
  showToast(appConfig.magazine[key] ? `เปิดแสดงรูปภาพที่ ${num} เรียบร้อย 🖼️` : `ปิดซ่อนรูปภาพที่ ${num} เรียบร้อย 🙈`);
  renderMagazinePhotoToggles();
}
window.toggleMagazineImageVisibility = toggleMagazineImageVisibility;

function initMagazinePhotoLightbox() {
  const configs = [
    { picId: 'magPic1', titleId: 'magHead1', defaultTitle: 'ศิลปะกับพลังแห่งจินตนาการ' },
    { picId: 'magPic2', titleId: 'magHead2', defaultTitle: 'เทคนิคสีโปสเตอร์และคู่สีตรงข้าม' },
    { picId: 'magPic3', titleId: 'magHead2', defaultTitle: 'จินตนาการลายเส้นที่ไร้กรอบจำกัด' }
  ];

  configs.forEach(c => {
    const img = document.getElementById(c.picId);
    if (!img) return;
    const parentWrap = img.closest('.mag-photo-wrap-fill');
    if (!parentWrap) return;

    parentWrap.onclick = (e) => {
      if (e.target.closest('.btn-mag-quick-toggle')) return;
      const headEl = document.getElementById(c.titleId);
      const title = (headEl ? headEl.textContent : '') || c.defaultTitle;
      const src = img.src;
      if (src && !src.endsWith('#') && src !== window.location.href) {
        openPhotoLightbox(src, title, "📰 ภาพประกอบจาก THE ART TIME • คลิก ✕ หรือคลิกนอกกรอบเพื่อปิดรูป");
      }
    };
  });
}

// Room Passcode Handler
let pendingPasscodeGrade = null;
let pendingPasscodeRoom = null;

function requestRoomAccess(targetGrade, targetRoom) {
  const targetKey = `${targetGrade}_${targetRoom}`;
  const loggedTeacher = getLoggedInTeacher();

  // If teacher is logged in or room already unlocked in this session, go directly
  if (loggedTeacher || unlockedRooms.has(targetKey)) {
    currentGrade = targetGrade;
    currentRoom = targetRoom;
    switchView('leaderboard');
    return;
  }

  // Open Passcode Modal
  pendingPasscodeGrade = targetGrade;
  pendingPasscodeRoom = targetRoom;
  const modal = document.getElementById('roomPasscodeModal');
  const targetText = document.getElementById('passcodeTargetClassText');
  const errAlert = document.getElementById('passcodeErrorAlert');
  const input = document.getElementById('inputRoomPasscode');

  if (targetText) targetText.textContent = `เข้าสู่ห้องเรียน ${getGradeLabel(targetGrade)} ห้อง ${targetRoom}`;
  if (errAlert) errAlert.classList.add('hidden');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 150);
  }
  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
}

function closePasscodeModal() {
  const modal = document.getElementById('roomPasscodeModal');
  if (modal) modal.classList.add('hidden');
  pendingPasscodeGrade = null;
  pendingPasscodeRoom = null;
}

function handlePasscodeSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('inputRoomPasscode');
  const enteredPass = input ? input.value.trim() : '';
  const errAlert = document.getElementById('passcodeErrorAlert');

  if (!pendingPasscodeGrade || !pendingPasscodeRoom) return;

  const targetKey = `${pendingPasscodeGrade}_${pendingPasscodeRoom}`;
  const passcodes = appConfig.roomPasscodes || {};
  const correctPass = passcodes[targetKey] || passcodes['default'] || "1234";

  if (enteredPass === correctPass) {
    unlockedRooms.add(targetKey);
    currentGrade = pendingPasscodeGrade;
    currentRoom = pendingPasscodeRoom;
    closePasscodeModal();
    switchView('leaderboard');
    artSound.playUnlock();
    showToast(`ปลดล็อกเข้าสู่ ${getGradeLabel(currentGrade)} ห้อง ${currentRoom} สำเร็จ! 🎨`);
    confettiEngine.fire(50);
  } else {
    artSound.playError();
    if (errAlert) errAlert.classList.remove('hidden');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function getRoomSlogan(grade = currentGrade, room = currentRoom) {
  const key = `${grade}_${room}`;
  if (appConfig.roomSlogans && appConfig.roomSlogans[key] !== undefined && appConfig.roomSlogans[key] !== null) {
    return appConfig.roomSlogans[key];
  }
  if (appConfig.roomSlogans && appConfig.roomSlogans['default'] !== undefined && appConfig.roomSlogans['default'] !== null) {
    return appConfig.roomSlogans['default'];
  }
  return '👑 "มีแต่ลิฟต์เท่านั้นที่จะเอาหนูลงได้" 👑';
}

function setRoomSlogan(grade = currentGrade, room = currentRoom, slogan = '') {
  if (!appConfig.roomSlogans) appConfig.roomSlogans = {};
  const key = `${grade}_${room}`;
  const clean = slogan !== undefined && slogan !== null ? slogan.trim() : '';
  appConfig.roomSlogans[key] = clean;
  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });
}

// ==========================================
// 8. VIEW RENDERING: ROOM LEADERBOARD & PODIUM
// ==========================================
function renderLeaderboardView() {
  const ranked = getRankedStudents(currentGrade, currentRoom);
  const tasks = getActiveAssignments();

  const titleElem = document.getElementById('currentRoomDisplayTitle');
  const countElem = document.getElementById('roomStudentsCountBadge');
  const termBadge = document.getElementById('podiumTermYearDisplay');
  const sloganElem = document.getElementById('podiumCustomTitle');
  const quickEditBtn = document.getElementById('quickEditSloganBtn');

  const semester = appConfig.semester || "1";
  const academicYear = appConfig.academicYear || "2567";

  if (titleElem) titleElem.textContent = `${getGradeLabel(currentGrade)} / ห้อง ${currentRoom}`;
  if (countElem) countElem.textContent = `${ranked.length} คน`;
  if (termBadge) termBadge.textContent = `ภาคเรียนที่ ${semester} ปีการศึกษา ${academicYear}`;
  const sloganText = getRoomSlogan(currentGrade, currentRoom);
  if (sloganElem) {
    if (sloganText && sloganText.trim()) {
      sloganElem.textContent = sloganText;
      sloganElem.style.display = '';
    } else {
      sloganElem.textContent = '';
      sloganElem.style.display = 'none';
    }
  }

  const scale = getClassScoreScale(currentGrade);
  const subtitleElem = document.getElementById('tableHeaderSubtitle');
  if (subtitleElem) {
    subtitleElem.textContent = `คะแนนเก็บ ${scale.maxAssignment} คะแนนสอบ ${scale.maxExam} รวม ${scale.maxTotal} คะแนน`;
  }

  // Teacher Class & Room Switcher (Visible only when logged in as teacher)
  const isTeacher = !!getLoggedInTeacher();
  if (quickEditBtn) {
    quickEditBtn.classList.toggle('hidden', !isTeacher);
  }
  const lbTeacherPicker = document.getElementById('leaderboardTeacherClassPicker');
  if (lbTeacherPicker) {
    if (isTeacher) {
      lbTeacherPicker.classList.remove('hidden');
      const lbGrade = document.getElementById('leaderboardGradeSelect');
      const lbRoom = document.getElementById('leaderboardRoomSelect');
      if (lbGrade) lbGrade.value = currentGrade;
      if (lbRoom) lbRoom.value = currentRoom;
    } else {
      lbTeacherPicker.classList.add('hidden');
    }
  }

  renderPodium(ranked);
  renderRankTable(ranked);
  renderClassroomGallery();
}

function renderPodium(ranked) {
  const slot1 = document.getElementById('slotRank1');
  const slot2 = document.getElementById('slotRank2');
  const slot3 = document.getElementById('slotRank3');

  const top1 = ranked[0] || null;
  const top2 = ranked[1] || null;
  const top3 = ranked[2] || null;

  slot1.innerHTML = buildPodiumSlotHtml(top1, 1);
  slot2.innerHTML = buildPodiumSlotHtml(top2, 2);
  slot3.innerHTML = buildPodiumSlotHtml(top3, 3);

  [
    { slot: slot1, student: top1, rank: 1 },
    { slot: slot2, student: top2, rank: 2 },
    { slot: slot3, student: top3, rank: 3 }
  ].forEach(item => {
    const card = item.slot.querySelector('.podium-student-card');
    if (card && item.student) {
      card.addEventListener('click', () => {
        artSound.playFanfare();
        confettiEngine.fire(60);
        openStudentProfileModal(item.student);
      });
    }
  });
}

function buildPodiumSlotHtml(student, rank) {
  const badgeEmojis = { 1: '👑', 2: '🥈', 3: '🥉' };
  const stepLabel = rank === 1 ? '1ST PLACE' : rank === 2 ? '2ND PLACE' : '3RD PLACE';
  const tasks = getActiveAssignments();
  const scale = getClassScoreScale(currentGrade);

  if (!student) {
    return `
      <div class="podium-student-card" style="opacity: 0.6; cursor: default;">
        <div class="rank-badge-floater">${badgeEmojis[rank]}</div>
        <div class="avatar-halo">🎨</div>
        <div class="podium-student-name">ยังไม่มีนักเรียน</div>
        <div class="podium-score-tag">- <span class="unit">คะแนน</span></div>
      </div>
      <div class="podium-block">
        <div class="podium-step-number">${rank}</div>
        <div class="podium-step-sub">${stepLabel}</div>
      </div>
    `;
  }

  const totalScore = calcStudentTotalScore(student, currentGrade);
  const tier = getArtRankTier(totalScore, currentGrade);
  const submittedCount = getSubmittedTasksCount(student, currentGrade, currentRoom);

  const avatarDisplay = student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('data:image'))
    ? `<img src="${student.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" alt="${student.name}">`
    : (student.avatar || '🎨');

  const miniBadgesHtml = (student.badges && student.badges.length > 0)
    ? `<div class="student-mini-badges" style="justify-content: center; margin-top: 6px;">
        ${student.badges.map(bId => {
          const bDef = ART_BADGES.find(b => b.id === bId);
          return bDef ? `<img src="assets/badges/${bDef.id}.jpg" class="mini-badge-img" title="${bDef.title}: ${bDef.desc}" alt="${bDef.title}">` : "";
        }).join("")}
      </div>`
    : "";

  return `
    <div class="podium-student-card" title="คลิกเพื่อดูโปรไฟล์และผลงานศิลปะของ ${student.name}">
      <div class="rank-badge-floater" title="อันดับที่ ${rank}">${badgeEmojis[rank]}</div>
      <div class="avatar-halo">${avatarDisplay}</div>
      <h3 class="podium-student-name">${student.name}</h3>
      <div class="podium-task-summary">📝 ส่งครบ ${submittedCount}/${tasks.length} งาน</div>
      ${miniBadgesHtml}
      <div class="podium-score-tag">
        ${totalScore} <span class="unit">/ ${scale.maxTotal} คะแนน</span>
      </div>
      <div class="podium-tier-label ${tier.class}">
        <span>${tier.icon}</span> <span>${tier.label}</span>
      </div>
      <button type="button" class="btn btn-sm btn-outline" style="margin-top: 8px; font-size: 0.76rem; border-radius: var(--radius-full);">
        🎨 ดูผลงาน & โปรไฟล์
      </button>
    </div>
    <div class="podium-block">
      <div class="podium-step-number">${rank}</div>
      <div class="podium-step-sub">${stepLabel}</div>
    </div>
  `;
}

function triggerStudentAvatarUpload(student) {
  if (!student) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.onchange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const resized = await resizeImageToCanvas(e.target.files[0], 250, 250, 0.85);
        student.avatar = resized;
        saveDataToStorage();
        apiPost({
          action: 'save_student',
          grade: currentGrade,
          room: currentRoom,
          student: student
        });
        artSound.playCamera();
        confettiEngine.fire(45);
        showToast(`อัปเดตรูปประจำตัวของ ${student.name} เรียบร้อยแล้ว! 📸`);
        if (currentView === 'leaderboard') renderLeaderboardView();
        else if (currentView === 'teacher') renderTeacherView();
        const profileModal = document.getElementById('studentProfileModal');
        if (profileModal && !profileModal.classList.contains('hidden') && currentProfileStudent?.id === student.id) {
          openStudentProfileModal(student);
        }
      } catch (err) {
        alert("ไม่สามารถบันทึกรูปภาพได้: " + err.message);
      }
    }
    input.remove();
  };
  input.click();
}

function renderRankTable(ranked) {
  const theadRow = document.getElementById('rankTableHeadRow');
  const tbody = document.getElementById('rankTableBody');
  const searchInput = document.getElementById('studentSearchInput');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const emptyState = document.getElementById('noResultsState');
  const tasks = getActiveAssignments();
  const scale = getClassScoreScale(currentGrade);

  // Dynamic Head Row: อันดับ, ชื่อ-นามสกุล, คะแนนรายชิ้นงาน, คะแนนรวม (50 หรือ 100), อันดับแรงก์, โปรไฟล์
  theadRow.innerHTML = `
    <th class="col-rank" style="width: 70px; text-align: center;">อันดับ</th>
    <th class="col-student" style="min-width: 200px;">ชื่อ-นามสกุล (คลิกดูผลงาน)</th>
    <th>คะแนนรายชิ้นงานที่สั่ง (${tasks.length} งาน)</th>
    <th class="col-score" style="width: 110px; text-align: center;">คะแนนรวม (${scale.maxTotal})</th>
    <th class="col-badge" style="min-width: 250px; text-align: center;">อันดับแรงก์</th>
    <th class="col-action" style="width: 130px; text-align: center;">ดูผลงาน & โปรไฟล์</th>
  `;

  tbody.innerHTML = '';

  const filtered = ranked.filter(s => {
    if (!query) return true;
    const nameMatch = (s.name || '').toLowerCase().includes(query);
    const nickMatch = (s.nickname || '').toLowerCase().includes(query);
    const noMatch = String(s.no || '') === query;
    return nameMatch || nickMatch || noMatch;
  });

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  filtered.forEach(student => {
    const actualRank = ranked.findIndex(item => item.id === student.id) + 1;
    const totalScore = calcStudentTotalScore(student, currentGrade);
    const tier = getArtRankTier(totalScore, currentGrade);

    let rankBadgeClass = 'rank-badge-other';
    let rankBadgeContent = actualRank;
    if (actualRank === 1) { rankBadgeClass = 'rank-badge-1'; rankBadgeContent = '🥇'; }
    else if (actualRank === 2) { rankBadgeClass = 'rank-badge-2'; rankBadgeContent = '🥈'; }
    else if (actualRank === 3) { rankBadgeClass = 'rank-badge-3'; rankBadgeContent = '🥉'; }

    // Chips for each assignment score
    const chipsHtml = tasks.map((t, idx) => {
      const val = student.scores ? student.scores[t.id] : undefined;
      const isSet = val !== undefined && val !== null && val !== '';
      const num = isSet ? Number(val) : 0;
      let chipClass = '';
      if (isSet && num === t.maxScore) chipClass = 'chip-perfect';
      else if (isSet && num === 0) chipClass = 'chip-zero';

      return `
        <span class="task-score-chip ${chipClass}" title="${t.title} (เต็ม ${t.maxScore})">
          งาน ${idx + 1}: <strong>${isSet ? num : '-'}</strong>/${t.maxScore}
        </span>
      `;
    }).join('');

    const avatarDisplay = student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('data:image'))
      ? `<img src="${student.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" alt="${student.name}">`
      : (student.avatar || '🎨');

    const miniBadgesHtml = (student.badges && student.badges.length > 0)
      ? `<div class="student-mini-badges" style="margin-top: 4px;">
          ${student.badges.map(bId => {
            const bDef = ART_BADGES.find(b => b.id === bId);
            return bDef ? `<img src="assets/badges/${bDef.id}.jpg" class="mini-badge-img" title="${bDef.title}: ${bDef.desc}" alt="${bDef.title}">` : '';
          }).join('')}
        </div>`
      : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-rank" style="text-align: center;">
        <span class="rank-badge ${rankBadgeClass}">${rankBadgeContent}</span>
      </td>
      <td>
        <div class="student-cell-clickable" title="คลิกเพื่อดูโปรไฟล์และผลงานของ ${student.name}">
          <div class="student-table-avatar" title="แตะเพื่อเปลี่ยนรูปถ่ายประจำตัวของ ${student.name}">
            ${avatarDisplay}
            <span class="avatar-camera-pill" title="เปลี่ยนรูปประจำตัว">📸</span>
          </div>
          <div class="student-table-details">
            <span class="student-table-name">${student.name}</span>
            <span class="student-table-nick">เลขที่ ${student.no} • ดูโปรไฟล์ & ผลงาน 🎨</span>
            ${miniBadgesHtml}
          </div>
        </div>
      </td>
      <td>
        <div class="task-scores-flow">
          ${chipsHtml}
        </div>
      </td>
      <td style="text-align: center;">
        <div class="score-cell-badge">
          ${totalScore} <span class="total-max">/${scale.maxTotal}</span>
        </div>
      </td>
      <td style="text-align: center;">
        <span class="art-tier-badge ${tier.class}">
          <span>${tier.icon}</span> <span>${tier.label}</span>
        </span>
      </td>
      <td style="text-align: center;">
        <button class="btn btn-sm btn-art-primary btn-view-profile" data-id="${student.id}">
          <span>🎨 ผลงาน & โปรไฟล์</span>
        </button>
      </td>
    `;

    const openHandler = () => openStudentProfileModal(student);
    tr.querySelector('.student-cell-clickable').addEventListener('click', openHandler);
    tr.querySelector('.btn-view-profile').addEventListener('click', openHandler);

    const avatarBtn = tr.querySelector('.student-table-avatar');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerStudentAvatarUpload(student);
      });
    }

    tbody.appendChild(tr);
  });
}

// ==========================================
// 9. CLASSROOM ACTIVITY & ARTWORK GALLERY (แยกตามห้องใครห้องมัน)
// ==========================================
let currentLightboxTaskId = null;
let currentLightboxPhotoId = null;

function getActiveRoomGalleryDict(grade = currentGrade, room = currentRoom) {
  if (!appConfig.roomGalleries) appConfig.roomGalleries = {};
  const key = getRoomAssignmentKey(grade, room);
  if (!appConfig.roomGalleries[key]) {
    appConfig.roomGalleries[key] = {};
  }
  return appConfig.roomGalleries[key];
}

function deleteGalleryPhoto(taskId, photoId) {
  const roomDict = getActiveRoomGalleryDict();
  if (!roomDict || !roomDict[taskId]) return;
  const list = roomDict[taskId];
  const idx = list.findIndex(p => p.id === photoId);
  if (idx === -1) return;

  const photo = list[idx];
  if (!confirm(`คุณต้องการลบรูปภาพ "${photo.title || 'นี้'}" ใช่หรือไม่?`)) {
    return;
  }

  list.splice(idx, 1);
  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  showToast("ลบรูปภาพกิจกรรมเรียบร้อยแล้ว 🗑️");
  artSound.playPop();
  closePhotoLightbox();
  renderClassroomGallery();
}

function deleteCustomGalleryFolder(folderId) {
  const folders = appConfig.customFolders || [];
  const idx = folders.findIndex(f => f.id === folderId);
  if (idx === -1) return;

  const folder = folders[idx];
  if (!confirm(`คุณต้องการลบโฟลเดอร์ "${folder.title}" และภาพทั้งหมดในโฟลเดอร์นี้ใช่หรือไม่?`)) {
    return;
  }

  folders.splice(idx, 1);
  const roomDict = getActiveRoomGalleryDict();
  if (roomDict && roomDict[folderId]) {
    delete roomDict[folderId];
  }
  if (appConfig.galleries && appConfig.galleries[folderId]) {
    delete appConfig.galleries[folderId];
  }

  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  showToast(`ลบโฟลเดอร์ "${folder.title}" เรียบร้อยแล้ว 🗑️`);
  artSound.playPop();

  const tasks = getActiveAssignments();
  activeGalleryTaskId = tasks.length > 0 ? tasks[0].id : '';
  renderClassroomGallery();
}

function renderClassroomGallery() {
  const headerTitle = document.getElementById('classroomGalleryHeaderTitle');
  if (headerTitle) {
    headerTitle.textContent = `ภาพรวมการเรียนการสอนและผลงานศิลปะประจำชิ้นงาน • ${getGradeLabel(currentGrade)} ห้อง ${currentRoom}`;
  }
  const headerSub = document.getElementById('classroomGalleryHeaderSub');
  if (headerSub) {
    headerSub.textContent = `ภาพบรรยากาศห้องเรียนและผลงานของ ${getGradeLabel(currentGrade)} ห้อง ${currentRoom} (แยกตามห้องใครห้องมัน)`;
  }

  const tabsContainer = document.getElementById('galleryTasksTabs');
  const photosGrid = document.getElementById('galleryPhotosGrid');
  const teacherActions = document.getElementById('galleryHeaderActions');
  const tasks = getActiveAssignments();
  const folders = appConfig.customFolders || [];
  const allCategories = [...tasks, ...folders];

  if (!tabsContainer || !photosGrid) return;

  if (allCategories.length === 0) {
    tabsContainer.innerHTML = '';
    photosGrid.innerHTML = `<div style="text-align: center; color: #94A3B8; padding: 30px;">ยังไม่มีหัวข้องานหรือโฟลเดอร์กิจกรรม</div>`;
    return;
  }

  const roomDict = getActiveRoomGalleryDict();
  if (!activeGalleryTaskId || !allCategories.some(c => c.id === activeGalleryTaskId)) {
    activeGalleryTaskId = allCategories[0].id;
  }

  // Render Tabs
  tabsContainer.innerHTML = allCategories.map(c => {
    const count = (roomDict[c.id] || []).length;
    const isActive = c.id === activeGalleryTaskId;
    return `
      <button class="gallery-task-tab ${isActive ? 'active' : ''}" data-task-id="${c.id}">
        📁 ${c.title} (${count} ภาพ)
      </button>
    `;
  }).join('');

  tabsContainer.querySelectorAll('.gallery-task-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeGalleryTaskId = tab.getAttribute('data-task-id');
      artSound.playPop();
      renderClassroomGallery();
    });
  });

  // Render Teacher Action Buttons if Logged In
  const loggedTeacher = getLoggedInTeacher();
  const isTeacher = !!loggedTeacher;

  if (teacherActions) {
    if (isTeacher) {
      const isCustomFolder = (appConfig.customFolders || []).some(f => f.id === activeGalleryTaskId);
      let actionsHtml = `
        <button id="galleryNewFolderBtn" class="btn btn-sm btn-outline" style="border-radius: var(--radius-full); margin-right: 8px;">
          <span>➕ สร้างโฟลเดอร์ใหม่</span>
        </button>
        <button id="quickUploadGalleryBtn" class="btn btn-sm btn-emerald" style="border-radius: var(--radius-full); margin-right: 8px;">
          <span>📸 อัปโหลดภาพกิจกรรม</span>
        </button>
      `;
      if (isCustomFolder) {
        actionsHtml += `
          <button id="galleryDeleteFolderBtn" class="btn btn-sm btn-outline-danger" style="border-radius: var(--radius-full);" title="ลบโฟลเดอร์นี้">
            <span>🗑️ ลบโฟลเดอร์นี้</span>
          </button>
        `;
      }
      teacherActions.innerHTML = actionsHtml;

      document.getElementById('galleryNewFolderBtn')?.addEventListener('click', promptAddNewGalleryFolder);
      document.getElementById('quickUploadGalleryBtn')?.addEventListener('click', () => {
        openGalleryUploadModal(activeGalleryTaskId);
      });
      document.getElementById('galleryDeleteFolderBtn')?.addEventListener('click', () => {
        deleteCustomGalleryFolder(activeGalleryTaskId);
      });
    } else {
      teacherActions.innerHTML = '';
    }
  }

  // Render Photos for Active Assignment in this Classroom
  const photos = roomDict[activeGalleryTaskId] || [];

  let cardsHtml = '';

  // If teacher is logged in, show the quick-add card first!
  if (isTeacher) {
    cardsHtml += `
      <div class="gallery-photo-card gallery-quick-add-card" id="galleryQuickAddCard" title="คลิกเพื่ออัปโหลดภาพกิจกรรมใหม่">
        <div style="font-size: 2.2rem; margin-bottom: 6px;">➕</div>
        <strong style="color: #047857; font-size: 0.95rem;">เพิ่มรูปภาพใหม่</strong>
        <p style="font-size: 0.78rem; color: #065F46; margin-top: 4px;">คลิกเพื่ออัปโหลดรูปภาพกิจกรรม</p>
      </div>
    `;
  }

  if (photos.length === 0 && !isTeacher) {
    photosGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94A3B8; background: #F8FAFC; border-radius: 16px;">
        📷 ยังไม่มีภาพกิจกรรมสำหรับชิ้นงานนี้
      </div>
    `;
    return;
  }

  cardsHtml += photos.map(p => `
    <div class="gallery-photo-card" data-photo-id="${p.id}" data-photo-url="${p.url}" data-photo-title="${p.title}">
      <div class="photo-img-wrap" style="position: relative;">
        <img src="${p.url}" alt="${p.title}" loading="lazy">
        ${isTeacher ? `
          <button type="button" class="btn-delete-photo-corner" data-photo-id="${p.id}" title="ลบรูปภาพนี้">
            🗑️
          </button>
        ` : ''}
      </div>
      <div class="gallery-photo-info">
        <div class="gallery-photo-title">${p.title}</div>
        <div class="gallery-photo-meta">
          <span class="gallery-photo-tag">${p.date || 'กิจกรรมในห้องเรียน'}</span>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span class="btn-view-photo-sm">🔍 ดูรูปขยาย</span>
            ${isTeacher ? `
              <button type="button" class="btn-delete-photo-sm" data-photo-id="${p.id}" title="ลบรูปนี้">
                🗑️ ลบ
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  photosGrid.innerHTML = cardsHtml;

  // Attach quick add listener
  document.getElementById('galleryQuickAddCard')?.addEventListener('click', () => {
    openGalleryUploadModal(activeGalleryTaskId);
  });

  // Attach delete listeners
  photosGrid.querySelectorAll('.btn-delete-photo-corner, .btn-delete-photo-sm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const photoId = btn.getAttribute('data-photo-id');
      deleteGalleryPhoto(activeGalleryTaskId, photoId);
    });
  });

  // Attach card click listeners (excluding delete clicks)
  photosGrid.querySelectorAll('.gallery-photo-card:not(.gallery-quick-add-card)').forEach(card => {
    card.addEventListener('click', () => {
      const url = card.getAttribute('data-photo-url');
      const title = card.getAttribute('data-photo-title');
      const photoId = card.getAttribute('data-photo-id');
      openPhotoLightbox(url, title, `ชิ้นงาน: ${getAssignmentTitle(activeGalleryTaskId)}`, activeGalleryTaskId, photoId);
    });
  });
}

function getAssignmentTitle(taskId, grade = currentGrade, room = currentRoom) {
  const tasks = getActiveAssignments(grade, room);
  const t = tasks.find(item => item.id === taskId);
  return t ? t.title : taskId;
}

function openPhotoLightbox(imgUrl, title, caption, taskId = null, photoId = null) {
  currentLightboxTaskId = taskId;
  currentLightboxPhotoId = photoId;

  const modal = document.getElementById('galleryPhotoModal');
  const img = document.getElementById('lightboxImg');
  const titleEl = document.getElementById('lightboxTitle');
  const captionEl = document.getElementById('lightboxCaption');
  const downloadBtn = document.getElementById('downloadPhotoBtn');
  const deleteBtn = document.getElementById('lightboxDeletePhotoBtn');

  if (img) img.src = imgUrl;
  if (titleEl) titleEl.textContent = title || "ภาพกิจกรรมศิลปะ";
  if (captionEl) captionEl.textContent = caption || "";
  if (downloadBtn) {
    downloadBtn.href = imgUrl;
    downloadBtn.download = `art-${Date.now()}.jpg`;
  }

  const isTeacher = !!getLoggedInTeacher();
  if (deleteBtn) {
    if (isTeacher && taskId && photoId) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.onclick = () => {
        deleteGalleryPhoto(currentLightboxTaskId, currentLightboxPhotoId);
      };
    } else {
      deleteBtn.classList.add('hidden');
      deleteBtn.onclick = null;
    }
  }

  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
}

function closePhotoLightbox() {
  const modal = document.getElementById('galleryPhotoModal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// 10. STUDENT PROFILE & ARTWORK PORTFOLIO MODAL
// ==========================================
let currentProfileStudent = null;

function openStudentProfileModal(student) {
  currentProfileStudent = student;
  const modal = document.getElementById('studentProfileModal');
  const content = document.getElementById('studentProfileContent');
  if (!modal || !content) return;

  if (!student.badges) student.badges = [];
  if (!student.cards) student.cards = [];
  if (!student.checklist) student.checklist = {};
  autoEvaluateStudentBadges(student);

  const scale = getClassScoreScale(currentGrade);
  const totalScore = calcStudentTotalScore(student, currentGrade);
  const sc = calcStudentAssignmentScore(student, currentGrade);
  const exam = calcStudentExamScore(student, currentGrade);
  const gradeVal = scale.hasGrade ? calculateGrade(totalScore, currentGrade) : '';
  const tier = getArtRankTier(totalScore, currentGrade);
  const tasks = getActiveAssignments();
  const portfolios = student.portfolio || [];

  const avatarDisplay = student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('data:image'))
    ? `<img src="${student.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 24px;" alt="${student.name}">`
    : (student.avatar || '🎨');

  // Task rows
  const taskRowsHtml = tasks.map((task, idx) => {
    const rawVal = student.scores && student.scores[task.id];
    const isSubmitted = rawVal !== undefined && rawVal !== null && rawVal !== '';
    const scoreVal = isSubmitted ? Number(rawVal) : 0;
    const pct = task.maxScore > 0 ? Math.min(100, (scoreVal / task.maxScore) * 100) : 0;
    return `
      <div class="passport-task-row">
        <div class="passport-task-header">
          <span>${task.title}</span>
          <span style="font-weight: 800; color: #4F46E5;">${scoreVal} / ${task.maxScore}</span>
        </div>
        <div class="meter-bar">
          <div class="meter-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  const loggedTeacher = getLoggedInTeacher();
  const isTeacher = !!loggedTeacher;

  // Portfolios HTML
  const portfolioHtml = portfolios.length > 0 ? portfolios.map((art, idx) => `
    <div class="portfolio-art-card">
      <div class="portfolio-art-img-wrap">
        <img src="${art.url}" alt="${art.title}">
      </div>
      <div class="portfolio-art-info">
        <div class="portfolio-art-title">${art.title}</div>
        <div class="portfolio-art-technique">${art.technique || 'ภาพวาดสร้างสรรค์'} • ${art.date || ''}</div>
        <div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
          <a href="${art.url}" download="${art.title}.jpg" class="btn btn-sm btn-outline" style="font-size: 0.72rem; padding: 2px 8px;">
            📥 ดาวน์โหลด
          </a>
          ${isTeacher ? `
            <button class="btn btn-sm btn-outline-danger delete-art-btn" data-art-index="${idx}" style="font-size: 0.72rem; padding: 2px 6px;" title="ลบผลงาน (อาจารย์เท่านั้น)">
              🗑️
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('') : `
    <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #94A3B8; background: #F8FAFC; border-radius: 14px;">
      🎨 ยังไม่มีภาพผลงานในคลัง ${isTeacher ? 'คลิกปุ่ม "+ อัปโหลดผลงานศิลปะ" ด้านบนเพื่อเริ่มสร้างแกลเลอรีของน้อง' : '(อาจารย์ผู้สอนเป็นผู้อัปโหลดผลงาน)'}
    </div>
  `;

  // Badges Showcase (20 Illustrated Badges - Full Color when earned, Grayscale when unearned)
  const earnedBadges = student.badges || [];
  const earnedBadgesCount = earnedBadges.length;
  const badgesListHtml = ART_BADGES.map(b => {
    const isEarned = earnedBadges.includes(b.id);
    return `
      <div class="profile-badge-card ${isEarned ? 'badge-earned' : 'badge-locked'}" title="${b.title}: ${b.desc}">
        <img src="assets/badges/${b.id}.jpg" class="badge-img-circle ${isEarned ? 'is-earned' : 'is-unearned'}" alt="${b.title}" style="width: 72px; height: 72px; margin-bottom: 8px;">
        <div class="badge-info-wrap" style="text-align: center; width: 100%;">
          <div class="badge-card-title" style="font-weight: 700; font-size: 0.84rem; color: ${isEarned ? '#1E293B' : '#64748B'}; line-height: 1.3;">${b.title}</div>
          <div class="badge-card-desc" style="font-size: 0.72rem; color: #64748B; margin-top: 3px;">${b.desc}</div>
          <div style="margin-top: 6px;">
            <span class="badge-status-chip ${isEarned ? 'unlocked' : 'locked'}">
              ${isEarned ? '✨ ได้รับแล้ว' : '🔒 ยังไม่ได้รับ'}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Holographic Cards Vault (6 Art Cards)
  const earnedCards = student.cards || [];
  const totalDrawTickets = Math.floor(earnedBadgesCount / 5);
  const remainingTickets = Math.max(0, totalDrawTickets - earnedCards.length);

  // Art Lucky Wheel (การ์ด 5 ใบ = สิทธิ์หมุนวงล้อ 1 ครั้ง)
  const totalWheelSpins = Math.floor(earnedCards.length / 5);
  const spentWheelSpins = student.checklist && typeof student.checklist.spent_spins === 'number' ? student.checklist.spent_spins : 0;
  const remainingWheelSpins = Math.max(0, totalWheelSpins - spentWheelSpins);
  const wheelRewards = (student.checklist && student.checklist.wheel_rewards) || [];

  const cardsListHtml = ART_CARDS.map(card => {
    const isUnlocked = earnedCards.includes(card.id);
    if (isUnlocked) {
      return `
        <div class="art-holo-card holo-unlocked" style="background: ${card.gradient};" title="${card.thaiTitle} - ${card.power}">
          <div class="holo-shimmer"></div>
          <div class="holo-card-inner">
            <div class="holo-card-rarity">${card.rarityLabel}</div>
            <div class="holo-card-icon">${card.icon}</div>
            <div class="holo-card-title">${card.title}</div>
            <div class="holo-card-thai">${card.thaiTitle}</div>
            <div class="holo-card-power">${card.power}</div>
            <div class="holo-card-desc">${card.desc}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="art-holo-card holo-locked" title="การ์ดพลังศิลปะ (ยังไม่ปลดล็อก)">
          <div class="holo-shimmer"></div>
          <div class="holo-card-inner">
            <div class="holo-card-rarity" style="color: #94A3B8;">🔒 ยังไม่ปลดล็อก</div>
            <div class="holo-card-icon" style="filter: grayscale(1); opacity: 0.5;">🎴</div>
            <div class="holo-card-title" style="color: #64748B;">LOCKED CARD</div>
            <div class="holo-card-desc" style="color: #94A3B8; font-size: 0.75rem; margin-top: 10px;">
              สะสมเหรียญตราครบ 5 เหรียญ เพื่อรับสิทธิ์สุ่มการ์ดพลัง!
            </div>
          </div>
        </div>
      `;
    }
  }).join('');

  content.innerHTML = `
    <div class="passport-hero-banner">
      <div class="passport-student-header">
        <div class="passport-avatar-box" id="profileAvatarBox" style="position: relative; cursor: pointer;" title="แตะเพื่อเปลี่ยนรูปถ่ายประจำตัว (ถ่ายรูปหรือเลือกรูป)">
          ${avatarDisplay}
          <div style="position: absolute; bottom: -4px; right: -4px; background: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.25); font-size: 0.95rem; line-height: 1;" title="เปลี่ยนรูปถ่าย">📷</div>
        </div>
        <div class="passport-info">
          <h3>${student.name}</h3>
          <p>เลขที่ ${student.no} • ${getGradeLabel(currentGrade)} ห้อง ${currentRoom}</p>
          <div class="passport-rank-chip" style="margin-top: 6px;">
            <span>${tier.icon}</span> <span>${tier.label}</span>
          </div>
          <button type="button" id="btnStudentSelfAvatar" class="btn btn-sm btn-art-primary" style="margin-top: 10px; border-radius: 9999px; font-weight: 700; font-size: 0.8rem; padding: 4px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>📸 ถ่ายรูป / เปลี่ยนรูปประจำตัว</span>
          </button>
        </div>
      </div>
    </div>

    <div class="passport-body-content">
      
      <!-- Total Score Card -->
      <div class="passport-scores-card">
        <div class="scores-card-header">
          <span class="scores-card-title">🎯 คะแนนประเมินรวม</span>
          <div class="scores-big-total">
            ${totalScore} <small>/ ${scale.maxTotal} คะแนน</small>
            ${scale.hasGrade ? `<span class="art-tier-badge ${tier.class}" style="margin-left: 8px;">เกรด ${gradeVal}</span>` : ''}
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
          <div class="stat-box-mini" style="flex: 1;">
            <div class="stat-val" style="color: #4F46E5;">${sc} / ${scale.maxAssignment}</div>
            <div class="stat-lbl">คะแนนเก็บตามชิ้นงาน</div>
          </div>
          <div class="stat-box-mini" style="flex: 1;">
            <div class="stat-val" style="color: #059669;">${exam} / ${scale.maxExam}</div>
            <div class="stat-lbl">คะแนนสอบประเมิน</div>
          </div>
        </div>

        <!-- Task List Breakdown -->
        <div class="student-passport-tasks-list">
          ${taskRowsHtml}
        </div>
      </div>

      <!-- ART BADGES SECTION (20 Badges Collection) -->
      <div class="passport-scores-card">
        <div class="scores-card-header">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: #1E293B;">🏅 คอลเลกชันเหรียญตราศิลปะ (${earnedBadgesCount} / 20 เหรียญ)</h4>
            <p style="font-size: 0.8rem; color: #64748B;">เหรียญเกียรติยศสะท้อนทักษะ พฤติกรรม และความตั้งใจในห้องเรียนศิลปะ</p>
          </div>
        </div>
        <div class="profile-badges-grid">
          ${badgesListHtml}
        </div>
      </div>

      <!-- HOLOGRAPHIC CARDS VAULT (Placeholder & Draw System) -->
      <div class="passport-scores-card">
        <div class="scores-card-header" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: #1E293B;">✨ คลังการ์ดพลังศิลปะโฮโลแกรม (${earnedCards.length} / ${ART_CARDS.length} ใบ)</h4>
            <p style="font-size: 0.8rem; color: #64748B;">
              สะสมเหรียญตราครบทุก 5 เหรียญ = สิทธิ์สุ่มการ์ดพลัง 1 ใบ (สิทธิ์สุ่มคงเหลือ: <strong style="color: #4F46E5;">${remainingTickets}</strong> สิทธิ์)
            </p>
          </div>
          ${remainingTickets > 0 ? `
            <button type="button" id="btnDrawCard" class="btn btn-sm btn-art-primary" style="animation: pulse 1.8s infinite; background: linear-gradient(135deg, #EC4899, #8B5CF6); border: none;">
              <span>🎴 สุ่มจับการ์ดพลัง (เหลือ ${remainingTickets} สิทธิ์)</span>
            </button>
          ` : `
            <span style="font-size: 0.8rem; color: #94A3B8; background: #F1F5F9; padding: 4px 12px; border-radius: 9999px;">
              สะสมอีก ${5 - (earnedBadgesCount % 5 === 0 && earnedBadgesCount > 0 && remainingTickets === 0 ? 5 : earnedBadgesCount % 5)} เหรียญเพื่อรับสิทธิ์สุ่มถัดไป
            </span>
          `}
        </div>
        <div class="profile-cards-grid">
          ${cardsListHtml}
        </div>
      </div>

      <!-- LUCKY WHEEL SECTION (การ์ด 5 ใบ = หมุนวงล้อได้ 1 ครั้ง) -->
      <div class="passport-scores-card" style="background: linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%); border: 1.5px solid #DDD6FE;">
        <div class="scores-card-header" style="flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: #6D28D9;">🎡 วงล้อรางวัลศิลปะนำโชค</h4>
            <p style="font-size: 0.8rem; color: #64748B;">
              สะสมการ์ดพลังครบทุก 5 ใบ = สิทธิ์หมุนวงล้อรับรางวัล 1 ครั้ง (มีสิทธิ์หมุนคงเหลือ: <strong style="color: #7C3AED;">${remainingWheelSpins}</strong> ครั้ง)
            </p>
          </div>
          <div>
            ${remainingWheelSpins > 0 ? `
              <button type="button" id="btnOpenLuckyWheelModal" class="btn btn-sm btn-bounce" style="background: linear-gradient(135deg, #EC4899, #8B5CF6); color: white; border: none; font-weight: 800; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); padding: 8px 20px; border-radius: 9999px;">
                <span>🎡 ไปหมุนวงล้อเลย! (เหลือ ${remainingWheelSpins} ครั้ง)</span>
              </button>
            ` : `
              <span style="font-size: 0.8rem; color: #7C3AED; background: #EDE9FE; padding: 6px 14px; border-radius: 9999px; font-weight: 700;">
                การ์ดปัจจุบัน: ${earnedCards.length}/5 ใบ (ขาดอีก ${Math.max(0, 5 - (earnedCards.length % 5 || (earnedCards.length === 0 ? 0 : 5)))} ใบ เพื่อหมุน)
              </span>
            `}
          </div>
        </div>

        ${wheelRewards.length > 0 ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #DDD6FE;">
            <div style="font-size: 0.82rem; font-weight: 800; color: #4B5563; margin-bottom: 8px;">
              🎁 รางวัลที่ได้รับแล้วจากการหมุน (${wheelRewards.length} รายการ):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${wheelRewards.map(r => `
                <span class="wheel-reward-pill" title="${r.desc || ''} (${r.date || ''})">
                  <span>${r.icon || '🎁'}</span>
                  <span>${r.name}</span>
                  <small style="color: #94A3B8; font-weight: normal; margin-left: 2px;">${r.date ? `• ${r.date}` : ''}</small>
                </span>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="margin-top: 10px; font-size: 0.8rem; color: #94A3B8; font-style: italic;">
            ยังไม่มีประวัติการได้รับรางวัลจากวงล้อ (สะสมการ์ดพลังให้ครบ 5 ใบเพื่อเริ่มลุ้นรางวัลใหญ่!)
          </div>
        `}
      </div>

      <!-- Student Artwork Portfolio Section -->
      <div class="passport-scores-card">
        <div class="scores-card-header">
          <div>
            <h4 style="font-size: 1.05rem; font-weight: 800; color: #1E293B;">🖼️ คลังผลงานศิลปะของ ${student.name}</h4>
            <p style="font-size: 0.8rem; color: #64748B;">แสดงผลงานสร้างสรรค์ที่ภาคภูมิใจของนักเรียน</p>
          </div>
          ${isTeacher ? `
            <button type="button" id="uploadMyArtworkBtn" class="btn btn-sm btn-art-primary">
              <span>➕ อัปโหลดผลงานศิลปะ</span>
            </button>
          ` : `
            <span style="font-size: 0.8rem; color: #64748B; background: #F1F5F9; padding: 4px 12px; border-radius: 9999px; border: 1px solid #E2E8F0;">
              🔒 อาจารย์อัปได้เท่านั้น
            </span>
          `}
        </div>

        <div class="portfolio-artworks-grid">
          ${portfolioHtml}
        </div>
      </div>

    </div>
  `;

  // Student Self-Avatar Upload Handler (Direct click on avatar box)
  const selfAvatarInput = document.getElementById('studentAvatarSelfFileInput');
  if (selfAvatarInput) {
    selfAvatarInput.onchange = async (e) => {
      if (e.target.files && e.target.files[0]) {
        try {
          const resizedBase64 = await resizeImageToCanvas(e.target.files[0], 250, 250, 0.85);
          student.avatar = resizedBase64;
          saveDataToStorage();
          apiPost({
            action: 'save_student',
            grade: currentGrade,
            room: currentRoom,
            student: student
          });
          artSound.playCamera();
          confettiEngine.fire(40);
          showToast(`อัปเดตรูปประจำตัวของ ${student.name} เรียบร้อยแล้ว! 📸`);
          openStudentProfileModal(student);
          if (currentView === 'leaderboard') renderLeaderboardView();
          else if (currentView === 'teacher') renderTeacherView();
        } catch (err) {
          alert("ไม่สามารถบันทึกรูปภาพได้: " + err.message);
        }
      }
    };
  }

  const avatarBox = content.querySelector('#profileAvatarBox');
  if (avatarBox) {
    avatarBox.addEventListener('click', () => {
      triggerStudentAvatarUpload(student);
    });
  }

  const btnSelfAvatar = content.querySelector('#btnStudentSelfAvatar');
  if (btnSelfAvatar) {
    btnSelfAvatar.addEventListener('click', () => {
      triggerStudentAvatarUpload(student);
    });
  }

  // Draw Card Button Listener
  const btnDraw = content.querySelector('#btnDrawCard');
  if (btnDraw) {
    btnDraw.addEventListener('click', () => {
      drawRandomCard(student);
    });
  }

  // Open Lucky Wheel Listener
  const btnOpenWheel = content.querySelector('#btnOpenLuckyWheelModal');
  if (btnOpenWheel) {
    btnOpenWheel.addEventListener('click', () => {
      openLuckyWheelModal(student);
    });
  }

  // Upload Artwork Listener (Teacher Only)
  const uploadArtBtn = content.querySelector('#uploadMyArtworkBtn');
  if (uploadArtBtn) {
    uploadArtBtn.addEventListener('click', () => {
      if (!getLoggedInTeacher()) {
        showToast("🔒 สำหรับอาจารย์ผู้สอนเท่านั้น กรุณาเข้าสู่ระบบครู");
        return;
      }
      const artFileHidden = document.createElement('input');
      artFileHidden.type = 'file';
      artFileHidden.accept = 'image/*';
      artFileHidden.style.display = 'none';
      document.body.appendChild(artFileHidden);

      artFileHidden.click();

      artFileHidden.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          const title = prompt("ระบุชื่อผลงานศิลปะชิ้นนี้:", file.name.replace(/\.[^/.]+$/, ""));
          if (!title || !title.trim()) {
            artFileHidden.remove();
            return;
          }
          const technique = prompt("ระบุเทคนิคหรือสื่อที่ใช้ (เช่น สีน้ำ, สีโปสเตอร์, คอลลาจ):", "สีน้ำบนกระดาษวาดเขียน");

          try {
            const resizedUrl = await resizeImageToCanvas(file, 700, 700, 0.8);
            if (!student.portfolio) student.portfolio = [];
            student.portfolio.push({
              id: `art_${Date.now()}`,
              title: title.trim(),
              technique: (technique || 'สื่อผสม').trim(),
              date: new Date().toLocaleDateString('th-TH'),
              url: resizedUrl
            });

            saveDataToStorage();
            apiPost({
              action: 'save_student',
              grade: currentGrade,
              room: currentRoom,
              student: student
            });

            artSound.playSaveChime();
            confettiEngine.fire(50);
            showToast(`เพิ่มผลงานศิลปะ "${title.trim()}" เรียบร้อยแล้ว! 🎨`);
            openStudentProfileModal(student);
          } catch (err) {
            alert("ไม่สามารถบันทึกภาพผลงานได้: " + err.message);
          }
        }
        artFileHidden.remove();
      });
    });
  }

  // Delete Artwork Listeners (Teacher Only)
  content.querySelectorAll('.delete-art-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-art-index'), 10);
      if (confirm("คุณต้องการลบผลงานศิลปะชิ้นนี้ใช่หรือไม่?")) {
        student.portfolio.splice(idx, 1);
        saveDataToStorage();
        apiPost({
          action: 'save_student',
          grade: currentGrade,
          room: currentRoom,
          student: student
        });
        showToast("ลบผลงานศิลปะเรียบร้อยแล้ว");
        openStudentProfileModal(student);
      }
    });
  });

  // Direct close binding
  const closeProfileBtn = document.getElementById('closeProfileModalBtn');
  if (closeProfileBtn) closeProfileBtn.onclick = closeStudentProfileModal;

  modal.onclick = (e) => {
    if (e.target === modal) closeStudentProfileModal();
  };

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  artSound.playPop();
}

function closeStudentProfileModal() {
  const modal = document.getElementById('studentProfileModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// Backward compatibility
function openStudentDetailModal(student) {
  openStudentProfileModal(student);
}
function closeStudentDetailModal() {
  closeStudentProfileModal();
}

// ==========================================
// 10.5 BADGE MANAGER & HOLOGRAPHIC CARD SYSTEM
// ==========================================
let currentBadgeStudent = null;
let badgeSaveTimer = null;

function scheduleStudentSave(student) {
  clearTimeout(badgeSaveTimer);
  badgeSaveTimer = setTimeout(() => {
    saveDataToStorage();
    apiPost({
      action: 'save_student',
      grade: currentGrade,
      room: currentRoom,
      student: student
    });
  }, 800);
}

function openBadgeManagerModal(student) {
  currentBadgeStudent = student;
  const modal = document.getElementById('badgeManagerModal');
  if (!modal || !student) return;

  if (!student.badges) student.badges = [];
  if (!student.cards) student.cards = [];
  if (!student.checklist) student.checklist = {};

  const titleEl = document.getElementById('badgeManagerStudentTitle');
  const subEl = document.getElementById('badgeManagerStudentSub');
  if (titleEl) {
    titleEl.textContent = `🏅 จัดการเหรียญตรา & เช็คเกณฑ์งาน: ${student.name} (เลขที่ ${student.no})`;
  }
  if (subEl) {
    subEl.textContent = `${getGradeLabel(currentGrade)} ห้อง ${currentRoom} • ติ๊กเกณฑ์รายชิ้นงานครบ 3 ครั้งปลดล็อกเหรียญทันที หรือมอบเหรียญพิเศษได้โดยตรง`;
  }

  // Set active tab to 20 badges manager by default (ผู้สอนเปิด/ปิดให้เหรียญเด็กแต่ละคน)
  const tabChecklistBtn = document.getElementById('tabChecklistBtn');
  const tabQuickBadgesBtn = document.getElementById('tabQuickBadgesBtn');
  const paneChecklist = document.getElementById('badgeTabChecklistContent');
  const paneQuick = document.getElementById('badgeTabQuickBadgesContent');

  if (tabChecklistBtn && tabQuickBadgesBtn && paneChecklist && paneQuick) {
    tabQuickBadgesBtn.classList.add('active');
    tabChecklistBtn.classList.remove('active');
    paneQuick.classList.remove('hidden');
    paneChecklist.classList.add('hidden');
  }

  renderBadgeChecklistTable(student);
  renderQuickGrantBadges(student);
  updateBadgeManagerCount(student);

  // Bind close and save buttons directly
  const closeBtn = document.getElementById('closeBadgeManagerModalBtn');
  if (closeBtn) closeBtn.onclick = closeBadgeManagerModal;

  const footerCloseBtn = document.getElementById('closeBadgeManagerFooterBtn');
  if (footerCloseBtn) footerCloseBtn.onclick = closeBadgeManagerModal;

  const saveBtn = document.getElementById('saveBadgeManagerBtn');
  if (saveBtn) saveBtn.onclick = saveBadgeManager;

  // Backdrop click closes modal
  modal.onclick = (e) => {
    if (e.target === modal) closeBadgeManagerModal();
  };

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  artSound.playPop();
}

function updateBadgeManagerCount(student) {
  const countEl = document.getElementById('badgeManagerEarnedCount');
  if (countEl) {
    const count = (student.badges || []).length;
    countEl.innerHTML = `ปลดล็อกแล้ว: <strong>${count}</strong> / 20 เหรียญ (ได้รับสิทธิ์การ์ด ${Math.floor(count / 5)} ใบ)`;
  }
}

function renderBadgeChecklistTable(student) {
  const thead = document.getElementById('badgeChecklistTableHead');
  const tbody = document.getElementById('badgeChecklistTableBody');
  if (!thead || !tbody) return;

  const tasks = getActiveAssignments();
  if (!student.checklist) student.checklist = {};

  thead.innerHTML = `
    <tr>
      <th style="min-width: 190px; text-align: left;">เกณฑ์ประเมิน (จากภาพบรีฟครู)</th>
      ${tasks.map((t, idx) => `
        <th style="min-width: 75px; text-align: center;" title="${t.title}">งาน ${idx + 1}</th>
      `).join('')}
      <th style="min-width: 95px; text-align: center;">สะสม (ครั้ง)</th>
      <th style="min-width: 140px; text-align: center;">สถานะเหรียญตรา</th>
    </tr>
  `;

  tbody.innerHTML = CHECKLIST_CRITERIA.map(crit => {
    let checkCount = 0;
    const taskCells = tasks.map(t => {
      const taskChecklist = student.checklist[t.id] || {};
      const isChecked = !!taskChecklist[crit.key];
      if (isChecked) checkCount++;
      return `
        <td style="text-align: center;">
          <input type="checkbox" class="checklist-cell-checkbox" 
            data-student-id="${student.id}" 
            data-task-id="${t.id}" 
            data-key="${crit.key}" 
            ${isChecked ? 'checked' : ''} 
            style="width: 18px; height: 18px; cursor: pointer; accent-color: #4F46E5;">
        </td>
      `;
    }).join('');

    const bDef = ART_BADGES.find(b => b.id === crit.badgeId);
    const hasBadge = (student.badges || []).includes(crit.badgeId);
    const target = (bDef && bDef.target) ? bDef.target : 3;
    const isUnlocked = hasBadge || checkCount >= target;

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: #1E293B;">${crit.label}</div>
          <div style="font-size: 0.75rem; color: #64748B;">${crit.desc}</div>
        </td>
        ${taskCells}
        <td style="text-align: center; font-weight: 800; font-size: 0.95rem; color: ${checkCount >= target ? '#059669' : '#475569'};">
          ${checkCount} / ${target}
        </td>
        <td style="text-align: center;">
          ${isUnlocked ? `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: #ECFDF5; color: #065F46; padding: 3px 8px; border-radius: 9999px; font-weight: 700; font-size: 0.78rem; border: 1px solid #A7F3D0;">
              <span>${bDef ? bDef.icon : '✨'}</span> ปลดล็อกแล้ว!
            </span>
          ` : `
            <span style="font-size: 0.78rem; color: #94A3B8;">
              ขาดอีก ${Math.max(0, target - checkCount)} ครั้ง
            </span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.checklist-cell-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const taskId = e.target.getAttribute('data-task-id');
      const key = e.target.getAttribute('data-key');
      const checked = e.target.checked;

      if (!student.checklist[taskId]) student.checklist[taskId] = {};
      student.checklist[taskId][key] = checked;

      const crit = CHECKLIST_CRITERIA.find(c => c.key === key);
      if (crit && crit.badgeId) {
        const bDef = ART_BADGES.find(b => b.id === crit.badgeId);
        const target = (bDef && bDef.target) ? bDef.target : 3;
        let cnt = 0;
        tasks.forEach(t => {
          if (student.checklist[t.id] && student.checklist[t.id][key]) cnt++;
        });

        if (cnt >= target && !student.badges.includes(crit.badgeId)) {
          student.badges.push(crit.badgeId);
          artSound.playChime();
          confettiEngine.fire(50);
          showToast(`🎉 ยินดีด้วย! ${student.name} ได้รับเหรียญ "${bDef ? bDef.title : crit.badgeId}" เรียบร้อยแล้ว!`);
        }
      }

      autoEvaluateStudentBadges(student);
      renderBadgeChecklistTable(student);
      renderQuickGrantBadges(student);
      updateBadgeManagerCount(student);
      scheduleStudentSave(student);
    });
  });
}

function renderQuickGrantBadges(student) {
  const container = document.getElementById('quickGrantBadgesGrid');
  if (!container) return;

  if (!student.badges) student.badges = [];
  if (!student.revoked_badges) student.revoked_badges = [];

  const tasks = getActiveAssignments();

  container.innerHTML = ART_BADGES.map(b => {
    const isGranted = student.badges.includes(b.id);
    const matchedCrit = CHECKLIST_CRITERIA.find(c => c.badgeId === b.id);
    let progressHtml = '';
    if (matchedCrit) {
      let cnt = 0;
      tasks.forEach(t => {
        if (student.checklist && student.checklist[t.id] && student.checklist[t.id][matchedCrit.key]) {
          cnt++;
        }
      });
      const target = b.target || 3;
      progressHtml = `
        <div style="font-size: 0.73rem; color: #4338CA; margin-top: 5px; background: #EEF2FF; padding: 2px 8px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid #E0E7FF;">
          <span>📝 ทดไว้:</span> <strong>${cnt}/${target} งาน</strong>
          <span style="color: ${cnt >= target ? '#059669' : '#64748B'};">(${cnt >= target ? 'ครบแล้ว ✨' : `ขาดอีก ${target - cnt}`})</span>
        </div>
      `;
    }

    return `
      <div class="quick-badge-card ${isGranted ? 'granted' : 'revoked'}" data-badge-id="${b.id}" title="${b.title}: ${b.desc} (คลิกเพื่อ ${isGranted ? 'ขอคืนเหรียญ' : 'มอบเหรียญ'})">
        <img src="assets/badges/${b.id}.jpg" class="badge-img-circle ${isGranted ? 'is-earned' : 'is-unearned'}" alt="${b.title}">
        <div class="quick-badge-info" style="flex: 1; min-width: 0;">
          <div class="quick-badge-title" style="font-weight: 700; font-size: 0.9rem; color: ${isGranted ? '#1E293B' : '#64748B'}; line-height: 1.3;">
            ${b.title}
          </div>
          <div style="font-size: 0.76rem; color: #64748B; margin-top: 2px;">
            ${b.desc}
          </div>
          ${progressHtml}
          <div style="margin-top: 6px;">
            <span class="badge-toggle-btn-pill ${isGranted ? 'pill-earned' : 'pill-unearned'}">
              ${isGranted ? '✅ ได้รับแล้ว (คลิกเพื่อขอคืน)' : '⚪ ยังไม่ได้มอบ (คลิกเพื่อมอบ)'}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Instant in-place toggle handler (0ms latency)
  container.querySelectorAll('.quick-badge-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const bId = card.getAttribute('data-badge-id');
      const bDef = ART_BADGES.find(b => b.id === bId);
      const idx = student.badges.indexOf(bId);
      let isNowGranted = false;

      if (idx !== -1) {
        student.badges.splice(idx, 1);
        if (!student.revoked_badges.includes(bId)) student.revoked_badges.push(bId);
        try { artSound.playPop(); } catch (e) {}
        isNowGranted = false;
      } else {
        student.badges.push(bId);
        student.revoked_badges = student.revoked_badges.filter(id => id !== bId);
        try { artSound.playChime(); } catch (e) {}
        isNowGranted = true;
      }

      // 1. Instant DOM updates in-place without rebuilding HTML
      card.className = `quick-badge-card ${isNowGranted ? 'granted' : 'revoked'}`;
      
      const img = card.querySelector('img');
      if (img) {
        img.className = `badge-img-circle ${isNowGranted ? 'is-earned' : 'is-unearned'}`;
      }

      const titleEl = card.querySelector('.quick-badge-title');
      if (titleEl) {
        titleEl.style.color = isNowGranted ? '#1E293B' : '#64748B';
      }

      const pill = card.querySelector('.badge-toggle-btn-pill');
      if (pill) {
        pill.className = `badge-toggle-btn-pill ${isNowGranted ? 'pill-earned' : 'pill-unearned'}`;
        pill.textContent = isNowGranted ? '✅ ได้รับแล้ว (คลิกเพื่อขอคืน)' : '⚪ ยังไม่ได้มอบ (คลิกเพื่อมอบ)';
      }

      // 2. Update counter in modal header/footer instantly
      updateBadgeManagerCount(student);

      // 3. Update teacher table row badge count directly without table rebuild
      const teacherRowBtn = document.querySelector(`.btn-badge-manage[data-student-id="${student.id}"]`);
      if (teacherRowBtn) {
        teacherRowBtn.innerHTML = `🏅 ${student.badges.length} เหรียญ`;
      }

      // 4. Debounced auto-save (smooth background persistence)
      scheduleStudentSave(student);
    });
  });

  // Grant All / Revoke All buttons
  const grantAllBtn = document.getElementById('btnGrantAllBadges');
  if (grantAllBtn) {
    grantAllBtn.onclick = () => {
      if (confirm(`คุณต้องการมอบเหรียญทั้งหมด (20 เหรียญ) ให้ ${student.name} ใช่หรือไม่?`)) {
        student.badges = ART_BADGES.map(b => b.id);
        student.revoked_badges = [];
        scheduleStudentSave(student);
        try { artSound.playFanfare(); } catch (e) {}
        confettiEngine.fire(60);
        showToast(`✨ มอบเหรียญทั้งหมด 20 เหรียญให้ ${student.name} เรียบร้อยแล้ว! 👑`);
        renderQuickGrantBadges(student);
        updateBadgeManagerCount(student);
        const teacherRowBtn = document.querySelector(`.btn-badge-manage[data-student-id="${student.id}"]`);
        if (teacherRowBtn) teacherRowBtn.innerHTML = `🏅 ${student.badges.length} เหรียญ`;
      }
    };
  }

  const revokeAllBtn = document.getElementById('btnRevokeAllBadges');
  if (revokeAllBtn) {
    revokeAllBtn.onclick = () => {
      if (confirm(`คุณต้องการขอคืนเหรียญทั้งหมดของ ${student.name} ใช่หรือไม่?`)) {
        student.revoked_badges = ART_BADGES.map(b => b.id);
        student.badges = [];
        scheduleStudentSave(student);
        try { artSound.playPop(); } catch (e) {}
        showToast(`↩️ ขอคืนเหรียญทั้งหมดของ ${student.name} เรียบร้อยแล้ว`);
        renderQuickGrantBadges(student);
        updateBadgeManagerCount(student);
        const teacherRowBtn = document.querySelector(`.btn-badge-manage[data-student-id="${student.id}"]`);
        if (teacherRowBtn) teacherRowBtn.innerHTML = `🏅 ${student.badges.length} เหรียญ`;
      }
    };
  }
}

function saveBadgeManager() {
  if (!currentBadgeStudent) return;
  const s = currentBadgeStudent;
  clearTimeout(badgeSaveTimer);
  badgeSaveTimer = null;

  saveDataToStorage();
  apiPost({
    action: 'save_student',
    grade: currentGrade,
    room: currentRoom,
    student: s
  });
  try { artSound.playSaveChime(); } catch (e) {}
  showToast(`บันทึกข้อมูลเหรียญและเกณฑ์งานของ ${s.name} เรียบร้อยแล้ว! 🏅`);

  // Direct fast in-place update of teacher table row without freezing the page
  const teacherRowBtn = document.querySelector(`.btn-badge-manage[data-student-id="${s.id}"]`);
  if (teacherRowBtn) {
    teacherRowBtn.innerHTML = `🏅 ${s.badges.length} เหรียญ`;
  }

  closeBadgeManagerModal();
}

function closeBadgeManagerModal() {
  try {
    if (badgeSaveTimer && currentBadgeStudent) {
      clearTimeout(badgeSaveTimer);
      badgeSaveTimer = null;
      saveDataToStorage();
      apiPost({
        action: 'save_student',
        grade: currentGrade,
        room: currentRoom,
        student: currentBadgeStudent
      });
    }
  } catch (err) {
    console.warn("Auto-save on modal close error:", err);
  }

  if (currentBadgeStudent) {
    const teacherRowBtn = document.querySelector(`.btn-badge-manage[data-student-id="${currentBadgeStudent.id}"]`);
    if (teacherRowBtn) {
      teacherRowBtn.innerHTML = `🏅 ${currentBadgeStudent.badges.length} เหรียญ`;
    }
  }

  const modal = document.getElementById('badgeManagerModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  currentBadgeStudent = null;
}

function drawRandomCard(student) {
  if (!student) return;
  if (!student.badges) student.badges = [];
  if (!student.cards) student.cards = [];

  const earnedBadgesCount = student.badges.length;
  const cardsCount = student.cards.length;
  const totalTickets = Math.floor(earnedBadgesCount / 5);
  const remainingTickets = Math.max(0, totalTickets - cardsCount);

  if (remainingTickets <= 0) {
    showToast("⚠️ ยังไม่มีสิทธิ์สุ่มการ์ด ต้องสะสมเหรียญตราครบทุก 5 เหรียญเพื่อรับ 1 สิทธิ์!");
    return;
  }

  const unownedCards = ART_CARDS.filter(c => !student.cards.includes(c.id));
  const pool = unownedCards.length > 0 ? unownedCards : ART_CARDS;
  const drawnCard = pool[Math.floor(Math.random() * pool.length)];

  if (!student.cards.includes(drawnCard.id)) {
    student.cards.push(drawnCard.id);
  }

  if (student.cards.length >= 3 && !student.badges.includes('card_master')) {
    student.badges.push('card_master');
  }

  saveDataToStorage();
  apiPost({
    action: 'save_student',
    grade: currentGrade,
    room: currentRoom,
    student: student
  });

  const modal = document.getElementById('cardDrawModal');
  const container = document.getElementById('cardDrawContainer');
  if (modal && container) {
    container.innerHTML = `
      <div class="card-draw-reveal" style="text-align: center; padding: 20px;">
        <div style="font-size: 2.4rem; animation: bounce 1s infinite;">🎉✨</div>
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #1E293B; margin-top: 6px;">
          ยินดีด้วย! คุณได้รับการ์ดพลังใหม่
        </h2>
        <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 20px;">
          สิทธิ์สุ่มการ์ดจากการสะสมเหรียญตราของ ${student.name}
        </p>

        <div class="art-holo-card holo-unlocked" style="background: ${drawnCard.gradient}; margin: 0 auto; width: 220px; height: 320px; box-shadow: 0 15px 35px rgba(0,0,0,0.3);">
          <div class="holo-shimmer"></div>
          <div class="holo-card-inner">
            <div class="holo-card-rarity">${drawnCard.rarityLabel}</div>
            <div class="holo-card-icon" style="font-size: 3.5rem;">${drawnCard.icon}</div>
            <div class="holo-card-title">${drawnCard.title}</div>
            <div class="holo-card-thai">${drawnCard.thaiTitle}</div>
            <div class="holo-card-power">${drawnCard.power}</div>
            <div class="holo-card-desc" style="font-size: 0.78rem;">${drawnCard.desc}</div>
          </div>
        </div>

        <div style="margin-top: 24px;">
          <button type="button" id="confirmCardDrawBtn" class="btn btn-art-primary" style="padding: 10px 28px; font-size: 1rem; border-radius: 9999px;">
            ✨ เก็บเข้าคลังการ์ด
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    artSound.playFanfare();
    confettiEngine.fire(80);

    const confirmBtn = container.querySelector('#confirmCardDrawBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        closeCardDrawModal();
      closeLuckyWheelModal();
        openStudentProfileModal(student);
      });
    }
  }
}

function closeCardDrawModal() {
  const modal = document.getElementById('cardDrawModal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================
// 10.6 ART LUCKY WHEEL SYSTEM (วงล้อรางวัลศิลปะนำโชค)
// การ์ด 5 ใบ กดวงล้อได้ 1 ครั้ง
// ==========================================
const ART_WHEEL_PRIZES = [
  { id: 'prize_tools', name: 'เลือกอุปกรณ์ก่อนใคร', icon: '🎨', color: '#F43F5E', desc: 'ได้สิทธิ์เลือกพู่กัน สี หรืออุปกรณ์พิเศษก่อนเพื่อนในคาบถัดไป' },
  { id: 'prize_bonus', name: 'คะแนนพิเศษ +2', icon: '⭐', color: '#8B5CF6', desc: 'ได้รับคะแนนโบนัสสะสมวิชาศิลปะเพิ่ม 2 คะแนน' },
  { id: 'prize_snack', name: 'ขนมรางวัลจากครู', icon: '🍬', color: '#06B6D4', desc: 'รับขนมอร่อยๆ 1 ชิ้นจากโต๊ะคุณครูศิลปะ' },
  { id: 'prize_time', name: 'ตั๋วต่อเวลา +2 วัน', icon: '🎟️', color: '#10B981', desc: 'ขยายเวลาส่งงานศิลปะชิ้นต่อไปได้อีก 2 วัน' },
  { id: 'prize_leader', name: 'หัวหน้ากลุ่มศิลปะ 1 วัน', icon: '👑', color: '#F59E0B', desc: 'ได้สิทธิ์เป็นผู้ช่วยครูจัดแจงอุปกรณ์และดูแลเพื่อน 1 วัน' },
  { id: 'prize_brush', name: 'สติ๊กเกอร์พรีเมียม', icon: '🖌️', color: '#EC4899', desc: 'รับสติ๊กเกอร์โฮโลแกรมศิลปะสุดเท่ไปสะสม' },
  { id: 'prize_title', name: 'ฉายาปรมาจารย์ศิลป์', icon: '🌟', color: '#3B82F6', desc: 'ได้รับการโปรโมตชื่อและผลงานเด่นในหน้า THE ART TIME' },
  { id: 'prize_respin', name: 'ดวงดีสองต่อ (หมุนฟรี)', icon: '🔄', color: '#14B8A6', desc: 'รับสิทธิ์หมุนวงล้อนำโชคเพิ่มฟรีอีก 1 รอบทันที!' }
];

let currentWheelStudent = null;
let isWheelSpinning = false;
let wheelCurrentAngle = 0;
let lastTickSector = -1;

function drawLuckyWheel(canvas, angle) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = cx - 18;
  const numPrizes = ART_WHEEL_PRIZES.length;
  const arc = (2 * Math.PI) / numPrizes;

  ctx.clearRect(0, 0, w, h);

  // Outer Golden Rim with lights
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, 2 * Math.PI);
  ctx.fillStyle = '#1E1B4B';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FCD34D';
  ctx.stroke();

  // Decorative lights on rim
  const numDots = 24;
  for (let i = 0; i < numDots; i++) {
    const dotAngle = (2 * Math.PI / numDots) * i + angle;
    const dotX = cx + (radius + 6) * Math.cos(dotAngle);
    const dotY = cy + (radius + 6) * Math.sin(dotAngle);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = i % 2 === 0 ? '#FBBF24' : '#FFFFFF';
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 4;
    ctx.fill();
  }
  ctx.restore();

  // Draw Slices
  for (let i = 0; i < numPrizes; i++) {
    const p = ART_WHEEL_PRIZES[i];
    const startAngle = angle + i * arc;
    const endAngle = startAngle + arc;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // Slice Content (Icon & Text)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // Text Label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12.5px Kanit, sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText(p.name, radius - 38, 0);

    // Icon Emoji
    ctx.font = '22px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillText(p.icon, radius - 10, 0);

    ctx.restore();
    ctx.restore();
  }

  // Center Inner Circle Rim
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#8B5CF6';
  ctx.stroke();
  ctx.restore();
}

function openLuckyWheelModal(student) {
  currentWheelStudent = student;
  const modal = document.getElementById('luckyWheelModal');
  if (!modal) return;

  const earnedCards = student.cards || [];
  const totalSpins = Math.floor(earnedCards.length / 5);
  const spentSpins = student.checklist && typeof student.checklist.spent_spins === 'number' ? student.checklist.spent_spins : 0;
  const remainingSpins = Math.max(0, totalSpins - spentSpins);

  const titleElem = document.getElementById('wheelModalTitle');
  if (titleElem) titleElem.textContent = `🎡 วงล้อรางวัล: ${student.name}`;

  const subElem = document.getElementById('wheelModalSub');
  if (subElem) {
    subElem.innerHTML = `สะสมการ์ดพลังครบ 5 ใบ = สิทธิ์หมุน 1 ครั้ง (ปัจจุบันมีการ์ด <strong>${earnedCards.length}</strong> ใบ)`;
  }

  const textRemaining = document.getElementById('wheelSpinsRemainingText');
  if (textRemaining) {
    textRemaining.innerHTML = `สิทธิ์หมุนคงเหลือ: <strong style="color: #7C3AED; font-size: 1.05rem;">${remainingSpins}</strong> ครั้ง`;
  }

  const resultBox = document.getElementById('wheelResultBox');
  if (resultBox) resultBox.classList.add('hidden');

  const btnSpin = document.getElementById('btnTriggerWheelSpin');
  if (btnSpin) {
    btnSpin.disabled = remainingSpins <= 0;
    btnSpin.style.opacity = remainingSpins <= 0 ? '0.6' : '1';
    btnSpin.style.cursor = remainingSpins <= 0 ? 'not-allowed' : 'pointer';
  }

  const canvas = document.getElementById('luckyWheelCanvas');
  if (canvas) {
    drawLuckyWheel(canvas, wheelCurrentAngle);
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  artSound.playPop();
}

function closeLuckyWheelModal() {
  if (isWheelSpinning) return;
  const modal = document.getElementById('luckyWheelModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function triggerLuckyWheelSpin() {
  if (isWheelSpinning || !currentWheelStudent) return;

  const student = currentWheelStudent;
  const earnedCards = student.cards || [];
  const totalSpins = Math.floor(earnedCards.length / 5);
  const spentSpins = student.checklist && typeof student.checklist.spent_spins === 'number' ? student.checklist.spent_spins : 0;
  const remainingSpins = Math.max(0, totalSpins - spentSpins);

  if (remainingSpins <= 0) {
    showToast("⚠️ ไม่มีสิทธิ์หมุนวงล้อ ต้องสะสมการ์ดพลังครบ 5 ใบเพื่อรับ 1 สิทธิ์!");
    return;
  }

  const canvas = document.getElementById('luckyWheelCanvas');
  if (!canvas) return;

  isWheelSpinning = true;
  const btnSpin = document.getElementById('btnTriggerWheelSpin');
  if (btnSpin) {
    btnSpin.disabled = true;
    btnSpin.style.opacity = '0.6';
  }

  const resultBox = document.getElementById('wheelResultBox');
  if (resultBox) resultBox.classList.add('hidden');

  const numPrizes = ART_WHEEL_PRIZES.length;
  const arc = (2 * Math.PI) / numPrizes;

  // Choose winning prize index
  const winnerIndex = Math.floor(Math.random() * numPrizes);
  const prize = ART_WHEEL_PRIZES[winnerIndex];

  // The pointer pin is at the top (angle = 1.5 * PI)
  const pinAngle = 1.5 * Math.PI;
  const targetSliceCenter = (winnerIndex + 0.5) * arc;
  const desiredEndAngle = pinAngle - targetSliceCenter;

  const currentMod = wheelCurrentAngle % (2 * Math.PI);
  let angleDiff = desiredEndAngle - currentMod;
  while (angleDiff < 0) angleDiff += 2 * Math.PI;

  const fullSpins = (5 + Math.floor(Math.random() * 3)) * (2 * Math.PI);
  const totalRotation = fullSpins + angleDiff;

  const startAngle = wheelCurrentAngle;
  const startTime = performance.now();
  const duration = 4500; // 4.5 seconds

  lastTickSector = -1;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = easeOutCubic(progress);

    wheelCurrentAngle = startAngle + totalRotation * easeProgress;
    drawLuckyWheel(canvas, wheelCurrentAngle);

    // Audio tick on sector crossing
    const currentSector = Math.floor(((pinAngle - wheelCurrentAngle) % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI) / arc);
    if (currentSector !== lastTickSector) {
      lastTickSector = currentSector;
      try { artSound.playWheelTick(); } catch (e) {}
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isWheelSpinning = false;
      onWheelFinished(student, prize);
    }
  }

  requestAnimationFrame(animate);
}

function onWheelFinished(student, prize) {
  if (!student.checklist) student.checklist = {};
  if (!student.checklist.wheel_rewards) student.checklist.wheel_rewards = [];

  // Update spent spins
  if (prize.id !== 'prize_respin') {
    student.checklist.spent_spins = (student.checklist.spent_spins || 0) + 1;
  } else {
    // Free re-spin bonus: do not consume spin!
    showToast("🎉 ส้มหล่นสองต่อ! ได้รับสิทธิ์หมุนฟรีทันทีอีก 1 ครั้ง!", "success");
  }

  // Record won prize
  student.checklist.wheel_rewards.push({
    id: prize.id,
    name: prize.name,
    icon: prize.icon,
    desc: prize.desc,
    date: new Date().toLocaleDateString('th-TH')
  });

  saveDataToStorage();
  apiPost({
    action: 'save_student',
    grade: currentGrade,
    room: currentRoom,
    student: student
  });

  try { artSound.playFanfare(); } catch (e) {}
  confettiEngine.fire(80);

  // Update UI
  const earnedCards = student.cards || [];
  const totalSpins = Math.floor(earnedCards.length / 5);
  const spentSpins = student.checklist && typeof student.checklist.spent_spins === 'number' ? student.checklist.spent_spins : 0;
  const remainingSpins = Math.max(0, totalSpins - spentSpins);

  const textRemaining = document.getElementById('wheelSpinsRemainingText');
  if (textRemaining) {
    textRemaining.innerHTML = `สิทธิ์หมุนคงเหลือ: <strong style="color: #7C3AED; font-size: 1.05rem;">${remainingSpins}</strong> ครั้ง`;
  }

  const btnSpin = document.getElementById('btnTriggerWheelSpin');
  if (btnSpin) {
    btnSpin.disabled = remainingSpins <= 0;
    btnSpin.style.opacity = remainingSpins <= 0 ? '0.6' : '1';
    btnSpin.style.cursor = remainingSpins <= 0 ? 'not-allowed' : 'pointer';
  }

  const resultBox = document.getElementById('wheelResultBox');
  const resultIcon = document.getElementById('wheelResultIcon');
  const resultName = document.getElementById('wheelResultName');
  const resultDesc = document.getElementById('wheelResultDesc');

  if (resultBox && resultIcon && resultName && resultDesc) {
    resultIcon.textContent = prize.icon;
    resultName.textContent = `${prize.icon} ${prize.name}`;
    resultDesc.textContent = prize.desc;
    resultBox.classList.remove('hidden');
  }
}


// ==========================================
// 11. TEACHER PORTAL & SCORING TABLE (ตรงตามบรีฟภาพ 3)
// ==========================================
function renderTeacherView() {
  const teacherGradeSelect = document.getElementById('teacherGradeSelect');
  const teacherRoomSelect = document.getElementById('teacherRoomSelect');

  if (teacherGradeSelect) teacherGradeSelect.value = currentGrade;
  if (teacherRoomSelect) teacherRoomSelect.value = currentRoom;

  // Update Room Slogan for current Room in Teacher Lounge
  const roomLabelElem = document.getElementById('teacherCurrentRoomLabel');
  const sloganInputElem = document.getElementById('teacherRoomSloganInput');
  if (roomLabelElem) {
    roomLabelElem.textContent = `${getGradeLabel(currentGrade)} / ห้อง ${currentRoom}`;
  }
  if (sloganInputElem) {
    sloganInputElem.value = getRoomSlogan(currentGrade, currentRoom);
  }

  const students = getStudentsList(currentGrade, currentRoom);
  const sortedByNo = [...students].sort((a, b) => (a.no || 0) - (b.no || 0));
  const tasks = getActiveAssignments();
  const scale = getClassScoreScale(currentGrade);

  // Dynamic Table Headers:
  // เลขที่, รูปโปรไฟล์, ชื่อ-นามสกุล, งาน... คะแนนเก็บ (40/80), คะแนนสอบ (10/20), คะแนนรวม (50/100), เกรด (ถ้ามี), จัดการ
  const theadRow = document.getElementById('teacherTableHeadRow');
  let headHtml = `
    <th style="width: 50px; text-align: center;">เลขที่</th>
    <th style="width: 60px; text-align: center;">รูปโปรไฟล์</th>
    <th style="min-width: 170px;">ชื่อ - นามสกุล</th>
  `;

  tasks.forEach((task, idx) => {
    headHtml += `
      <th style="min-width: 90px; text-align: center;" title="${task.title}">
        งาน ${idx + 1} (${task.maxScore})
      </th>
    `;
  });

  headHtml += `
    <th style="min-width: 85px; text-align: center; color: #4F46E5;">คะแนนเก็บ (${scale.maxAssignment})</th>
    <th style="min-width: 85px; text-align: center; color: #059669;">คะแนนสอบ (${scale.maxExam})</th>
    <th style="min-width: 85px; text-align: center; color: #D97706;">คะแนนรวม (${scale.maxTotal})</th>
  `;

  if (scale.hasGrade) {
    headHtml += `<th style="min-width: 65px; text-align: center;">เกรด</th>`;
  }

  headHtml += `<th style="min-width: 95px; text-align: center;">เหรียญตรา</th>`;
  headHtml += `<th style="width: 90px; text-align: center;">จัดการ</th>`;

  theadRow.innerHTML = headHtml;

  const tbody = document.getElementById('teacherTableBody');
  tbody.innerHTML = '';

  const colSpanCount = (scale.hasGrade ? 8 : 7) + tasks.length;

  if (sortedByNo.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${colSpanCount}" style="text-align: center; padding: 40px; color: #94A3B8;">
          🎨 ยังไม่มีข้อมูลนักเรียนใน ${getGradeLabel(currentGrade)} ห้อง ${currentRoom} <br>
          <div style="margin-top: 14px; display: flex; justify-content: center; gap: 10px;">
            <button id="addFirstStudentBtn" class="btn btn-art-primary">➕ เพิ่มนักเรียนคนแรก</button>
            <button id="importFirstBtn" class="btn btn-emerald">📥 นำเข้าจาก Excel/CSV</button>
          </div>
        </td>
      </tr>
    `;
    const addBtn = document.getElementById('addFirstStudentBtn');
    if (addBtn) addBtn.addEventListener('click', () => openStudentModal());
    const importBtn = document.getElementById('importFirstBtn');
    if (importBtn) importBtn.addEventListener('click', () => openImportModal());
    return;
  }

  sortedByNo.forEach(student => {
    if (!student.scores) student.scores = {};
    const sc = calcStudentAssignmentScore(student, currentGrade);
    const examScore = calcStudentExamScore(student, currentGrade);
    const totalScore = calcStudentTotalScore(student, currentGrade);
    const gradeVal = scale.hasGrade ? calculateGrade(totalScore, currentGrade) : '';

    const avatarDisplay = student.avatar && (student.avatar.startsWith('http') || student.avatar.startsWith('data:image'))
      ? `<img src="${student.avatar}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%;" alt="${student.name}">`
      : `<span style="font-size: 1.4rem;">${student.avatar || '🎨'}</span>`;

    const tr = document.createElement('tr');
    tr.id = `teacher-row-${student.id}`;

    let rowHtml = `
      <td style="font-weight: 700; text-align: center;">${student.no}</td>
      <td style="text-align: center;">
        <div class="teacher-avatar-trigger" data-student-id="${student.id}" style="cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" title="คลิกเพื่อเปลี่ยนรูปถ่าย">
          ${avatarDisplay}
        </div>
      </td>
      <td>
        <strong>${student.name}</strong>
      </td>
    `;

    // Dynamic inputs for each task
    tasks.forEach(task => {
      const val = student.scores[task.id] !== undefined ? student.scores[task.id] : '';
      rowHtml += `
        <td style="text-align: center;">
          <input type="number" min="0" max="${task.maxScore}" 
            class="score-input-inline task-score-input" 
            data-task-id="${task.id}" 
            data-max="${task.maxScore}"
            value="${val}" 
            placeholder="0-${task.maxScore}">
        </td>
      `;
    });

    // Auto-calculated columns
    rowHtml += `
      <td style="text-align: center; font-weight: 700; color: #4F46E5;">
        <span id="score80-${student.id}">${sc}</span>
      </td>
      <td style="text-align: center;">
        <input type="number" min="0" max="${scale.maxExam}" 
          class="score-input-inline exam-score-input" 
          data-student-id="${student.id}" 
          value="${examScore}" 
          placeholder="0-${scale.maxExam}">
      </td>
      <td style="text-align: center; font-weight: 800; font-size: 1.05rem; color: #D97706;">
        <span id="total100-${student.id}">${totalScore}</span>
      </td>
    `;

    if (scale.hasGrade) {
      rowHtml += `
        <td style="text-align: center; font-weight: 800; color: #059669;">
          <span id="grade-${student.id}" class="badge-grade-auto">${gradeVal}</span>
        </td>
      `;
    }

    rowHtml += `
      <td style="text-align: center;">
        <button type="button" class="btn btn-sm btn-badge-manage" data-student-id="${student.id}" style="background: linear-gradient(135deg, #FEF3C7, #FDE68A); color: #B45309; border: 1px solid #FCD34D; font-weight: 700; border-radius: 9999px; padding: 3px 10px; font-size: 0.8rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="เปิดระบบเช็กเกณฑ์เหรียญ & มอบเหรียญตรา">
          🏅 ${(student.badges || []).length} เหรียญ
        </button>
      </td>
      <td>
        <div class="table-actions-cell">
          <button class="btn-icon-sm view-profile-btn" title="ดูผลงาน & โปรไฟล์">👁️</button>
          <button class="btn-icon-sm edit-full-btn" title="แก้ไขข้อมูลนักเรียน">✏️</button>
          <button class="btn-icon-sm delete-btn" title="ลบข้อมูล">🗑️</button>
        </div>
      </td>
    `;

    tr.innerHTML = rowHtml;

    const badgeManageBtn = tr.querySelector('.btn-badge-manage');
    if (badgeManageBtn) {
      badgeManageBtn.addEventListener('click', () => openBadgeManagerModal(student));
    }

    // Helper to refresh calculated columns in row
    const refreshRowCalculations = () => {
      const newSc = calcStudentAssignmentScore(student, currentGrade);
      const newTotal = calcStudentTotalScore(student, currentGrade);
      const newGrade = scale.hasGrade ? calculateGrade(newTotal, currentGrade) : '';

      const el80 = document.getElementById(`score80-${student.id}`);
      const elTotal = document.getElementById(`total100-${student.id}`);
      const elGrade = document.getElementById(`grade-${student.id}`);

      if (el80) el80.textContent = newSc;
      if (elTotal) elTotal.textContent = newTotal;
      if (elGrade && scale.hasGrade) elGrade.textContent = newGrade;
    };

    // Realtime score update handler
    const updateTaskScore = (input, commit = false) => {
      const taskId = input.getAttribute('data-task-id');
      const maxScore = parseInt(input.getAttribute('data-max'), 10) || 100;
      let rawVal = input.value.trim();
      let val = rawVal === '' ? 0 : parseInt(rawVal, 10);

      if (isNaN(val) || val < 0) val = 0;
      if (val > maxScore) val = maxScore;
      if (commit) input.value = rawVal === '' ? '' : val;

      student.scores[taskId] = val;
      refreshRowCalculations();

      if (commit) {
        saveDataToStorage();
        apiPost({
          action: 'save_student',
          grade: currentGrade,
          room: currentRoom,
          student: student
        });
        showToast(`บันทึกคะแนน ${student.name} แล้ว!`);
        artSound.playSaveChime();
      }
    };

    // Attach inline score listeners (both input for instant calculation & change for saving)
    const scoreInputs = tr.querySelectorAll('.task-score-input');
    scoreInputs.forEach(input => {
      input.addEventListener('input', () => updateTaskScore(input, false));
      input.addEventListener('change', () => updateTaskScore(input, true));
    });

    // Realtime exam score update handler
    const updateExamScore = (commit = false) => {
      if (!examInput) return;
      let rawVal = examInput.value.trim();
      let val = rawVal === '' ? 0 : parseInt(rawVal, 10);
      if (isNaN(val) || val < 0) val = 0;
      if (val > scale.maxExam) val = scale.maxExam;
      if (commit) examInput.value = rawVal === '' ? '' : val;

      student.scores.examScore = val;
      student.examScore = val;
      refreshRowCalculations();

      if (commit) {
        saveDataToStorage();
        apiPost({
          action: 'save_student',
          grade: currentGrade,
          room: currentRoom,
          student: student
        });
        showToast(`บันทึกคะแนนสอบ ${student.name} (${val}/${scale.maxExam}) แล้ว!`);
        artSound.playSaveChime();
      }
    };

    // Attach exam score listener
    const examInput = tr.querySelector('.exam-score-input');
    if (examInput) {
      examInput.addEventListener('input', () => updateExamScore(false));
      examInput.addEventListener('change', () => updateExamScore(true));
    }

    // Teacher Change Profile Photo Listener
    tr.querySelector('.teacher-avatar-trigger').addEventListener('click', () => {
      const fileInp = document.createElement('input');
      fileInp.type = 'file';
      fileInp.accept = 'image/*';
      fileInp.style.display = 'none';
      document.body.appendChild(fileInp);

      fileInp.click();

      fileInp.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          try {
            const base64 = await resizeImageToCanvas(e.target.files[0], 250, 250, 0.85);
            student.avatar = base64;
            saveDataToStorage();
            apiPost({
              action: 'save_student',
              grade: currentGrade,
              room: currentRoom,
              student: student
            });
            artSound.playCamera();
            showToast(`เปลี่ยนรูปถ่ายของ ${student.name} สำเร็จ! 📸`);
            renderTeacherView();
          } catch (err) {
            alert("ไม่สามารถบันทึกรูปภาพได้: " + err.message);
          }
        }
        fileInp.remove();
      });
    });

    // Row action buttons
    tr.querySelector('.view-profile-btn').addEventListener('click', () => {
      openStudentProfileModal(student);
    });

    tr.querySelector('.edit-full-btn').addEventListener('click', () => {
      openStudentModal(student);
    });

    tr.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm(`คุณต้องการลบข้อมูลของ "${student.name}" ใช่หรือไม่?`)) {
        deleteStudent(student.id);
      }
    });

    tbody.appendChild(tr);
  });
}

function deleteStudent(studentId) {
  const list = getStudentsList(currentGrade, currentRoom);
  const index = list.findIndex(s => s.id === studentId);
  if (index !== -1) {
    list.splice(index, 1);
    saveDataToStorage();
    apiPost({ action: 'delete_student', studentId });
    showToast("ลบข้อมูลนักเรียนเรียบร้อยแล้ว");
    artSound.playPop();
    renderTeacherView();
  }
}

// ==========================================
// 9. ASSIGNMENTS / TASKS MANAGER MODAL
// ==========================================
let taskManagerTargetGrade = currentGrade;
let taskManagerTargetRoom = currentRoom;

function populateTaskManagerSelectors() {
  const gradeSel = document.getElementById('taskManagerGradeSelect');
  const roomSel = document.getElementById('taskManagerRoomSelect');
  const scopeBadge = document.getElementById('taskManagerScopeBadge');
  const termBadge = document.getElementById('taskManagerTermBadge');

  if (gradeSel) {
    gradeSel.innerHTML = (appConfig.grades || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    gradeSel.value = taskManagerTargetGrade;
  }

  const rooms = (appConfig.rooms && appConfig.rooms[taskManagerTargetGrade]) || ['1'];
  if (!rooms.includes(taskManagerTargetRoom)) {
    taskManagerTargetRoom = rooms[0] || '1';
  }

  if (roomSel) {
    roomSel.innerHTML = rooms.map(r => `<option value="${r}">ห้อง ${r}</option>`).join('');
    roomSel.value = taskManagerTargetRoom;
  }

  if (scopeBadge) {
    scopeBadge.textContent = `${getGradeLabel(taskManagerTargetGrade)} / ห้อง ${taskManagerTargetRoom}`;
  }
  if (termBadge) {
    termBadge.textContent = `ภาคเรียนที่ ${appConfig.semester || '1'} ปีการศึกษา ${appConfig.academicYear || '2567'}`;
  }
}

function openTaskManagerModal() {
  taskManagerTargetGrade = currentGrade;
  taskManagerTargetRoom = currentRoom;
  const modal = document.getElementById('taskManagerModal');
  populateTaskManagerSelectors();
  renderTasksManagerList();
  if (modal) modal.classList.remove('hidden');
}

function closeTaskManagerModal() {
  document.getElementById('taskManagerModal').classList.add('hidden');
}

function copyTasksToEntireGrade() {
  const currentTasks = getActiveAssignments(taskManagerTargetGrade, taskManagerTargetRoom);
  const rooms = (appConfig.rooms && appConfig.rooms[taskManagerTargetGrade]) || ['1'];
  const gradeName = getGradeLabel(taskManagerTargetGrade);

  if (!confirm(`คุณต้องการคัดลอกรายการชิ้นงานชุดนี้ (${currentTasks.length} งาน) ไปใช้กับทุกห้องใน ${gradeName} (ห้อง ${rooms.join(', ')}) ใช่หรือไม่?`)) {
    return;
  }

  if (!appConfig.roomAssignments) appConfig.roomAssignments = {};

  rooms.forEach(r => {
    const key = getRoomAssignmentKey(taskManagerTargetGrade, r);
    appConfig.roomAssignments[key] = JSON.parse(JSON.stringify(currentTasks));
  });

  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  showToast(`คัดลอกชิ้นงานไปยังทุกห้องของ ${gradeName} สำเร็จแล้ว! 📋`);
  artSound.playSaveChime();

  if (currentView === 'teacher') renderTeacherView();
  else if (currentView === 'leaderboard') renderLeaderboardView();
}

function openEditTaskModal(task) {
  const modal = document.getElementById('editTaskModal');
  const idInput = document.getElementById('editTaskId');
  const titleInput = document.getElementById('editTaskTitleInput');
  const maxScoreInput = document.getElementById('editTaskMaxScoreInput');

  if (idInput) idInput.value = task.id;
  if (titleInput) titleInput.value = task.title;
  if (maxScoreInput) maxScoreInput.value = task.maxScore;

  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
  setTimeout(() => titleInput?.focus(), 120);
}

function closeEditTaskModal() {
  const modal = document.getElementById('editTaskModal');
  if (modal) modal.classList.add('hidden');
}

function handleEditTaskSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('editTaskId')?.value;
  const title = document.getElementById('editTaskTitleInput')?.value?.trim();
  const maxScore = parseInt(document.getElementById('editTaskMaxScoreInput')?.value, 10);

  if (!title) {
    alert("กรุณาระบุชื่อหัวข้องาน");
    return;
  }
  if (isNaN(maxScore) || maxScore <= 0) {
    alert("กรุณาระบุคะแนนเต็มที่ถูกต้อง (มากกว่า 0)");
    return;
  }

  const roomTasks = ensureRoomAssignmentsMutable(taskManagerTargetGrade, taskManagerTargetRoom);
  const task = roomTasks.find(t => t.id === id);
  if (task) {
    task.title = title;
    task.maxScore = maxScore;
    saveConfigToStorage();
    apiPost({ action: 'save_config', config: appConfig });

    closeEditTaskModal();
    renderTasksManagerList();
    showToast(`อัปเดตชิ้นงาน "${title}" (เต็ม ${maxScore} คะแนน) สำเร็จ!`);
    artSound.playSaveChime();

    if (currentView === 'teacher') renderTeacherView();
    else if (currentView === 'leaderboard') renderLeaderboardView();
    renderClassroomGallery();
  }
}

function renderTasksManagerList() {
  const container = document.getElementById('tasksListContainer');
  const countLabel = document.getElementById('taskCountLabel');
  const totalBadge = document.getElementById('totalMaxScoreBadge');
  const tasks = getActiveAssignments(taskManagerTargetGrade, taskManagerTargetRoom);
  const totalMax = getTotalMaxScore(taskManagerTargetGrade, taskManagerTargetRoom);
  const scale = getClassScoreScale(taskManagerTargetGrade);

  if (countLabel) countLabel.textContent = tasks.length;
  if (totalBadge) {
    totalBadge.textContent = `คะแนนเต็มรวม: ${totalMax} คะแนน (คะแนนเก็บฐาน ${scale.maxAssignment} คะแนน)`;
  }
  if (!container) return;
  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 25px; color: #94A3B8;">ยังไม่มีหัวข้องานที่สั่งสำหรับห้องนี้ กรุณาเพิ่มชิ้นงานด้านบน</div>`;
    return;
  }

  tasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className = 'task-item-card';

    card.innerHTML = `
      <div class="task-item-info">
        <span style="font-weight: 800; color: #64748B;">#${idx + 1}</span>
        <span class="task-item-title">${task.title}</span>
        <span class="task-item-score-badge">เต็ม ${task.maxScore} คะแนน</span>
      </div>
      <div class="task-item-actions">
        <button class="btn-icon-sm edit-task-btn" title="แก้ไขชื่องาน/คะแนนเต็ม">✏️</button>
        <button class="btn-icon-sm delete-btn delete-task-btn" title="ลบชิ้นงานนี้">🗑️</button>
      </div>
    `;

    card.querySelector('.edit-task-btn').addEventListener('click', () => {
      openEditTaskModal(task);
    });

    card.querySelector('.delete-task-btn').addEventListener('click', () => {
      if (confirm(`คุณต้องการลบ "${task.title}" ของห้องนี้ใช่หรือไม่?`)) {
        deleteAssignment(task.id);
      }
    });

    container.appendChild(card);
  });
}

function addNewAssignment(title, maxScore) {
  const cleanTitle = title.trim();
  const cleanMax = parseInt(maxScore, 10);

  if (!cleanTitle) {
    alert("กรุณากรอกชื่อชิ้นงาน");
    return;
  }
  if (isNaN(cleanMax) || cleanMax <= 0) {
    alert("กรุณากรอกคะแนนเต็มที่ถูกต้อง (มากกว่า 0)");
    return;
  }

  const roomTasks = ensureRoomAssignmentsMutable(taskManagerTargetGrade, taskManagerTargetRoom);
  const newId = `task_${Date.now()}`;
  roomTasks.push({
    id: newId,
    title: cleanTitle,
    maxScore: cleanMax
  });

  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });
  renderTasksManagerList();
  showToast(`เพิ่มชิ้นงาน "${cleanTitle}" สำเร็จแล้ว!`);
  artSound.playSaveChime();

  if (currentView === 'teacher') renderTeacherView();
  else if (currentView === 'leaderboard') renderLeaderboardView();
}

function deleteAssignment(taskId) {
  const roomTasks = ensureRoomAssignmentsMutable(taskManagerTargetGrade, taskManagerTargetRoom);
  const idx = roomTasks.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    const deleted = roomTasks.splice(idx, 1)[0];
    saveConfigToStorage();
    apiPost({ action: 'save_config', config: appConfig });
    renderTasksManagerList();
    showToast(`ลบชิ้นงาน "${deleted.title}" เรียบร้อยแล้ว`);
    artSound.playPop();

    if (currentView === 'teacher') renderTeacherView();
    else if (currentView === 'leaderboard') renderLeaderboardView();
  }
}

// ==========================================
// 10. STUDENT MODAL (ADD / EDIT)
// ==========================================
function openStudentModal(editingStudent = null) {
  const modal = document.getElementById('studentModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('studentForm');
  const tasksGrid = document.getElementById('modalTasksGrid');
  const tasks = getActiveAssignments();

  form.reset();
  tasksGrid.innerHTML = '';

  if (editingStudent) {
    title.textContent = `แก้ไขข้อมูล: ${editingStudent.name}`;
    document.getElementById('editStudentId').value = editingStudent.id;
    document.getElementById('inputStudentNo').value = editingStudent.no;
    document.getElementById('inputStudentName').value = editingStudent.name;
    document.getElementById('inputNickname').value = editingStudent.nickname || '';
    document.getElementById('inputAvatar').value = editingStudent.avatar || '👦';
    document.getElementById('inputTeacherFeedback').value = editingStudent.feedback || '';

    // Render inputs for each assignment
    tasks.forEach(task => {
      const scoreVal = (editingStudent.scores && editingStudent.scores[task.id] !== undefined)
        ? editingStudent.scores[task.id]
        : 0;

      const div = document.createElement('div');
      div.className = 'task-modal-item';
      div.innerHTML = `
        <label title="${task.title}">${task.title} (เต็ม ${task.maxScore})</label>
        <input type="number" min="0" max="${task.maxScore}" value="${scoreVal}" data-task-id="${task.id}" class="modal-task-score-input" required>
      `;
      tasksGrid.appendChild(div);
    });
  } else {
    title.textContent = `เพิ่มข้อมูลนักเรียนใหม่ (${getGradeLabel(currentGrade)} ห้อง ${currentRoom})`;
    document.getElementById('editStudentId').value = '';
    const list = getStudentsList(currentGrade, currentRoom);
    const nextNo = list.length > 0 ? Math.max(...list.map(s => s.no || 0)) + 1 : 1;
    document.getElementById('inputStudentNo').value = nextNo;

    // Render blank inputs for each assignment
    tasks.forEach(task => {
      const div = document.createElement('div');
      div.className = 'task-modal-item';
      div.innerHTML = `
        <label title="${task.title}">${task.title} (เต็ม ${task.maxScore})</label>
        <input type="number" min="0" max="${task.maxScore}" value="${task.maxScore}" data-task-id="${task.id}" class="modal-task-score-input" required>
      `;
      tasksGrid.appendChild(div);
    });
  }

  // Real-time sum calculation
  tasksGrid.querySelectorAll('.modal-task-score-input').forEach(input => {
    input.addEventListener('input', updateModalScoreSum);
  });

  updateModalScoreSum();
  modal.classList.remove('hidden');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.add('hidden');
}

function updateModalScoreSum() {
  const inputs = document.querySelectorAll('.modal-task-score-input');
  let sum = 0;
  inputs.forEach(inp => {
    const v = parseInt(inp.value, 10);
    if (!isNaN(v)) sum += v;
  });
  const totalMax = getTotalMaxScore();
  const sumElem = document.getElementById('modalScoreSum');
  if (sumElem) {
    sumElem.textContent = `รวม: ${sum} / ${totalMax}`;
  }
}

function handleStudentFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editStudentId').value;
  const no = parseInt(document.getElementById('inputStudentNo').value, 10) || 1;
  const name = document.getElementById('inputStudentName').value.trim();
  const nickname = document.getElementById('inputNickname').value.trim();
  const avatar = document.getElementById('inputAvatar').value;
  const feedback = document.getElementById('inputTeacherFeedback').value.trim();

  // Harvest assignment scores
  const scores = {};
  const inputs = document.querySelectorAll('.modal-task-score-input');
  inputs.forEach(inp => {
    const taskId = inp.getAttribute('data-task-id');
    const max = parseInt(inp.getAttribute('max'), 10) || 100;
    let v = parseInt(inp.value, 10);
    if (isNaN(v) || v < 0) v = 0;
    if (v > max) v = max;
    scores[taskId] = v;
  });

  const list = getStudentsList(currentGrade, currentRoom);

  if (id) {
    const existing = list.find(s => s.id === id);
    if (existing) {
      existing.no = no;
      existing.name = name;
      existing.nickname = nickname;
      existing.avatar = avatar;
      existing.scores = scores;
      existing.feedback = feedback;
    }
    showToast(`อัปเดตข้อมูล ${name} สำเร็จ!`);
  } else {
    const newStudent = {
      id: `${currentGrade}_${currentRoom}_${Date.now()}`,
      no,
      name,
      nickname,
      avatar,
      scores,
      feedback
    };
    list.push(newStudent);
    showToast(`เพิ่มข้อมูล ${name} เรียบร้อยแล้ว!`);
  }

  saveDataToStorage();
  apiPost({
    action: 'save_student',
    grade: currentGrade,
    room: currentRoom,
    student: id ? list.find(s => s.id === id) : list[list.length - 1]
  });
  artSound.playSaveChime();
  closeStudentModal();

  if (currentView === 'teacher') renderTeacherView();
  else renderLeaderboardView();
}

// ==========================================
// 11. ROOM CONFIGURATION MODAL
// ==========================================
function openRoomConfigModal() {
  const modal = document.getElementById('roomConfigModal');
  renderRoomsTree();
  modal.classList.remove('hidden');
}

function closeRoomConfigModal() {
  document.getElementById('roomConfigModal').classList.add('hidden');
}

function renderRoomsTree() {
  const container = document.getElementById('configRoomsListContainer');
  container.innerHTML = '';

  appConfig.grades.forEach(grade => {
    const rooms = (appConfig.rooms && appConfig.rooms[grade.id]) || [];
    const div = document.createElement('div');
    div.className = 'config-grade-group';

    div.innerHTML = `
      <div class="config-grade-header">
        <span>🎒 ${grade.name}</span>
        <small style="color: #64748B;">(${rooms.length} ห้อง)</small>
      </div>
      <div class="config-room-chips">
        ${rooms.map(room => `
          <span class="room-chip-tag">
            ห้อง ${room}
            <span class="room-chip-delete" data-grade="${grade.id}" data-room="${room}" title="ลบห้องนี้">&times;</span>
          </span>
        `).join('')}
      </div>
    `;

    div.querySelectorAll('.room-chip-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gId = e.target.getAttribute('data-grade');
        const rId = e.target.getAttribute('data-room');
        deleteRoom(gId, rId);
      });
    });

    container.appendChild(div);
  });
}

function addNewRoom(gradeId, roomName) {
  let cleanName = roomName.trim();
  if (!cleanName) return;

  if (!appConfig.rooms[gradeId]) {
    appConfig.rooms[gradeId] = [];
  }

  if (appConfig.rooms[gradeId].includes(cleanName)) {
    alert(`ห้อง ${cleanName} มีอยู่แล้วในระดับชั้นนี้`);
    return;
  }

  appConfig.rooms[gradeId].push(cleanName);
  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });
  populateRoomDropdowns();
  renderRoomsTree();
  showToast(`เพิ่มห้อง ${cleanName} ใน ${getGradeLabel(gradeId)} เรียบร้อย!`);
  artSound.playSaveChime();
}

function deleteRoom(gradeId, roomName) {
  const classKey = `${gradeId}_${roomName}`;
  const count = (appData[classKey] || []).length;

  const confirmMsg = count > 0 
    ? `ห้องนี้มีนักเรียนอยู่ ${count} คน หากลบห้องนี้ นักเรียนจะยังถูกเก็บไว้ในฐานข้อมูล แต่จะไม่ปรากฏในรายการ คุณต้องการลบห้องนี้ใช่หรือไม่?`
    : `คุณต้องการลบห้อง ${roomName} ใช่หรือไม่?`;

  if (confirm(confirmMsg)) {
    const list = appConfig.rooms[gradeId] || [];
    const idx = list.indexOf(roomName);
    if (idx !== -1) {
      list.splice(idx, 1);
      saveConfigToStorage();
      apiPost({ action: 'save_config', config: appConfig });
      populateRoomDropdowns();
      renderRoomsTree();
      showToast(`ลบห้อง ${roomName} เรียบร้อยแล้ว`);
      artSound.playPop();

      if (currentGrade === gradeId && currentRoom === roomName) {
        currentRoom = (appConfig.rooms[gradeId] && appConfig.rooms[gradeId][0]) || '1';
        populateRoomDropdowns();
        if (currentView === 'teacher') renderTeacherView();
        else renderLeaderboardView();
      }
    }
  }
}

// ==========================================
// 12. EXCEL / CSV IMPORT SYSTEM
// ==========================================
function openImportModal() {
  const modal = document.getElementById('importModal');
  const targetLabel = document.getElementById('importTargetLabel');
  targetLabel.textContent = `${getGradeLabel(currentGrade)} ห้อง ${currentRoom}`;

  stagedImportStudents = [];
  document.getElementById('importPreviewArea').classList.add('hidden');
  document.getElementById('confirmImportBtn').disabled = true;
  document.getElementById('fileInputExcel').value = '';

  modal.classList.remove('hidden');
}

function closeImportModal() {
  document.getElementById('importModal').classList.add('hidden');
}

function downloadTemplateCsv() {
  const tasks = getActiveAssignments();
  const headers = ["เลขที่", "ชื่อ-นามสกุล", "ชื่อเล่น", "อิโมจิ"];
  tasks.forEach((t, i) => {
    headers.push(`งานที่ ${i + 1} (${t.maxScore})`);
  });
  headers.push("คำติชมครู");

  const sampleRows = [
    ["1", "ด.ช. ธนกร ศิลป์เลิศ", "อาร์ต", "👦", ...tasks.map(t => t.maxScore), "ส่งงานตรงเวลาทุกชิ้นงาน ทักษะการคุมสีน้ำยอดเยี่ยม"],
    ["2", "ด.ญ. พิมพ์มาดา วาดวิจิตร", "พู่กัน", "👧", ...tasks.map(t => Math.max(0, t.maxScore - 1)), "งานสร้างสรรค์ไอเดียแปลกใหม่ ลายเส้นสดใส"],
    ["3", "ด.ญ. กัญญาพัชร สีสันดี", "สายรุ้ง", "🦄", ...tasks.map(t => Math.max(0, t.maxScore - 2)), "การเลือกคู่สีพาสเทลลงตัวและประณีต"]
  ];

  let csvContent = "\uFEFF"; // UTF-8 BOM
  csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n";
  sampleRows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(",") + "\r\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Art_Assignments_Template_${currentGrade}_Room${currentRoom}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("ดาวน์โหลดไฟล์ตัวอย่าง Template (.csv) เรียบร้อยแล้ว!");
}

function handleFileUpload(file) {
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const reader = new FileReader();

  if (fileName.endsWith('.csv')) {
    reader.onload = function(e) {
      parseCsvToStaged(e.target.result);
    };
    reader.readAsText(file, 'UTF-8');
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      if (typeof XLSX !== 'undefined') {
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        parseSheetJsonToStaged(json);
      } else {
        alert("กรุณารอโหลดเครื่องมืออ่าน Excel สักครู่ หรือใช้ไฟล์ .csv แทน");
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("รองรับเฉพาะไฟล์ .csv, .xlsx หรือ .xls เท่านั้น");
  }
}

function parseCsvToStaged(csvText) {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    alert("ไฟล์ว่างเปล่าหรือไม่มีข้อมูลนักเรียน");
    return;
  }

  const rawRows = lines.map(line => {
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const row = [];
    let match;
    while ((match = regex.exec(line)) !== null && match.index < line.length) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      row.push(val.trim());
    }
    return row;
  });

  parseSheetJsonToStaged(rawRows);
}

function parseSheetJsonToStaged(rows) {
  if (!rows || rows.length < 2) {
    alert("ไม่พบข้อมูลแถวนักเรียนในไฟล์");
    return;
  }

  const tasks = getActiveAssignments();
  const headers = rows[0].map(h => String(h || '').trim().toLowerCase());

  let idxNo = headers.findIndex(h => h.includes('เลขที่') || h.includes('no'));
  let idxName = headers.findIndex(h => h.includes('ชื่อ-นามสกุล') || h.includes('ชื่อ') || h.includes('name'));
  let idxNick = headers.findIndex(h => h.includes('ชื่อเล่น') || h.includes('nick'));
  let idxAvatar = headers.findIndex(h => h.includes('อิโมจิ') || h.includes('avatar'));
  let idxFeedback = headers.findIndex(h => h.includes('ติชม') || h.includes('comment') || h.includes('feedback'));

  if (idxNo === -1) idxNo = 0;
  if (idxName === -1) idxName = 1;
  if (idxNick === -1) idxNick = 2;
  if (idxAvatar === -1) idxAvatar = 3;

  // Map each assignment to corresponding column
  const taskColMap = {};
  tasks.forEach((t, i) => {
    const taskKeyword = `งานที่ ${i + 1}`;
    const altKeyword = `งาน ${i + 1}`;
    let foundIdx = headers.findIndex(h => h.includes(taskKeyword.toLowerCase()) || h.includes(altKeyword.toLowerCase()));
    if (foundIdx === -1) {
      foundIdx = 4 + i;
    }
    taskColMap[t.id] = foundIdx;
  });

  stagedImportStudents = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || !row[idxName]) continue;

    const no = parseInt(row[idxNo], 10) || r;
    const name = String(row[idxName] || '').trim();
    if (!name) continue;

    const nickname = idxNick !== -1 ? String(row[idxNick] || '').trim() : '';
    const avatar = idxAvatar !== -1 && row[idxAvatar] ? String(row[idxAvatar]).trim() : '🎨';
    const feedback = idxFeedback !== -1 && row[idxFeedback] ? String(row[idxFeedback]).trim() : '';

    const scores = {};
    tasks.forEach(t => {
      const colIdx = taskColMap[t.id];
      if (colIdx !== undefined && row[colIdx] !== undefined && row[colIdx] !== '') {
        const parsed = parseInt(row[colIdx], 10);
        scores[t.id] = isNaN(parsed) ? 0 : Math.min(t.maxScore, Math.max(0, parsed));
      } else {
        scores[t.id] = t.maxScore;
      }
    });

    stagedImportStudents.push({
      id: `${currentGrade}_${currentRoom}_imp_${Date.now()}_${r}`,
      no,
      name,
      nickname,
      avatar,
      scores,
      feedback
    });
  }

  renderImportPreview();
}

function renderImportPreview() {
  const previewArea = document.getElementById('importPreviewArea');
  const previewCount = document.getElementById('previewCount');
  const theadRow = document.getElementById('previewTableHeadRow');
  const tbody = document.getElementById('importPreviewTableBody');
  const confirmBtn = document.getElementById('confirmImportBtn');
  const tasks = getActiveAssignments();
  const totalMax = getTotalMaxScore();

  if (stagedImportStudents.length === 0) {
    alert("ไม่พบข้อมูลนักเรียนที่ถูกต้องในไฟล์ กรุณาตรวจสอบรูปแบบไฟล์");
    previewArea.classList.add('hidden');
    confirmBtn.disabled = true;
    return;
  }

  previewCount.textContent = stagedImportStudents.length;

  let headHtml = `
    <th>เลขที่</th>
    <th>ชื่อ-นามสกุล</th>
    <th>ชื่อเล่น</th>
  `;
  tasks.forEach((t, i) => {
    headHtml += `<th>งาน ${i + 1} (${t.maxScore})</th>`;
  });
  headHtml += `<th>รวม (${totalMax})</th><th>คำติชม</th>`;
  theadRow.innerHTML = headHtml;

  tbody.innerHTML = '';

  stagedImportStudents.forEach(s => {
    const total = calcStudentTotalScore(s);
    let rowHtml = `
      <td>${s.no}</td>
      <td><strong>${s.name}</strong></td>
      <td>${s.nickname || '-'}</td>
    `;
    tasks.forEach(t => {
      const v = (s.scores && s.scores[t.id] !== undefined) ? s.scores[t.id] : 0;
      rowHtml += `<td>${v}</td>`;
    });
    rowHtml += `<td><strong>${total}</strong></td><td><small>${s.feedback || '-'}</small></td>`;

    const tr = document.createElement('tr');
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  });

  previewArea.classList.remove('hidden');
  confirmBtn.disabled = false;
  artSound.playPop();
}

function confirmImport() {
  if (stagedImportStudents.length === 0) return;

  const modeRadio = document.querySelector('input[name="importMode"]:checked');
  const mode = modeRadio ? modeRadio.value : 'append';

  const classKey = getClassKey(currentGrade, currentRoom);
  if (!appData[classKey]) appData[classKey] = [];

  if (mode === 'replace') {
    appData[classKey] = [...stagedImportStudents];
  } else {
    appData[classKey].push(...stagedImportStudents);
  }

  saveDataToStorage();
  apiPost({
    action: 'import_students',
    grade: currentGrade,
    room: currentRoom,
    students: stagedImportStudents,
    mode
  });
  artSound.playFanfare();
  confettiEngine.fire(80);
  showToast(`นำเข้านักเรียน ${stagedImportStudents.length} คน เข้าสู่ ${getGradeLabel(currentGrade)} ห้อง ${currentRoom} สำเร็จแล้ว!`);
  closeImportModal();

  if (currentView === 'teacher') renderTeacherView();
  else renderLeaderboardView();
}

// ==========================================
// 13. EXCEL / CSV EXPORT SYSTEM
// ==========================================
function getExportDataForClass(gradeId, roomId) {
  const list = getRankedStudents(gradeId, roomId);
  const gradeLabel = getGradeLabel(gradeId);
  const tasks = getActiveAssignments();
  const scale = getClassScoreScale(gradeId);

  return list.map((s, index) => {
    const rank = index + 1;
    const totalScore = calcStudentTotalScore(s, gradeId);
    const sc = calcStudentAssignmentScore(s, gradeId);
    const exam = calcStudentExamScore(s, gradeId);
    const gradeVal = scale.hasGrade ? calculateGrade(totalScore, gradeId) : '';
    const tier = getArtRankTier(totalScore, gradeId);

    const rowObj = {
      "อันดับ (Rank)": rank,
      "ระดับชั้น": gradeLabel,
      "ห้อง": `ห้อง ${roomId}`,
      "เลขที่": s.no,
      "ชื่อ-นามสกุล": s.name,
      "ชื่อเล่น": s.nickname || ''
    };

    // Columns for each assignment
    tasks.forEach((t, i) => {
      const val = (s.scores && s.scores[t.id] !== undefined) ? s.scores[t.id] : 0;
      rowObj[`งานที่ ${i + 1}: ${t.title} (${t.maxScore})`] = val;
    });

    rowObj[`คะแนนเก็บ (${scale.maxAssignment})`] = sc;
    rowObj[`คะแนนสอบ (${scale.maxExam})`] = exam;
    rowObj[`คะแนนรวม (${scale.maxTotal})`] = totalScore;
    if (scale.hasGrade) {
      rowObj["เกรด (Grade)"] = gradeVal;
    }
    rowObj["อันดับแรงก์ (Art Rank)"] = `${tier.icon} ${tier.label}`;
    rowObj["ฉายาทางศิลปะ"] = tier.title;
    rowObj["คำติชมของครู"] = s.feedback || '';

    return rowObj;
  });
}

function exportToCsv(dataRows, filename) {
  if (!dataRows || dataRows.length === 0) {
    alert("ไม่มีข้อมูลสำหรับส่งออก");
    return;
  }

  const headers = Object.keys(dataRows[0]);
  let csv = "\uFEFF"; // UTF-8 BOM
  csv += headers.map(h => `"${h}"`).join(",") + "\r\n";

  dataRows.forEach(row => {
    const line = headers.map(h => {
      let cell = row[h] === null || row[h] === undefined ? "" : String(row[h]);
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(",");
    csv += line + "\r\n";
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว!`);
  artSound.playSaveChime();
}

function exportToXlsx(dataRows, filename, sheetName = 'คะแนนศิลปะ') {
  if (!dataRows || dataRows.length === 0) {
    alert("ไม่มีข้อมูลสำหรับส่งออก");
    return;
  }

  if (typeof XLSX !== 'undefined') {
    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
    XLSX.writeFile(workbook, filename);
    showToast(`ส่งออกไฟล์ Excel (${filename}) เรียบร้อยแล้ว!`);
    artSound.playSaveChime();
  } else {
    exportToCsv(dataRows, filename.replace('.xlsx', '.csv'));
  }
}

function exportCurrentClass(format = 'xlsx') {
  const rows = getExportDataForClass(currentGrade, currentRoom);
  if (rows.length === 0) {
    alert(`ไม่มีข้อมูลนักเรียนใน ${getGradeLabel(currentGrade)} ห้อง ${currentRoom}`);
    return;
  }
  const filename = `Art_Assignments_Scores_${currentGrade}_Room${currentRoom}.${format}`;
  if (format === 'xlsx') {
    exportToXlsx(rows, filename, `${currentGrade}_Room${currentRoom}`);
  } else {
    exportToCsv(rows, filename);
  }
}

function exportAllClasses(format = 'xlsx') {
  const allRows = [];
  appConfig.grades.forEach(g => {
    const rooms = (appConfig.rooms && appConfig.rooms[g.id]) || [];
    rooms.forEach(r => {
      const rows = getExportDataForClass(g.id, r);
      allRows.push(...rows);
    });
  });

  if (allRows.length === 0) {
    alert("ไม่มีข้อมูลนักเรียนในระบบ");
    return;
  }

  const filename = `Art_Assignments_Scores_All_Classes_${new Date().toISOString().slice(0, 10)}.${format}`;
  if (format === 'xlsx') {
    exportToXlsx(allRows, filename, 'คะแนนนักเรียนทั้งหมด');
  } else {
    exportToCsv(allRows, filename);
  }
}

// ==========================================
// 14. TOAST & NOTIFICATIONS
// ==========================================
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const msgElem = document.getElementById('toastMessage');
  msgElem.textContent = message;
  toast.classList.remove('hidden');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ==========================================
// 15. EVENT LISTENERS & INITIALIZATION
// ==========================================
function switchView(viewName) {
  currentView = viewName;
  const hmBtn = document.getElementById('viewHomeBtn');
  const lbBtn = document.getElementById('viewLeaderboardBtn');
  const tcBtn = document.getElementById('viewTeacherBtn');

  const hmSec = document.getElementById('homeView');
  const lbSec = document.getElementById('leaderboardView');
  const tcSec = document.getElementById('teacherView');

  if (hmBtn) hmBtn.classList.toggle('active', viewName === 'home');
  if (lbBtn) lbBtn.classList.toggle('active', viewName === 'leaderboard');
  if (tcBtn) tcBtn.classList.toggle('active', viewName === 'teacher');

  if (hmSec) hmSec.classList.toggle('active-view', viewName === 'home');
  if (lbSec) lbSec.classList.toggle('active-view', viewName === 'leaderboard');
  if (tcSec) tcSec.classList.toggle('active-view', viewName === 'teacher');

  const gallerySec = document.getElementById('classroomGallerySection');
  if (gallerySec) {
    if (viewName === 'leaderboard') {
      gallerySec.style.display = 'block';
      renderClassroomGallery();
    } else {
      gallerySec.style.display = 'none';
    }
  }

  if (viewName === 'home') {
    renderHomeView();
  } else if (viewName === 'leaderboard') {
    renderLeaderboardView();
  } else if (viewName === 'teacher') {
    renderTeacherView();
  }
}

// ==========================================
// 15. AUTHENTICATION & TEACHER SESSIONS
// ==========================================
function updateTeacherAuthUI(user = null) {
  const current = user || getLoggedInTeacher();
  const chip = document.getElementById('loggedInUserChip');
  const headerBadge = document.getElementById('headerTeacherBadge');
  const headerName = document.getElementById('headerTeacherName');
  const headerLoginBtn = document.getElementById('headerLoginBtn');

  if (current) {
    const displayName = current.displayName || current.username;
    if (chip) {
      chip.textContent = `👩‍🏫 ${displayName}`;
      chip.title = `บัญชีผู้สอน: ${displayName} (@${current.username})`;
    }
    if (headerName) {
      headerName.textContent = displayName;
    }
    if (headerBadge) {
      headerBadge.classList.remove('hidden');
    }
    if (headerLoginBtn) {
      headerLoginBtn.classList.add('hidden');
    }
  } else {
    if (chip) {
      chip.textContent = '👤 ครูผู้ดูแลระบบ';
      chip.removeAttribute('title');
    }
    if (headerBadge) {
      headerBadge.classList.add('hidden');
    }
    if (headerLoginBtn) {
      headerLoginBtn.classList.remove('hidden');
    }
  }

  // Toggle Leaderboard teacher picker
  const lbTeacherPicker = document.getElementById('leaderboardTeacherClassPicker');
  if (lbTeacherPicker) {
    lbTeacherPicker.classList.toggle('hidden', !current);
    if (current) {
      populateGradeDropdowns();
    }
  }

  // Refresh classroom gallery so teacher add/delete controls update
  renderClassroomGallery();
  renderMagazinePhotoToggles();
}

function openTeacherLoginModal() {
  const modal = document.getElementById('teacherLoginModal');
  const errBox = document.getElementById('loginErrorMsg');
  const form = document.getElementById('teacherLoginForm');
  form.reset();
  if (errBox) errBox.classList.add('hidden');
  modal.classList.remove('hidden');
  const usernameInput = document.getElementById('loginUsername');
  if (usernameInput) usernameInput.focus();
}

function closeTeacherLoginModal() {
  document.getElementById('teacherLoginModal').classList.add('hidden');
}

async function handleTeacherLoginSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('loginUsername').value.trim();
  const passwordInput = document.getElementById('loginPassword').value;
  const errBox = document.getElementById('loginErrorMsg');
  const errText = document.getElementById('loginErrorText');

  if (!usernameInput || !passwordInput) {
    errText.textContent = "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน";
    errBox.classList.remove('hidden');
    return;
  }

  const hash = await sha256Hex(passwordInput);
  const accounts = loadAccounts();
  const found = accounts.find(a => a.username.toLowerCase() === usernameInput.toLowerCase());

  if (found && found.passwordHash === hash) {
    const userSession = {
      username: found.username,
      displayName: found.displayName,
      role: found.role
    };
    setLoggedInTeacher(userSession);
    updateTeacherAuthUI(userSession);
    closeTeacherLoginModal();
    switchView('teacher');
    artSound.playFanfare();
    confettiEngine.fire(60);
    showToast(`ยินดีต้อนรับ ${found.displayName || found.username} เข้าสู่ระบบ!`);
  } else {
    errText.textContent = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
    errBox.classList.remove('hidden');
    artSound.playPop();
  }
}

function openLogoutConfirmModal() {
  const current = getLoggedInTeacher();
  const nameEl = document.getElementById('logoutTeacherName');
  if (nameEl) {
    if (current) {
      nameEl.textContent = `${current.displayName || current.username} (@${current.username})`;
    } else {
      nameEl.textContent = 'คุณครูผู้ดูแลระบบ';
    }
  }
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
}

function closeLogoutConfirmModal() {
  const modal = document.getElementById('logoutConfirmModal');
  if (modal) modal.classList.add('hidden');
}

function executeTeacherLogout() {
  closeLogoutConfirmModal();
  clearLoggedInTeacher();
  updateTeacherAuthUI(null);
  switchView('leaderboard');
  artSound.playPop();
  showToast("ออกจากระบบห้องพักครูเรียบร้อยแล้ว ขอบคุณครับ/ค่ะคุณครู ✨");
}

// ==========================================
// 16. ACCOUNT MANAGEMENT (ADD ACCOUNT FOR OTHERS)
// ==========================================
function openAccountManagerModal() {
  const modal = document.getElementById('accountManagerModal');
  const form = document.getElementById('createAccountForm');
  form.reset();
  renderAccountsList();
  modal.classList.remove('hidden');
}

function closeAccountManagerModal() {
  document.getElementById('accountManagerModal').classList.add('hidden');
}

function renderAccountsList() {
  const tbody = document.getElementById('accountsTableBody');
  const accounts = loadAccounts();
  tbody.innerHTML = '';

  accounts.forEach(acc => {
    const tr = document.createElement('tr');
    const isPrimary = acc.isPrimary || acc.username === 'admin';
    const deleteBtnHtml = isPrimary
      ? `<span style="font-size: 0.78rem; color: #94A3B8;">(บัญชีหลัก)</span>`
      : `<button class="btn-icon-sm delete-btn delete-account-btn" data-username="${acc.username}" title="ลบบัญชีนี้">🗑️</button>`;

    tr.innerHTML = `
      <td><strong>${acc.username}</strong></td>
      <td>${acc.displayName}</td>
      <td><span class="art-tier-badge tier-silver">${acc.role || 'ครูผู้สอน'}</span></td>
      <td><small style="color: #64748B;">${acc.createdAt || '-'}</small></td>
      <td style="text-align: center;">${deleteBtnHtml}</td>
    `;

    if (!isPrimary) {
      tr.querySelector('.delete-account-btn').addEventListener('click', () => {
        deleteTeacherAccount(acc.username);
      });
    }

    tbody.appendChild(tr);
  });
}

async function handleCreateAccountSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('newAccountUsername').value.trim();
  const displayName = document.getElementById('newAccountDisplayName').value.trim();
  const password = document.getElementById('newAccountPassword').value;
  const confirmPassword = document.getElementById('newAccountConfirmPassword').value;

  if (!username || !displayName || !password) {
    alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    return;
  }

  if (password.length < 4) {
    alert("รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร");
    return;
  }

  if (password !== confirmPassword) {
    alert("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
    return;
  }

  const accounts = loadAccounts();
  const exists = accounts.some(a => a.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    alert(`ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
    return;
  }

  const passwordHash = await sha256Hex(password);
  const newAccountObj = {
    username,
    displayName,
    passwordHash,
    role: "ครูผู้สอน",
    createdAt: new Date().toLocaleDateString('th-TH'),
    isPrimary: false
  };
  accounts.push(newAccountObj);

  saveAccounts(accounts);
  apiPost({ action: 'save_account', account: newAccountObj });
  document.getElementById('createAccountForm').reset();
  renderAccountsList();
  showToast(`สร้างบัญชีผู้ใช้สำหรับ "${displayName}" สำเร็จ!`);
  artSound.playSaveChime();
}

function deleteTeacherAccount(username) {
  if (confirm(`คุณต้องการลบบัญชีผู้ใช้ "${username}" ใช่หรือไม่?`)) {
    let accounts = loadAccounts();
    accounts = accounts.filter(a => a.username !== username);
    saveAccounts(accounts);
    apiPost({ action: 'delete_account', username });
    renderAccountsList();
    showToast(`ลบบัญชี "${username}" เรียบร้อยแล้ว`);
    artSound.playPop();
  }
}

// ==========================================
// 17. ACADEMIC YEAR PROMOTION SYSTEM
// ==========================================
function getNextGradeId(gradeId) {
  const sequence = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const idx = sequence.indexOf(gradeId);
  if (idx === -1 || idx === sequence.length - 1) return null; // p6 graduates
  return sequence[idx + 1];
}

function openPromoteModal() {
  const modal = document.getElementById('promoteYearModal');
  const currentClassLabel = document.getElementById('promoteCurrentClassLabel');
  const classFlowPreview = document.getElementById('promoteClassFlowPreview');
  const ackCheck = document.getElementById('promoteAcknowledgeCheck');
  const confirmBtn = document.getElementById('confirmPromoteActionBtn');
  const radioSchool = document.getElementById('promoteScopeSchool');

  if (radioSchool) radioSchool.checked = true;
  if (ackCheck) ackCheck.checked = false;
  if (confirmBtn) confirmBtn.disabled = true;

  const curGradeLabel = getGradeLabel(currentGrade);
  const nextGId = getNextGradeId(currentGrade);
  const nextGradeLabel = nextGId ? getGradeLabel(nextGId) : 'จบการศึกษา (Graduated)';

  if (currentClassLabel) {
    currentClassLabel.textContent = `${curGradeLabel} ห้อง ${currentRoom}`;
  }
  if (classFlowPreview) {
    classFlowPreview.textContent = `${curGradeLabel} / ${currentRoom} ➔ ${nextGradeLabel} / ${currentRoom}`;
  }

  updatePromoteModeCards();
  renderPromoteStats();

  modal.classList.remove('hidden');
  artSound.playPop();
}

function closePromoteModal() {
  const modal = document.getElementById('promoteYearModal');
  if (modal) modal.classList.add('hidden');
}

function updatePromoteModeCards() {
  const schoolRadio = document.getElementById('promoteScopeSchool');
  const schoolLabel = document.getElementById('promoteModeSchoolLabel');
  const classLabel = document.getElementById('promoteModeClassLabel');
  if (schoolRadio && schoolLabel && classLabel) {
    if (schoolRadio.checked) {
      schoolLabel.classList.add('active');
      classLabel.classList.remove('active');
    } else {
      schoolLabel.classList.remove('active');
      classLabel.classList.add('active');
    }
  }
}

function renderPromoteStats() {
  const container = document.getElementById('promoteStatsRow');
  if (!container) return;

  const sequence = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  let totalSchoolStudents = 0;
  let graduatingCount = 0;
  let currentClassCount = (appData[`${currentGrade}_${currentRoom}`] || []).length;

  sequence.forEach(gId => {
    const rooms = (appConfig.rooms && appConfig.rooms[gId]) || [];
    rooms.forEach(r => {
      const list = appData[`${gId}_${r}`] || [];
      totalSchoolStudents += list.length;
      if (gId === 'p6') graduatingCount += list.length;
    });
  });

  const scope = document.querySelector('input[name="promoteScope"]:checked')?.value || 'school';

  if (scope === 'school') {
    container.innerHTML = `
      <div class="promote-stat-card">
        <div class="stat-num">${totalSchoolStudents}</div>
        <div class="stat-text">นักเรียนทั้งหมดในระบบ</div>
      </div>
      <div class="promote-stat-card">
        <div class="stat-num" style="color: #059669;">${Math.max(0, totalSchoolStudents - graduatingCount)}</div>
        <div class="stat-text">ที่จะเลื่อนขึ้น 1 ระดับชั้น</div>
      </div>
      <div class="promote-stat-card">
        <div class="stat-num" style="color: #D97706;">${graduatingCount}</div>
        <div class="stat-text">ป.6 ที่จะจบการศึกษา</div>
      </div>
      <div class="promote-stat-card">
        <div class="stat-num" style="color: #6366F1;">ป.1 ว่าง</div>
        <div class="stat-text">พร้อมรับนักเรียนใหม่</div>
      </div>
    `;
  } else {
    const nextGId = getNextGradeId(currentGrade);
    const nextLabel = nextGId ? getGradeLabel(nextGId) : 'จบการศึกษา';
    container.innerHTML = `
      <div class="promote-stat-card">
        <div class="stat-num">${currentClassCount}</div>
        <div class="stat-text">นักเรียนในห้องปัจจุบัน</div>
      </div>
      <div class="promote-stat-card">
        <div class="stat-num" style="color: #059669;">➔ ${nextLabel}</div>
        <div class="stat-text">ระดับชั้นปลายทาง</div>
      </div>
      <div class="promote-stat-card">
        <div class="stat-num" style="color: #4338CA;">ห้อง ${currentRoom}</div>
        <div class="stat-text">ห้องเรียนเดิม</div>
      </div>
    `;
  }
}

async function executeAcademicPromotion() {
  const scope = document.querySelector('input[name="promoteScope"]:checked')?.value || 'school';
  const resetScores = document.getElementById('promoteResetScores')?.checked ?? true;
  const resetFeedback = document.getElementById('promoteResetFeedback')?.checked ?? true;

  const sequence = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  let promotedCount = 0;
  let graduatedCount = 0;

  if (scope === 'school') {
    const newAppData = {};
    if (!appData.alumni) appData.alumni = [];

    // Loop backwards from highest grade down to lowest: p6 -> p5 -> p4 -> p3 -> p2 -> p1
    for (let i = sequence.length - 1; i >= 0; i--) {
      const gId = sequence[i];
      const rooms = (appConfig.rooms && appConfig.rooms[gId]) || [];

      if (gId === 'p6') {
        // Students in P.6 graduate
        rooms.forEach(r => {
          const list = appData[`${gId}_${r}`] || [];
          graduatedCount += list.length;
          list.forEach(s => {
            appData.alumni.push({
              ...s,
              graduatedFrom: `p6_${r}`,
              graduatedYear: new Date().getFullYear() + 543
            });
          });
        });
      } else {
        const nextGId = sequence[i + 1];
        if (!appConfig.rooms[nextGId]) appConfig.rooms[nextGId] = [];

        rooms.forEach(r => {
          if (!appConfig.rooms[nextGId].includes(r)) {
            appConfig.rooms[nextGId].push(r);
          }
          const sourceStudents = appData[`${gId}_${r}`] || [];
          const targetKey = `${nextGId}_${r}`;
          
          newAppData[targetKey] = sourceStudents.map(s => ({
            ...s,
            scores: resetScores ? {} : { ...(s.scores || {}) },
            feedback: resetFeedback ? '' : (s.feedback || '')
          }));

          promotedCount += sourceStudents.length;
        });
      }
    }

    // Set empty rooms for p1
    ((appConfig.rooms && appConfig.rooms['p1']) || []).forEach(r => {
      newAppData[`p1_${r}`] = [];
    });

    // Replace appData with newAppData while preserving alumni
    const alumniBackup = appData.alumni || [];
    appData = newAppData;
    appData.alumni = alumniBackup;

  } else {
    // Current class only promotion
    const nextGId = getNextGradeId(currentGrade);
    const sourceKey = `${currentGrade}_${currentRoom}`;
    const sourceStudents = appData[sourceKey] || [];

    if (!appData.alumni) appData.alumni = [];

    if (!nextGId) {
      // Current is p6, so they graduate
      graduatedCount = sourceStudents.length;
      sourceStudents.forEach(s => {
        appData.alumni.push({
          ...s,
          graduatedFrom: sourceKey,
          graduatedYear: new Date().getFullYear() + 543
        });
      });
      appData[sourceKey] = [];
    } else {
      // Promote to nextGId
      if (!appConfig.rooms[nextGId]) appConfig.rooms[nextGId] = [];
      if (!appConfig.rooms[nextGId].includes(currentRoom)) {
        appConfig.rooms[nextGId].push(currentRoom);
      }
      const targetKey = `${nextGId}_${currentRoom}`;
      appData[targetKey] = sourceStudents.map(s => ({
        ...s,
        scores: resetScores ? {} : { ...(s.scores || {}) },
        feedback: resetFeedback ? '' : (s.feedback || '')
      }));
      appData[sourceKey] = [];
      promotedCount = sourceStudents.length;
      currentGrade = nextGId; // Switch view to new grade
    }
  }

  // Save to LocalStorage
  saveDataToStorage();
  saveConfigToStorage();

  // Sync to Neon Cloud Database
  apiPost({ action: 'promote_students', studentsMap: appData });
  apiPost({ action: 'save_config', config: appConfig });

  // Update UI & Dropdowns
  populateGradeDropdowns();
  populateRoomDropdowns();
  renderLeaderboardView();
  renderTeacherView();

  closePromoteModal();
  artSound.playFanfare();
  confettiEngine.fire(90);

  const message = scope === 'school'
    ? `🎓 เลื่อนชั้นเรียนทั้งโรงเรียนสำเร็จ! เลื่อนชั้น ${promotedCount} คน, ป.6 จบการศึกษา ${graduatedCount} คน`
    : `🎓 เลื่อนชั้นเรียนห้อง ${currentRoom} สำเร็จแล้ว!`;
  showToast(message);
}

// ==========================================
// 14. CLASSROOM GALLERY UPLOAD SYSTEM
// ==========================================
let currentGalleryUploadBase64 = null;

function promptAddNewGalleryFolder() {
  const folderName = prompt("➕ กรุณาระบุชื่อโฟลเดอร์ / หัวข้อกิจกรรมใหม่:");
  if (!folderName || !folderName.trim()) return;
  const cleanName = folderName.trim();
  if (!appConfig.customFolders) appConfig.customFolders = [];
  const folderId = `folder_${Date.now()}`;
  appConfig.customFolders.push({ id: folderId, title: cleanName });
  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });
  showToast(`สร้างโฟลเดอร์ "${cleanName}" สำเร็จแล้ว! 📂`);
  artSound.playUnlock();

  openGalleryUploadModal(folderId);
  renderClassroomGallery();
}

function openGalleryUploadModal(selectedTaskId = null) {
  const modal = document.getElementById('galleryUploadModal');
  const taskSelect = document.getElementById('galleryTaskSelect');
  const previewBox = document.getElementById('galleryPreviewContainer');
  const previewImg = document.getElementById('galleryUploadPreviewImg');
  const titleInput = document.getElementById('galleryPhotoTitle');
  const fileInput = document.getElementById('galleryFileInput');

  const tasks = getActiveAssignments();
  const folders = appConfig.customFolders || [];

  if (taskSelect) {
    let opts = tasks.map(t => `<option value="${t.id}">📁 ${t.title}</option>`).join('');
    if (folders.length > 0) {
      opts += `<optgroup label="📂 โฟลเดอร์กิจกรรมเพิ่มเติม">` +
        folders.map(f => `<option value="${f.id}">📂 ${f.title}</option>`).join('') +
        `</optgroup>`;
    }
    taskSelect.innerHTML = opts;
    if (selectedTaskId) taskSelect.value = selectedTaskId;
  }

  if (titleInput) titleInput.value = '';
  if (fileInput) fileInput.value = '';
  currentGalleryUploadBase64 = null;
  if (previewBox) previewBox.classList.add('hidden');
  if (previewImg) previewImg.src = '';

  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
}

function closeGalleryUploadModal(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const modal = document.getElementById('galleryUploadModal');
  if (modal) modal.classList.add('hidden');
  currentGalleryUploadBase64 = null;
  const fileInput = document.getElementById('galleryFileInput');
  if (fileInput) fileInput.value = '';
  const previewBox = document.getElementById('galleryPreviewContainer');
  if (previewBox) previewBox.classList.add('hidden');
  const previewImg = document.getElementById('galleryUploadPreviewImg');
  if (previewImg) previewImg.src = '';
  artSound.playPop();
}

async function handleGalleryUploadSubmit(e) {
  e.preventDefault();
  const taskSelect = document.getElementById('galleryTaskSelect');
  const titleInput = document.getElementById('galleryPhotoTitle');
  const taskId = taskSelect ? taskSelect.value : activeGalleryTaskId;
  const title = (titleInput ? titleInput.value : '').trim();

  if (!currentGalleryUploadBase64) {
    alert("กรุณาเลือกหรืออัปโหลดรูปภาพกิจกรรม");
    return;
  }

  const roomDict = getActiveRoomGalleryDict();
  if (!roomDict[taskId]) roomDict[taskId] = [];

  const newPhoto = {
    id: `photo_${Date.now()}`,
    title: title || 'บรรยากาศกิจกรรมสร้างสรรค์',
    date: new Date().toLocaleDateString('th-TH'),
    url: currentGalleryUploadBase64
  };

  roomDict[taskId].push(newPhoto);
  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  artSound.playFanfare();
  confettiEngine.fire(60);
  showToast("บันทึกภาพกิจกรรมเข้าสู่แกลเลอรีของห้องเรียบร้อยแล้ว! 📸");
  closeGalleryUploadModal();
  renderClassroomGallery();
}

function initGalleryUploadDropzone() {
  const dropzone = document.getElementById('galleryDropzone');
  const fileInput = document.getElementById('galleryFileInput');
  const previewBox = document.getElementById('galleryPreviewContainer');
  const previewImg = document.getElementById('galleryUploadPreviewImg');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    try {
      currentGalleryUploadBase64 = await resizeImageToCanvas(file, 900, 900, 0.85);
      if (previewImg) previewImg.src = currentGalleryUploadBase64;
      if (previewBox) previewBox.classList.remove('hidden');
      artSound.playCamera();
    } catch (err) {
      alert("ไม่สามารถอ่านรูปภาพได้: " + err.message);
    }
  };

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-active');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  });
}

// ==========================================
// 14.2 SCHOOL SETTINGS & ROOM PASSCODES
// ==========================================
function openSchoolSettingsModal() {
  const modal = document.getElementById('schoolSettingsModal');
  const nameInput = document.getElementById('settingSchoolName');
  const logoInput = document.getElementById('settingSchoolLogo');
  const semInput = document.getElementById('settingSemester');
  const yearInput = document.getElementById('settingAcademicYear');
  const bgUrlInput = document.getElementById('settingCustomBgUrl');

  if (nameInput) nameInput.value = appConfig.schoolName || "โรงเรียนสาธิตศิลปวัฒนธรรม";
  if (logoInput) logoInput.value = appConfig.schoolLogo || "🎨";
  if (semInput) semInput.value = appConfig.semester || "1";
  if (yearInput) yearInput.value = appConfig.academicYear || "2567";
  if (bgUrlInput) bgUrlInput.value = appConfig.customBgUrl || "";

  const theme = appConfig.bgTheme || 'theme-pastel';
  const radio = document.querySelector(`input[name="bgThemeRadio"][value="${theme}"]`);
  if (radio) radio.checked = true;

  renderSettingsPasscodesTable();

  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
}

function closeSchoolSettingsModal() {
  const modal = document.getElementById('schoolSettingsModal');
  if (modal) modal.classList.add('hidden');
}

function renderSettingsPasscodesTable() {
  const tbody = document.getElementById('settingsPasscodesTableBody');
  if (!tbody) return;

  const passcodes = appConfig.roomPasscodes || {};
  let rowsHtml = `
    <tr style="background: #F8FAFC;">
      <td><strong>ทุกห้อง (Default Passcode)</strong></td>
      <td>
        <input type="text" class="score-input-inline passcode-input" data-key="default" value="${passcodes['default'] || '1234'}" maxlength="8">
      </td>
    </tr>
  `;

  (appConfig.grades || []).forEach(g => {
    const rooms = (appConfig.rooms && appConfig.rooms[g.id]) || ['1', '2', '3'];
    rooms.forEach(r => {
      const key = `${g.id}_${r}`;
      const code = passcodes[key] || passcodes['default'] || "1234";
      rowsHtml += `
        <tr>
          <td>${g.name} ห้อง ${r}</td>
          <td>
            <input type="text" class="score-input-inline passcode-input" data-key="${key}" value="${code}" maxlength="8">
          </td>
        </tr>
      `;
    });
  });

  tbody.innerHTML = rowsHtml;
}

function handleSchoolSettingsSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('settingSchoolName');
  const logoInput = document.getElementById('settingSchoolLogo');
  const semInput = document.getElementById('settingSemester');
  const yearInput = document.getElementById('settingAcademicYear');
  const bgUrlInput = document.getElementById('settingCustomBgUrl');
  const checkedTheme = document.querySelector('input[name="bgThemeRadio"]:checked');

  if (nameInput) appConfig.schoolName = nameInput.value.trim();
  if (logoInput) appConfig.schoolLogo = logoInput.value.trim();
  if (semInput) appConfig.semester = semInput.value.trim();
  if (yearInput) appConfig.academicYear = yearInput.value.trim();
  if (bgUrlInput) appConfig.customBgUrl = bgUrlInput.value.trim();
  if (checkedTheme) appConfig.bgTheme = checkedTheme.value;

  if (!appConfig.roomPasscodes) appConfig.roomPasscodes = {};
  document.querySelectorAll('.passcode-input').forEach(inp => {
    const key = inp.getAttribute('data-key');
    const val = inp.value.trim();
    if (key && val) {
      appConfig.roomPasscodes[key] = val;
    }
  });

  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  const schoolDisplay = document.getElementById('schoolNameDisplay');
  const schoolLogo = document.getElementById('schoolLogoDisplay');
  const logoImg = document.getElementById('schoolLogoImg');
  const stripLogo = document.querySelector('.school-strip-logo');
  const semBadge = document.getElementById('semesterYearBadge');
  const footerSchool = document.getElementById('footerSchoolName');

  if (schoolDisplay) schoolDisplay.textContent = appConfig.schoolName;
  if (semBadge) semBadge.textContent = `ภาคเรียนที่ ${appConfig.semester} ปีการศึกษา ${appConfig.academicYear}`;
  if (footerSchool) footerSchool.textContent = appConfig.schoolName;

  const isImg = (appConfig.schoolLogo || '').includes('/') || (appConfig.schoolLogo || '').startsWith('data:image');
  if (isImg) {
    if (logoImg) {
      logoImg.src = appConfig.schoolLogo;
      logoImg.classList.remove('hidden');
    }
    if (schoolLogo) schoolLogo.classList.add('hidden');
    if (stripLogo) stripLogo.src = appConfig.schoolLogo;
  } else {
    if (schoolLogo) {
      schoolLogo.textContent = appConfig.schoolLogo;
      schoolLogo.classList.remove('hidden');
    }
    if (logoImg) logoImg.classList.add('hidden');
  }

  applyBackgroundTheme();
  closeSchoolSettingsModal();
  artSound.playSaveChime();
  showToast("บันทึกการตั้งค่าโรงเรียนและรหัสผ่านเรียบร้อยแล้ว!");
  if (currentView === 'home') renderHomeView();
  else if (currentView === 'leaderboard') renderLeaderboardView();
  else renderTeacherView();
}

// ==========================================
// 14.3 THE ART TIME MAGAZINE EDIT
// ==========================================
const DEFAULT_MAGAZINE_DATA = {
  head1: "ศิลปะกับพลังแห่งจินตนาการ: ปล่อยหัวใจให้โบยบินบนแผ่นกระดาษ",
  copy1: "ในห้องเรียนศิลปะ ความผิดพลาดไม่มีอยู่จริง มีเพียงการค้นพบสิ่งใหม่ ทุกหยดสีน้ำที่ไหลรวมกัน และทุกรอยแรเงาของดินสอ คือเสียงสะท้อนจากโลกภายในของเด็กๆ ที่กำลังเปล่งประกายอย่างเสรี",
  pic1: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80",
  caption1: "🎨 การทดลองผสมสีน้ำสร้างโทนสีแห่งความสุข",
  pic2: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80",
  caption2: "🖼️ ศิลปะภาพพิมพ์และงานตัดแปะคอลลาจ",
  pic3: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
  caption3: "🦁 จินตนาการลายเส้นที่ไร้กรอบจำกัด",
  head2: "เทคนิคสีโปสเตอร์และคู่สีตรงข้าม: เปลี่ยนความกลัวเป็นความกล้า",
  copy2: "เด็กหลายคนมักกลัวการลงสีเข้ม แต่เมื่อได้เรียนรู้ที่จะก้าวข้ามความลังเล ภาพวาดธรรมดาก็กลับมีชีวิตและมิติที่น่าทึ่ง การฝึกฝนศิลปะจึงไม่ใช่แค่การวาดรูป แต่คือการฝึกความมั่นใจในตนเอง",
  pic4: "https://images.unsplash.com/photo-1569172122301-bc500f309134?w=800&auto=format&fit=crop&q=80",
  quote: "ศิลปะไม่ใช่แค่ผลงานที่แขวนบนผนัง แต่คือการเดินทางที่เด็กๆ ได้ค้นพบคุณค่าในตัวเอง"
};

function updateMagazinePreviewThumbnails() {
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`editMagPic${i}`);
    const img = document.getElementById(`previewImgPic${i}`);
    const box = document.getElementById(`previewBoxPic${i}`);
    const placeholder = box ? box.querySelector('.mag-pic-placeholder-text') : null;
    const val = input ? input.value.trim() : '';

    if (val && img) {
      img.src = val;
      img.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
    } else if (img) {
      img.src = '';
      img.classList.add('hidden');
      if (placeholder) placeholder.classList.remove('hidden');
    }
  }
}

async function handleMagPicUpload(file, picNum) {
  if (!file) return;
  const statusElem = document.getElementById(`statusPic${picNum}`);
  if (statusElem) statusElem.textContent = "กำลังประมวลผล...";

  try {
    const base64Data = await resizeImageToCanvas(file, 900, 900, 0.85);
    const input = document.getElementById(`editMagPic${picNum}`);
    if (input) {
      input.value = base64Data;
    }
    updateMagazinePreviewThumbnails();
    if (statusElem) {
      statusElem.textContent = `✅ อัปโหลดสำเร็จ (${file.name.slice(0, 15)}...)`;
      statusElem.style.color = "#059669";
    }
    showToast(`อัปโหลดรูปภาพที่ ${picNum} เรียบร้อยแล้ว 📸`);
    artSound.playCamera();
  } catch (err) {
    console.error("Mag image upload error:", err);
    if (statusElem) {
      statusElem.textContent = "❌ ไม่สามารถประมวลผลรูปภาพได้";
      statusElem.style.color = "#EF4444";
    }
    showToast("เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ");
  }
}

function clearMagazinePic(picNum) {
  const input = document.getElementById(`editMagPic${picNum}`);
  const fileInput = document.getElementById(`fileMagPic${picNum}`);
  const statusElem = document.getElementById(`statusPic${picNum}`);
  if (input) input.value = '';
  if (fileInput) fileInput.value = '';
  if (statusElem) {
    statusElem.textContent = "🗑️ ลบ/ล้างรูปแล้ว (จะใช้รูปภาพเริ่มต้นหากไม่ระบุรูปใหม่)";
    statusElem.style.color = "#EF4444";
  }
  updateMagazinePreviewThumbnails();
  artSound.playChime();
  showToast(`ล้างรูปภาพที่ ${picNum} เรียบร้อยแล้ว 🧹`);
}
window.clearMagazinePic = clearMagazinePic;

function openMagazineModal() {
  const modal = document.getElementById('magazineEditModal');
  const mag = appConfig.magazine || {};

  const h1 = document.getElementById('editMagHead1');
  const c1 = document.getElementById('editMagCopy1');
  const p1 = document.getElementById('editMagPic1');
  const p2 = document.getElementById('editMagPic2');
  const p3 = document.getElementById('editMagPic3');
  const h2 = document.getElementById('editMagHead2');
  const c2 = document.getElementById('editMagCopy2');
  const p4 = document.getElementById('editMagPic4');
  const quote = document.getElementById('editMagQuote');
  const currentTermElem = document.getElementById('magEditCurrentTermLabel');

  if (currentTermElem) {
    currentTermElem.textContent = `ฉบับพิเศษ • ภาคเรียนที่ ${appConfig.semester || '1'} ปีการศึกษา ${appConfig.academicYear || '2567'}`;
  }
  if (h1) h1.value = mag.head1 || '';
  if (c1) c1.value = mag.copy1 || '';
  if (p1) p1.value = mag.pic1 || '';
  const cap1 = document.getElementById('editMagCaption1');
  if (cap1) cap1.value = mag.caption1 !== undefined ? mag.caption1 : DEFAULT_MAGAZINE_DATA.caption1;
  if (p2) p2.value = mag.pic2 || '';
  const cap2 = document.getElementById('editMagCaption2');
  if (cap2) cap2.value = mag.caption2 !== undefined ? mag.caption2 : DEFAULT_MAGAZINE_DATA.caption2;
  if (p3) p3.value = mag.pic3 || '';
  const cap3 = document.getElementById('editMagCaption3');
  if (cap3) cap3.value = mag.caption3 !== undefined ? mag.caption3 : DEFAULT_MAGAZINE_DATA.caption3;
  if (h2) h2.value = mag.head2 || '';
  if (c2) c2.value = mag.copy2 || '';
  if (p4) p4.value = mag.pic4 || '';
  if (quote) quote.value = mag.quote || '';

  // Setup Image Toggles
  const t1 = document.getElementById('toggleMagPic1');
  const t2 = document.getElementById('toggleMagPic2');
  const t3 = document.getElementById('toggleMagPic3');
  const t4 = document.getElementById('toggleMagPic4');

  if (t1) t1.checked = mag.showPic1 !== false;
  if (t2) t2.checked = mag.showPic2 !== false;
  if (t3) t3.checked = mag.showPic3 !== false;
  if (t4) t4.checked = mag.showPic4 !== false;

  [1, 2, 3, 4].forEach(i => {
    const t = document.getElementById(`toggleMagPic${i}`);
    const g = document.getElementById(`groupMagPic${i}`);
    if (t && g) {
      g.style.opacity = t.checked ? '1' : '0.45';
      g.style.pointerEvents = t.checked ? 'auto' : 'none';
      t.onchange = () => {
        g.style.opacity = t.checked ? '1' : '0.45';
        g.style.pointerEvents = t.checked ? 'auto' : 'none';
        artSound.playPop();
      };
    }
  });

  // Reset upload statuses and refresh live thumbnails
  for (let i = 1; i <= 4; i++) {
    const statusElem = document.getElementById(`statusPic${i}`);
    if (statusElem) statusElem.textContent = '';
  }
  updateMagazinePreviewThumbnails();

  if (modal) modal.classList.remove('hidden');
  artSound.playPop();
}

function fillDefaultMagazineValues() {
  const h1 = document.getElementById('editMagHead1');
  const c1 = document.getElementById('editMagCopy1');
  const p1 = document.getElementById('editMagPic1');
  const p2 = document.getElementById('editMagPic2');
  const p3 = document.getElementById('editMagPic3');
  const h2 = document.getElementById('editMagHead2');
  const c2 = document.getElementById('editMagCopy2');
  const p4 = document.getElementById('editMagPic4');
  const quote = document.getElementById('editMagQuote');

  if (h1) h1.value = DEFAULT_MAGAZINE_DATA.head1;
  if (c1) c1.value = DEFAULT_MAGAZINE_DATA.copy1;
  if (p1) p1.value = DEFAULT_MAGAZINE_DATA.pic1;
  const cap1 = document.getElementById('editMagCaption1');
  if (cap1) cap1.value = DEFAULT_MAGAZINE_DATA.caption1;
  if (p2) p2.value = DEFAULT_MAGAZINE_DATA.pic2;
  const cap2 = document.getElementById('editMagCaption2');
  if (cap2) cap2.value = DEFAULT_MAGAZINE_DATA.caption2;
  if (p3) p3.value = DEFAULT_MAGAZINE_DATA.pic3;
  const cap3 = document.getElementById('editMagCaption3');
  if (cap3) cap3.value = DEFAULT_MAGAZINE_DATA.caption3;
  if (h2) h2.value = DEFAULT_MAGAZINE_DATA.head2;
  if (c2) c2.value = DEFAULT_MAGAZINE_DATA.copy2;
  if (p4) p4.value = DEFAULT_MAGAZINE_DATA.pic4;
  if (quote) quote.value = DEFAULT_MAGAZINE_DATA.quote;

  // Turn toggles back on
  [1, 2, 3, 4].forEach(i => {
    const t = document.getElementById(`toggleMagPic${i}`);
    const g = document.getElementById(`groupMagPic${i}`);
    if (t) {
      t.checked = true;
      if (g) {
        g.style.opacity = '1';
        g.style.pointerEvents = 'auto';
      }
    }
  });

  updateMagazinePreviewThumbnails();
  artSound.playChime();
  showToast("📋 ดึงข้อมูลตัวอย่างหน้าแรกมาใส่ในช่องเรียบร้อยแล้ว");
}

function closeMagazineModal() {
  const modal = document.getElementById('magazineEditModal');
  if (modal) modal.classList.add('hidden');
}

function handleMagazineSubmit(e) {
  e.preventDefault();
  if (!appConfig.magazine) appConfig.magazine = {};

  const h1 = document.getElementById('editMagHead1');
  const c1 = document.getElementById('editMagCopy1');
  const p1 = document.getElementById('editMagPic1');
  const p2 = document.getElementById('editMagPic2');
  const p3 = document.getElementById('editMagPic3');
  const h2 = document.getElementById('editMagHead2');
  const c2 = document.getElementById('editMagCopy2');
  const p4 = document.getElementById('editMagPic4');
  const quote = document.getElementById('editMagQuote');

  const t1 = document.getElementById('toggleMagPic1');
  const t2 = document.getElementById('toggleMagPic2');
  const t3 = document.getElementById('toggleMagPic3');
  const t4 = document.getElementById('toggleMagPic4');

  appConfig.magazine.showPic1 = t1 ? t1.checked : true;
  appConfig.magazine.showPic2 = t2 ? t2.checked : true;
  appConfig.magazine.showPic3 = t3 ? t3.checked : true;
  appConfig.magazine.showPic4 = t4 ? t4.checked : true;

  appConfig.magazine.head1 = (h1 && h1.value.trim()) ? h1.value.trim() : DEFAULT_MAGAZINE_DATA.head1;
  appConfig.magazine.copy1 = (c1 && c1.value.trim()) ? c1.value.trim() : DEFAULT_MAGAZINE_DATA.copy1;
  appConfig.magazine.pic1 = (p1 && p1.value.trim()) ? p1.value.trim() : DEFAULT_MAGAZINE_DATA.pic1;
  const cap1 = document.getElementById('editMagCaption1');
  appConfig.magazine.caption1 = (cap1 && cap1.value.trim()) ? cap1.value.trim() : DEFAULT_MAGAZINE_DATA.caption1;
  appConfig.magazine.pic2 = (p2 && p2.value.trim()) ? p2.value.trim() : DEFAULT_MAGAZINE_DATA.pic2;
  const cap2 = document.getElementById('editMagCaption2');
  appConfig.magazine.caption2 = (cap2 && cap2.value.trim()) ? cap2.value.trim() : DEFAULT_MAGAZINE_DATA.caption2;
  appConfig.magazine.pic3 = (p3 && p3.value.trim()) ? p3.value.trim() : DEFAULT_MAGAZINE_DATA.pic3;
  const cap3 = document.getElementById('editMagCaption3');
  appConfig.magazine.caption3 = (cap3 && cap3.value.trim()) ? cap3.value.trim() : DEFAULT_MAGAZINE_DATA.caption3;
  appConfig.magazine.head2 = (h2 && h2.value.trim()) ? h2.value.trim() : DEFAULT_MAGAZINE_DATA.head2;
  appConfig.magazine.copy2 = (c2 && c2.value.trim()) ? c2.value.trim() : DEFAULT_MAGAZINE_DATA.copy2;
  appConfig.magazine.pic4 = (p4 && p4.value.trim()) ? p4.value.trim() : DEFAULT_MAGAZINE_DATA.pic4;
  appConfig.magazine.quote = (quote && quote.value.trim()) ? quote.value.trim() : DEFAULT_MAGAZINE_DATA.quote;

  saveConfigToStorage();
  apiPost({ action: 'save_config', config: appConfig });

  renderHomeView();
  closeMagazineModal();
  artSound.playSaveChime();
  showToast("บันทึกเนื้อหา THE ART TIME สำเร็จแล้ว!");
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Storage & Dropdowns
  loadStorage();
  confettiEngine = new ConfettiManager('confettiCanvas');
  populateGradeDropdowns();

  // 2. Sound Switch (Always ON by default: "เสียงเอฟเฟคให้มีตลอด")
  soundEnabled = true;
  localStorage.setItem(SOUND_KEY, 'true');
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.classList.add('active');
    const soundIcon = soundBtn.querySelector('.sound-icon');
    if (soundIcon) soundIcon.textContent = '🔊';
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(SOUND_KEY, String(soundEnabled));
      soundBtn.classList.toggle('active', soundEnabled);
      if (soundIcon) soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) {
        artSound.ensureActive();
        artSound.playPop();
      }
    });
  }

  // Pre-unlock Web AudioContext on first user interaction anywhere
  const unlockAudioContext = () => {
    artSound.ensureActive();
    document.removeEventListener('click', unlockAudioContext);
    document.removeEventListener('keydown', unlockAudioContext);
    document.removeEventListener('touchstart', unlockAudioContext);
  };
  document.addEventListener('click', unlockAudioContext, { once: true });
  document.addEventListener('keydown', unlockAudioContext, { once: true });
  document.addEventListener('touchstart', unlockAudioContext, { once: true });

  // 3. Class Selectors in Leaderboard (if present)
  const gradeSelect = document.getElementById('gradeSelect');
  const roomSelect = document.getElementById('roomSelect');

  if (gradeSelect) {
    gradeSelect.addEventListener('change', () => {
      currentGrade = gradeSelect.value;
      populateRoomDropdowns();
      artSound.playPop();
      renderLeaderboardView();
      confettiEngine.fire(40);
    });
  }

  if (roomSelect) {
    roomSelect.addEventListener('change', () => {
      currentRoom = roomSelect.value;
      artSound.playPop();
      renderLeaderboardView();
      confettiEngine.fire(40);
    });
  }

  // 4. Class Selectors in Teacher Portal
  const teacherGradeSelect = document.getElementById('teacherGradeSelect');
  const teacherRoomSelect = document.getElementById('teacherRoomSelect');

  if (teacherGradeSelect) {
    teacherGradeSelect.addEventListener('change', (e) => {
      currentGrade = e.target.value;
      if (gradeSelect) gradeSelect.value = currentGrade;
      populateRoomDropdowns();
      artSound.playPop();
      renderTeacherView();
    });
  }

  if (teacherRoomSelect) {
    teacherRoomSelect.addEventListener('change', (e) => {
      currentRoom = e.target.value;
      if (roomSelect) roomSelect.value = currentRoom;
      artSound.playPop();
      renderTeacherView();
    });
  }

  // Room Slogan Listeners (แก้ไขคำคมประจำห้อง)
  const saveRoomSloganBtn = document.getElementById('saveRoomSloganBtn');
  if (saveRoomSloganBtn) {
    saveRoomSloganBtn.addEventListener('click', () => {
      const input = document.getElementById('teacherRoomSloganInput');
      const val = input ? input.value : '';
      setRoomSlogan(currentGrade, currentRoom, val);
      artSound.playSaveChime();
      showToast(`บันทึกคำคมประจำห้อง ${getGradeLabel(currentGrade)} ห้อง ${currentRoom} เรียบร้อยแล้ว! 👑`);
      const sloganElem = document.getElementById('podiumCustomTitle');
      const sloganText = getRoomSlogan(currentGrade, currentRoom);
  if (sloganElem) {
    if (sloganText && sloganText.trim()) {
      sloganElem.textContent = sloganText;
      sloganElem.style.display = '';
    } else {
      sloganElem.textContent = '';
      sloganElem.style.display = 'none';
    }
  }
    });
  }

  const teacherRoomSloganInput = document.getElementById('teacherRoomSloganInput');
  if (teacherRoomSloganInput) {
    teacherRoomSloganInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveRoomSloganBtn?.click();
      }
    });
  }

  const quickEditSloganBtn = document.getElementById('quickEditSloganBtn');
  if (quickEditSloganBtn) {
    quickEditSloganBtn.addEventListener('click', () => {
      artSound.playPop();
      const current = getRoomSlogan(currentGrade, currentRoom);
      const newSlogan = prompt(`ระบุข้อความสโลแกน / คำคมประจำห้อง ${getGradeLabel(currentGrade)} ห้อง ${currentRoom}:`, current);
      if (newSlogan !== null) {
        setRoomSlogan(currentGrade, currentRoom, newSlogan);
        artSound.playSaveChime();
        showToast("บันทึกคำคมประจำห้องเรียบร้อยแล้ว! 👑");
        renderLeaderboardView();
      }
    });
  }

  // Quick Action Buttons
  const quickAddRoomBtn = document.getElementById('quickAddRoomBtn');
  if (quickAddRoomBtn) {
    quickAddRoomBtn.addEventListener('click', () => {
      const newRoom = prompt(`กรุณากรอกชื่อหรือเลขห้องใหม่สำหรับ ${getGradeLabel(currentGrade)}:`, `${(appConfig.rooms[currentGrade]?.length || 0) + 1}`);
      if (newRoom) {
        addNewRoom(currentGrade, newRoom);
      }
    });
  }

  const quickAddTaskBtn = document.getElementById('quickAddTaskBtn');
  if (quickAddTaskBtn) {
    quickAddTaskBtn.addEventListener('click', () => {
      const nextNo = (appConfig.assignments?.length || 0) + 1;
      const title = prompt("กรุณาระบุชื่อชิ้นงานใหม่ที่สั่ง:", `งานที่ ${nextNo}: การวาดภาพระบายสีสร้างสรรค์`);
      if (title) {
        const maxScore = prompt("ระบุคะแนนเต็มของชิ้นงานนี้:", "20");
        if (maxScore) addNewAssignment(title, maxScore);
      }
    });
  }

  // 5. Navigation Tabs
  const viewHomeBtn = document.getElementById('viewHomeBtn');
  if (viewHomeBtn) {
    viewHomeBtn.addEventListener('click', () => {
      artSound.playPop();
      switchView('home');
    });
  }

  const backToHomeBtn = document.getElementById('backToHomeBtn');
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      artSound.playPop();
      switchView('home');
    });
  }

  document.getElementById('viewLeaderboardBtn')?.addEventListener('click', () => {
    artSound.playPop();
    const loggedTeacher = getLoggedInTeacher();
    const targetKey = `${currentGrade}_${currentRoom}`;
    if (loggedTeacher || unlockedRooms.has(targetKey)) {
      switchView('leaderboard');
    } else {
      showToast("🔒 กรุณาเลือกระดับชั้นและกรอกรหัสผ่านเพื่อเข้าสู่ทำเนียบแรงกิ้ง");
      requestRoomAccess(currentGrade, currentRoom);
    }
  });

  document.getElementById('viewTeacherBtn')?.addEventListener('click', () => {
    artSound.playPop();
    const user = getLoggedInTeacher();
    if (user) {
      updateTeacherAuthUI(user);
      switchView('teacher');
    } else {
      openTeacherLoginModal();
    }
  });

  // Direct Header Login & Logout Buttons
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => {
      artSound.playPop();
      openTeacherLoginModal();
    });
  }

  const headerLogoutBtn = document.getElementById('headerLogoutBtn');
  if (headerLogoutBtn) {
    headerLogoutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      artSound.playPop();
      openLogoutConfirmModal();
    });
  }

  // Home Single Line Class Picker
  const homeGradeSelect = document.getElementById('homeGradeSelect');
  if (homeGradeSelect) {
    homeGradeSelect.addEventListener('change', () => {
      currentGrade = homeGradeSelect.value;
      populateRoomDropdowns();
      artSound.playPop();
    });
  }

  // Leaderboard Teacher Class & Room Switcher Listeners
  const leaderboardGradeSelect = document.getElementById('leaderboardGradeSelect');
  if (leaderboardGradeSelect) {
    leaderboardGradeSelect.addEventListener('change', (e) => {
      currentGrade = e.target.value;
      populateRoomDropdowns();
      artSound.playPop();
      renderLeaderboardView();
    });
  }

  const leaderboardRoomSelect = document.getElementById('leaderboardRoomSelect');
  if (leaderboardRoomSelect) {
    leaderboardRoomSelect.addEventListener('change', (e) => {
      currentRoom = e.target.value;
      artSound.playPop();
      renderLeaderboardView();
    });
  }

  const homeClassSelectForm = document.getElementById('homeClassSelectForm');
  if (homeClassSelectForm) {
    homeClassSelectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = document.getElementById('homeGradeSelect')?.value || currentGrade;
      const r = document.getElementById('homeRoomSelect')?.value || currentRoom;
      requestRoomAccess(g, r);
    });
  }

  // Room Passcode Modal Listeners
  const roomPasscodeForm = document.getElementById('roomPasscodeForm');
  if (roomPasscodeForm) {
    roomPasscodeForm.addEventListener('submit', handlePasscodeSubmit);
  }
  const cancelPasscodeBtn = document.getElementById('cancelPasscodeBtn');
  if (cancelPasscodeBtn) {
    cancelPasscodeBtn.addEventListener('click', closePasscodeModal);
  }
  const roomPasscodeModal = document.getElementById('roomPasscodeModal');
  if (roomPasscodeModal) {
    roomPasscodeModal.addEventListener('click', (e) => {
      if (e.target.id === 'roomPasscodeModal') closePasscodeModal();
    });
  }

  // Student Profile & Artwork Portfolio Modal Listeners
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
  if (closeProfileModalBtn) {
    closeProfileModalBtn.addEventListener('click', closeStudentProfileModal);
  }
  const studentProfileModal = document.getElementById('studentProfileModal');
  if (studentProfileModal) {
    studentProfileModal.addEventListener('click', (e) => {
      if (e.target.id === 'studentProfileModal') closeStudentProfileModal();
    });
  }

  // Classroom Photo Lightbox Listeners
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');
  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closePhotoLightbox);
  }
  const galleryPhotoModal = document.getElementById('galleryPhotoModal');
  if (galleryPhotoModal) {
    galleryPhotoModal.addEventListener('click', (e) => {
      if (e.target.id === 'galleryPhotoModal') closePhotoLightbox();
    });
  }

  // Classroom Gallery Upload Listeners & Dropzone
  initGalleryUploadDropzone();
  const openGalleryManagerBtn = document.getElementById('openGalleryManagerBtn');
  if (openGalleryManagerBtn) {
    openGalleryManagerBtn.addEventListener('click', () => {
      artSound.playPop();
      openGalleryUploadModal();
    });
  }
  const closeGalleryUploadBtn = document.getElementById('closeGalleryUploadBtn');
  if (closeGalleryUploadBtn) {
    closeGalleryUploadBtn.addEventListener('click', closeGalleryUploadModal);
  }
  const cancelGalleryUploadBtn = document.getElementById('cancelGalleryUploadBtn');
  if (cancelGalleryUploadBtn) {
    cancelGalleryUploadBtn.addEventListener('click', closeGalleryUploadModal);
  }
  document.getElementById('addNewFolderBtn')?.addEventListener('click', promptAddNewGalleryFolder);
  const galleryUploadForm = document.getElementById('galleryUploadForm');
  if (galleryUploadForm) {
    galleryUploadForm.addEventListener('submit', handleGalleryUploadSubmit);
  }
  const galleryUploadModal = document.getElementById('galleryUploadModal');
  if (galleryUploadModal) {
    galleryUploadModal.addEventListener('click', (e) => {
      if (e.target.id === 'galleryUploadModal') closeGalleryUploadModal();
    });
  }

  // School Settings & Room Passcode Management Listeners
  const openSchoolSettingsBtn = document.getElementById('openSchoolSettingsBtn');
  if (openSchoolSettingsBtn) {
    openSchoolSettingsBtn.addEventListener('click', () => {
      artSound.playPop();
      openSchoolSettingsModal();
    });
  }
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  if (closeSettingsModalBtn) {
    closeSettingsModalBtn.addEventListener('click', closeSchoolSettingsModal);
  }
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  if (cancelSettingsBtn) {
    cancelSettingsBtn.addEventListener('click', closeSchoolSettingsModal);
  }
  const schoolSettingsForm = document.getElementById('schoolSettingsForm');
  if (schoolSettingsForm) {
    schoolSettingsForm.addEventListener('submit', handleSchoolSettingsSubmit);
  }
  const schoolSettingsModal = document.getElementById('schoolSettingsModal');
  if (schoolSettingsModal) {
    schoolSettingsModal.addEventListener('click', (e) => {
      if (e.target.id === 'schoolSettingsModal') closeSchoolSettingsModal();
    });
  }

  // THE ART TIME Magazine Management Listeners
  const openMagazineManagerBtn = document.getElementById('openMagazineManagerBtn');
  if (openMagazineManagerBtn) {
    openMagazineManagerBtn.addEventListener('click', () => {
      artSound.playPop();
      openMagazineModal();
    });
  }

  const openMagEditDirectBtn = document.getElementById('openMagEditDirectBtn');
  if (openMagEditDirectBtn) {
    openMagEditDirectBtn.addEventListener('click', () => {
      artSound.playPop();
      const user = getLoggedInTeacher();
      if (user) {
        openMagazineModal();
      } else {
        openTeacherLoginModal();
      }
    });
  }
  const closeMagazineModalBtn = document.getElementById('closeMagazineModalBtn');
  if (closeMagazineModalBtn) {
    closeMagazineModalBtn.addEventListener('click', closeMagazineModal);
  }
  const cancelMagazineBtn = document.getElementById('cancelMagazineBtn');
  if (cancelMagazineBtn) {
    cancelMagazineBtn.addEventListener('click', closeMagazineModal);
  }
  const magazineEditForm = document.getElementById('magazineEditForm');
  if (magazineEditForm) {
    magazineEditForm.addEventListener('submit', handleMagazineSubmit);
  }
  const fillDefaultMagBtn = document.getElementById('fillDefaultMagBtn');
  if (fillDefaultMagBtn) {
    fillDefaultMagBtn.addEventListener('click', fillDefaultMagazineValues);
  }
  const magazineEditModal = document.getElementById('magazineEditModal');
  if (magazineEditModal) {
    magazineEditModal.addEventListener('click', (e) => {
      if (e.target.id === 'magazineEditModal') closeMagazineModal();
    });
  }

  // Live previews and file upload for magazine photos
  for (let i = 1; i <= 4; i++) {
    const fileInput = document.getElementById(`fileMagPic${i}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleMagPicUpload(e.target.files[0], i);
        }
      });
    }
    const textInput = document.getElementById(`editMagPic${i}`);
    if (textInput) {
      textInput.addEventListener('input', () => updateMagazinePreviewThumbnails());
    }
  }

  // Auth & Account Modal Listeners
  document.getElementById('closeLoginModalBtn')?.addEventListener('click', closeTeacherLoginModal);
  document.getElementById('cancelLoginBtn')?.addEventListener('click', closeTeacherLoginModal);
  document.getElementById('teacherLoginForm')?.addEventListener('submit', handleTeacherLoginSubmit);

  // Logout Confirmation Modal Listeners
  document.getElementById('logoutBtn')?.addEventListener('click', openLogoutConfirmModal);
  document.getElementById('cancelLogoutBtn')?.addEventListener('click', closeLogoutConfirmModal);
  document.getElementById('confirmLogoutActionBtn')?.addEventListener('click', executeTeacherLogout);
  document.getElementById('logoutConfirmModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'logoutConfirmModal') closeLogoutConfirmModal();
  });

  // Header Teacher Badge Click Listener
  document.getElementById('headerTeacherBadge')?.addEventListener('click', () => {
    artSound.playPop();
    const user = getLoggedInTeacher();
    if (user) {
      updateTeacherAuthUI(user);
      switchView('teacher');
    }
  });

  document.getElementById('manageAccountsBtn')?.addEventListener('click', () => {
    artSound.playPop();
    openAccountManagerModal();
  });
  document.getElementById('closeAccountModalBtn')?.addEventListener('click', closeAccountManagerModal);
  document.getElementById('closeAccountFooterBtn')?.addEventListener('click', closeAccountManagerModal);
  document.getElementById('createAccountForm')?.addEventListener('submit', handleCreateAccountSubmit);

  // 6. Celebrate & Palette Logo
  document.getElementById('celebrateBtn')?.addEventListener('click', () => {
    artSound.playFanfare();
    confettiEngine.fire(90);
    showToast("🎉 ขอแสดงความยินดีกับผลงานสร้างสรรค์ยอดเยี่ยม!");
  });

  document.getElementById('logoInteractive')?.addEventListener('click', () => {
    artSound.playPop();
    confettiEngine.fire(35);
  });

  // 7. Search
  const searchInput = document.getElementById('studentSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('input', () => {
    clearSearchBtn.classList.toggle('show', searchInput.value.length > 0);
    renderRankTable(getRankedStudents(currentGrade, currentRoom));
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.remove('show');
    renderRankTable(getRankedStudents(currentGrade, currentRoom));
    searchInput.focus();
  });

  // 8. Student Detail Modal Events
  document.getElementById('closeDetailModalBtn')?.addEventListener('click', closeStudentDetailModal);
  document.getElementById('studentDetailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'studentDetailModal') closeStudentDetailModal();
  });

  // 9. Student Add/Edit Modal
  document.getElementById('addNewStudentBtn')?.addEventListener('click', () => {
    artSound.playPop();
    openStudentModal();
  });
  document.getElementById('closeModalBtn')?.addEventListener('click', closeStudentModal);
  document.getElementById('cancelModalBtn')?.addEventListener('click', closeStudentModal);
  document.getElementById('studentModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'studentModal') closeStudentModal();
  });
  document.getElementById('studentForm')?.addEventListener('submit', handleStudentFormSubmit);

  // 10. Assignments Manager Modal
  document.getElementById('manageTasksBtn')?.addEventListener('click', () => {
    artSound.playPop();
    openTaskManagerModal();
  });
  document.getElementById('closeTaskManagerModalBtn')?.addEventListener('click', closeTaskManagerModal);
  document.getElementById('closeTaskManagerFooterBtn')?.addEventListener('click', closeTaskManagerModal);
  document.getElementById('taskManagerModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'taskManagerModal') closeTaskManagerModal();
  });

  document.getElementById('taskManagerGradeSelect')?.addEventListener('change', (e) => {
    taskManagerTargetGrade = e.target.value;
    taskManagerTargetRoom = (appConfig.rooms[taskManagerTargetGrade] || ['1'])[0] || '1';
    populateTaskManagerSelectors();
    renderTasksManagerList();
  });

  document.getElementById('taskManagerRoomSelect')?.addEventListener('change', (e) => {
    taskManagerTargetRoom = e.target.value;
    populateTaskManagerSelectors();
    renderTasksManagerList();
  });

  document.getElementById('copyTasksToGradeBtn')?.addEventListener('click', copyTasksToEntireGrade);

  // 10.5 Edit Task Modal Listeners
  document.getElementById('closeEditTaskModalBtn')?.addEventListener('click', closeEditTaskModal);
  document.getElementById('cancelEditTaskBtn')?.addEventListener('click', closeEditTaskModal);
  document.getElementById('editTaskForm')?.addEventListener('submit', handleEditTaskSubmit);
  document.getElementById('editTaskModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editTaskModal') closeEditTaskModal();
  });

  document.getElementById('submitNewTaskBtn')?.addEventListener('click', () => {
    const title = document.getElementById('newTaskTitle').value;
    const maxScore = document.getElementById('newTaskMaxScore').value;
    addNewAssignment(title, maxScore);
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskMaxScore').value = '20';
  });

  // 11. Room Configuration Modal
  document.getElementById('manageRoomsBtn')?.addEventListener('click', () => {
    artSound.playPop();
    openRoomConfigModal();
  });
  document.getElementById('closeRoomConfigModalBtn')?.addEventListener('click', closeRoomConfigModal);
  document.getElementById('closeRoomConfigFooterBtn')?.addEventListener('click', closeRoomConfigModal);
  document.getElementById('roomConfigModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'roomConfigModal') closeRoomConfigModal();
  });

  document.getElementById('submitNewRoomBtn')?.addEventListener('click', () => {
    const gId = document.getElementById('configNewRoomGrade').value;
    const rName = document.getElementById('configNewRoomName').value;
    if (!rName.trim()) {
      alert("กรุณากรอกชื่อหรือหมายเลขห้อง");
      return;
    }
    addNewRoom(gId, rName);
    document.getElementById('configNewRoomName').value = '';
  });

  // 11.5. Academic Year Promotion Modal
  document.getElementById('openPromoteYearBtn')?.addEventListener('click', () => {
    artSound.playPop();
    openPromoteModal();
  });
  document.getElementById('closePromoteModalBtn')?.addEventListener('click', closePromoteModal);
  document.getElementById('cancelPromoteBtn')?.addEventListener('click', closePromoteModal);
  document.getElementById('promoteYearModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'promoteYearModal') closePromoteModal();
  });

  document.getElementById('promoteBackupExcelBtn')?.addEventListener('click', () => {
    exportAllClasses('xlsx');
    showToast("ดาวน์โหลดไฟล์สำรองคะแนนทั้งหมดเรียบร้อยแล้ว!");
  });

  document.getElementById('promoteScopeSchool')?.addEventListener('change', () => {
    updatePromoteModeCards();
    renderPromoteStats();
  });
  document.getElementById('promoteScopeClass')?.addEventListener('change', () => {
    updatePromoteModeCards();
    renderPromoteStats();
  });

  const ackCheck = document.getElementById('promoteAcknowledgeCheck');
  const confirmPromoteBtn = document.getElementById('confirmPromoteActionBtn');
  ackCheck.addEventListener('change', () => {
    confirmPromoteBtn.disabled = !ackCheck.checked;
  });

  confirmPromoteBtn.addEventListener('click', () => {
    const scope = document.querySelector('input[name="promoteScope"]:checked')?.value || 'school';
    const msg = scope === 'school'
      ? "คุณแน่ใจหรือไม่ว่าต้องการเลื่อนชั้นเด็กทุกคนทั้งโรงเรียน (ป.1 - ป.6) ประจำปีการศึกษาใหม่?"
      : `คุณแน่ใจหรือไม่ว่าต้องการเลื่อนชั้นเด็กนักเรียนห้อง ${getGradeLabel(currentGrade)} ห้อง ${currentRoom} ขึ้นสู่ระดับชั้นถัดไป?`;
    
    if (confirm(msg)) {
      executeAcademicPromotion();
    }
  });

  // 12. Import Modal
  document.getElementById('openImportBtn')?.addEventListener('click', () => {
    artSound.playPop();
    openImportModal();
  });
  document.getElementById('closeImportModalBtn')?.addEventListener('click', closeImportModal);
  document.getElementById('cancelImportBtn')?.addEventListener('click', closeImportModal);
  document.getElementById('importModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'importModal') closeImportModal();
  });

  document.getElementById('downloadTemplateBtn')?.addEventListener('click', downloadTemplateCsv);

  const fileInput = document.getElementById('fileInputExcel');
  const dropzone = document.getElementById('fileDropzone');

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-active');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  document.getElementById('confirmImportBtn')?.addEventListener('click', confirmImport);

  // 13. Export Dropdown Menu
  const exportBtn = document.getElementById('exportDropdownBtn');
  const exportMenu = document.getElementById('exportMenu');

  exportBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
  });

  document.getElementById('exportCurrentExcelBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentClass('xlsx');
  });

  document.getElementById('exportCurrentCsvBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentClass('csv');
  });

  document.getElementById('exportAllExcelBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportAllClasses('xlsx');
  });

  document.getElementById('exportAllCsvBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    exportAllClasses('csv');
  });

  // 13.5 Rank Criteria Modal
  const rankCriteriaModal = document.getElementById('rankCriteriaModal');
  const openRankCriteriaModal = () => {
    artSound.playPop();
    rankCriteriaModal?.classList.remove('hidden');
  };
  const closeRankCriteriaModal = () => {
    artSound.playPop();
    rankCriteriaModal?.classList.add('hidden');
  };
  document.getElementById('viewRankCriteriaBtn')?.addEventListener('click', openRankCriteriaModal);
  document.getElementById('closeRankCriteriaModalBtn')?.addEventListener('click', closeRankCriteriaModal);
  document.getElementById('okRankCriteriaBtn')?.addEventListener('click', closeRankCriteriaModal);
  rankCriteriaModal?.addEventListener('click', (e) => {
    if (e.target.id === 'rankCriteriaModal') closeRankCriteriaModal();
  });

  // Reset Badges & Checklist for Current Room Button
  document.getElementById('resetRoomBadgesBtn')?.addEventListener('click', async () => {
    const gradeLabel = getGradeLabel(currentGrade);
    const confirmed = confirm(`⚠️ ต้องการเอาเหรียญตราออกและรีเซ็ตเกณฑ์งานทั้งหมดของนักเรียนทุกคนใน ${gradeLabel} ห้อง ${currentRoom} ใช่หรือไม่?\n\n(คะแนนเก็บปกติจะไม่ถูกลบ เฉพาะเหรียญตรา การ์ด และสิทธิ์วงล้อจะถูกรีเซ็ตใหม่)`);
    if (!confirmed) return;

    const roomStudents = getStudentsList(currentGrade, currentRoom);
    roomStudents.forEach(s => {
      s.badges = [];
      s.cards = [];
      s.checklist = {};
      s.revoked_badges = ART_BADGES.map(b => b.id);
    });

    saveDataToStorage();

    try {
      await apiPost({
        action: 'reset_badges',
        grade: currentGrade,
        room: currentRoom,
        mode: 'room'
      });
    } catch (err) {
      console.warn("Cloud DB reset_badges failed or offline:", err);
    }

    try { artSound.playPop(); } catch (e) {}
    showToast(`🏅 เอาเหรียญออกและรีเซ็ตของทุกคนในห้อง ${currentRoom} เรียบร้อยแล้ว`, 'success');
    renderTeacherView();
  });

  // Lucky Wheel Modal Listeners
  const closeLuckyWheelBtn = document.getElementById('closeLuckyWheelModalBtn');
  if (closeLuckyWheelBtn) closeLuckyWheelBtn.addEventListener('click', closeLuckyWheelModal);

  const luckyWheelModal = document.getElementById('luckyWheelModal');
  if (luckyWheelModal) {
    luckyWheelModal.addEventListener('click', (e) => {
      if (e.target.id === 'luckyWheelModal') closeLuckyWheelModal();
    });
  }

  const btnSpinWheel = document.getElementById('btnTriggerWheelSpin');
  if (btnSpinWheel) btnSpinWheel.addEventListener('click', triggerLuckyWheelSpin);

  const wheelCenterHub = document.getElementById('wheelSpinCenterBtn');
  if (wheelCenterHub) wheelCenterHub.addEventListener('click', triggerLuckyWheelSpin);

  const btnCollectPrize = document.getElementById('btnCollectWheelPrize');
  if (btnCollectPrize) {
    btnCollectPrize.addEventListener('click', () => {
      closeLuckyWheelModal();
      if (currentWheelStudent) openStudentProfileModal(currentWheelStudent);
    });
  }

  // 14. Reset Data Button
  document.getElementById('resetSampleDataBtn')?.addEventListener('click', () => {
    if (confirm("คุณต้องการรีเซ็ตข้อมูลและห้องเรียนทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?")) {
      appData = JSON.parse(JSON.stringify(DEFAULT_STUDENTS_DATA));
      appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      saveDataToStorage();
      saveConfigToStorage();
      apiPost({ action: 'reset_data' });
      populateGradeDropdowns();
      artSound.playSaveChime();
      showToast("รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นเรียบร้อย!");
      renderTeacherView();
    }
  });

  // Badge Manager Modal Tabs & Buttons
  const closeBadgeModalBtn = document.getElementById('closeBadgeManagerModalBtn');
  if (closeBadgeModalBtn) closeBadgeModalBtn.addEventListener('click', closeBadgeManagerModal);

  const saveBadgeModalBtn = document.getElementById('saveBadgeManagerBtn');
  if (saveBadgeModalBtn) saveBadgeModalBtn.addEventListener('click', saveBadgeManager);

  const tabChecklistBtn = document.getElementById('tabChecklistBtn');
  const tabQuickBadgesBtn = document.getElementById('tabQuickBadgesBtn');
  const paneChecklist = document.getElementById('badgeTabChecklistContent');
  const paneQuick = document.getElementById('badgeTabQuickBadgesContent');

  if (tabChecklistBtn && tabQuickBadgesBtn && paneChecklist && paneQuick) {
    tabChecklistBtn.addEventListener('click', () => {
      tabChecklistBtn.classList.add('active');
      tabQuickBadgesBtn.classList.remove('active');
      paneChecklist.classList.remove('hidden');
      paneQuick.classList.add('hidden');
    });
    tabQuickBadgesBtn.addEventListener('click', () => {
      tabQuickBadgesBtn.classList.add('active');
      tabChecklistBtn.classList.remove('active');
      paneQuick.classList.remove('hidden');
      paneChecklist.classList.add('hidden');
    });
  }

  const closeCardDrawBtn = document.getElementById('closeCardDrawModalBtn');
  if (closeCardDrawBtn) closeCardDrawBtn.addEventListener('click', closeCardDrawModal);

  const cardDrawModal = document.getElementById('cardDrawModal');
  if (cardDrawModal) {
    cardDrawModal.addEventListener('click', (e) => {
      if (e.target.id === 'cardDrawModal') closeCardDrawModal();
    });
  }

  const closeBadgeFooterBtn = document.getElementById('closeBadgeManagerFooterBtn');
  if (closeBadgeFooterBtn) closeBadgeFooterBtn.addEventListener('click', closeBadgeManagerModal);

  const badgeManagerModal = document.getElementById('badgeManagerModal');
  if (badgeManagerModal) {
    badgeManagerModal.addEventListener('click', (e) => {
      if (e.target.id === 'badgeManagerModal') closeBadgeManagerModal();
    });
  }

  // Global Escape key listener to close active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeBadgeManagerModal();
      closeStudentProfileModal();
      closeCardDrawModal();
      closeStudentModal();
      closeTaskManagerModal();
      closeEditTaskModal();
      closeRoomConfigModal();
      closePromoteModal();
      closeImportModal();
      closePhotoLightbox();
      closeGalleryUploadModal();
      closeTeacherLoginModal();
      closeLogoutConfirmModal();
      closeAccountManagerModal();
      closeRankCriteriaModal();
      closeSchoolSettingsModal();
      closeMagazineModal();
    }
  });

  // 15. Initial Render, Auth State & Cloud DB Sync
  updateTeacherAuthUI();
  switchView('home');
  checkAndSyncCloudDb();
  setTimeout(() => confettiEngine.fire(50), 400);
});
