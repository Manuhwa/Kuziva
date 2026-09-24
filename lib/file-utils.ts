import { MarkingResult } from './types';

export interface FileSubmission {
  id: string;
  fileName: string;
  content: string;
  originalFile?: File;
  status: 'pending' | 'marking' | 'completed' | 'failed';
  result?: MarkingResult;
  error?: string;
  extractionMethod?: string;
}

export const SUPPORTED_FORMATS = {
  text: ['txt', 'md', 'markdown'],
  document: ['pdf', 'docx', 'doc', 'rtf', 'odt', 'html', 'htm'],
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'],
  data: ['json', 'csv']
};

export function isSupportedFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return Object.values(SUPPORTED_FORMATS).some(formats => formats.includes(ext));
}

export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

export async function readPdfFile(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    if (fullText.trim().length < 10) {
      throw new Error('PDF appears to be empty or image-based');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw new Error('Could not extract text from PDF. This may be a scanned/image-based PDF.');
  }
}

export async function readDocxFile(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.value.trim().length < 10) {
      throw new Error('Document appears to be empty');
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('DOCX parsing failed:', error);
    throw new Error('Could not extract text from Word document.');
  }
}

export async function readImageFile(file: File): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log(m)
    });
    
    if (result.data.text.trim().length < 10) {
      return `[Image file: ${file.name}]\n\nOCR detected minimal text. This may be a handwritten script or low-quality image. Please provide a transcript or re-scan at higher quality.\n\n${result.data.text}`;
    }
    
    return `[Extracted from image: ${file.name}]\n\n${result.data.text.trim()}`;
  } catch (error) {
    console.error('OCR failed:', error);
    return `[Image file: ${file.name}]\n\nAutomatic text extraction failed. This image may contain handwritten text. Please provide a typed transcript for accurate marking.`;
  }
}

export async function readHtmlFile(file: File): Promise<string> {
  const html = await readTextFile(file);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || doc.body.innerText || '';
}

