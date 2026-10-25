const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Database = require('better-sqlite3');

let db;
const modules = [
  { id: 'substances', number: 1, title: 'Prohibited Substances', icon: '🧪', color: 'mint', description: 'Make safer choices about medicines and supplements.' },
  { id: 'testing', number: 2, title: 'The Doping Control Process', icon: '🧾', color: 'blue', description: 'Know what to expect during sample collection.' },
  { id: 'adrvs', number: 3, title: 'Anti-Doping Rule Violations', icon: '🛡️', color: 'peach', description: 'Recognize responsibilities and protect clean sport.' }
];

const lessons = {
  substances: {
    title: 'Choose with care', intro: 'Athletes are responsible for what enters their body. A product label or a teammate’s recommendation is not proof that a product is safe for sport.',
    points: ['Check medicines against your sport’s current rules with your National Anti-Doping Organization or team medical professional.', 'Supplements can carry contamination or inaccurate labels. There is no zero-risk guarantee.', 'Keep a record of medicines and supplements, including packaging and batch details.', 'If a medicine is medically necessary and prohibited, ask your medical team about the Therapeutic Use Exemption process before use when possible.'],
    steps: ['Pause before taking it', 'Check with a qualified professional', 'Keep the label and batch number'],
    quiz: 'supplement'
  },
  testing: {
    title: 'A clear process', intro: 'Doping control can happen in or out of competition. A trained collection officer explains the process and your rights and responsibilities.',
    points: ['Ask to see identification and listen to the notification instructions.', 'You may have a representative with you where the rules allow; tell the officer if you need one.', 'Follow instructions, disclose medications and supplements, and read the form carefully before signing.', 'If you have a concern, record it on the form and request your copy.'],
    steps: ['Notification', 'Sample collection', 'Review and record'],
    quiz: 'testing'
  },
  adrvs: {
    title: 'Clean sport is a team effort', intro: 'Anti-doping rules protect fair competition and athlete health. Rules apply to athletes and, in many cases, their support personnel.',
    points: ['Examples of violations include presence or use of a prohibited substance, evading or refusing a test, and tampering with a sample process.', 'Athletes have a personal responsibility to know and follow applicable anti-doping rules.', 'Never pressure another athlete to take a product or interfere with testing.', 'Ask your NADO or federation for guidance; rules and consequences depend on the facts and current regulations.'],
    steps: ['Know the rules', 'Speak up safely', 'Support fair play'],
    quiz: 'adrv'
  }
};

const questions = {
  supplement: { id: 'supplement', moduleId: 'substances', prompt: 'A teammate offers you a pre-workout supplement. What is the best first step?', options: ['Take a small amount to see how it feels', 'Pause and check it with a qualified sports medical professional', 'Trust the label if it says “natural”'], answer: 1, explanation: 'Pause and ask a qualified professional. Product labels and recommendations cannot guarantee a supplement is safe for sport.' },
  testing: { id: 'testing', moduleId: 'testing', prompt: 'An officer notifies you for a doping control test. What should you do?', options: ['Ask to see their identification and follow the notification instructions', 'Leave and return after practice', 'Sign the form without reading it'], answer: 0, explanation: 'Ask to see identification, follow the instructions, and read the form carefully. If you have a concern, note it on the form.' },
  adrv: { id: 'adrv', moduleId: 'adrvs', prompt: 'You notice a teammate being pressured to take an unknown product. What is a responsible response?', options: ['Tell them to try it once', 'Encourage them to pause and consult their medical team', 'Post the situation publicly'], answer: 1, explanation: 'Encourage a pause and a confidential conversation with qualified support. Protecting athlete health and clean sport starts with informed choices.' }
};

