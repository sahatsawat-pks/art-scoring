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

// Default Configuration with Dynamic Assignments
const DEFAULT_CONFIG = {
  grades: [
    { id: 'p1', name: 'ชั้นประถมศึกษาปีที่ 1 (ป.1)' },
    { id: 'p2', name: 'ชั้นประถมศึกษาปีที่ 2 (ป.2)' },
    { id: 'p3', name: 'ชั้นประถมศึกษาปีที่ 3 (ป.3)' },
    { id: 'p4', name: 'ชั้นประถมศึกษาปีที่ 4 (ป.4)' },
    { id: 'p5', name: 'ชั้นประถมศึกษาปีที่ 5 (ป.5)' },
    { id: 'p6', name: 'ชั้นประถมศึกษาปีที่ 6 (ป.6)' }
  ],
  rooms: {
    'p1': ['1', '2', '3'],
    'p2': ['1', '2', '3'],
    'p3': ['1', '2', '3'],
    'p4': ['1', '2', '3'],
    'p5': ['1', '2', '3'],
    'p6': ['1', '2', '3']
  },
  // Dynamic Assignment List (สามารถเพิ่ม/ลด/แก้ไขได้อิสระ)
  assignments: [
    { id: 'task_1', title: 'งานที่ 1: การไล่เฉดสีน้ำและเทคนิคเปียกบนเปียก', maxScore: 25 },
    { id: 'task_2', title: 'งานที่ 2: วาดภาพสัตว์ในจินตนาการ (สีโปสเตอร์)', maxScore: 25 },
    { id: 'task_3', title: 'งานที่ 3: ภาพพิมพ์และงานสร้างสรรค์คอลลาจ', maxScore: 25 },
    { id: 'task_4', title: 'งานที่ 4: การแรเงาเส้นและน้ำหนักแสงเงา', maxScore: 25 }
  ]
};

// Default Sample Student Dataset (Default Grade 4 Room 1)
const DEFAULT_STUDENTS_DATA = {
  "p4_1": [
    {
      id: "p4_1_01",
      no: 1,
      name: "ด.ช. ธนกร ศิลป์เลิศ",
      nickname: "อาร์ต",
      avatar: "👦",
      scores: { task_1: 24, task_2: 25, task_3: 24, task_4: 25 },
      feedback: "ส่งงานตรงเวลาครบทุกชิ้น มีความรับผิดชอบและทักษะการคุมสีน้ำยอดเยี่ยม"
    },
    {
      id: "p4_1_02",
      no: 2,
      name: "ด.ญ. พิมพ์มาดา วาดวิจิตร",
      nickname: "พู่กัน",
      avatar: "👧",
      scores: { task_1: 24, task_2: 25, task_3: 23, task_4: 24 },
      feedback: "งานสร้างสรรค์สัตว์ในจินตนาการไอเดียแปลกใหม่มาก ลายเส้นสดใส"
    },
    {
      id: "p4_1_03",
      no: 3,
      name: "ด.ญ. กัญญาพัชร สีสันดี",
      nickname: "สายรุ้ง",
      avatar: "🦄",
      scores: { task_1: 23, task_2: 24, task_3: 24, task_4: 23 },
      feedback: "การเลือกคู่สีพาสเทลลงตัว ชิ้นงานคอลลาจมีความละเอียดประณีต"
    },
    {
      id: "p4_1_04",
      no: 4,
      name: "ด.ช. ปัณณธร ลายเส้นทอง",
      nickname: "วินเนอร์",
      avatar: "🦁",
      scores: { task_1: 22, task_2: 24, task_3: 23, task_4: 24 },
      feedback: "การแรเงาแสงเงามีมิติชัดเจนมาก กล้าใช้น้ำหนักเข้ม"
    },
    {
      id: "p4_1_05",
      no: 5,
      name: "ด.ญ. อลินดา มโนภาพ",
      nickname: "ลินิน",
      avatar: "🐱",
      scores: { task_1: 23, task_2: 22, task_3: 23, task_4: 22 },
      feedback: "มีพัฒนาการที่ดีขึ้นต่อเนื่อง การเกลี่ยสีน้ำเริ่มนุ่มนวล"
    },
    {
      id: "p4_1_06",
      no: 6,
      name: "ด.ช. ชนนนท์ นักวาด",
      nickname: "นนท์",
      avatar: "🦊",
      scores: { task_1: 21, task_2: 23, task_3: 24, task_4: 20 },
      feedback: "งานภาพพิมพ์ทำออกมาได้น่าสนใจมาก ไอเดียสร้างสรรค์ไม่ซ้ำใคร"
    },
    {
      id: "p4_1_07",
      no: 7,
      name: "ด.ญ. รินรดา สดใสศิลป์",
      nickname: "มินนี่",
      avatar: "👧",
      scores: { task_1: 22, task_2: 21, task_3: 21, task_4: 22 },
      feedback: "ตั้งใจทำงานอย่างสม่ำเสมอ ฝึกการเน้นขอบเส้นจะช่วยให้ภาพคมชัดยิ่งขึ้น"
    },
    {
      id: "p4_1_08",
      no: 8,
      name: "ด.ช. ภัทรดนัย จินตนาการ",
      nickname: "ข้าวกล้อง",
      avatar: "🐼",
      scores: { task_1: 20, task_2: 22, task_3: 21, task_4: 21 },
      feedback: "รายละเอียดในชิ้นงานดีมาก รักษาความสะอาดของกระดาษได้ดี"
    },
    {
      id: "p4_1_09",
      no: 9,
      name: "ด.ช. วชิรวิทย์ ประณีตงาม",
      nickname: "เต้",
      avatar: "👦",
      scores: { task_1: 20, task_2: 20, task_3: 21, task_4: 20 },
      feedback: "งานเรียบร้อย ส่งตรงเวลา ควรฝึกเรื่องการผสมคู่สีตรงข้ามเพิ่มเติม"
    },
    {
      id: "p4_1_10",
      no: 10,
      name: "ด.ญ. ณิชาภัทร อารมณ์ศิลป์",
      nickname: "ณิชา",
      avatar: "👧",
      scores: { task_1: 19, task_2: 21, task_3: 20, task_4: 19 },
      feedback: "เส้นร่างบางเบาสะอาดตา เพิ่มความกล้าในการลงสีเข้มจะสมบูรณ์แบบ"
    },
    {
      id: "p4_1_11",
      no: 11,
      name: "ด.ช. กิตติพงษ์ มือศิลป์",
      nickname: "กาย",
      avatar: "🦖",
      scores: { task_1: 18, task_2: 20, task_3: 19, task_4: 19 },
      feedback: "มีความกล้าแสดงออกในการลงสี ควรเพิ่มความใจเย็นในขั้นตอนเก็บรายละเอียด"
    },
    {
      id: "p4_1_12",
      no: 12,
      name: "ด.ญ. วรินทร สุขภาพใจ",
      nickname: "เอย",
      avatar: "🐰",
      scores: { task_1: 18, task_2: 19, task_3: 18, task_4: 18 },
      feedback: "ส่งงานครบทุกชิ้น มีความพยายามที่ดีมาก ขอให้ฝึกฝนบ่อย ๆ นะครับ"
    }
  ],
  "p4_2": [
    {
      id: "p4_2_01",
      no: 1,
      name: "ด.ช. ปิติพล แต้มสี",
      nickname: "มิกซ์",
      avatar: "👦",
      scores: { task_1: 23, task_2: 24, task_3: 24, task_4: 24 },
      feedback: "งานสวยสดใส มีพลังและส่งงานตรงเวลา"
    },
    {
      id: "p4_2_02",
      no: 2,
      name: "ด.ญ. ชนิกานต์ ดวงดาว",
      nickname: "ดาว",
      avatar: "🦄",
      scores: { task_1: 22, task_2: 23, task_3: 22, task_4: 23 },
      feedback: "ระบายสีได้กลมกลืนและสะอาดตามาก"
    }
  ],
  "p5_1": [
    {
      id: "p5_1_01",
      no: 1,
      name: "ด.ญ. ศศิธร แสงจันทร์",
      nickname: "จันทร์เจ้า",
      avatar: "👧",
      scores: { task_1: 25, task_2: 25, task_3: 25, task_4: 24 },
      feedback: "ผลงานดีเด่นทุกชิ้น ความคิดสร้างสรรค์ระดับยอดเยี่ยม"
    }
  ]
};

