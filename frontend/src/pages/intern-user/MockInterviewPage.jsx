import { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Chip, Grid, LinearProgress, Avatar, TextField } from '@mui/material';
import { SmartToy, Mic, Stop, Assignment, Assessment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { aiUtils } from '../../utils/aiUtils';

export default function MockInterviewPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your answer.");
      return;
    }
    
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setAnswerText(prev => (prev ? prev + " " + transcript : transcript));
        }
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      setRecognition(rec);
      setIsRecording(true);
      setAnswerText("");
    } catch (err) {
      console.error("Failed to start Speech Recognition:", err);
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const questions = [
    "Tell me about a challenging project you worked on and how you handled it.",
    "How do you prioritize tasks when you have multiple deadlines?",
    "Describe a time you had a disagreement with a team member. How did you resolve it?"
  ];

  const handleStart = () => {
    setSessionActive(true);
    setQuestionIndex(0);
  };

  const submitAnswer = async () => {
    if (isRecording) {
      stopSpeechRecognition();
    }
    if (!answerText.trim()) return;
    setIsEvaluating(true);
    try {
      const response = await aiUtils.chatResponse(`Evaluate this mock interview answer to "${questions[questionIndex]}": ${answerText}`);
      setAiFeedback(response);
    } catch (e) {
      console.error("AI Evaluation failed", e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setAiFeedback(null);
    setAnswerText("");
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(prev => prev + 1);
    } else {
      setSessionActive(false);
      alert("Interview Complete! Generating AI Feedback Report...");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>AI Mock Interview</Typography>
        <Typography variant="body2" color="text.secondary">
          Practice your interview skills with real-time AI feedback.
        </Typography>
      </Box>

      {!sessionActive ? (
        <Grid container spacing={3}>
          <Grid xs={12} md={8}>
            <Paper className="glass-card" sx={{ p: 4, textAlign: 'center' }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'var(--color-accent)', margin: '0 auto', mb: 2 }}>
                <SmartToy fontSize="large" />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Start a New Interview Session
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 500, margin: '0 auto 32px' }}>
                Select an interview type and duration. Our AI will analyze your responses for technical accuracy, confidence, and clarity.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
                <Chip label="Technical (React/Node)" variant="outlined" sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} />
                <Chip label="HR / Behavioral" variant="outlined" />
                <Chip label="Project Review" variant="outlined" />
              </Box>

              <Button 
                variant="contained" 
                size="large" 
                onClick={handleStart}
                sx={{ background: 'var(--gradient-primary)', px: 6, py: 1.5, borderRadius: 8 }}
              >
                Start Interview Now
              </Button>
            </Paper>
          </Grid>
          <Grid xs={12} md={4}>
            <Paper className="glass-card" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment sx={{ color: '#f59e0b' }} /> Past Performance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { date: 'Oct 12', score: 85, type: 'Technical' },
                  { date: 'Sep 28', score: 72, type: 'Behavioral' }
                ].map((r, i) => (
                  <Box key={i} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{r.type}</Typography>
                      <Typography variant="body2" color="primary.main" fontWeight={700}>{r.score}/100</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{r.date}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Paper className="glass-card" sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" fontWeight={700}>Question {questionIndex + 1} of {questions.length}</Typography>
            <Button color="error" onClick={() => setSessionActive(false)}>End Session</Button>
          </Box>
          
          <LinearProgress variant="determinate" value={((questionIndex) / questions.length) * 100} sx={{ mb: 4 }} />

          <Box sx={{ p: 4, bgcolor: 'rgba(0,188,212,0.05)', borderRadius: 3, border: '1px solid rgba(0,188,212,0.2)', mb: 4 }}>
            <Typography variant="h5" fontWeight={500} align="center">
              "{questions[questionIndex]}"
            </Typography>
          </Box>

          {!aiFeedback && (
            <Box sx={{ mb: 4 }}>
              <TextField 
                fullWidth 
                multiline 
                rows={4} 
                variant="outlined" 
                placeholder="Type your answer here, or click Start Recording..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {aiFeedback && (
            <Box sx={{ p: 3, mb: 4, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
              <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>AI Feedback & Evaluation</Typography>
              <Typography variant="body1">{aiFeedback}</Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, alignItems: 'center' }}>
            {!aiFeedback && (
              <>
                <Button 
                  variant={isRecording ? "contained" : "outlined"} 
                  color={isRecording ? "error" : "primary"}
                  startIcon={isRecording ? <Stop /> : <Mic />}
                  onClick={toggleRecording}
                  sx={{ borderRadius: 8, px: 4, py: 1.5 }}
                >
                  {isRecording ? "Stop Recording" : "Start Answering"}
                </Button>
                <Button 
                  variant="contained" 
                  onClick={submitAnswer}
                  disabled={!answerText.trim() || isEvaluating}
                  sx={{ background: 'var(--gradient-primary)', borderRadius: 8, px: 4, py: 1.5 }}
                >
                  {isEvaluating ? "Evaluating..." : "Submit Answer"}
                </Button>
              </>
            )}

            {aiFeedback && (
              <Button 
                variant="contained" 
                onClick={nextQuestion}
                sx={{ background: 'var(--gradient-primary)', borderRadius: 8, px: 4, py: 1.5 }}
              >
                {questionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
              </Button>
            )}
          </Box>
          
          {isRecording && !aiFeedback && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Typography color="error" fontWeight={600}>Recording...</Typography>
              </motion.div>
            </Box>
          )}
        </Paper>
      )}
    </motion.div>
  );
}
