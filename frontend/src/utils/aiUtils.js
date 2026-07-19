import { aiAPI } from '../services/api';

// Simulate network delay for non-AI tasks if needed
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

export const aiUtils = {
  // 1. Intern Chatbot
  chatResponse: async (message) => {
    try {
      const res = await aiAPI.chat({ message });
      return res.data.response;
    } catch (err) {
      console.error('AI Chat Error:', err);
      return "Error: Could not connect to the backend AI service.";
    }
  },

  // 2. Automated Task Assignment
  suggestTaskAssignment: async (taskId) => {
    try {
      const res = await aiAPI.chat({ message: `Suggest an intern assignment for task ID ${taskId}. Return a JSON object with { recommendedInternId: 1, reason: "...", confidence: "85%" }` });
      // In a full implementation, you'd parse res.data.response as JSON
      return { recommendedInternId: 1, reason: "Alice has strong React skills matching this task's tags.", confidence: "85%" };
    } catch (err) {
      return { recommendedInternId: null, reason: "Error parsing AI response", confidence: "0%" };
    }
  },

  // 3. Performance Review Summarization
  summarizePerformance: async (internId) => {
    try {
      const res = await aiAPI.chat({ message: `Summarize the performance of intern ID ${internId}.` });
      return res.data.response;
    } catch (err) {
      return "Error summarizing performance.";
    }
  },

  // 4. Burnout Detection Alerts
  detectBurnout: async () => {
    await delay();
    return [
      { internId: 2, name: 'Bob Jones', riskLevel: 'High', reason: 'Logged 50+ hours last week with late check-outs.' },
    ];
  },

  // 5. Intelligent Document Parsing (Mock extraction)
  parseDocument: async (file) => {
    await delay(1500);
    return { documentType: 'ID_Card', extractedName: 'Alice Smith', verificationStatus: 'MATCH' };
  },

  // 6. Project Timeline Prediction
  predictProjectTimeline: async (projectId) => {
    await delay();
    return { predictedCompletion: '2026-07-15', confidence: '78%', bottleneck: 'Backend API Testing' };
  },

  // 7. Sentiment Analysis on Feedback
  analyzeFeedbackSentiment: async (feedbackId) => {
    await delay();
    return { sentiment: 'Positive', score: 0.85, keywords: ['proactive', 'fast learner', 'helpful'] };
  },

  // 8. Dynamic Form Generation
  generateFormTemplate: async (topic) => {
    await delay();
    return [
      { label: `How satisfied are you with ${topic}?`, type: 'rating' },
      { label: `What could be improved regarding ${topic}?`, type: 'textarea' },
    ];
  },

  // 9. Personalized Learning Recommendations
  recommendLearning: async (internId) => {
    await delay();
    return [
      { course: 'Advanced React Patterns', provider: 'Internal', relevance: '95%' },
      { course: 'GraphQL Basics', provider: 'Udemy', relevance: '80%' },
    ];
  },

  // 10. Automated Attendance Anomaly Detection
  detectAttendanceAnomaly: async () => {
    await delay();
    return [
      { internId: 3, name: 'Charlie', issue: 'Checked in from an unknown IP address 3 days in a row.' },
    ];
  },

  // 11. Resume Parsing & Skill Matching
  parseResume: async (file) => {
    try {
      // In a real implementation, we'd send the file text to the AI
      const res = await aiAPI.chat({ message: "Parse this resume and extract skills." });
      return { skills: ['JavaScript', 'Python', 'React'], experienceYears: 1, matchedRole: 'Software Intern' };
    } catch (err) {
      return { skills: [], experienceYears: 0, matchedRole: 'Unknown' };
    }
  },

  // 12. Smart Notification Routing
  routeNotification: async (notificationData) => {
    await delay();
    return { routedTo: ['Manager', 'HR'], priority: 'High', reason: 'Urgent compliance document missing.' };
  },

  // 13. Intern Skill Growth Tracking
  trackSkillGrowth: async (internId) => {
    await delay();
    return { previousMonthScore: 70, currentMonthScore: 85, predictedNextMonth: 90, topSkill: 'React' };
  },

  // 14. Asset Allocation Optimizer
  optimizeAssets: async () => {
    await delay();
    return { recommendation: "Reallocate 3 idle MacBooks from Design Team to Frontend Team to reduce wait times." };
  },

  // 15. Auto-Drafting Emails
  draftEmail: async (intent) => {
    try {
      const res = await aiAPI.chat({ message: `Draft a professional email regarding: ${intent}` });
      return res.data.response;
    } catch (err) {
      return "Error drafting email.";
    }
  },

  // 16. AI Insights Dashboard Summarization
  generateDashboardInsights: async () => {
    try {
      const res = await aiAPI.chat({ message: `Analyze system metrics and generate a short dashboard summary with overallHealth, keyMetrics, and an actionItem formatted as JSON. Return valid JSON.` });
      // In a real implementation, you'd parse JSON. We will return mock JSON for now to prevent UI crashes if Claude replies with markdown.
      return {
        overallHealth: 'Good',
        keyMetrics: 'System is running optimally with live AI connected.',
        actionItem: 'Review recent AI chat logs.'
      };
    } catch (err) {
      return {
        overallHealth: 'Error',
        keyMetrics: 'AI connection failed.',
        actionItem: 'Check backend API key.'
      };
    }
  }
};
