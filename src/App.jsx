import React, { useEffect, useState } from 'react';
import { browserApi } from './browserApi';
import logo from './logo.svg';

const api = window.api || browserApi;

const nav = [
  ['home', '⌂', 'Home'], ['learn', '▤', 'Learn'], ['analytics', '▥', 'Progress'], ['leaderboard', '♛', 'Leaderboard']
];

function App() {
  const [page, setPage] = useState('home');
  const [dashboard, setDashboard] = useState(null);
  const [modules, setModules] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  async function refresh() {
    const [d, m, a, l] = await Promise.all([api.getDashboardData(), api.getEducationalModules(), api.getAnalytics(), api.getLeaderboard()]);
    setDashboard(d); setModules(m); setAnalytics(a); setLeaders(l);
  }
  useEffect(() => { refresh().catch(() => setToast('Could not load local profile. Restart the app to try again.')); }, []);

  function notify(message) { setToast(message); window.setTimeout(() => setToast(''), 3000); }
  function go(target) { setPage(target); setLesson(null); setActiveModule(null); setQuestion(null); setResult(null); setSelected(null); }
  async function openLesson(module) {
    setActiveModule(module);
    setLesson(await api.getLearningContent(module.id));
    setPage('lesson');
  }
  async function beginQuiz(moduleId = activeModule?.id) {
    const q = await api.getQuestion(moduleId);
    setQuestion(q); setSelected(null); setResult(null); setPage('quiz');
  }
  async function submit() {
    if (selected === null || !question) return;
    setBusy(true);
    try {
      const response = await api.submitAnswer(question.id, selected);
      setResult(response);
      await refresh();
      if (response.badge_unlocked) notify(`Badge unlocked: ${response.badge_unlocked}`);
    } catch { notify('Could not save your answer. Try again.'); }
    finally { setBusy(false); }
  }
  async function pledge() {
    const response = await api.signPledge();
    await refresh();
    if (response.badge_unlocked) notify(`Badge unlocked: ${response.badge_unlocked}`);
    else notify('Your clean sport pledge is saved.');
  }

  if (!dashboard) return <div className="loading"><img className="logo-mark" src={logo} alt=""/><b>Getting your game ready…</b></div>;
  const completed = modules.filter(m => m.completed).length;
  const progress = Math.round(completed / Math.max(1, modules.length) * 100);
  const heading = ({ home: 'Your clean sport journey', learn: 'Learning paths', lesson: activeModule?.title || 'Lesson', quiz: 'Quick challenge', analytics: 'Your progress', leaderboard: 'Leaderboard' })[page];

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><img className="brand-icon" src={logo} alt=""/><div><strong>clean sport</strong><small>QUEST</small></div></div>
      <div className="nav-label">YOUR SPACE</div>
      <nav aria-label="Main navigation">{nav.map(([id, icon, label]) => <button key={id} aria-current={page === id || (id === 'learn' && ['lesson', 'quiz'].includes(page)) ? 'page' : undefined} className={`nav-item ${page === id || (id === 'learn' && ['lesson', 'quiz'].includes(page)) ? 'selected' : ''}`} onClick={() => go(id)}><span className="nav-icon" aria-hidden="true">{icon}</span>{label}{id === 'learn' && <span className="nav-chevron" aria-hidden="true">›</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="pledge-mini"><div className="pledge-star">✦</div><b>Play fair. Be proud.</b><p>Small choices make a big difference.</p><button onClick={pledge}>Take the pledge</button></div>
        <div className="version">NADA · CLEAN SPORT LEARNING</div>
      </div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">ATHLETE LEARNING HUB</div><h1>{heading}</h1></div><div className="stats"><div className="stat-pill streak"><span>🔥</span><b>{dashboard.streak}</b><small>DAY STREAK</small></div><div className="stat-pill heart"><span>♥</span><b>{dashboard.health}</b><small>ENERGY</small></div><div className="stat-pill xp"><span>✦</span><b>{dashboard.xp}</b><small>XP</small></div><div className="avatar">A</div></div></header>

      {page === 'home' && <div className="content dashboard-page">
        <section className="hero-card"><div className="hero-copy"><span className="tag tag-light">YOUR NEXT QUEST</span><h2>Build your clean sport<br/>superpowers.</h2><p>Learn the rules, make confident choices, and help keep sport fair for everyone.</p><button className="btn white-btn" onClick={() => go('learn')}>Continue learning <span>→</span></button><div className="hero-note">✦ &nbsp;Curious athletes make strong choices</div></div><div className="hero-art"><div className="sun"></div><div className="hill hill-back"></div><div className="hill hill-front"></div><div className="shield">✓</div><div className="spark spark-one">✦</div><div className="spark spark-two">✧</div></div></section>
        <div className="section-heading"><div><h2>Your learning map</h2><p>Three short paths. A lifetime of good decisions.</p></div><button className="text-link" onClick={() => go('learn')}>See all paths <span>→</span></button></div>
        <div className="module-grid">{modules.map((m, i) => <button key={m.id} className={`module-card ${m.color}`} onClick={() => openLesson(m)}><div className="module-top"><span className="module-icon">{m.icon}</span><span className="module-number">0{i + 1} / 03</span></div><h3>{m.title}</h3><p>{m.description}</p><div className="module-footer"><span className={m.completed ? 'complete-label' : ''}>{m.completed ? '✓ Completed' : 'Start path'}</span><span className="circle-arrow">→</span></div></button>)}</div>
        <div className="bottom-grid"><section className="progress-card"><div className="card-title"><div><h3>Quest progress</h3><p>Every step counts</p></div><span className="progress-percent">{progress}%</span></div><div className="progress-track"><div style={{ width: `${progress}%` }} /></div><div className="progress-foot"><span>{completed} of 3 paths completed</span><button className="text-link" onClick={() => go('analytics')}>View details →</button></div></section><section className="badge-card"><div className="badge-medal">🏅</div><div><h3>Your badges</h3><p>{dashboard.badges.length ? dashboard.badges.join(' · ') : 'Complete a quest to earn your first badge.'}</p></div><button className="badge-arrow" onClick={() => go('learn')}>→</button></section></div>
        <div className="source-note">Learning aid only. Check current NADA/WADA guidance and ask your qualified medical team about individual decisions.</div>
      </div>}

      {page === 'learn' && <div className="content learn-page"><div className="welcome-strip"><div><span className="tag">YOUR LEARNING MAP</span><h2>Pick a path and grow your game.</h2><p>Short, practical lessons made for athletes.</p></div><div className="map-illustration">🧭</div></div><div className="module-list">{modules.map((m, i) => <article key={m.id} className={`path-row ${m.color}`}><div className="path-index">0{i + 1}</div><div className="path-icon">{m.icon}</div><div className="path-details"><span className="path-kicker">PATH {i + 1} · 4 MIN</span><h3>{m.title}</h3><p>{m.description}</p></div><div className="path-end">{m.completed && <span className="done-pill">✓ DONE</span>}<button className="btn green-btn" onClick={() => openLesson(m)}>{m.completed ? 'Review' : 'Start'} <span>→</span></button></div></article>)}</div><div className="callout"><span>💡</span><p><b>Real-world tip</b> &nbsp;When in doubt, pause and ask your NADO, federation, or sports medical team.</p></div></div>}

      {page === 'lesson' && lesson && <div className="content lesson-page"><button className="back-link" onClick={() => go('learn')}>← All learning paths</button><div className="lesson-banner"><span className="lesson-emoji">{activeModule?.icon}</span><div><span className="tag">PATH {activeModule?.number} · QUICK LESSON</span><h2>{lesson.title}</h2></div></div><section className="lesson-intro"><span className="intro-icon">✦</span><p>{lesson.intro}</p></section><h3 className="lesson-subhead">The essentials</h3><div className="essentials">{lesson.points.map((point, i) => <div className="essential" key={point}><span className="essential-check">{['✓', '!', '↗', '✦'][i]}</span><p>{point}</p></div>)}</div><div className="process-card"><h3>Remember your three steps</h3><div className="step-flow">{lesson.steps.map((step, i) => <div className="step" key={step}><span>{i + 1}</span><b>{step}</b>{i < lesson.steps.length - 1 && <i>→</i>}</div>)}</div></div><div className="lesson-actions"><div><b>Ready to try a scenario?</b><small>One quick question · earn 20 XP</small></div><button className="btn green-btn" onClick={() => beginQuiz()}>Take the challenge <span>→</span></button></div><div className="source-note">Educational overview, not medical or legal advice. Rules change; verify current guidance with NADA/WADA.</div></div>}

      {page === 'quiz' && question && <div className="content quiz-page"><button className="back-link" onClick={() => activeModule ? openLesson(activeModule) : go('learn')}>← Back to lesson</button><div className="quiz-progress"><span></span><span></span><span></span><small>CHALLENGE 1 OF 1</small></div><div className="question-wrap"><div className="question-label"><span className="question-star" aria-hidden="true">✦</span><span>WHAT WOULD YOU DO?</span></div><h2>{question.prompt}</h2><div className="answer-list">{question.options.map((option, i) => <button key={option} disabled={!!result} className={`answer-option ${selected === i ? 'active' : ''} ${result && i === result.correct_answer ? 'answer-correct' : ''} ${result && i === selected && !result.correct ? 'answer-wrong' : ''}`} onClick={() => setSelected(i)}><span className="answer-letter">{String.fromCharCode(65 + i)}</span><span>{option}</span>{result && i === result.correct_answer && <b aria-label="Correct answer">✓</b>}{result && i === selected && !result.correct && <b aria-label="Your answer">×</b>}</button>)}</div>{result && <div className={`feedback ${result.correct ? 'good' : 'try-again'}`}><b>{result.correct ? 'That’s a strong choice!' : 'Good moment to learn.'}</b><p>{result.detailed_feedback}</p><div>{result.xp_awarded ? `+${result.xp_awarded} XP ✦` : result.correct ? 'Path reward already earned ✦' : '−1 energy ♥'}</div></div>}<div className="quiz-footer">{result ? <button className="btn green-btn" onClick={() => go('learn')}>Back to learning <span>→</span></button> : <button className="btn green-btn" disabled={selected === null || busy} onClick={submit}>{busy ? 'Saving…' : 'Check answer'} <span>→</span></button>}</div></div></div>}

      {page === 'analytics' && analytics && <div className="content analytics-page"><div className="welcome-strip compact"><div><span className="tag">YOUR SNAPSHOT</span><h2>Look how far you’ve come.</h2><p>Learning grows one good choice at a time.</p></div><div className="map-illustration">📈</div></div><div className="metric-row"><div className="metric-card"><span className="metric-icon mint-icon">✦</span><small>TOTAL EXPERIENCE</small><strong>{dashboard.xp} <em>XP</em></strong><p>Level {dashboard.level} athlete</p></div><div className="metric-card"><span className="metric-icon peach-icon">✓</span><small>QUIZ ACCURACY</small><strong>{analytics.accuracy}<em>%</em></strong><p>Across {analytics.attempts} answers</p></div><div className="metric-card"><span className="metric-icon blue-icon">▤</span><small>PATHS COMPLETED</small><strong>{completed}<em>/ 3</em></strong><p>Keep building your knowledge</p></div></div><section className="chart-card"><div className="card-title"><div><h3>Learning path completion</h3><p>Finish each path to unlock its badge</p></div><span className="chart-legend"><i></i> COMPLETE</span></div><div className="bar-list">{analytics.modules.map(m => <div className="bar-row" key={m.id}><span>{m.title}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${m.completion}%` }} /></div><b>{m.completion}%</b></div>)}</div></section><div className="analytics-foot">Your progress is stored locally on this Mac. It is not sent to a server.</div></div>}

      {page === 'leaderboard' && <div className="content leaderboard-page"><div className="leader-hero"><div><span className="tag tag-light">THIS WEEK · PRACTICE BOARD</span><h2>Good sport looks<br/>good on everyone.</h2><p>Keep learning. Your points are saved on this device.</p></div><div className="trophy">🏆</div></div><section className="leader-card"><div className="leader-heading"><div><h3>Friendly leaderboard</h3><p>Sample athletes · local demo</p></div><span className="week-pill">WEEK 43</span></div><div className="leaders">{leaders.map((user, i) => <div className={`leader-row ${user.current ? 'you-row' : ''}`} key={user.name}><span className={`rank rank-${i + 1}`}>{i === 0 ? '♛' : String(i + 1).padStart(2, '0')}</span><span className={`leader-avatar ${user.color}`}>{user.initials}</span><span className="leader-name">{user.name}{user.current && <small>THAT’S YOU</small>}</span><span className="leader-points">✦ &nbsp;{user.points} <small>XP</small></span></div>)}</div><div className="leader-foot">Mock leaderboard for demonstration. Social competition can be added with an account-backed service.</div></section><div className="callout"><span>🌱</span><p><b>Celebrate progress</b> &nbsp;The best win is a fair one. Invite a teammate to learn with you.</p></div></div>}
    </main>
    {toast && <div className="toast">✦ &nbsp;{toast}</div>}
  </div>;
}

export default App;
