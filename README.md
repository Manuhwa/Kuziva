# Kuziva - Intelligent Assignment & Exam Marking

AI-powered assignment marking application for teachers and lecturers. Mark assignments efficiently with automated grading, AI content detection, and detailed feedback.

## Features

### Core Capabilities
- **Batch Document Upload**: Upload multiple student documents at once (PDF, DOCX, TXT, MD, RTF, ODT, HTML, images via OCR, CSV, JSON)
- **Intelligent Marking**: Multi-pass exhaustive analysis checking question demands, marking guides, coverage, strengths, and consistency
- **AI Content Detection**: Multi-signal analysis to detect AI-generated content with configurable thresholds
- **Detailed Feedback**: In-text comments with ticks (✓), crosses (✗), and warnings (⚠) plus criterion-by-criterion grading
- **Examiner Signature**: Upload or draw signature to appear on all marked scripts
- **Marked Script Export**: Download HTML marked copies with annotations, marks, and examiner signature
- **Offline-First**: Works without API keys using local heuristic engine; optional OpenAI integration for enhanced analysis

### Thorough Multi-Pass Marking Engine
For every student script and every question, the marking engine performs:

1. **Question-demand loop** — Detects demand words (explain, discuss, compare, etc.) and verifies each is addressed
2. **Marking-guide loop** — If rubric exists, scores each criterion separately with partial credit
3. **No-guide fallback loop** — If no rubric, checks relevance, completeness, accuracy, structure, evidence
4. **Coverage/omission loop** — Scans for missing concepts, wrong focus, off-topic content
5. **Strength loop** — Identifies strong evidence and places ✓ annotations
6. **Consistency loop** — Validates marks ≤ max, comments match score, redo decision aligns with AI %
7. **AI-content loop** — Runs multiple signals: generic phrasing, template structure, lack of specifics, unnatural uniformity
8. **Cross-question loop** — Ensures unanswered questions receive 0 + "not attempted" comment

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will start on port 3000. Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
npm run build
npm start
```

## Demo Guide for Lecturers

### Quick 5-Minute Demo

1. **Open the app** at http://localhost:3000
2. Click **"Get Started"** or **"Examiner Portal"**
3. You'll see 2 pre-loaded sample assignments
4. Click **"Mark Scripts"** on "Educational Psychology Mid-Term"
5. **Drag and drop** the 3 sample files from `public/samples/` folder:
   - `Tendai_Moyo_EduPsych.txt`
   - `Grace_Chikwamba_EduPsych.txt`
   - `Farai_Ndlovu_EduPsych.txt`
6. Click **"Mark All"** and watch the batch processing
7. Click **"View"** on any completed result to see:
   - In-text annotations with ✓ ticks and ⚠ warnings
   - Criterion-by-criterion marks
   - AI content % and pass/redo recommendation
   - Total score
8. Click **"Download"** to get the marked script as HTML
9. Go to **Settings** to add your signature

### Complete Feature Tour

#### 1. Setup Your Profile (Optional but Recommended)
- Go to **Settings** from the Examiner Portal
- Enter your name (e.g., "Dr. Jane Mutasa")
- Add institution (e.g., "Madziwa Teachers College")
- Upload or draw your signature
- This signature will appear on all marked scripts

#### 2. Create a New Assignment
- Click **"Create New Assignment"**
- Enter title (e.g., "Grade 6 Science Test")
- Enter subject (e.g., "General Science")
- Set AI threshold (e.g., 20% - students over this get REDO)
- Add questions:
  - Question prompt
  - Maximum marks
  - Optional marking guide/rubric (each criterion on a new line)
- Click **"Save Assignment"**

#### 3. Batch Mark Student Scripts
- Select any assignment
- Click **"Mark Scripts"**
- **Upload multiple files at once**:
  - Drag & drop files into the upload zone, OR
  - Click to browse and select multiple files
  - Accepts: PDF, Word, text, Markdown, images, and more
- Click **"Mark All (N)"** to process the batch
- Watch status change: pending → marking → completed
- Each file shows: total marks, AI %, status

#### 4. Review Marked Results
- Click **"View"** on any completed script
- See comprehensive feedback:
  - **AI Content Banner**: Pass/Fail with % and rationale
  - **Question-by-question breakdown**:
    - Student answer with in-text highlighting
    - ✓ Green = good points
    - ✗ Red = errors or missing content
    - ⚠ Yellow = warnings
    - 💬 Blue = general comments
  - **Marking table** (if rubric used): criterion | marks | comment
  - **Examiner comment**: Overall feedback per question
  - **Total score** with percentage

#### 5. Download Marked Scripts
- Click **"Download Marked Script"** button
- Gets HTML file with:
  - All annotations and marks
  - Your signature stamp at bottom
  - Your name and date
  - Professional print-ready format
- Student can see exactly where they gained/lost marks

### Batch Demo with Sample Files

To demonstrate batch marking with the included samples:

1. Go to Examiner Portal
2. Click "Mark Scripts" on "Educational Psychology Mid-Term"
3. Navigate to the `public/samples/` folder in your file browser
4. Select all 3 `.txt` files and upload them
5. Click "Mark All (3)"
6. Within seconds, see:
   - Tendai Moyo: High score, detailed feedback, strong performance
   - Grace Chikwamba: Good score, meets criteria
   - Farai Ndlovu: Lower score, needs improvement
7. View each to see how the marking engine:
   - Places ✓ on strong evidence
   - Flags missing concepts with ✗
   - Scores each rubric criterion separately
   - Detects AI content signals
   - Provides constructive feedback

## Optional OpenAI Integration

To enable enhanced AI marking (optional):

1. Set environment variable:
   ```bash
   OPENAI_API_KEY=your-key-here
   ```

2. Optionally set custom base URL:
   ```bash
   OPENAI_BASE_URL=https://your-custom-endpoint
   ```

3. Restart the server

The app works fully without API keys using local heuristic analysis. API integration provides richer natural language feedback.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Document Parsing**: 
  - PDF: pdfjs-dist
  - Word: mammoth
  - Images: tesseract.js (OCR)
- **Storage**: localStorage (client-side, no database required)
- **Deployment**: Static export compatible (works on any static host)

## File Format Support

### Text Documents
- `.txt` - Plain text
- `.md`, `.markdown` - Markdown

### Office Documents
- `.pdf` - PDF (text extraction via PDF.js)
- `.docx` - Microsoft Word (via Mammoth)
- `.rtf` - Rich Text Format (basic extraction)
- `.odt` - OpenDocument Text (basic extraction)

### Web & Markup
- `.html`, `.htm` - HTML documents

### Images (OCR)
- `.png`, `.jpg`, `.jpeg` - Images with Tesseract OCR
- `.webp`, `.gif`, `.bmp` - Other image formats

### Data Formats
- `.json` - JSON data
- `.csv` - CSV tables

**Note**: For scanned PDFs or low-quality images, OCR quality may vary. Best results with digital PDFs and high-resolution scans.

## Architecture

### Multi-Pass Marking Engine (`lib/marking-engine.ts`)
- Exhaustive analysis loops for thoroughness
- Criterion-by-criterion scoring
- AI content detection with multiple signals
- Consistency validation
- Both local heuristic and optional LLM paths

### Storage (`lib/storage.ts`, `lib/examiner-storage.ts`)
- Assignments, results, and examiner profiles in localStorage
- No backend required
- Data persists across sessions

### File Processing (`lib/file-utils.ts`)
- Client-side document parsing
- Multi-format support
- Student name extraction from filenames/content
- Marked document generation with signature stamps

## Development

### Project Structure

```
/app
  /examiner           - Examiner portal pages
  /result             - Marked result viewer
  page.tsx            - Landing page
/components
  /ui                 - Reusable UI components
  signature-upload.tsx - Signature canvas/upload
/lib
  marking-engine.ts   - Core marking logic
  file-utils.ts       - Document processing
  storage.ts          - Data persistence
  types.ts            - TypeScript interfaces
```

### Key Components

- **Batch Upload**: Drag-and-drop zone with multi-file support
- **Marking Pipeline**: Async processing with progress tracking
- **Result Viewer**: Interactive annotations with hover tooltips
- **Signature Canvas**: Draw or upload examiner signature

## Deployment

### Static Export (Recommended)

```bash
npm run build
```

Output in `.next/` can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static host

### Environment Variables (Optional)

- `OPENAI_API_KEY` - For enhanced AI marking
- `OPENAI_BASE_URL` - Custom OpenAI-compatible endpoint

## Educational Context

Built with Madziwa Teachers College and Zimbabwean educational contexts in mind:
- Offline-first design (unreliable internet)
- No subscriptions or vendor lock-in
- Local marking guide examples (ZPD, Piaget, Bruner, sustainable agriculture)
- Sample data reflects African teaching contexts

## License

Built for educators, by educators.

## Support

For issues or questions, see the inline documentation or create an issue in the repository.
