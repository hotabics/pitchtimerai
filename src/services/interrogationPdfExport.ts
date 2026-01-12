// PDF Export Service for Interrogation Sessions

import { jsPDF } from 'jspdf';
import { ResponseRecord, VerdictData } from '@/components/ai-coach/interrogation/InterrogationVerdict';
import { JURORS, JurorType } from '@/components/ai-coach/interrogation/JurorSelection';

interface InterrogationSessionData {
  id: string;
  juror_type: JurorType;
  overall_score: number;
  choreography_score: number;
  ammunition_score: number;
  cold_bloodedness_score: number;
  status: string;
  created_at: string;
  dossier_data?: {
    projectName?: string;
    problemStatement?: string;
    solutionOverview?: string;
    targetAudience?: string;
  } | null;
  responses?: ResponseRecord[];
  verdict_data?: VerdictData;
}

const getScoreColor = (score: number): [number, number, number] => {
  if (score >= 80) return [16, 185, 129]; // Green
  if (score >= 60) return [255, 215, 0]; // Gold
  return [139, 0, 0]; // Dark red
};

const getScoreLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Developing';
  return 'Needs Work';
};

export const generateInterrogationPDF = (session: InterrogationSessionData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const checkPageBreak = (height: number) => {
    if (yPos + height > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  const jurorConfig = JURORS.find(j => j.id === session.juror_type);

  // Header
  doc.setFillColor(31, 31, 31);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 215, 0);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERROGATION VERDICT', margin, 28);
  
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.text(`Session: ${new Date(session.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, 42);

  yPos = 65;

  // Juror & Project Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Details', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Juror: ${jurorConfig?.title || session.juror_type}`, margin, yPos);
  yPos += 6;

  if (session.dossier_data?.projectName) {
    doc.text(`Project: ${session.dossier_data.projectName}`, margin, yPos);
    yPos += 6;
  }

  yPos += 8;

  // Overall Score Box
  checkPageBreak(60);
  const [r, g, b] = getScoreColor(session.overall_score);
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(margin, yPos, contentWidth, 50, 5, 5, 'F');
  
  // Score circle
  doc.setFillColor(r, g, b);
  doc.circle(margin + 35, yPos + 25, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(`${session.overall_score}%`, margin + 35, yPos + 28, { align: 'center' });
  
  // Status badge
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(session.status, margin + 70, yPos + 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(getScoreLabel(session.overall_score), margin + 70, yPos + 32);
  
  doc.setFontSize(9);
  doc.text('Overall Performance', margin + 70, yPos + 42);

  yPos += 60;

  // Category Scores
  checkPageBreak(50);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', margin, yPos);
  yPos += 12;

  const categories = [
    { name: 'Choreography', score: session.choreography_score, desc: 'Delivery, pace, filler word control' },
    { name: 'Ammunition', score: session.ammunition_score, desc: 'Logical flow and evidence usage' },
    { name: 'Cold-Bloodedness', score: session.cold_bloodedness_score, desc: 'Confidence under pressure' },
  ];

  categories.forEach((cat) => {
    checkPageBreak(25);
    const [cr, cg, cb] = getScoreColor(cat.score);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${cat.name}:`, margin, yPos);
    
    doc.setTextColor(cr, cg, cb);
    doc.text(`${cat.score}%`, margin + 55, yPos);
    
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(cat.desc, margin + 80, yPos);
    
    // Progress bar
    const barWidth = 50;
    const barHeight = 4;
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(margin, yPos + 4, barWidth, barHeight, 2, 2, 'F');
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(margin, yPos + 4, (cat.score / 100) * barWidth, barHeight, 2, 2, 'F');
    
    yPos += 18;
  });

  yPos += 10;

  // Question-Answer Breakdown
  if (session.responses && session.responses.length > 0) {
    checkPageBreak(30);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Question-Answer Review', margin, yPos);
    yPos += 12;

    session.responses.forEach((response, index) => {
      checkPageBreak(60);
      
      // Question header
      doc.setFillColor(248, 248, 252);
      doc.roundedRect(margin, yPos - 2, contentWidth, 8, 2, 2, 'F');
      
      const avgScore = Math.round(
        (response.analysis.relevance + response.analysis.clarity + 
         response.analysis.confidence + response.analysis.depth) / 4
      );
      const [qr, qg, qb] = getScoreColor(avgScore);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Q${index + 1}: ${response.category}`, margin + 3, yPos + 4);
      
      doc.setTextColor(qr, qg, qb);
      doc.text(`${avgScore}%`, margin + contentWidth - 20, yPos + 4);
      
      yPos += 12;
      
      // Question text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      const questionLines = doc.splitTextToSize(response.question, contentWidth - 10);
      doc.text(questionLines, margin + 3, yPos);
      yPos += questionLines.length * 5 + 4;
      
      // Response text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      const responseText = `"${response.response}"`;
      const responseLines = doc.splitTextToSize(responseText, contentWidth - 15);
      const displayLines = responseLines.slice(0, 4);
      doc.text(displayLines, margin + 5, yPos);
      yPos += displayLines.length * 4 + 2;
      
      if (responseLines.length > 4) {
        doc.setTextColor(140, 140, 140);
        doc.text('[Response truncated...]', margin + 5, yPos);
        yPos += 4;
      }
      
      // Metrics row
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Relevance: ${response.analysis.relevance}% | Clarity: ${response.analysis.clarity}% | Confidence: ${response.analysis.confidence}% | Depth: ${response.analysis.depth}%`, margin + 3, yPos);
      yPos += 5;
      
      doc.text(`Words: ${response.analysis.wordCount} | Fillers: ${response.analysis.fillerCount}`, margin + 3, yPos);
      yPos += 6;
      
      // AI Feedback
      if (response.analysis.feedback) {
        checkPageBreak(20);
        doc.setFillColor(255, 250, 230);
        const feedbackLines = doc.splitTextToSize(`💡 ${response.analysis.feedback}`, contentWidth - 15);
        const feedbackHeight = feedbackLines.length * 4 + 6;
        doc.roundedRect(margin, yPos - 2, contentWidth, feedbackHeight, 2, 2, 'F');
        
        doc.setFontSize(8);
        doc.setTextColor(140, 110, 0);
        doc.text(feedbackLines, margin + 5, yPos + 2);
        yPos += feedbackHeight + 4;
      }
      
      yPos += 8;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | PitchPal Interrogation Room`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  const projectName = session.dossier_data?.projectName || 'session';
  const filename = `interrogation-${projectName.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
