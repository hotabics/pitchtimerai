// Interview PDF Export Service - Generate downloadable interview transcripts with strategic reframes

import { jsPDF } from 'jspdf';

interface StrategicReframe {
  question_topic: string;
  what_they_said: string;
  strategic_reframe: string;
  cv_evidence_to_use?: string;
}

interface CategoryScores {
  first_impression?: number;
  technical_competence?: number;
  cultural_fit?: number;
  communication?: number;
  gap_handling?: number;
}

interface Turn {
  role: string;
  content: string;
  turn_number: number;
}

interface InterviewData {
  job_title: string;
  company_name?: string;
  duration_seconds: number;
  hireability_score: number | null;
  category_scores: CategoryScores | null;
  strategic_reframes: StrategicReframe[];
  verdict_summary: string | null;
  conversion_likelihood: "high" | "medium" | "low" | null;
  turns: Turn[];
}

// Neo-Noir color palette (RGB values)
const COLORS = {
  mustard: { r: 234, g: 179, b: 8 },      // interview-mustard
  blood: { r: 220, g: 38, b: 38 },         // interview-blood
  bg: { r: 23, g: 23, b: 23 },             // interview-bg
  card: { r: 38, g: 38, b: 38 },           // interview-card
  text: { r: 250, g: 250, b: 250 },        // interview-text
  muted: { r: 163, g: 163, b: 163 },       // interview-muted
  green: { r: 34, g: 197, b: 94 },         // success green
};

const getScoreLabel = (score: number | null): string => {
  if (score === null) return 'Not Scored';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Unlikely to Advance';
};

const getLikelihoodLabel = (likelihood: string | null): string => {
  if (!likelihood) return 'Unknown';
  const labels: Record<string, string> = {
    high: 'Strong Candidate',
    medium: 'Needs Improvement', 
    low: 'Unlikely to Advance',
  };
  return labels[likelihood] || 'Unknown';
};

