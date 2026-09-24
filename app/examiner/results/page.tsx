'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ArrowLeft, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { examinerStorage } from '@/lib/examiner-storage';
import { Assignment, MarkingResult } from '@/lib/types';
import { downloadMarkedDocument } from '@/lib/file-utils';

function AssignmentResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assignmentId = searchParams.get('id');
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [results, setResults] = useState<MarkingResult[]>([]);

  useEffect(() => {
    if (!assignmentId) {
      router.push('/examiner');
      return;
    }

    const loaded = storage.getAssignment(assignmentId);
    if (loaded) {
      setAssignment(loaded);
      const assignmentResults = storage.getResultsForAssignment(assignmentId);
      setResults(assignmentResults);
    } else {
      router.push('/examiner');
    }
  }, [assignmentId, router]);

  const handleDownload = (result: MarkingResult) => {
    if (!assignment) return;
    const profile = examinerStorage.getProfile();
    downloadMarkedDocument(result, assignment, profile?.name, profile?.signature);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!assignmentId || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const passedCount = results.filter(r => !r.recommendRedo).length;
  const redoCount = results.filter(r => r.recommendRedo).length;
  const averageScore = results.length > 0
    ? results.reduce((sum, r) => sum + (r.totalScore / r.totalMaxScore) * 100, 0) / results.length
    : 0;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Marked Scripts</h1>
          <p className="text-gray-600 mb-4">{assignment.title}</p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{assignment.subject}</span>
            <span>•</span>
            <span>{assignment.questions.length} questions</span>
            <span>•</span>
            <span>{assignment.totalMarks} marks total</span>
          </div>
        </div>

        {results.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{results.length}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Scripts</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{passedCount}</div>
                  <div className="text-sm text-gray-600 mt-1">Passed AI Check</div>
                  {redoCount > 0 && (
                    <div className="text-sm text-red-600 mt-1">{redoCount} need redo</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{Math.round(averageScore)}%</div>
                  <div className="text-sm text-gray-600 mt-1">Average Score</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {results.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Marked Scripts Yet</h3>
              <p className="text-gray-600 mb-6">Upload and mark student submissions to see results here</p>
              <Link href={`/examiner/mark?id=${assignment.id}`}>
                <Button>Mark Scripts Now</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">All Results</h2>
              <Link href={`/examiner/mark?id=${assignment.id}`}>
                <Button variant="outline">Mark More Scripts</Button>
              </Link>
            </div>

            {results
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .map(result => {
                const percentage = Math.round((result.totalScore / result.totalMaxScore) * 100);
                
                return (
                  <Card key={result.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{result.studentName}</h3>
                            {result.recommendRedo ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3" />
                                REDO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3" />
                                PASS
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>Marked: {formatDate(result.submittedAt)}</span>
                            <span>•</span>
                            <span className={result.recommendRedo ? 'text-red-600 font-medium' : 'text-green-600'}>
                              AI: {result.aiContentPercent}%
                            </span>
                          </div>

                          <div className="text-sm text-gray-600">
                            {result.aiRationale}
                          </div>
                        </div>

                        <div className="text-right ml-6">
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {result.totalScore}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            out of {result.totalMaxScore}
                          </div>
                          <div className="text-lg font-medium text-gray-700">
                            {percentage}%
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Link href={`/result?id=${result.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => handleDownload(result)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AssignmentResults() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AssignmentResultsContent />
    </Suspense>
  );
}
