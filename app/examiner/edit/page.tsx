'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ArrowLeft, Plus, X, Save, Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { storage } from '@/lib/storage';
import { Assignment, Question } from '@/lib/types';
import { processUploadedFile, parseAssignmentDocument, parseMarkingGuide, ParsedQuestion } from '@/lib/file-utils';

function EditAssignmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [maxAiContentPercent, setMaxAiContentPercent] = useState(20);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { prompt: '', maxMarks: 10, markingGuide: '' }
  ]);
  
  const [assignmentDocument, setAssignmentDocument] = useState<{
    fileName: string;
    extractedText: string;
    extractionMethod: string;
  } | null>(null);
  
  const [markingGuideDocument, setMarkingGuideDocument] = useState<{
    fileName: string;
    extractedText: string;
    extractionMethod: string;
  } | null>(null);
  
  const [isProcessingAssignment, setIsProcessingAssignment] = useState(false);
  const [isProcessingGuide, setIsProcessingGuide] = useState(false);
  
  const assignmentFileInputRef = useRef<HTMLInputElement>(null);
  const guideFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!assignmentId) {
      router.push('/examiner');
      return;
    }
    
    const assignment = storage.getAssignment(assignmentId);
    if (!assignment) {
      router.push('/examiner');
      return;
    }
    
    setTitle(assignment.title);
    setSubject(assignment.subject);
    setMaxAiContentPercent(assignment.maxAiContentPercent);
    setQuestions(assignment.questions.map(q => ({
      id: q.id,
      prompt: q.prompt,
      maxMarks: q.maxMarks,
      markingGuide: q.markingGuide || ''
    })));
    
    if (assignment.assignmentDocument) {
      setAssignmentDocument(assignment.assignmentDocument);
    }
    
    if (assignment.markingGuideDocument) {
      setMarkingGuideDocument(assignment.markingGuideDocument);
    }
    
    setLoading(false);
  }, [assignmentId, router]);

  const handleAssignmentUpload = async (file: File) => {
    setIsProcessingAssignment(true);
    try {
      const { content, method } = await processUploadedFile(file);
      setAssignmentDocument({
        fileName: file.name,
        extractedText: content,
        extractionMethod: method
      });
      
      const parsed = parseAssignmentDocument(content);
      
      if (parsed.suggestedTitle && !title) {
        setTitle(parsed.suggestedTitle);
      }
      
      if (parsed.suggestedQuestions.length > 0) {
        const shouldReplace = confirm(
          `Found ${parsed.suggestedQuestions.length} question(s) in the uploaded document.\n\n` +
          `Click OK to replace current questions with extracted ones, or Cancel to keep existing questions.`
        );
        
        if (shouldReplace) {
          setQuestions(parsed.suggestedQuestions.map(q => ({
            prompt: q.prompt,
            maxMarks: q.maxMarks,
            markingGuide: q.markingGuide || ''
          })));
        }
      }
    } catch (error: any) {
      alert(`Failed to process assignment document: ${error.message}`);
    } finally {
      setIsProcessingAssignment(false);
    }
  };

  const handleMarkingGuideUpload = async (file: File) => {
    setIsProcessingGuide(true);
    try {
      const { content, method } = await processUploadedFile(file);
      setMarkingGuideDocument({
        fileName: file.name,
        extractedText: content,
        extractionMethod: method
      });
      
      const parsed = parseMarkingGuide(content, questions as ParsedQuestion[]);
      
      if (parsed.questionGuides.length > 0) {
        const shouldApply = confirm(
          `Found marking criteria for ${parsed.questionGuides.length} question(s).\n\n` +
          `Click OK to apply these guides to your questions, or Cancel to keep existing guides.`
        );
        
        if (shouldApply) {
          const updatedQuestions = [...questions];
          parsed.questionGuides.forEach(({ questionIndex, guide }) => {
            if (questionIndex >= 0 && questionIndex < updatedQuestions.length) {
              updatedQuestions[questionIndex] = {
                ...updatedQuestions[questionIndex],
                markingGuide: guide
              };
            }
          });
          setQuestions(updatedQuestions);
        }
      } else if (parsed.generalGuide) {
        const shouldApply = confirm(
          `Found a general marking guide.\n\n` +
          `Click OK to apply this guide to all questions, or Cancel to keep existing guides.`
        );
        
        if (shouldApply) {
          setQuestions(questions.map(q => ({
            ...q,
            markingGuide: parsed.generalGuide
          })));
        }
      }
    } catch (error: any) {
      alert(`Failed to process marking guide: ${error.message}`);
    } finally {
      setIsProcessingGuide(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { prompt: '', maxMarks: 10, markingGuide: '' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSave = () => {
    if (!assignmentId) return;
    
    if (!title.trim() || !subject.trim() || questions.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    const hasEmptyQuestions = questions.some(q => !q.prompt?.trim() || !q.maxMarks);
    if (hasEmptyQuestions) {
      alert('All questions must have a prompt and marks');
      return;
    }

    const totalMarks = questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

    const assignment: Assignment = {
      id: assignmentId,
      title: title.trim(),
      subject: subject.trim(),
      totalMarks,
      maxAiContentPercent,
      createdAt: storage.getAssignment(assignmentId)?.createdAt || new Date().toISOString(),
      questions: questions.map(q => ({
        id: q.id || crypto.randomUUID(),
        prompt: q.prompt!.trim(),
        maxMarks: q.maxMarks!,
        markingGuide: q.markingGuide?.trim() || undefined
      })),
      assignmentDocument: assignmentDocument || undefined,
      markingGuideDocument: markingGuideDocument || undefined
    };

    storage.saveAssignment(assignment);
    router.push('/examiner');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.maxMarks || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Kuziva</span>
            </Link>
            <Link href="/examiner">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Assignment</h1>
          <p className="text-gray-600">Update assignment documents, questions, marking guides, and settings</p>
        </div>

        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Upload Assignment Document (Optional)</CardTitle>
              <CardDescription>
                Upload or replace the assignment/question paper as a file (PDF, DOCX, TXT, MD, images, etc.). 
                We'll extract text and help populate questions automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!assignmentDocument ? (
                <div className="flex gap-4">
                  <Button
                    onClick={() => assignmentFileInputRef.current?.click()}
                    disabled={isProcessingAssignment}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isProcessingAssignment ? 'Processing...' : 'Upload Assignment'}
                  </Button>
                  <input
                    ref={assignmentFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleAssignmentUpload(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-green-300 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{assignmentDocument.fileName}</p>
                      <p className="text-sm text-gray-600">Extracted via {assignmentDocument.extractionMethod}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAssignmentDocument(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle>Upload Marking Guide (Optional)</CardTitle>
              <CardDescription>
                Upload or replace the official marking guide/memorandum/rubric document. We'll extract criteria and attach them to questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!markingGuideDocument ? (
                <div className="flex gap-4">
                  <Button
                    onClick={() => guideFileInputRef.current?.click()}
                    disabled={isProcessingGuide}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isProcessingGuide ? 'Processing...' : 'Upload Marking Guide'}
                  </Button>
                  <input
                    ref={guideFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleMarkingGuideUpload(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-green-300 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{markingGuideDocument.fileName}</p>
                      <p className="text-sm text-gray-600">Extracted via {markingGuideDocument.extractionMethod}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMarkingGuideDocument(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mid-Term Examination"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Educational Psychology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum AI Content Percentage (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={maxAiContentPercent}
                  onChange={(e) => setMaxAiContentPercent(Number(e.target.value))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  If a student's AI content exceeds this threshold, they will be recommended to redo the assignment.
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Marks:</span>
                  <span className="text-2xl font-bold text-blue-600">{totalMarks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Questions</h2>
            <Button onClick={addQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          {questions.map((question, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Prompt *
                  </label>
                  <Textarea
                    value={question.prompt || ''}
                    onChange={(e) => updateQuestion(index, 'prompt', e.target.value)}
                    placeholder="Enter the question text..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Marks *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={question.maxMarks || ''}
                    onChange={(e) => updateQuestion(index, 'maxMarks', Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marking Guide / Rubric (Optional)
                  </label>
                  <Textarea
                    value={question.markingGuide || ''}
                    onChange={(e) => updateQuestion(index, 'markingGuide', e.target.value)}
                    placeholder="Enter marking criteria, one per line:&#10;- Clear explanation of concept (5 marks)&#10;- Practical examples provided (3 marks)&#10;- Correct terminology used (2 marks)"
                    rows={5}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    If provided, the marking engine will grade against each criterion separately. 
                    Leave blank for general marking based on relevance and completeness.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-4">
            <Button onClick={handleSave} size="lg" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Link href="/examiner" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function EditAssignment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EditAssignmentContent />
    </Suspense>
  );
}