export async function readJsonFile(file: File): Promise<string> {
  const json = await readTextFile(file);
  const data = JSON.parse(json);
  
  if (Array.isArray(data)) {
    return data.map((item, idx) => `Answer ${idx + 1}: ${JSON.stringify(item, null, 2)}`).join('\n\n');
  } else if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`)
      .join('\n\n');
  }
  
  return json;
}

export async function readCsvFile(file: File): Promise<string> {
  const csv = await readTextFile(file);
  const lines = csv.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return '';
  
  const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
  
  return rows.map((row, idx) => 
    idx === 0 ? `Headers: ${row.join(' | ')}` : `Row ${idx}: ${row.join(' | ')}`
  ).join('\n');
}

export async function processUploadedFile(file: File): Promise<{ content: string; method: string }> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  try {
    if (SUPPORTED_FORMATS.text.includes(extension)) {
      return { content: await readTextFile(file), method: 'text' };
    }
    
    if (extension === 'pdf') {
      return { content: await readPdfFile(file), method: 'PDF.js' };
    }
    
    if (['docx', 'doc'].includes(extension)) {
      return { content: await readDocxFile(file), method: 'Mammoth' };
    }
    
    if (SUPPORTED_FORMATS.image.includes(extension)) {
      return { content: await readImageFile(file), method: 'Tesseract OCR' };
    }
    
    if (['html', 'htm'].includes(extension)) {
      return { content: await readHtmlFile(file), method: 'HTML parser' };
    }
    
    if (extension === 'json') {
      return { content: await readJsonFile(file), method: 'JSON parser' };
    }
    
    if (extension === 'csv') {
      return { content: await readCsvFile(file), method: 'CSV parser' };
    }
    
    if (['rtf', 'odt'].includes(extension)) {
      const text = await readTextFile(file);
      const cleaned = text.replace(/\{[^}]*\}/g, '').replace(/[^\x20-\x7E\n]/g, ' ');
      if (cleaned.trim().length > 20) {
        return { content: cleaned, method: 'text extraction (partial)' };
      }
      throw new Error(`${extension.toUpperCase()} format detected but text extraction was insufficient. Please convert to PDF, DOCX, or TXT.`);
    }
    
    const basicText = await readTextFile(file);
    if (basicText.trim().length > 20) {
      return { content: basicText, method: 'plain text fallback' };
    }
    
    throw new Error(`Unsupported or unreadable file type: .${extension}`);
    
  } catch (error: any) {
    throw new Error(error.message || `Failed to process ${file.name}`);
  }
}

export function extractStudentName(fileName: string, content: string): string {
  const nameFromFile = fileName
    .replace(/\.(txt|md|pdf)$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();
  
  const lines = content.split('\n').slice(0, 5);
  for (const line of lines) {
    const nameMatch = line.match(/(?:name|student|submitted by):\s*(.+)/i);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
  }
  
  if (nameFromFile.length > 3 && nameFromFile.length < 50) {
    return nameFromFile;
  }
  
  return 'Unknown Student';
}

export function generateMarkedDocument(
  result: MarkingResult,
  assignment: any,
  examinerName?: string,
  examinerSignature?: string
): string {
  const date = new Date(result.submittedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marked Script - ${result.studentName}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: white;
      color: #000;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: bold;
    }
    .header .info {
      font-size: 14px;
      margin: 5px 0;
    }
    .ai-warning {
      background: ${result.recommendRedo ? '#fee' : '#fef9e7'};
      border: 2px solid ${result.recommendRedo ? '#c00' : '#f39c12'};
      padding: 15px;
      margin: 20px 0;
      border-radius: 5px;
    }
    .ai-warning strong {
      color: ${result.recommendRedo ? '#c00' : '#d68910'};
    }
    .question-section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .question-header {
      background: #f0f0f0;
      padding: 10px;
      font-weight: bold;
      border-left: 4px solid #333;
      margin-bottom: 10px;
    }
    .answer-text {
      line-height: 1.8;
      margin: 15px 0;
      padding: 15px;
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 3px;
      position: relative;
    }
    .inline-comment {
      background: #fffacd;
      border-bottom: 2px solid #f39c12;
      position: relative;
      cursor: help;
    }
    .inline-comment.tick {
      background: #d4edda;
      border-bottom-color: #28a745;
    }
    .inline-comment.cross {
      background: #f8d7da;
      border-bottom-color: #dc3545;
    }
    .inline-comment.warning {
      background: #fff3cd;
      border-bottom-color: #ffc107;
    }
    .comment-tooltip {
      font-size: 11px;
      color: #666;
      font-style: italic;
      display: block;
      margin-top: 2px;
    }
    .marks-awarded {
      background: #e8f5e9;
      border: 2px solid #4caf50;
      padding: 10px;
      margin: 10px 0;
      font-weight: bold;
    }
    .criteria-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    .criteria-table th,
    .criteria-table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .criteria-table th {
      background: #f5f5f5;
      font-weight: bold;
    }
    .general-comment {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 15px 0;
      font-style: italic;
    }
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #000;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .total-score {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      background: #f0f0f0;
      padding: 20px;
      border: 3px solid #000;
      margin: 30px 0;
    }
    .signature-section {
      text-align: center;
      max-width: 300px;
    }
    .signature-image {
      max-width: 200px;
      height: auto;
      margin: 10px 0;
      border-bottom: 1px solid #000;
    }
    .signature-text {
      font-size: 12px;
      margin-top: 5px;
    }
    @media print {
      body {
        margin: 0;
        padding: 15px;
      }
      .ai-warning {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${assignment.title}</h1>
    <div class="info"><strong>Subject:</strong> ${assignment.subject}</div>
    <div class="info"><strong>Student:</strong> ${result.studentName}</div>
    <div class="info"><strong>Date Marked:</strong> ${date}</div>
  </div>

  <div class="ai-warning">
    <strong>${result.recommendRedo ? '⚠️ REDO RECOMMENDED' : 'AI Content Check: PASSED'}</strong><br>
    AI-generated content estimate: <strong>${result.aiContentPercent}%</strong> (threshold: ${assignment.maxAiContentPercent}%)<br>
    <em>${result.aiRationale}</em>
    ${result.recommendRedo ? '<br><br>This submission exceeds the maximum allowed AI content percentage. The student should resubmit with original work.' : ''}
  </div>
`;

  result.questionMarks.forEach((qm, idx) => {
    const question = assignment.questions.find((q: any) => q.id === qm.questionId);
    const answer = result.answers.find((a: any) => a.questionId === qm.questionId);
    
    if (!question || !answer) return;

    html += `
  <div class="question-section">
    <div class="question-header">
      Question ${idx + 1} (${qm.maxScore} marks)
    </div>
    <p><strong>${question.prompt}</strong></p>
    
    <div class="answer-text">
      ${renderAnswerWithComments(answer.text, qm.inlineComments)}
    </div>

    ${qm.criteriaMarks && qm.criteriaMarks.length > 0 ? `
    <table class="criteria-table">
      <thead>
        <tr>
          <th>Criterion</th>
          <th style="width: 100px; text-align: center;">Marks</th>
          <th>Comment</th>
        </tr>
      </thead>
      <tbody>
        ${qm.criteriaMarks.map(cm => `
        <tr>
          <td>${cm.criterion}</td>
          <td style="text-align: center;">${cm.marks}/${cm.maxMarks}</td>
          <td>${cm.comment}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="general-comment">
      <strong>Examiner Comment:</strong> ${qm.generalComment}
    </div>

    <div class="marks-awarded">
      Marks Awarded: ${qm.score} / ${qm.maxScore}
    </div>
  </div>
`;
  });

  html += `
  <div class="total-score">
    TOTAL SCORE: ${result.totalScore} / ${result.totalMaxScore}
    ${!result.recommendRedo ? ` (${Math.round((result.totalScore / result.totalMaxScore) * 100)}%)` : ' - REDO REQUIRED'}
  </div>

  <div class="footer">
    <div style="flex: 1;">
      <div style="font-size: 12px; color: #666;">
        Marked using Kuziva<br>
        Automated marking with AI content detection
      </div>
    </div>
    ${examinerSignature || examinerName ? `
    <div class="signature-section">
      ${examinerSignature ? `<img src="${examinerSignature}" alt="Examiner Signature" class="signature-image">` : ''}
      <div class="signature-text">
        ${examinerName ? `<strong>${examinerName}</strong><br>` : ''}
        Examiner<br>
        ${date}
      </div>
    </div>
    ` : ''}
  </div>
</body>
</html>`;

  return html;
}

function renderAnswerWithComments(text: string, comments: any[]): string {
  const sortedComments = [...comments].sort((a, b) => b.position - a.position);
  
  let result = text;
  const annotated: { start: number; end: number; comment: any }[] = [];
  
  sortedComments.forEach(comment => {
    const start = comment.position;
    const end = comment.position + comment.length;
    annotated.push({ start, end, comment });
  });
  
  annotated.reverse().forEach(({ start, end, comment }) => {
    const before = result.substring(0, start);
    const highlighted = result.substring(start, end);
    const after = result.substring(end);
    
    const icon = comment.type === 'tick' ? '✓' : 
                 comment.type === 'cross' ? '✗' : 
                 comment.type === 'warning' ? '⚠' : '💬';
    
    result = before + 
             `<span class="inline-comment ${comment.type}" title="${comment.text}">` +
             highlighted +
             ` <sup>${icon}</sup>` +
             `</span>` +
             after;
  });
  
  return result.replace(/\n/g, '<br>');
}

export function downloadMarkedDocument(
  result: MarkingResult,
  assignment: any,
  examinerName?: string,
  examinerSignature?: string
) {
  const html = generateMarkedDocument(result, assignment, examinerName, examinerSignature);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.studentName.replace(/\s+/g, '_')}_marked.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadBatchAsZip(
  results: MarkingResult[],
  assignment: any,
  examinerName?: string,
  examinerSignature?: string
) {
  alert('Preparing marked scripts for download...\n\n' +
        'In a production environment, this would create a ZIP file with all marked scripts.\n' +
        'For this demo, each script can be downloaded individually from the batch results view.');
  
  results.forEach((result, idx) => {
    setTimeout(() => {
      downloadMarkedDocument(result, assignment, examinerName, examinerSignature);
    }, idx * 500);
  });
}