function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'data.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1), xp INTEGER NOT NULL DEFAULT 0,
      health INTEGER NOT NULL DEFAULT 5, streak INTEGER NOT NULL DEFAULT 1,
      last_seen TEXT NOT NULL DEFAULT '', pledge INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO profile (id) VALUES (1);
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, question_id TEXT NOT NULL,
      correct INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS completions (
      module_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS badges (badge_id TEXT PRIMARY KEY, earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
  `);
}

const profile = () => db.prepare('SELECT * FROM profile WHERE id = 1').get();
const badgeLabels = { pledge: 'Clean Sport Pledge', testing: 'Testing Pro', scholar: 'Clean Sport Scholar' };
function awardBadge(id) {
  const exists = db.prepare('SELECT 1 FROM badges WHERE badge_id = ?').get(id);
  if (!exists) db.prepare('INSERT INTO badges (badge_id) VALUES (?)').run(id);
  return exists ? null : badgeLabels[id];
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000, height: 750, minWidth: 1000, maxWidth: 1000,
    minHeight: 750, maxHeight: 750, resizable: false,
    title: 'Clean Sport Quest', backgroundColor: '#f7f8f5',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  if (!app.isPackaged) win.loadURL('http://127.0.0.1:5173');
  else win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

ipcMain.handle('dashboard:get', () => {
  const p = profile();
  const badgeRows = db.prepare('SELECT badge_id FROM badges').all();
  return { name: 'Athlete', level: Math.floor(p.xp / 100) + 1, xp: p.xp, nextLevelXp: (Math.floor(p.xp / 100) + 1) * 100, streak: p.streak, health: p.health, badges: badgeRows.map(b => badgeLabels[b.badge_id]), modules: modules.map(m => ({ ...m, completed: !!db.prepare('SELECT 1 FROM completions WHERE module_id = ?').get(m.id) })) };
});
ipcMain.handle('modules:get', () => modules.map(m => ({ ...m, completed: !!db.prepare('SELECT 1 FROM completions WHERE module_id = ?').get(m.id) })));
ipcMain.handle('lesson:get', (_event, moduleId) => lessons[moduleId] || null);
ipcMain.handle('question:get', (_event, moduleId) => {
  const lesson = lessons[moduleId];
  return lesson ? questions[lesson.quiz] : null;
});
ipcMain.handle('answer:submit', (_event, questionId, userAnswer) => {
  const q = questions[questionId];
  if (!q || !Number.isInteger(userAnswer) || userAnswer < 0 || userAnswer >= q.options.length) throw new Error('Invalid answer');
  const correct = userAnswer === q.answer;
  const p = profile();
  let health = p.health;
  let newXp = p.xp;
  let badge = null;
  db.prepare('INSERT INTO answers (question_id, correct) VALUES (?, ?)').run(q.id, Number(correct));
  if (correct) {
    newXp += 20;
    db.prepare('INSERT OR IGNORE INTO completions (module_id) VALUES (?)').run(q.moduleId);
    if (q.moduleId === 'substances') badge = awardBadge('pledge');
    if (q.moduleId === 'testing') badge = awardBadge('testing');
    const correctCount = db.prepare('SELECT COUNT(*) AS count FROM answers WHERE correct = 1').get().count;
    if (correctCount >= 3) badge = awardBadge('scholar') || badge;
  } else health = Math.max(0, health - 1);
  db.prepare('UPDATE profile SET xp = ?, health = ? WHERE id = 1').run(newXp, health);
  return { correct, detailed_feedback: q.explanation, new_xp: newXp, new_health: health, badge_unlocked: badge };
});
ipcMain.handle('analytics:get', () => {
  const total = db.prepare('SELECT COUNT(*) AS count FROM answers').get().count;
  const correct = db.prepare('SELECT COUNT(*) AS count FROM answers WHERE correct = 1').get().count;
  return { accuracy: total ? Math.round((correct / total) * 100) : 0, attempts: total, modules: modules.map(m => ({ id: m.id, title: m.title, completion: db.prepare('SELECT COUNT(*) AS count FROM completions WHERE module_id = ?').get(m.id).count ? 100 : 0 })) };
});
ipcMain.handle('leaderboard:get', () => {
  const yours = profile().xp;
  return [
    { name: 'Aarav', points: Math.max(180, yours + 80), initials: 'A', color: 'orange' },
    { name: 'Meera', points: Math.max(140, yours + 35), initials: 'M', color: 'purple' },
    { name: 'You', points: yours, initials: 'Y', color: 'green', current: true },
    { name: 'Kabir', points: Math.max(60, yours - 20), initials: 'K', color: 'blue' }
  ].sort((a, b) => b.points - a.points);
});
ipcMain.handle('pledge:sign', () => {
  db.prepare('UPDATE profile SET pledge = 1 WHERE id = 1').run();
  const badge = awardBadge('pledge');
  return { success: true, badge_unlocked: badge };
});

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (db) db.close(); if (process.platform !== 'darwin') app.quit(); });
