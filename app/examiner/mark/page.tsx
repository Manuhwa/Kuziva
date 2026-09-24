'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ArrowLeft, Upload, File, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { Assignment } from '@/lib/types';
import { FileSubmission, processUploadedFile, extractStudentName, downloadMarkedDocument } from '@/lib/file-utils';
import { MarkingEngine } from '@/lib/marking-engine';
import { examinerStorage } from '@/lib/examiner-storage';

function MarkAssignmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assignmentId = searchParams.get('id');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [files, setFiles] = useState<FileSubmission[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!assignmentId) {
      router.push('/examiner');
      return;
    }

    try {
      const loaded = storage.getAssignment(assignmentId);
      if (loaded) {
        setAssignment(loaded);
      } else {
        router.push('/examiner');
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
      router.push('/examiner');
    }
  }, [assignmentId, router]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (uploadedFiles: File[]) => {
    const newSubmissions: FileSubmission[] = uploadedFiles.map(file => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      content: '',
      originalFile: file,
      status: 'pending',
      extractionMethod: ''
    }));

    setFiles(prev => [...prev, ...newSubmissions]);
  };

  const processAndMark = async () => {
    if (!assignment) return;

    setIsProcessing(true);
    const engine = new MarkingEngine({
      useOpenAI: false
    });

    for (const fileSubmission of files) {
      if (fileSubmission.status !== 'pending') continue;

      try {
        setFiles(prev => prev.map(f => 
          f.id === fileSubmission.id ? { ...f, status: 'marking' } : f
        ));

        if (!fileSubmission.originalFile) continue;

        const { content, method } = await processUploadedFile(fileSubmission.originalFile);
        
        const studentName = extractStudentName(fileSubmission.fileName, content);

        const answers = assignment.questions.map(q => ({
          questionId: q.id,
          text: content
        }));

        const result = await engine.markSubmission(
          assignment.id,
          studentName,
          assignment.questions,
          answers,
          assignment.maxAiContentPercent
        );

        storage.saveResult(result);

        setFiles(prev => prev.map(f =>
          f.id === fileSubmission.id
            ? { ...f, content, extractionMethod: method, status: 'completed', result }
            : f
        ));

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setFiles(prev => prev.map(f =>
          f.id === fileSubmission.id
            ? { ...f, status: 'failed', error: message }
            : f
        ));
      }
    }

    setIsProcessing(false);
  };

  const downloadMarked = (fileSubmission: FileSubmission) => {
    if (!fileSubmission.result || !assignment) return;
    const profile = examinerStorage.getProfile();
    downloadMarkedDocument(
      fileSubmission.result,
      assignment,
      profile?.name,
      profile?.signature
    );
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: FileSubmission['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-5 w-5 text-gray-400" />;
      case 'marking':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: FileSubmission['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      case 'marking':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
    }
  };

  if (!assignmentId || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const failedCount = files.filter(f => f.status === 'failed').length;

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
                Back to Portal
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mark Scripts</h1>
          <p className="text-gray-600 mb-4">{assignment.title}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{assignment.questions.length} questions</span>
            <span>•</span>
            <span>{assignment.totalMarks} marks total</span>
            <span>•</span>
            <span>AI threshold: {assignment.maxAiContentPercent}%</span>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Student Scripts</CardTitle>
            <CardDescription>
              Upload any common document format: PDF, Word (.docx), plain text, Markdown, RTF, ODT, HTML, images (PNG/JPG), or CSV/JSON data files.
              Multiple files can be uploaded and marked in one batch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Supports: PDF, DOCX, TXT, MD, RTF, ODT, HTML, PNG, JPG, CSV, JSON
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Select Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-600">
                  {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                </span>
                {completedCount > 0 && (
                  <span className="text-green-600 font-medium">
                    {completedCount} completed
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-red-600 font-medium">
                    {failedCount} failed
                  </span>
                )}
              </div>
              {pendingCount > 0 && (
                <Button onClick={processAndMark} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Mark All ({pendingCount})</>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {files.map(file => (
                <Card key={file.id} className={getStatusColor(file.status)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(file.status)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.fileName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span className="capitalize">{file.status}</span>
                            {file.extractionMethod && (
                              <>
                                <span>•</span>
                                <span>Extracted via {file.extractionMethod}</span>
                              </>
                            )}
                            {file.result && (
                              <>
                                <span>•</span>
                                <span className="font-medium">
                                  {file.result.totalScore}/{file.result.totalMaxScore} marks
                                </span>
                                <span>•</span>
                                <span className={file.result.recommendRedo ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  AI: {file.result.aiContentPercent}%
                                </span>
                              </>
                            )}
                          </div>
                          {file.error && (
                            <p className="text-sm text-red-600 mt-1">Error: {file.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {file.status === 'completed' && file.result && (
                          <>
                            <Link href={`/result?id=${file.result.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadMarked(file)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {file.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function MarkAssignment() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MarkAssignmentContent />
    </Suspense>
  );
}
