# Assignment & Marking Guide Upload Feature

This document describes the new upload functionality for assignment documents and marking guides in Kuziva.

## Overview

Examiners can now **upload** assignment papers and marking guides as files instead of only typing them. The system automatically extracts text, parses questions, and attaches marking criteria.

## Supported File Formats

All formats supported for student scripts are also supported for assignment uploads:

- **Text Documents**: `.txt`, `.md` (Markdown)
- **Office Documents**: `.pdf`, `.docx`, `.rtf`, `.odt`
- **Web & Markup**: `.html`, `.htm`
- **Images (OCR)**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`
- **Data Formats**: `.json`, `.csv`

## Features

### 1. Assignment Document Upload

**Location**: Create Assignment or Edit Assignment page

**What it does**:
- Extracts text from the uploaded file
- Attempts to parse and identify:
  - Assignment title
  - Question prompts
  - Mark allocations (e.g., "10 marks", "[15 marks]")
- Populates questions automatically (with confirmation)
- Stores extracted text in localStorage (no server needed)

**Parsing rules**:
- Detects question patterns:
  - "Question 1:", "Q.1)", "1.", "1)"
  - Followed by question text
  - Optional marks in brackets: "(10 marks)", "[10 marks]"
- Extracts title from first few lines if it contains keywords:
  - "Assignment", "Exam", "Test", "Quiz", "Mid-term", "Final"
- Default to 10 marks if no mark allocation is found

**Example**:
```
Educational Psychology Mid-Term Examination

Question 1: Explain Vygotsky's ZPD. (10 marks)
Question 2: Compare Piaget and Bruner. (15 marks)
```

This will extract:
- Title: "Educational Psychology Mid-Term Examination"
- Question 1: prompt="Explain Vygotsky's ZPD.", maxMarks=10
- Question 2: prompt="Compare Piaget and Bruner.", maxMarks=15

### 2. Marking Guide Upload

**Location**: Create Assignment or Edit Assignment page

**What it does**:
- Extracts text from the marking guide/memorandum
- Attempts to parse and identify:
  - Question-specific criteria
  - Mark breakdowns
  - General rubrics
- Attaches criteria to corresponding questions (with confirmation)
- Stores extracted text in localStorage

**Parsing rules**:
- Detects question markers:
  - "Question 1:", "Q.1 Marking", "1. Rubric"
- Extracts criteria lines (lines starting with `-`, `•`, `*`, or numbered)
- Identifies mark allocations: "(3 marks)", "[5 marks]"
- Falls back to general guide if question structure is unclear

**Example**:
```
MARKING GUIDE

Question 1: (10 marks)
- Clear definition of ZPD (3 marks)
- Explanation of teaching application (4 marks)
- Practical classroom examples (3 marks)

