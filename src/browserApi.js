const modules = [
  { id: 'substances', number: 1, title: 'Prohibited Substances', icon: '🧪', color: 'mint', description: 'Make safer choices about medicines and supplements.' },
  { id: 'testing', number: 2, title: 'The Doping Control Process', icon: '🧾', color: 'blue', description: 'Know what to expect during sample collection.' },
  { id: 'adrvs', number: 3, title: 'Anti-Doping Rule Violations', icon: '🛡️', color: 'peach', description: 'Recognize responsibilities and protect clean sport.' }
];

const lessons = {
  substances: { title: 'Choose with care', intro: 'Athletes are responsible for what enters their body. A product label or a teammate’s recommendation is not proof that a product is safe for sport.', points: ['Check medicines against your sport’s current rules with your National Anti-Doping Organization or team medical professional.', 'Supplements can carry contamination or inaccurate labels. There is no zero-risk guarantee.', 'Keep a record of medicines and supplements, including packaging and batch details.', 'If a medicine is medically necessary and prohibited, ask your medical team about the Therapeutic Use Exemption process before use when possible.'], steps: ['Pause before taking it', 'Check with a qualified professional', 'Keep the label and batch number'], quiz: 'supplement' },
  testing: { title: 'A clear process', intro: 'Doping control can happen in or out of competition. A trained collection officer explains the process and your rights and responsibilities.', points: ['Ask to see identification and listen to the notification instructions.', 'You may have a representative with you where the rules allow; tell the officer if you need one.', 'Follow instructions, disclose medications and supplements, and read the form carefully before signing.', 'If you have a concern, record it on the form and request your copy.'], steps: ['Notification', 'Sample collection', 'Review and record'], quiz: 'testing' },
  adrvs: { title: 'Clean sport is a team effort', intro: 'Anti-doping rules protect fair competition and athlete health. Rules apply to athletes and, in many cases, their support personnel.', points: ['Examples of violations include presence or use of a prohibited substance, evading or refusing a test, and tampering with a sample process.', 'Athletes have a personal responsibility to know and follow applicable anti-doping rules.', 'Never pressure another athlete to take a product or interfere with testing.', 'Ask your NADO or federation for guidance; rules and consequences depend on the facts and current regulations.'], steps: ['Know the rules', 'Speak up safely', 'Support fair play'], quiz: 'adrv' }
};

const questions = {
  supplement: { id: 'supplement', moduleId: 'substances', prompt: 'A teammate offers you a pre-workout supplement. What is the best first step?', options: ['Take a small amount to see how it feels', 'Pause and check it with a qualified sports medical professional', 'Trust the label if it says “natural”'], answer: 1, explanation: 'Pause and ask a qualified professional. Product labels and recommendations cannot guarantee a supplement is safe for sport.' },
  testing: { id: 'testing', moduleId: 'testing', prompt: 'An officer notifies you for a doping control test. What should you do?', options: ['Ask to see their identification and follow the notification instructions', 'Leave and return after practice', 'Sign the form without reading it'], answer: 0, explanation: 'Ask to see identification, follow the instructions, and read the form carefully. If you have a concern, note it on the form.' },
  adrv: { id: 'adrv', moduleId: 'adrvs', prompt: 'You notice a teammate being pressured to take an unknown product. What is a responsible response?', options: ['Tell them to try it once', 'Encourage them to pause and consult their medical team', 'Post the situation publicly'], answer: 1, explanation: 'Encourage a pause and a confidential conversation with qualified support. Protecting athlete health and clean sport starts with informed choices.' }
};

const badgeLabels = { pledge: 'Clean Sport Pledge', testing: 'Testing Pro', scholar: 'Clean Sport Scholar' };
const key = 'clean-sport-quest-v1';
function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    return { xp: 0, health: 5, streak: 1, lastSeen: '', pledge: false, answers: [], completions: [], badges: [], ...saved };
  } catch {
    return { xp: 0, health: 5, streak: 1, lastSeen: '', pledge: false, answers: [], completions: [], badges: [] };
  }
}
function write(state) { localStorage.setItem(key, JSON.stringify(state)); return state; }
function todayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function touchDay(state) {
  const today = todayKey();
  if (state.lastSeen !== today) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    state.streak = state.lastSeen === todayKey(yesterday) ? state.streak + 1 : 1;
    state.lastSeen = today;
    write(state);
  }
  return state;
}
function award(state, id) {
  if (state.badges.includes(id)) return null;
  state.badges.push(id);
  return badgeLabels[id];
}
function withCompletion() { const s = read(); return modules.map(m => ({ ...m, completed: s.completions.includes(m.id) })); }

export const browserApi = {
  async getDashboardData() {
    const s = touchDay(read());
    return { name: 'Athlete', level: Math.floor(s.xp / 100) + 1, xp: s.xp, nextLevelXp: (Math.floor(s.xp / 100) + 1) * 100, streak: s.streak, health: s.health, badges: s.badges.map(id => badgeLabels[id]), modules: withCompletion() };
  },
  async getEducationalModules() { return withCompletion(); },
  async getLearningContent(moduleId) { return lessons[moduleId] || null; },
  async getQuestion(moduleId) { const lesson = lessons[moduleId]; return lesson ? questions[lesson.quiz] : null; },
  async submitAnswer(questionId, userAnswer) {
    const q = questions[questionId];
    if (!q || !Number.isInteger(userAnswer) || userAnswer < 0 || userAnswer >= q.options.length) throw new Error('Invalid answer');
    const state = read();
    const correct = userAnswer === q.answer;
    let badge = null;
    let xpAwarded = 0;
    state.answers.push({ questionId, correct });
    if (correct) {
      if (!state.completions.includes(q.moduleId)) {
        state.completions.push(q.moduleId);
        state.xp += 20;
        xpAwarded = 20;
        if (q.moduleId === 'substances') badge = award(state, 'pledge');
        if (q.moduleId === 'testing') badge = award(state, 'testing');
        if (state.completions.length >= modules.length) badge = award(state, 'scholar') || badge;
      }
    } else state.health = Math.max(0, state.health - 1);
    write(state);
    return { correct, correct_answer: q.answer, xp_awarded: xpAwarded, detailed_feedback: q.explanation, new_xp: state.xp, new_health: state.health, badge_unlocked: badge };
  },
  async getAnalytics() {
    const s = read();
    const correct = s.answers.filter(a => a.correct).length;
    return { accuracy: s.answers.length ? Math.round(correct / s.answers.length * 100) : 0, attempts: s.answers.length, modules: modules.map(m => ({ id: m.id, title: m.title, completion: s.completions.includes(m.id) ? 100 : 0 })) };
  },
  async getLeaderboard() {
    const yours = read().xp;
    return [
      { name: 'Aarav', points: Math.max(180, yours + 80), initials: 'A', color: 'orange' },
      { name: 'Meera', points: Math.max(140, yours + 35), initials: 'M', color: 'purple' },
      { name: 'You', points: yours, initials: 'Y', color: 'green', current: true },
      { name: 'Kabir', points: Math.max(60, yours - 20), initials: 'K', color: 'blue' }
    ].sort((a, b) => b.points - a.points);
  },
  async signPledge() {
    const s = read();
    s.pledge = true;
    const badge = award(s, 'pledge');
    write(s);
    return { success: true, badge_unlocked: badge };
  }
};
