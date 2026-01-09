// PDF Export Service - Generate downloadable reports for pitch sessions

import { jsPDF } from 'jspdf';

interface SessionData {
  id: string;
  idea: string;
  track: string;
  score: number;
  wpm: number;
  filler_count: number;
  tone: string | null;
  created_at: string;
  transcription?: string | null;
  feedback?: string[] | null;
  missed_sections?: string[] | null;
}

const formatTypeName = (type: string) => {
  return type
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
};

const getPacingLabel = (wpm: number) => {
  if (wpm >= 120 && wpm <= 160) return 'Optimal (120-160 WPM)';
  if (wpm < 120) return 'Slow - Try speaking faster';
  return 'Fast - Try slowing down';
};

const getFillerFeedback = (count: number) => {
  if (count === 0) return 'Excellent! No filler words detected.';
  if (count <= 3) return 'Good control. Minor filler usage.';
  if (count <= 7) return 'Moderate filler usage. Practice pausing instead.';
  return 'High filler usage. Focus on embracing silence.';
};

export const generateSessionPDF = (session: SessionData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper to add new page if needed
  const checkPageBreak = (height: number) => {
    if (yPos + height > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Header
  doc.setFillColor(99, 102, 241); // Primary color
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Pitch Performance Report', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 38);

  yPos = 60;

  // Session Info Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Overview', margin, yPos);
  yPos += 10;

  // Pitch title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Pitch:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  
  // Wrap long titles
  const titleLines = doc.splitTextToSize(session.idea, contentWidth - 30);
  doc.text(titleLines, margin + 30, yPos);
  yPos += titleLines.length * 6 + 6;

  // Track and Date
  doc.setFont('helvetica', 'bold');
  doc.text('Track:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatTypeName(session.track), margin + 30, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(session.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }), margin + 30, yPos);
  yPos += 15;

  // Score Section
  checkPageBreak(60);
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(margin, yPos, contentWidth, 50, 5, 5, 'F');
  
  // Score display
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  const scoreText = (session.score / 10).toFixed(1);
  doc.setTextColor(99, 102, 241);
  doc.text(scoreText, margin + 15, yPos + 32);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('/10', margin + 50, yPos + 32);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Score', margin + 15, yPos + 42);
  
  // Score label
  doc.setFontSize(14);
  doc.text(getScoreLabel(session.score), margin + 100, yPos + 28);
  
  yPos += 60;

  // Key Metrics Section
  checkPageBreak(50);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', margin, yPos);
  yPos += 12;

  // Metrics grid
  const metrics = [
    { label: 'Speaking Pace', value: `${session.wpm} WPM`, feedback: getPacingLabel(session.wpm) },
    { label: 'Filler Words', value: session.filler_count.toString(), feedback: getFillerFeedback(session.filler_count) },
    { label: 'Detected Tone', value: session.tone ? session.tone.charAt(0).toUpperCase() + session.tone.slice(1) : 'Not analyzed', feedback: '' },
  ];

  metrics.forEach((metric) => {
    checkPageBreak(25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.label + ':', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.value, margin + 45, yPos);
    
    if (metric.feedback) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(metric.feedback, margin + 45, yPos + 5);
      doc.setTextColor(0, 0, 0);
      yPos += 15;
    } else {
      yPos += 10;
    }
  });

  yPos += 10;

  // Feedback Section
  if (session.feedback && session.feedback.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Feedback', margin, yPos);
    yPos += 10;

    session.feedback.forEach((item, index) => {
      checkPageBreak(20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const feedbackLines = doc.splitTextToSize(`${index + 1}. ${item}`, contentWidth - 10);
      doc.text(feedbackLines, margin + 5, yPos);
      yPos += feedbackLines.length * 5 + 5;
    });
    yPos += 5;
  }

  // Missed Sections
  if (session.missed_sections && session.missed_sections.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69);
    doc.text('Areas for Improvement', margin, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    session.missed_sections.forEach((section) => {
      checkPageBreak(15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${section}`, margin + 5, yPos);
      yPos += 7;
    });
    yPos += 5;
  }

  // Transcription Section
  if (session.transcription) {
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Transcription', margin, yPos);
    yPos += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    // Clean up transcription (remove HTML tags if any)
    const cleanTranscript = session.transcription.replace(/<[^>]*>/g, '').trim();
    const transcriptLines = doc.splitTextToSize(cleanTranscript, contentWidth - 10);
    
    // Limit to reasonable length
    const maxLines = 30;
    const displayLines = transcriptLines.slice(0, maxLines);
    
    displayLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });

    if (transcriptLines.length > maxLines) {
      doc.setTextColor(100, 100, 100);
      doc.text('[Transcription truncated for brevity...]', margin + 5, yPos);
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by PitchPal AI Coach`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  const filename = `pitch-report-${session.idea.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// Generate a summary PDF with multiple sessions
export const generateSummaryPDF = (sessions: SessionData[]): void => {
  if (sessions.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Practice Summary Report', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sessions.length} Sessions | Generated: ${new Date().toLocaleDateString()}`, margin, 38);

  yPos = 60;

  // Stats overview
  const avgScore = sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;
  const avgWpm = sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;
  const totalFillers = sessions.reduce((sum, s) => sum + s.filler_count, 0);
  const bestScore = Math.max(...sessions.map(s => s.score));

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Statistics', margin, yPos);
  yPos += 15;

  doc.setFillColor(245, 245, 250);
  doc.roundedRect(margin, yPos, contentWidth, 35, 5, 5, 'F');
  
  const statWidth = contentWidth / 4;
  const stats = [
    { label: 'Avg Score', value: (avgScore / 10).toFixed(1) },
    { label: 'Best Score', value: (bestScore / 10).toFixed(1) },
    { label: 'Avg WPM', value: Math.round(avgWpm).toString() },
    { label: 'Total Fillers', value: totalFillers.toString() },
  ];

  stats.forEach((stat, i) => {
    const x = margin + (statWidth * i) + statWidth / 2;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text(stat.value, x, yPos + 18, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(stat.label, x, yPos + 28, { align: 'center' });
  });

  yPos += 50;

  // Sessions list
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Session History', margin, yPos);
  yPos += 12;

  sessions.slice(0, 15).forEach((session, index) => {
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFillColor(index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
    doc.rect(margin, yPos - 4, contentWidth, 12, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const titleText = session.idea.length > 35 ? session.idea.slice(0, 35) + '...' : session.idea;
    doc.text(titleText, margin + 2, yPos + 3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(new Date(session.created_at).toLocaleDateString(), margin + 110, yPos + 3);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text((session.score / 10).toFixed(1), margin + 155, yPos + 3);

    yPos += 14;
  });

  if (sessions.length > 15) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`... and ${sessions.length - 15} more sessions`, margin, yPos + 5);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | PitchPal AI Coach`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const filename = `pitch-summary-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