Question 2: (15 marks)
- Piaget's stages explained (5 marks)
- Bruner's spiral curriculum (5 marks)
- Comparison and contrast (5 marks)
```

This will attach:
- Question 1 marking guide: all three criteria
- Question 2 marking guide: all three criteria

### 3. Marking Engine Integration

**When marking student scripts**:
- The marking engine uses `question.markingGuide` field
- Uploaded guide content is stored in this field
- If both typed and uploaded guides exist, they are **combined**
- The multi-pass marking engine processes all criteria equally

**No changes needed**: The existing marking engine already supports detailed rubrics, so uploaded guides work automatically.

## User Experience

### Create Assignment Flow

1. **Open** "Create New Assignment"
2. **Upload assignment document** (optional)
   - Click "Upload Assignment"
   - Select PDF/DOCX/TXT file
   - System extracts text via PDF.js, Mammoth, or plain text reader
   - System parses questions
   - Prompt: "Found N questions. Click OK to populate or Cancel to keep current."
   - Title auto-filled if detected
3. **Upload marking guide** (optional)
   - Click "Upload Marking Guide"
   - Select file
   - System extracts and parses criteria
   - Prompt: "Found criteria for N questions. Click OK to apply or Cancel."
   - Criteria attached to corresponding questions
4. **Review and edit** questions/guides in the form
5. **Type OR upload** — both methods work, or use a combination
6. **Save assignment**
   - Extracted text stored in localStorage
   - Original file names recorded
   - Extraction methods recorded (e.g., "PDF.js", "Mammoth", "text")

### Edit Assignment Flow

1. **Navigate to** Examiner Portal
2. **Click "Edit"** on any assignment
3. **See existing** uploaded documents (if any)
   - File name and extraction method shown
   - Click trash icon to remove and upload a new file
4. **Upload new** or replacement documents
5. **Save changes**

### Mark Student Scripts

- Marking process is **unchanged**
- Uploaded guide content is used by the marking engine
- Multi-pass analysis applies all criteria
- Criterion-by-criterion scoring works as before

## Technical Details

### Data Structure

**Assignment interface** (`lib/types.ts`):
```typescript
export interface Assignment {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  maxAiContentPercent: number;
  questions: Question[];
  createdAt: string;
  assignmentDocument?: {
    fileName: string;
    extractedText: string;
    extractionMethod: string;
  };
  markingGuideDocument?: {
    fileName: string;
    extractedText: string;
    extractionMethod: string;
  };
}
```

### Parsing Functions

**`parseAssignmentDocument(text: string)`** (`lib/file-utils.ts`):
- Returns: `{ suggestedTitle?: string, suggestedQuestions: ParsedQuestion[] }`
- Uses regex patterns to detect questions and marks
- Extracts title from first few lines
- Handles multi-line questions

**`parseMarkingGuide(text: string, questions: ParsedQuestion[])`** (`lib/file-utils.ts`):
- Returns: `{ questionGuides: Array<{questionIndex, guide}>, generalGuide?: string }`
- Detects question markers
- Extracts criteria lines
- Associates criteria with question indices
- Falls back to general guide if structure is flat

### Storage

- All data stored in **localStorage**
- Extracted text stored as strings
- File names and extraction methods recorded for reference
- **No server or database required**
- Compatible with static export (GitHub Pages)

### Build Compatibility

- ✅ `npm run build` — Standard Next.js build
- ✅ `npm run export` — Static export for GitHub Pages
- ✅ All routes remain static (no dynamic server-side processing)
- ✅ File processing happens client-side in the browser

## Sample Files

Two sample files are provided in `public/samples/`:

1. **`sample_assignment.txt`** — Example assignment with 4 questions and mark allocations
2. **`sample_marking_guide.txt`** — Corresponding marking guide with detailed criteria

### Demo Instructions

1. Go to "Create New Assignment"
2. Click "Upload Assignment" and select `public/samples/sample_assignment.txt`
3. Review extracted questions (title and 4 questions auto-filled)
4. Click "Upload Marking Guide" and select `public/samples/sample_marking_guide.txt`
5. Review marking criteria attached to each question
6. Optionally edit questions or guides
7. Save assignment
8. Go to "Mark Scripts" and upload student scripts
9. The marking engine will use the uploaded guide

## Backward Compatibility

- ✅ Existing assignments without uploaded documents work unchanged
- ✅ Typed questions and guides work as before
- ✅ Uploaded and typed guides can coexist
- ✅ No data migration needed
- ✅ Sample data (pre-loaded assignments) unaffected

## Future Enhancements

Potential improvements:
- Auto-detect question types (essay, short answer, multiple choice)
- Extract images from PDFs and attach to questions
- Support for multi-page assignments with section headers
- Batch parsing of multiple marking guides
- Export assignments back to PDF/DOCX with formatting

## Testing Checklist

- [x] Upload PDF assignment document
- [x] Upload DOCX assignment document
- [x] Upload TXT assignment document
- [x] Upload marking guide TXT
- [x] Parse questions correctly
- [x] Parse marking criteria correctly
- [x] Questions auto-populate
- [x] Criteria attach to questions
- [x] Manual editing after upload works
- [x] Save and load uploaded documents
- [x] Edit page shows uploaded documents
- [x] Remove and re-upload works
- [x] Marking engine uses uploaded guides
- [x] `npm run build` succeeds
- [x] `npm run export` succeeds
- [x] localStorage stores extracted text
- [x] GitHub Pages compatibility maintained

## Troubleshooting

**Q: Upload button doesn't respond?**
- Check browser console for errors
- Ensure file format is supported
- Try a different file format (e.g., TXT instead of PDF)

**Q: Questions not extracted correctly?**
- Check file format — scanned PDFs may not extract text well
- Manually edit questions after upload
- Try a text-based format (TXT, DOCX with text, Markdown)

**Q: Marking guide not attaching to questions?**
- Ensure guide has clear question markers ("Question 1:", "Q.1", "1.")
- Check that question count matches between assignment and guide
- Manually copy-paste guide text if auto-parsing fails

**Q: File too large?**
- localStorage has limits (~5-10 MB per domain)
- Reduce file size or use shorter text extracts
- Consider splitting large assignments into multiple smaller ones

**Q: Export fails?**
- Ensure no server-side code added
- All processing must be client-side
- Check `next.config.ts` for `output: 'export'` when `EXPORT=1`

## Summary

This feature allows examiners to:
- **Upload** assignment papers and marking guides as files
- **Extract** text automatically from PDF, DOCX, TXT, images, etc.
- **Parse** questions and criteria intelligently
- **Store** extracted content in localStorage (no backend)
- **Edit** and refine parsed content
- **Mark** student scripts using uploaded guides
- **Export** statically to GitHub Pages without changes

The feature maintains full backward compatibility, works offline, and requires no server infrastructure.
