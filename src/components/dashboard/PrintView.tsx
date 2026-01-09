import { useEffect } from "react";

interface SpeechBlock {
  timeStart: string;
  timeEnd: string;
  title: string;
  content: string;
  isDemo?: boolean;
  visualCue?: string;
}

interface PrintViewProps {
  idea: string;
  track: string;
  audienceLabel?: string;
  duration: number;
  blocks: SpeechBlock[];
  wordCount?: number;
  bulletPoints?: string[];
}

export const openPrintView = (props: PrintViewProps) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to open the print view");
    return;
  }

  const {
    idea,
    track,
    audienceLabel,
    duration,
    blocks,
    wordCount,
    bulletPoints,
  } = props;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Print Script - ${idea.slice(0, 50)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    @media print {
      body {
        padding: 20px;
        font-size: 11pt;
      }
      
      .no-print {
        display: none !important;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .bullet-page {
        page-break-before: always;
      }
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 10px;
      color: #111;
    }
    
    .header .meta {
      font-size: 11pt;
      color: #666;
    }
    
    .header .meta span {
      margin: 0 10px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }
    
    .time-badge {
      background: #f0f0f0;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 9pt;
      font-family: 'Courier New', monospace;
      color: #555;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      color: #333;
    }
    
    .demo-badge {
      background: #fff3cd;
      color: #856404;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: bold;
    }
    
    .section-content {
      font-size: 12pt;
      line-height: 1.8;
      text-align: justify;
    }
    
    .visual-cue {
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8f9ff;
      border-left: 3px solid #6366f1;
      font-size: 10pt;
      color: #555;
      font-style: italic;
    }
    
    .bullet-page {
      margin-top: 40px;
    }
    
    .bullet-page h2 {
      font-size: 18pt;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .bullet-list {
      list-style: none;
    }
    
    .bullet-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      font-size: 11pt;
    }
    
    .bullet-number {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      font-weight: bold;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    
    .print-button:hover {
      background: #4338ca;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 9pt;
      color: #999;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Print Script
  </button>

  <div class="header">
    <h1>${escapeHtml(idea)}</h1>
    <div class="meta">
      <span>${escapeHtml(track)}</span>
      <span>•</span>
      <span>${duration} min</span>
      ${wordCount ? `<span>•</span><span>${wordCount} words</span>` : ""}
      ${audienceLabel ? `<span>•</span><span>For: ${escapeHtml(audienceLabel)}</span>` : ""}
    </div>
  </div>

  ${blocks
    .map(
      (block) => `
    <div class="section">
      <div class="section-header">
        <span class="time-badge">${block.timeStart} - ${block.timeEnd}</span>
        <span class="section-title">${escapeHtml(block.title)}</span>
        ${block.isDemo ? '<span class="demo-badge">DEMO</span>' : ""}
      </div>
      <div class="section-content">
        ${escapeHtml(block.content)}
      </div>
      ${
        block.visualCue
          ? `<div class="visual-cue">📺 ${escapeHtml(block.visualCue)}</div>`
          : ""
      }
    </div>
  `
    )
    .join("")}

  ${
    bulletPoints && bulletPoints.length > 0
      ? `
    <div class="bullet-page">
      <h2>Quick Reference</h2>
      <ul class="bullet-list">
        ${bulletPoints
          .map(
            (point, i) => `
          <li>
            <span class="bullet-number">${i + 1}</span>
            <span>${escapeHtml(point)}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `
      : ""
  }

  <div class="footer">
    Generated with PitchPerfect • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