export const generateInterviewPDF = (data: InterviewData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const checkPageBreak = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // ============ HEADER ============
  doc.setFillColor(COLORS.bg.r, COLORS.bg.g, COLORS.bg.b);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Mustard accent bar
  doc.setFillColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
  doc.rect(0, 0, 6, 50, 'F');

  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERVIEW TRANSCRIPT', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
  doc.text('THE STRATEGIC VERDICT', margin, 35);
  
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })}`, margin, 45);

  yPos = 65;

  // ============ JOB INFO ============
  doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.job_title, margin, yPos);
  yPos += 8;
  
  if (data.company_name) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text(data.company_name, margin, yPos);
    yPos += 6;
  }
  
  const mins = Math.floor(data.duration_seconds / 60);
  const secs = data.duration_seconds % 60;
  doc.text(`Duration: ${mins}m ${secs}s`, margin, yPos);
  yPos += 15;

  // ============ HIREABILITY SCORE BOX ============
  checkPageBreak(50);
  
  doc.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
  doc.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');
  
  // Left side: Score
  const scoreColor = data.hireability_score !== null && data.hireability_score >= 80 
    ? COLORS.green 
    : data.hireability_score !== null && data.hireability_score >= 60 
      ? COLORS.mustard 
      : COLORS.blood;
  
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  doc.text(data.hireability_score?.toString() || '—', margin + 15, yPos + 26);
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Hireability Score', margin + 15, yPos + 35);
  
  // Right side: Likelihood
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const likelihood = getLikelihoodLabel(data.conversion_likelihood);
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  const likelihoodWidth = doc.getTextWidth(likelihood);
  doc.text(likelihood, pageWidth - margin - likelihoodWidth - 15, yPos + 22);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
  doc.text('Conversion Likelihood', pageWidth - margin - 80, yPos + 32);

  yPos += 50;

  // ============ CATEGORY SCORES ============
  if (data.category_scores) {
    checkPageBreak(70);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.text('Score Breakdown', margin, yPos);
    yPos += 10;

    const categories = [
      { name: 'First Impression', score: data.category_scores.first_impression, max: 20 },
      { name: 'Technical Competence', score: data.category_scores.technical_competence, max: 20 },
      { name: 'Cultural Fit', score: data.category_scores.cultural_fit, max: 20 },
      { name: 'Communication', score: data.category_scores.communication, max: 20 },
      { name: 'Gap Handling', score: data.category_scores.gap_handling, max: 20 },
    ];

    categories.forEach((cat) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      doc.text(cat.name, margin, yPos);
      
      const scoreText = cat.score !== undefined ? `${cat.score}/${cat.max}` : '—';
      doc.text(scoreText, margin + 100, yPos);
      
      // Progress bar
      doc.setFillColor(COLORS.bg.r, COLORS.bg.g, COLORS.bg.b);
      doc.rect(margin + 120, yPos - 4, 50, 5, 'F');
      
      if (cat.score !== undefined) {
        const barColor = cat.score >= 16 ? COLORS.green : cat.score >= 12 ? COLORS.mustard : COLORS.blood;
        doc.setFillColor(barColor.r, barColor.g, barColor.b);
        doc.rect(margin + 120, yPos - 4, (cat.score / cat.max) * 50, 5, 'F');
      }
      
      yPos += 10;
    });
    
    yPos += 10;
  }

  // ============ VERDICT SUMMARY ============
  if (data.verdict_summary) {
    checkPageBreak(40);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.text('AI Verdict', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    
    const verdictLines = doc.splitTextToSize(`"${data.verdict_summary}"`, contentWidth);
    doc.text(verdictLines, margin, yPos);
    yPos += verdictLines.length * 5 + 10;
  }

  // ============ STRATEGIC REFRAMES (HIGHLIGHTED) ============
  if (data.strategic_reframes.length > 0) {
    checkPageBreak(30);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
    doc.text('📌 STRATEGIC REFRAMES', margin, yPos);
    yPos += 4;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text('What you said vs. what you should have said', margin, yPos);
    yPos += 10;

    data.strategic_reframes.forEach((reframe, i) => {
      checkPageBreak(60);
      
      // Reframe box background
      doc.setFillColor(COLORS.card.r, COLORS.card.g, COLORS.card.b);
      
      // Calculate box height
      const whatSaidLines = doc.splitTextToSize(`"${reframe.what_they_said}"`, contentWidth - 15);
      const reframeLines = doc.splitTextToSize(`"${reframe.strategic_reframe}"`, contentWidth - 15);
      const evidenceLines = reframe.cv_evidence_to_use 
        ? doc.splitTextToSize(`CV Evidence: ${reframe.cv_evidence_to_use}`, contentWidth - 15)
        : [];
      const boxHeight = 25 + (whatSaidLines.length * 4) + 15 + (reframeLines.length * 4) + (evidenceLines.length > 0 ? 10 + evidenceLines.length * 4 : 0);
      
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'F');
      
      // Mustard accent on left
      doc.setFillColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
      doc.rect(margin, yPos, 4, boxHeight, 'F');
      
      yPos += 8;
      
      // Topic header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      doc.text(`${i + 1}. ${reframe.question_topic}`, margin + 10, yPos);
      yPos += 10;
      
      // What they said (blood red indicator)
      doc.setFillColor(COLORS.blood.r, COLORS.blood.g, COLORS.blood.b);
      doc.circle(margin + 12, yPos - 1, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.blood.r, COLORS.blood.g, COLORS.blood.b);
      doc.text('What you said:', margin + 18, yPos);
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
      doc.text(whatSaidLines, margin + 18, yPos);
      yPos += whatSaidLines.length * 4 + 8;
      
      // Strategic reframe (mustard indicator)
      doc.setFillColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
      doc.circle(margin + 12, yPos - 1, 2, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
      doc.text('Strategic reframe:', margin + 18, yPos);
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      doc.text(reframeLines, margin + 18, yPos);
      yPos += reframeLines.length * 4 + 5;
      
      // CV Evidence
      if (reframe.cv_evidence_to_use) {
        doc.setFontSize(8);
        doc.setTextColor(COLORS.mustard.r, COLORS.mustard.g, COLORS.mustard.b);
        doc.text(evidenceLines, margin + 18, yPos);
        yPos += evidenceLines.length * 4 + 5;
      }
      
      yPos += 10;
    });
  }

  // ============ FULL TRANSCRIPT ============
  if (data.turns.length > 0) {
    checkPageBreak(30);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
    doc.text('Full Interview Transcript', margin, yPos);
    yPos += 12;

    data.turns.forEach((turn) => {
      checkPageBreak(25);
      
      const isInterviewer = turn.role === 'interviewer';
      const roleColor = isInterviewer ? COLORS.mustard : COLORS.muted;
      const roleName = isInterviewer ? 'INTERVIEWER' : 'YOU';
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(roleColor.r, roleColor.g, roleColor.b);
      doc.text(roleName, margin, yPos);
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text.r, COLORS.text.g, COLORS.text.b);
      
      const contentLines = doc.splitTextToSize(turn.content, contentWidth - 5);
      const displayLines = contentLines.slice(0, 8); // Limit per turn
      doc.text(displayLines, margin + 5, yPos);
      yPos += displayLines.length * 4 + 8;
      
      if (contentLines.length > 8) {
        doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
        doc.text('[...continued]', margin + 5, yPos - 4);
      }
    });
  }

  // ============ FOOTER ============
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(COLORS.bg.r, COLORS.bg.g, COLORS.bg.b);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted.r, COLORS.muted.g, COLORS.muted.b);
    doc.text(
      `Page ${i} of ${pageCount} | First Round: Strategic Interview Simulator | pitchtimerai.lovable.app`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Download
  const safeName = data.job_title.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filename = `interview-transcript-${safeName}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