// Global App State
let appData = {};
let appConfig = {};
let currentGrade = 'p4';
let currentRoom = '1';
let currentView = 'leaderboard';
let soundEnabled = true;
let stagedImportStudents = [];

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
  }

  playPop() {
    if (!soundEnabled) return;
    this.init();
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

  playFanfare() {
    if (!soundEnabled) return;
    this.init();
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
    this.init();
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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
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

// Assignments helpers
function getActiveAssignments() {
  return appConfig.assignments || [];
}

function getTotalMaxScore() {
  const tasks = getActiveAssignments();
  return tasks.reduce((sum, t) => sum + (Number(t.maxScore) || 0), 0);
}

function calcStudentTotalScore(student) {
  const tasks = getActiveAssignments();
  const scores = student.scores || {};
  let total = 0;
  tasks.forEach(t => {
    const val = Number(scores[t.id]);
    if (!isNaN(val)) total += val;
  });
  return total;
}

function getSubmittedTasksCount(student) {
  const tasks = getActiveAssignments();
  const scores = student.scores || {};
  let count = 0;
  tasks.forEach(t => {
    if (scores[t.id] !== undefined && scores[t.id] !== null && scores[t.id] !== '') {
      count++;
    }
  });
  return count;
}

function getLetterGrade(score, maxScore) {
  if (maxScore <= 0) return { grade: "-", label: "-" };
  const pct = (score / maxScore) * 100;
  if (pct >= 90) return { grade: "A+", label: "ยอดเยี่ยมเป็นเลิศ (Masterpiece)" };
  if (pct >= 80) return { grade: "A", label: "ดีเยี่ยม (Excellent)" };
  if (pct >= 75) return { grade: "B+", label: "ดีมาก (Very Good)" };
  if (pct >= 70) return { grade: "B", label: "ดี (Good)" };
  if (pct >= 60) return { grade: "C+", label: "ปานกลาง (Satisfactory)" };
  if (pct >= 50) return { grade: "C", label: "ผ่านเกณฑ์ (Pass)" };
  return { grade: "D", label: "ควรพัฒนาและส่งงานเพิ่ม (Needs Improvement)" };
}

function getRankedStudents(grade = currentGrade, room = currentRoom) {
  const list = [...getStudentsList(grade, room)];
  return list.sort((a, b) => {
    const scoreA = calcStudentTotalScore(a);
    const scoreB = calcStudentTotalScore(b);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    // Tie-breaker: submitted tasks count
    const submittedA = getSubmittedTasksCount(a);
    const submittedB = getSubmittedTasksCount(b);
    if (submittedB !== submittedA) {
      return submittedB - submittedA;
    }
    // Final tie-breaker: student number
    return (a.no || 0) - (b.no || 0);
  });
}

function getArtRankTier(score, rank, maxScore) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (rank === 1) return { title: "👑 แปรงทองคำ", class: "tier-gold" };
  if (rank === 2) return { title: "🥈 แปรงเงินสุกสว่าง", class: "tier-silver" };
  if (rank === 3) return { title: "🥉 แปรงทองแดงศิลป์", class: "tier-bronze" };
  if (pct >= 85) return { title: "🌟 จิตรกรเอก", class: "tier-star" };
  if (pct >= 75) return { title: "🎨 ศิลปินดาวรุ่ง", class: "tier-star" };
  return { title: "🌈 นักสร้างสรรค์", class: "tier-pass" };
}

function getGradeLabel(gradeKey) {
  const found = appConfig.grades.find(g => g.id === gradeKey);
  return found ? found.name : gradeKey;
}

// ==========================================
// 5. DROPDOWN POPULATION & SYNC
// ==========================================
function populateGradeDropdowns() {
  const gradeSelect = document.getElementById('gradeSelect');
  const teacherGradeSelect = document.getElementById('teacherGradeSelect');
  const configNewRoomGrade = document.getElementById('configNewRoomGrade');

  const optionsHtml = appConfig.grades.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

  if (gradeSelect) gradeSelect.innerHTML = optionsHtml;
  if (teacherGradeSelect) teacherGradeSelect.innerHTML = optionsHtml;
  if (configNewRoomGrade) configNewRoomGrade.innerHTML = optionsHtml;

  gradeSelect.value = currentGrade;
  teacherGradeSelect.value = currentGrade;
  if (configNewRoomGrade) configNewRoomGrade.value = currentGrade;

  populateRoomDropdowns();
}

function populateRoomDropdowns() {
  const roomSelect = document.getElementById('roomSelect');
  const teacherRoomSelect = document.getElementById('teacherRoomSelect');

  const availableRooms = (appConfig.rooms && appConfig.rooms[currentGrade]) || ['1'];

  if (!availableRooms.includes(currentRoom)) {
    currentRoom = availableRooms[0] || '1';
  }

  const optionsHtml = availableRooms.map(r => {
    const isStandardNo = !isNaN(r);
    const label = isStandardNo ? `ห้อง ${r}` : r;
    return `<option value="${r}">${label}</option>`;
  }).join('');

  if (roomSelect) {
    roomSelect.innerHTML = optionsHtml;
    roomSelect.value = currentRoom;
  }
  if (teacherRoomSelect) {
    teacherRoomSelect.innerHTML = optionsHtml;
    teacherRoomSelect.value = currentRoom;
  }
}

// ==========================================
// 6. STUDENT FULL DETAILS / PORTFOLIO MODAL
// ==========================================
function openStudentDetailModal(student, rank = null) {
  const modal = document.getElementById('studentDetailModal');
  const container = document.getElementById('studentDetailContent');

  const ranked = getRankedStudents(currentGrade, currentRoom);
  const actualRank = rank !== null ? rank : (ranked.findIndex(s => s.id === student.id) + 1);
  const total = calcStudentTotalScore(student);
  const totalMax = getTotalMaxScore();
  const gradeInfo = getLetterGrade(total, totalMax);
  const tier = getArtRankTier(total, actualRank, totalMax);
  const tasks = getActiveAssignments();

  // Class comparison stats
  const scores = ranked.map(s => calcStudentTotalScore(s));
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : total;

  let rankChipIcon = '🎖️';
  if (actualRank === 1) rankChipIcon = '👑 อันดับ 1 (ทอง)';
  else if (actualRank === 2) rankChipIcon = '🥈 อันดับ 2 (เงิน)';
  else if (actualRank === 3) rankChipIcon = '🥉 อันดับ 3 (ทองแดง)';
  else rankChipIcon = `อันดับที่ #${actualRank}`;

  // Build task score rows
  const taskRowsHtml = tasks.map((task, idx) => {
    const rawVal = (student.scores && student.scores[task.id]);
    const isSubmitted = rawVal !== undefined && rawVal !== null && rawVal !== '';
    const scoreVal = isSubmitted ? Number(rawVal) : 0;
    const pct = task.maxScore > 0 ? Math.min(100, (scoreVal / task.maxScore) * 100) : 0;

    const statusBadge = isSubmitted
      ? `<span class="passport-task-status status-submitted">✓ ส่งแล้ว (${scoreVal}/${task.maxScore})</span>`
      : `<span class="passport-task-status status-pending">⏳ ยังไม่ส่ง</span>`;

    return `
      <div class="passport-task-row">
        <div class="passport-task-header">
          <span>${task.title}</span>
          ${statusBadge}
        </div>
        <div class="meter-bar">
          <div class="meter-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="passport-hero-banner">
      <div class="passport-student-header">
        <div class="passport-avatar-box">
          ${student.avatar || '🎨'}
        </div>
        <div class="passport-info">
          <h3>${student.name}</h3>
          <p>น้อง${student.nickname || '-'} • เลขที่ ${student.no} • ${getGradeLabel(currentGrade)} ห้อง ${currentRoom}</p>
          <div class="passport-rank-chip">
            <span>${rankChipIcon}</span>
            <span>• ${tier.title}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="passport-body-content">
      <!-- Total Score Summary Card -->
      <div class="passport-scores-card">
        <div class="scores-card-header">
          <span class="scores-card-title">🎯 คะแนนสะสมรวมตามงาน (${getSubmittedTasksCount(student)}/${tasks.length} ชิ้นงาน)</span>
          <div class="scores-big-total">
            ${total} <small>/ ${totalMax}</small>
            <span class="art-tier-badge ${tier.class}" style="font-size: 0.8rem; margin-left: 6px;">เกรด ${gradeInfo.grade}</span>
          </div>
        </div>

        <!-- Task List Breakdown -->
        <div class="student-passport-tasks-list">
          ${taskRowsHtml}
        </div>
      </div>

      <!-- Class Stats Comparison -->
      <div class="passport-stats-compare">
        <div class="stat-box-mini">
          <div class="stat-val">${total}</div>
          <div class="stat-lbl">คะแนนของตนเอง</div>
        </div>
        <div class="stat-box-mini">
          <div class="stat-val" style="color: #64748B;">${avgScore}</div>
          <div class="stat-lbl">คะแนนเฉลี่ยทั้งห้อง</div>
        </div>
        <div class="stat-box-mini">
          <div class="stat-val" style="color: #D97706;">${maxScore}</div>
          <div class="stat-lbl">คะแนนสูงสุดประจำห้อง</div>
        </div>
      </div>

      <!-- Teacher Feedback Callout -->
      <div class="passport-feedback-quote">
        <strong>💬 บันทึกติชมและคำแนะนำจากคุณครู:</strong>
        "${student.feedback || 'ส่งงานตรงเวลา มีความตั้งใจและมีพัฒนาการที่ดี ขอให้รักษาความมุ่งมั่นนี้ต่อไป!'}"
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  artSound.playPop();
}

function closeStudentDetailModal() {
  document.getElementById('studentDetailModal').classList.add('hidden');
}

// ==========================================
// 7. VIEW RENDERING: PODIUM & LEADERBOARD
// ==========================================
function renderLeaderboardView() {
  const ranked = getRankedStudents(currentGrade, currentRoom);
  const tasks = getActiveAssignments();
  const totalMax = getTotalMaxScore();

  const titleElem = document.getElementById('currentClassTitle');
  const countElem = document.getElementById('studentCountChip');
  const taskChip = document.getElementById('taskSummaryChip');
  const subtitle = document.getElementById('tableHeaderSubtitle');

  if (titleElem) titleElem.textContent = `กำลังแสดง: ${getGradeLabel(currentGrade)} ห้อง ${currentRoom}`;
  if (countElem) countElem.textContent = `${ranked.length} คน`;
  if (taskChip) taskChip.textContent = `${tasks.length} ชิ้นงาน (เต็ม ${totalMax} คะแนน)`;
  if (subtitle) subtitle.textContent = `ประเมินคะแนนสะสมตาม ${tasks.length} ชิ้นงานที่สั่ง (คะแนนเต็มรวม ${totalMax} คะแนน)`;

  renderPodium(ranked);
  renderRankTable(ranked);
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
        openStudentDetailModal(item.student, item.rank);
      });
    }
  });
}

function buildPodiumSlotHtml(student, rank) {
  const badgeEmojis = { 1: '👑', 2: '🥈', 3: '🥉' };
  const stepLabel = rank === 1 ? '1ST PLACE' : rank === 2 ? '2ND PLACE' : '3RD PLACE';
  const totalMax = getTotalMaxScore();
  const tasks = getActiveAssignments();

  if (!student) {
    return `
      <div class="podium-student-card" style="opacity: 0.6; cursor: default;">
        <div class="rank-badge-floater">${badgeEmojis[rank]}</div>
        <div class="avatar-halo">🎨</div>
        <div class="podium-student-name">ยังไม่มีนักเรียน</div>
        <div class="podium-student-nick">รอผลการกรอกคะแนน</div>
        <div class="podium-score-tag">- <span class="unit">คะแนน</span></div>
      </div>
      <div class="podium-block">
        <div class="podium-step-number">${rank}</div>
        <div class="podium-step-sub">${stepLabel}</div>
      </div>
    `;
  }

  const total = calcStudentTotalScore(student);
  const tier = getArtRankTier(total, rank, totalMax);
  const submittedCount = getSubmittedTasksCount(student);

  return `
    <div class="podium-student-card" title="คลิกเพื่อดูรายละเอียดคะแนนของ ${student.name}">
      <div class="rank-badge-floater" title="อันดับที่ ${rank}">${badgeEmojis[rank]}</div>
      <div class="avatar-halo">${student.avatar || '🎨'}</div>
      <h3 class="podium-student-name">${student.name}</h3>
      <div class="podium-student-nick">(น้อง${student.nickname || 'ศิลปิน'}) • เลขที่ ${student.no}</div>
      <div class="podium-task-summary">📝 ส่งครบ ${submittedCount}/${tasks.length} งาน</div>
      <div class="podium-score-tag">
        ${total} <span class="unit">/ ${totalMax}</span>
      </div>
      <div class="podium-tier-label ${tier.class}">${tier.title}</div>
    </div>
    <div class="podium-block">
      <div class="podium-step-number">${rank}</div>
      <div class="podium-step-sub">${stepLabel}</div>
    </div>
  `;
}

function renderRankTable(ranked) {
  const theadRow = document.getElementById('rankTableHeadRow');
  const tbody = document.getElementById('rankTableBody');
  const searchInput = document.getElementById('studentSearchInput');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const emptyState = document.getElementById('noResultsState');
  const tasks = getActiveAssignments();
  const totalMax = getTotalMaxScore();

  // Dynamic Head Row (หน้าแรกไม่ต้องใส่เกรด)
  theadRow.innerHTML = `
    <th class="col-rank">อันดับ</th>
    <th class="col-id">เลขที่</th>
    <th class="col-student">ชื่อ-นามสกุล / ชื่อเล่น (คลิกดูคะแนน)</th>
    <th>คะแนนรายชิ้นงานที่สั่ง (${tasks.length} งาน)</th>
    <th class="col-score">คะแนนรวม (${totalMax})</th>
    <th class="col-badge">ฉายาทางศิลปะ</th>
    <th class="col-action">ดูคะแนนละเอียด</th>
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
    const total = calcStudentTotalScore(student);
    const tier = getArtRankTier(total, actualRank, totalMax);
    const gradeInfo = getLetterGrade(total, totalMax);

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

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="col-rank">
        <span class="rank-badge ${rankBadgeClass}">${rankBadgeContent}</span>
      </td>
      <td style="font-weight: 700; color: #64748B;">#${student.no}</td>
      <td>
        <div class="student-cell-clickable" title="คลิกเพื่อดูรายละเอียดคะแนนของ ${student.name}">
          <div class="student-table-avatar">${student.avatar || '🎨'}</div>
          <div class="student-table-details">
            <span class="student-table-name">${student.name}</span>
            <span class="student-table-nick">น้อง${student.nickname || '-'} (คลิกดูคะแนน 🔍)</span>
          </div>
        </div>
      </td>
      <td>
        <div class="task-scores-flow">
          ${chipsHtml}
        </div>
      </td>
      <td>
        <div class="score-cell-badge">
          ${total} <span class="total-max">/${totalMax}</span>
        </div>
      </td>
      <td>
        <span class="art-tier-badge ${tier.class}">${tier.title}</span>
      </td>
      <td>
        <button class="btn-view-art" data-id="${student.id}">
          🔍 ดูคะแนน
        </button>
      </td>
    `;

    const openHandler = () => openStudentDetailModal(student, actualRank);
    tr.querySelector('.student-cell-clickable').addEventListener('click', openHandler);
    tr.querySelector('.btn-view-art').addEventListener('click', openHandler);

    tbody.appendChild(tr);
  });
}

// ==========================================
// 8. TEACHER PORTAL & SCORING TABLE
// ==========================================
function renderTeacherView() {
  const teacherGradeSelect = document.getElementById('teacherGradeSelect');
  const teacherRoomSelect = document.getElementById('teacherRoomSelect');

  if (teacherGradeSelect) teacherGradeSelect.value = currentGrade;
  if (teacherRoomSelect) teacherRoomSelect.value = currentRoom;

  const students = getStudentsList(currentGrade, currentRoom);
  const sortedByNo = [...students].sort((a, b) => (a.no || 0) - (b.no || 0));
  const tasks = getActiveAssignments();
  const totalMax = getTotalMaxScore();

  // Dynamic Table Headers
  const theadRow = document.getElementById('teacherTableHeadRow');
  let headHtml = `
    <th style="width: 50px; text-align: center;">เลขที่</th>
    <th style="width: 170px;">ชื่อ-นามสกุล</th>
    <th style="width: 80px;">ชื่อเล่น</th>
  `;

  tasks.forEach((task, idx) => {
    headHtml += `
      <th style="min-width: 95px; text-align: center;" title="${task.title}">
        งาน ${idx + 1} (${task.maxScore})
      </th>
    `;
  });

  headHtml += `
    <th style="width: 90px; text-align: center;">คะแนนรวม (${totalMax})</th>
    <th style="min-width: 180px;">บันทึกติชมของครู</th>
    <th style="width: 110px; text-align: center;">จัดการ</th>
  `;

  theadRow.innerHTML = headHtml;

  const tbody = document.getElementById('teacherTableBody');
  tbody.innerHTML = '';

  const colSpanCount = 5 + tasks.length;

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
    const total = calcStudentTotalScore(student);
    const tr = document.createElement('tr');
    tr.id = `teacher-row-${student.id}`;

    let rowHtml = `
      <td style="font-weight: 700; text-align: center;">${student.no}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${student.avatar || '🎨'}</span>
          <strong>${student.name}</strong>
        </div>
      </td>
      <td>น้อง${student.nickname || '-'}</td>
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

    rowHtml += `
      <td class="table-row-total" id="total-val-${student.id}">
        ${total}
      </td>
      <td>
        <input type="text" class="comment-input-inline input-feedback" 
          value="${student.feedback || ''}" 
          placeholder="พิมพ์คำติชมเพื่อให้นักเรียนพัฒนา...">
      </td>
      <td>
        <div class="table-actions-cell">
          <button class="btn-icon-sm view-profile-btn" title="เปิดดูการ์ดคะแนน">👁️</button>
          <button class="btn-icon-sm edit-full-btn" title="แก้ไขข้อมูลนักเรียน">✏️</button>
          <button class="btn-icon-sm delete-btn" title="ลบข้อมูล">🗑️</button>
        </div>
      </td>
    `;

    tr.innerHTML = rowHtml;

    // Attach inline score listeners
    const scoreInputs = tr.querySelectorAll('.task-score-input');
    scoreInputs.forEach(input => {
      input.addEventListener('change', () => {
        const taskId = input.getAttribute('data-task-id');
        const maxScore = parseInt(input.getAttribute('data-max'), 10) || 100;
        let val = parseInt(input.value, 10);

        if (isNaN(val) || val < 0) val = 0;
        if (val > maxScore) val = maxScore;
        input.value = val;

        student.scores[taskId] = val;
        saveDataToStorage();

        const newTotal = calcStudentTotalScore(student);
        document.getElementById(`total-val-${student.id}`).textContent = newTotal;
        showToast(`บันทึกคะแนน ${student.name} แล้ว (${newTotal}/${totalMax})`);
        artSound.playSaveChime();
      });
    });

    // Feedback input listener
    const feedInput = tr.querySelector('.input-feedback');
    feedInput.addEventListener('change', (e) => {
      student.feedback = e.target.value;
      saveDataToStorage();
      showToast(`บันทึกคำติชมสำหรับ ${student.name} แล้ว`);
    });

    // Row action buttons
    tr.querySelector('.view-profile-btn').addEventListener('click', () => {
      openStudentDetailModal(student);
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
    showToast("ลบข้อมูลนักเรียนเรียบร้อยแล้ว");
    artSound.playPop();
    renderTeacherView();
  }
}

// ==========================================
// 9. ASSIGNMENTS / TASKS MANAGER MODAL
// ==========================================
function openTaskManagerModal() {
  const modal = document.getElementById('taskManagerModal');
  renderTasksManagerList();
  modal.classList.remove('hidden');
}

function closeTaskManagerModal() {
  document.getElementById('taskManagerModal').classList.add('hidden');
}

function renderTasksManagerList() {
  const container = document.getElementById('tasksListContainer');
  const countLabel = document.getElementById('taskCountLabel');
  const totalBadge = document.getElementById('totalMaxScoreBadge');
  const tasks = getActiveAssignments();
  const totalMax = getTotalMaxScore();

  countLabel.textContent = tasks.length;
  totalBadge.textContent = `คะแนนเต็มรวม: ${totalMax} คะแนน`;
  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: #94A3B8;">ยังไม่มีหัวข้องานที่สั่ง กรุณาเพิ่มชิ้นงานด้านบน</div>`;
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
      const newTitle = prompt("แก้ไขชื่อชิ้นงาน:", task.title);
      if (newTitle && newTitle.trim()) {
        const newMax = prompt("แก้ไขคะแนนเต็ม:", task.maxScore);
        const parsedMax = parseInt(newMax, 10);
        if (!isNaN(parsedMax) && parsedMax > 0) {
          task.title = newTitle.trim();
          task.maxScore = parsedMax;
          saveConfigToStorage();
          renderTasksManagerList();
          showToast("อัปเดตชิ้นงานเรียบร้อยแล้ว!");
          artSound.playSaveChime();
          if (currentView === 'teacher') renderTeacherView();
          else renderLeaderboardView();
        }
      }
    });

    card.querySelector('.delete-task-btn').addEventListener('click', () => {
      if (confirm(`คุณต้องการลบ "${task.title}" ใช่หรือไม่? (คะแนนที่กรอกในช่องนี้จะถูกลบออกด้วย)`)) {
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

  const newId = `task_${Date.now()}`;
  if (!appConfig.assignments) appConfig.assignments = [];
  appConfig.assignments.push({
    id: newId,
    title: cleanTitle,
    maxScore: cleanMax
  });

  saveConfigToStorage();
  renderTasksManagerList();
  showToast(`เพิ่มชิ้นงาน "${cleanTitle}" สำเร็จแล้ว!`);
  artSound.playSaveChime();

  if (currentView === 'teacher') renderTeacherView();
  else renderLeaderboardView();
}

function deleteAssignment(taskId) {
  const idx = appConfig.assignments.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    const deleted = appConfig.assignments.splice(idx, 1)[0];
    saveConfigToStorage();
    renderTasksManagerList();
    showToast(`ลบชิ้นงาน "${deleted.title}" เรียบร้อยแล้ว`);
    artSound.playPop();

    if (currentView === 'teacher') renderTeacherView();
    else renderLeaderboardView();
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
  const totalMax = getTotalMaxScore();

  return list.map((s, index) => {
    const rank = index + 1;
    const total = calcStudentTotalScore(s);
    const letter = getLetterGrade(total, totalMax);
    const tier = getArtRankTier(total, rank, totalMax);

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

    rowObj[`คะแนนรวม (${totalMax})`] = total;
    rowObj["เกรด"] = letter.grade;
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
  const lbBtn = document.getElementById('viewLeaderboardBtn');
  const tcBtn = document.getElementById('viewTeacherBtn');
  const lbSec = document.getElementById('leaderboardView');
  const tcSec = document.getElementById('teacherView');

  if (viewName === 'leaderboard') {
    lbBtn.classList.add('active');
    tcBtn.classList.remove('active');
    lbSec.classList.add('active-view');
    tcSec.classList.remove('active-view');
    renderLeaderboardView();
  } else {
    tcBtn.classList.add('active');
    lbBtn.classList.remove('active');
    tcSec.classList.add('active-view');
    lbSec.classList.remove('active-view');
    renderTeacherView();
  }
}

// ==========================================
// 15. AUTHENTICATION & TEACHER SESSIONS
// ==========================================
function updateTeacherAuthUI(user = null) {
  const current = user || getLoggedInTeacher();
  const chip = document.getElementById('loggedInUserChip');
  if (chip && current) {
    chip.textContent = `👤 ${current.displayName || current.username}`;
  }
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

function handleTeacherLogout() {
  if (confirm("คุณต้องการออกจากระบบห้องพักครูใช่หรือไม่?")) {
    clearLoggedInTeacher();
    switchView('leaderboard');
    artSound.playPop();
    showToast("ออกจากระบบห้องพักครูเรียบร้อยแล้ว");
  }
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
  accounts.push({
    username,
    displayName,
    passwordHash,
    role: "ครูผู้สอน",
    createdAt: new Date().toLocaleDateString('th-TH'),
    isPrimary: false
  });

  saveAccounts(accounts);
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
    renderAccountsList();
    showToast(`ลบบัญชี "${username}" เรียบร้อยแล้ว`);
    artSound.playPop();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Storage & Dropdowns
  loadStorage();
  confettiEngine = new ConfettiManager('confettiCanvas');
  populateGradeDropdowns();

  // 2. Sound Switch
  const savedSound = localStorage.getItem(SOUND_KEY);
  if (savedSound !== null) soundEnabled = savedSound === 'true';
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.classList.toggle('active', soundEnabled);
    soundBtn.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(SOUND_KEY, soundEnabled);
      soundBtn.classList.toggle('active', soundEnabled);
      soundBtn.querySelector('.sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) artSound.playPop();
    });
  }

  // 3. Class Selectors in Leaderboard
  const gradeSelect = document.getElementById('gradeSelect');
  const roomSelect = document.getElementById('roomSelect');

  gradeSelect.addEventListener('change', () => {
    currentGrade = gradeSelect.value;
    populateRoomDropdowns();
    artSound.playPop();
    renderLeaderboardView();
    confettiEngine.fire(40);
  });

  roomSelect.addEventListener('change', () => {
    currentRoom = roomSelect.value;
    artSound.playPop();
    renderLeaderboardView();
    confettiEngine.fire(40);
  });

  // 4. Class Selectors in Teacher Portal
  const teacherGradeSelect = document.getElementById('teacherGradeSelect');
  const teacherRoomSelect = document.getElementById('teacherRoomSelect');

  teacherGradeSelect.addEventListener('change', (e) => {
    currentGrade = e.target.value;
    gradeSelect.value = currentGrade;
    populateRoomDropdowns();
    artSound.playPop();
    renderTeacherView();
  });

  teacherRoomSelect.addEventListener('change', (e) => {
    currentRoom = e.target.value;
    roomSelect.value = currentRoom;
    artSound.playPop();
    renderTeacherView();
  });

  // Quick Action Buttons
  document.getElementById('quickAddRoomBtn').addEventListener('click', () => {
    const newRoom = prompt(`กรุณากรอกชื่อหรือเลขห้องใหม่สำหรับ ${getGradeLabel(currentGrade)}:`, `${(appConfig.rooms[currentGrade]?.length || 0) + 1}`);
    if (newRoom) {
      addNewRoom(currentGrade, newRoom);
    }
  });

  document.getElementById('quickAddTaskBtn').addEventListener('click', () => {
    const nextNo = (appConfig.assignments?.length || 0) + 1;
    const title = prompt("กรุณาระบุชื่อชิ้นงานใหม่ที่สั่ง:", `งานที่ ${nextNo}: การวาดภาพระบายสีสร้างสรรค์`);
    if (title) {
      const maxScore = prompt("ระบุคะแนนเต็มของชิ้นงานนี้:", "20");
      if (maxScore) addNewAssignment(title, maxScore);
    }
  });

  // 5. Navigation Tabs
  document.getElementById('viewLeaderboardBtn').addEventListener('click', () => {
    artSound.playPop();
    switchView('leaderboard');
  });

  document.getElementById('viewTeacherBtn').addEventListener('click', () => {
    artSound.playPop();
    const user = getLoggedInTeacher();
    if (user) {
      updateTeacherAuthUI(user);
      switchView('teacher');
    } else {
      openTeacherLoginModal();
    }
  });

  // Auth & Account Modal Listeners
  document.getElementById('closeLoginModalBtn').addEventListener('click', closeTeacherLoginModal);
  document.getElementById('cancelLoginBtn').addEventListener('click', closeTeacherLoginModal);
  document.getElementById('teacherLoginForm').addEventListener('submit', handleTeacherLoginSubmit);

  document.getElementById('logoutBtn').addEventListener('click', handleTeacherLogout);

  document.getElementById('manageAccountsBtn').addEventListener('click', () => {
    artSound.playPop();
    openAccountManagerModal();
  });
  document.getElementById('closeAccountModalBtn').addEventListener('click', closeAccountManagerModal);
  document.getElementById('closeAccountFooterBtn').addEventListener('click', closeAccountManagerModal);
  document.getElementById('createAccountForm').addEventListener('submit', handleCreateAccountSubmit);

  // 6. Celebrate & Palette Logo
  document.getElementById('celebrateBtn').addEventListener('click', () => {
    artSound.playFanfare();
    confettiEngine.fire(90);
    showToast("🎉 ขอแสดงความยินดีกับผลงานสร้างสรรค์ยอดเยี่ยม!");
  });

  document.getElementById('logoInteractive').addEventListener('click', () => {
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
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeStudentDetailModal);
  document.getElementById('studentDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'studentDetailModal') closeStudentDetailModal();
  });

  // 9. Student Add/Edit Modal
  document.getElementById('addNewStudentBtn').addEventListener('click', () => {
    artSound.playPop();
    openStudentModal();
  });
  document.getElementById('closeModalBtn').addEventListener('click', closeStudentModal);
  document.getElementById('cancelModalBtn').addEventListener('click', closeStudentModal);
  document.getElementById('studentModal').addEventListener('click', (e) => {
    if (e.target.id === 'studentModal') closeStudentModal();
  });
  document.getElementById('studentForm').addEventListener('submit', handleStudentFormSubmit);

  // 10. Assignments Manager Modal
  document.getElementById('manageTasksBtn').addEventListener('click', () => {
    artSound.playPop();
    openTaskManagerModal();
  });
  document.getElementById('closeTaskManagerModalBtn').addEventListener('click', closeTaskManagerModal);
  document.getElementById('closeTaskManagerFooterBtn').addEventListener('click', closeTaskManagerModal);
  document.getElementById('taskManagerModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskManagerModal') closeTaskManagerModal();
  });

  document.getElementById('submitNewTaskBtn').addEventListener('click', () => {
    const title = document.getElementById('newTaskTitle').value;
    const maxScore = document.getElementById('newTaskMaxScore').value;
    addNewAssignment(title, maxScore);
    document.getElementById('newTaskTitle').value = '';
    document.getElementById('newTaskMaxScore').value = '20';
  });

  // 11. Room Configuration Modal
  document.getElementById('manageRoomsBtn').addEventListener('click', () => {
    artSound.playPop();
    openRoomConfigModal();
  });
  document.getElementById('closeRoomConfigModalBtn').addEventListener('click', closeRoomConfigModal);
  document.getElementById('closeRoomConfigFooterBtn').addEventListener('click', closeRoomConfigModal);
  document.getElementById('roomConfigModal').addEventListener('click', (e) => {
    if (e.target.id === 'roomConfigModal') closeRoomConfigModal();
  });

  document.getElementById('submitNewRoomBtn').addEventListener('click', () => {
    const gId = document.getElementById('configNewRoomGrade').value;
    const rName = document.getElementById('configNewRoomName').value;
    if (!rName.trim()) {
      alert("กรุณากรอกชื่อหรือหมายเลขห้อง");
      return;
    }
    addNewRoom(gId, rName);
    document.getElementById('configNewRoomName').value = '';
  });

  // 12. Import Modal
  document.getElementById('openImportBtn').addEventListener('click', () => {
    artSound.playPop();
    openImportModal();
  });
  document.getElementById('closeImportModalBtn').addEventListener('click', closeImportModal);
  document.getElementById('cancelImportBtn').addEventListener('click', closeImportModal);
  document.getElementById('importModal').addEventListener('click', (e) => {
    if (e.target.id === 'importModal') closeImportModal();
  });

  document.getElementById('downloadTemplateBtn').addEventListener('click', downloadTemplateCsv);

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

  document.getElementById('confirmImportBtn').addEventListener('click', confirmImport);

  // 13. Export Dropdown Menu
  const exportBtn = document.getElementById('exportDropdownBtn');
  const exportMenu = document.getElementById('exportMenu');

  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
  });

  document.getElementById('exportCurrentExcelBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentClass('xlsx');
  });

  document.getElementById('exportCurrentCsvBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportCurrentClass('csv');
  });

  document.getElementById('exportAllExcelBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportAllClasses('xlsx');
  });

  document.getElementById('exportAllCsvBtn').addEventListener('click', (e) => {
    e.preventDefault();
    exportAllClasses('csv');
  });

  // 14. Reset Data Button
  document.getElementById('resetSampleDataBtn').addEventListener('click', () => {
    if (confirm("คุณต้องการรีเซ็ตข้อมูลและห้องเรียนทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?")) {
      appData = JSON.parse(JSON.stringify(DEFAULT_STUDENTS_DATA));
      appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      saveDataToStorage();
      saveConfigToStorage();
      populateGradeDropdowns();
      artSound.playSaveChime();
      showToast("รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นเรียบร้อย!");
      renderTeacherView();
    }
  });

  // 15. Initial Render
  renderLeaderboardView();
  setTimeout(() => confettiEngine.fire(50), 400);
});
