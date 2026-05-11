import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, PlayCircle, RefreshCw, ChevronRight, Clock, Target } from 'lucide-react';
import { getQuiz } from '../api/client';

export default function QuizPanel({ videoId, onTimestampClick, isProcessing = false }) {
  const [quizData, setQuizData] = useState(null);
  const [activeQuizData, setActiveQuizData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [failedTopics, setFailedTopics] = useState(new Set());
  
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);

  const generateQuiz = async () => {
    if (!videoId) return;
    setLoading(true);
    setError('');
    setQuizData(null);
    setActiveQuizData(null);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
    setFailedTopics(new Set());

    try {
      const data = await getQuiz(videoId);
      if (data && data.quiz) {
        setQuizData(data.quiz);
        setActiveQuizData(data.quiz);
      } else {
        setError('Received invalid quiz data from server.');
      }
    } catch (err) {
      let errorMsg = err.message || 'Failed to generate quiz.';
      if (isProcessing) {
        errorMsg = 'Transcript is still being processed. Please wait a moment...';
      } else if (errorMsg.toLowerCase().includes('quota') || errorMsg.includes('429')) {
        errorMsg = 'Gemini API quota exceeded. Please try again later or check your API keys.';
      } else if (errorMsg.length > 150) {
        errorMsg = 'An error occurred while generating the quiz. Please try again.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizFinished || !activeQuizData) return;
    if (selectedOption !== null) {
      clearInterval(timerRef.current);
      return;
    }
    
    setTimeLeft(30);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerRef.current);
  }, [currentQuestionIndex, selectedOption, quizFinished, activeQuizData]);

  const handleTimeOut = () => {
    setSelectedOption('__TIMEOUT__');
    const currentQ = activeQuizData[currentQuestionIndex];
    if (currentQ.topic) {
      setFailedTopics(prev => new Set([...prev, currentQ.topic]));
    }
  };

  const handleOptionClick = (option) => {
    if (selectedOption !== null) return; // Already answered
    setSelectedOption(option);
    
    const currentQ = activeQuizData[currentQuestionIndex];
    if (option === currentQ.correctAnswer) {
      setScore(s => s + 1);
    } else {
      if (currentQ.topic) {
        setFailedTopics(prev => new Set([...prev, currentQ.topic]));
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuizData.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRetryWeak = () => {
    const weakQuestions = quizData.filter(q => failedTopics.has(q.topic));
    setActiveQuizData(weakQuestions);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizFinished(false);
    setFailedTopics(new Set());
  };

  const parseTimestamp = (ts) => {
    if (!ts) return null;
    const parts = ts.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem' }}>
        <Loader2 size={32} className="animate-spin text-primary" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Generating comprehensive quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <XCircle size={32} color="var(--danger)" />
        <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>
        <button onClick={generateQuiz} style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '999px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>Try Again</button>
      </div>
    );
  }

  if (quizFinished) {
    const failedArray = Array.from(failedTopics);
    return (
      <div className="glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0, fontFamily: 'Literata, serif' }}>Final Scorecard</h2>
        <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          You scored <strong style={{ color: score === activeQuizData.length ? 'var(--success, #22c55e)' : 'inherit' }}>{score}</strong> out of {activeQuizData.length}!
        </div>
        
        {failedArray.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1.5rem', borderRadius: '1rem', width: '100%', maxWidth: '600px', marginTop: '1rem' }}>
            <h4 style={{ color: '#ef4444', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Target size={18} /> Weak Topic Detection
            </h4>
            <p style={{ color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
              You struggled with: <strong>{failedArray.join(', ')}</strong>
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={generateQuiz}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--primary)', 
              border: '2px solid var(--primary)', borderRadius: '999px',
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RefreshCw size={18} /> Retake Full Quiz
          </button>

          {failedArray.length > 0 && (
            <button 
              onClick={handleRetryWeak}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff', 
                border: 'none', borderRadius: '999px',
                fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Target size={18} /> Retry Weak Topics
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!activeQuizData) {
    return (
      <div className="glass-panel fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', gap: '1rem', textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Ready to test your knowledge?</h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0, marginBottom: '1rem' }}>Generate a 10-question AI-powered quiz based on this content.</p>
        <button 
          onClick={generateQuiz}
          disabled={!videoId}
          style={{
            padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '999px',
            fontSize: '1rem', fontWeight: 600, cursor: videoId ? 'pointer' : 'not-allowed', opacity: videoId ? 1 : 0.6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          Test Your Knowledge
        </button>
      </div>
    );
  }

  const currentQ = activeQuizData[currentQuestionIndex];
  const isAnswered = selectedOption !== null;

  return (
    <div className="glass-panel fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>Question {currentQuestionIndex + 1} of {activeQuizData.length}</span>
        
        <span style={{ 
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          color: timeLeft <= 5 && !isAnswered ? '#ef4444' : 'inherit',
          animation: timeLeft <= 5 && !isAnswered ? 'pulse 1s infinite' : 'none'
        }}>
          <Clock size={16} /> {isAnswered ? '--' : timeLeft}s
        </span>

        <span>Score: {score}</span>
      </div>
      
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: 0 }}>
        {currentQ.topic && (
          <span style={{ background: 'var(--surface-container-high)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
            {currentQ.topic}
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
        {currentQ.question}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {currentQ.options.map((option, idx) => {
          let bgColor = '#fff';
          let borderColor = 'var(--outline-variant)';
          let icon = null;

          if (isAnswered) {
            if (option === currentQ.correctAnswer) {
              bgColor = '#f0fdf4'; 
              borderColor = '#22c55e'; 
              icon = <CheckCircle size={18} color="#22c55e" />;
            } else if (option === selectedOption) {
              bgColor = '#fef2f2'; 
              borderColor = '#ef4444'; 
              icon = <XCircle size={18} color="#ef4444" />;
            }
          } else if (option === selectedOption) {
            borderColor = 'var(--primary)';
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              disabled={isAnswered}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.25rem', background: bgColor, border: `2px solid ${borderColor}`,
                borderRadius: '0.75rem', cursor: isAnswered ? 'default' : 'pointer',
                textAlign: 'left', color: 'var(--text-primary)', fontSize: '1rem',
                transition: 'all 0.2s ease', opacity: isAnswered && option !== currentQ.correctAnswer && option !== selectedOption ? 0.6 : 1
              }}
              onMouseEnter={(e) => { if (!isAnswered) e.currentTarget.style.borderColor = 'var(--primary)' }}
              onMouseLeave={(e) => { if (!isAnswered) e.currentTarget.style.borderColor = 'var(--outline-variant)' }}
            >
              <span>{option}</span>
              {icon}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="fade-in" style={{ background: 'var(--surface-container-low)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>
          
          {selectedOption === '__TIMEOUT__' && (
            <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} /> Time is up! 
            </div>
          )}

          <h4 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Explanation</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>
            {currentQ.explanation}
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            {currentQ.timestamp && currentQ.timestamp !== "" ? (
              <button 
                onClick={() => onTimestampClick && onTimestampClick(parseTimestamp(currentQ.timestamp))}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.35rem', 
                  fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)',
                  background: 'var(--primary-fixed)', border: 'none',
                  padding: '0.5rem 1rem', borderRadius: '999px', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-fixed-dim)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary-fixed)'}
              >
                <PlayCircle size={16} /> Review at {currentQ.timestamp}
              </button>
            ) : <div />}
            
            <button 
              onClick={handleNextQuestion}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.6rem 1.5rem', background: 'var(--primary)', color: '#fff',
                border: 'none', borderRadius: '999px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
            >
              {currentQuestionIndex < activeQuizData.length - 1 ? 'Next Question' : 'View Results'} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
