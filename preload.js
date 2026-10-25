const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', Object.freeze({
  getDashboardData: () => ipcRenderer.invoke('dashboard:get'),
  getEducationalModules: () => ipcRenderer.invoke('modules:get'),
  getLearningContent: moduleId => ipcRenderer.invoke('lesson:get', moduleId),
  getQuestion: moduleId => ipcRenderer.invoke('question:get', moduleId),
  submitAnswer: (questionId, userAnswer) => ipcRenderer.invoke('answer:submit', questionId, userAnswer),
  getAnalytics: () => ipcRenderer.invoke('analytics:get'),
  getLeaderboard: () => ipcRenderer.invoke('leaderboard:get'),
  signPledge: () => ipcRenderer.invoke('pledge:sign')
}));
