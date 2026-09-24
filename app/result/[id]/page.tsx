'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { examinerStorage } from '@/lib/examiner-storage';
import { MarkingResult } from '@/lib/types';
import { downloadMarkedDocument } from '@/lib/file-utils';

export default function ViewResult() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  const [result, setResult] = useState<MarkingResult | null>(null);
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    const loaded = storage.getResult(resultId);
    if (loaded) {
      setResult(loaded);
      const assign = storage.getAssignment(loaded.assignmentId);
      setAssignment(assign);
    } else {
      router.push('/examiner');
    }
  }, [resultId, router]);

  const handleDownload = () => {
    if (!result || !assignment) return;
    const profile = examinerStorage.getProfile();
    downloadMarkedDocument(result, assignment, profile?.name, profile?.signature);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderAnswerWithAnnotations = (answerText: string, comments: any[]) => {
    if (comments.length === 0) {
      return <p className="whitespace-pre-wrap">{answerText}</p>;
    }

    const segments: { text: string; comment?: any }[] = [];
    let lastIndex = 0;

    const sortedComments = [...comments].sort((a, b) => a.position - b.position);

    sortedComments.forEach(comment => {
      if (comment.position > lastIndex) {
        segments.push({ text: answerText.substring(lastIndex, comment.position) });
      }

      segments.push({
        text: answerText.substring(comment.position, comment.position + comment.length),
        comment
      });

      lastIndex = comment.position + comment.length;
    });

    if (lastIndex < answerText.length) {
      segments.push({ text: answerText.substring(lastIndex) });
    }

    const getBgColor = (type: string) => {
      const colors: Record<string, string> = {
        tick: 'bg-green-100 border-b-2 border-green-500',
        cross: 'bg-red-100 border-b-2 border-red-500',
        warning: 'bg-yellow-100 border-b-2 border-yellow-500',
        comment: 'bg-blue-100 border-b-2 border-blue-500'
      };
      return colors[type] || colors.comment;
    };

    const getIcon = (type: string) => {
      const icons: Record<string, string> = {
        tick: '✓',
        cross: '✗',
        warning: '⚠',
        comment: '💬'
      };
      return icons[type] || icons.comment;
    };

    return (
      <div className="whitespace-pre-wrap">
        {segments.map((segment, idx) => {
          if (segment.comment) {
            const bgColor = getBgColor(segment.comment.type);
            const icon = getIcon(segment.comment.type);

            return (
              <span
                key={idx}
                className={`${bgColor} px-1 py-0.5 rounded relative group cursor-help`}
                title={segment.comment.text}
              >
                {segment.text}
                <sup className="ml-0.5 text-xs">{icon}</sup>
                <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {segment.comment.text}
                </span>
              </span>
            );
          }
          return <span key={idx}>{segment.text}</span>;
        })}
      </div>
    );
  };

  if (!result || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading result...</p>
        </div>
      </div>
    );
  }

  const percentage = Math.round((result.totalScore / result.totalMaxScore) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Kuziva</span>
            </Link>
            <div className="flex gap-2">
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download Marked Script
              </Button>
              <Link href="/examiner">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{assignment.title}</CardTitle>
                <CardDescription className="text-base">
                  Student: <span className="font-medium">{result.studentName}</span>
                  <br />
                  Marked: {formatDate(result.submittedAt)}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {result.totalScore} / {result.totalMaxScore}
                </div>
                <div className="text-sm text-gray-600">{percentage}%</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {result.recommendRedo ? (
          <Card className="mb-6 bg-red-50 border-red-300">
            <CardHeader>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <CardTitle className="text-red-900 mb-2">REDO RECOMMENDED</CardTitle>
                  <CardDescription className="text-red-800">
                    This submission exceeds the maximum allowed AI-generated content threshold 
                    ({result.aiContentPercent}% detected, {assignment.maxAiContentPercent}% maximum allowed).
                    <br /><br />
                    <strong>Rationale:</strong> {result.aiRationale}
                    <br /><br />
                    The student should resubmit with original work. While full marking analysis is shown below,
                    this submission cannot receive a passing grade until the AI content threshold is met.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ) : (
          <Card className="mb-6 bg-green-50 border-green-300">
            <CardHeader>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <CardTitle className="text-green-900 mb-2">AI Content Check: PASSED</CardTitle>
                  <CardDescription className="text-green-800">
                    AI-generated content estimate: <strong>{result.aiContentPercent}%</strong> 
                    (threshold: {assignment.maxAiContentPercent}%)
                    <br />
                    {result.aiRationale}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="space-y-8">
          {result.questionMarks.map((qm, idx) => {
            const question = assignment.questions.find((q: any) => q.id === qm.questionId);
            const answer = result.answers.find((a: any) => a.questionId === qm.questionId);

            if (!question) return null;

            return (
              <Card key={qm.questionId}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Question {idx + 1} ({qm.maxScore} marks)
                  </CardTitle>
                  <CardDescription className="text-base text-gray-700 mt-2">
                    {question.prompt}
                  </CardDescription>
                  {question.markingGuide && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        View Marking Guide
                      </summary>
                      <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {question.markingGuide}
                      </div>
                    </details>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Student Answer:</h4>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 leading-relaxed">
                        {answer ? renderAnswerWithAnnotations(answer.text, qm.inlineComments) : (
                          <p className="text-gray-500 italic">No answer provided</p>
                        )}
                      </div>
                    </div>

                    {qm.criteriaMarks && qm.criteriaMarks.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Criterion-by-Criterion Marking:</h4>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left p-3 font-medium text-gray-700">Criterion</th>
                                <th className="text-center p-3 font-medium text-gray-700 w-24">Marks</th>
                                <th className="text-left p-3 font-medium text-gray-700">Comment</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {qm.criteriaMarks.map((cm, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="p-3">{cm.criterion}</td>
                                  <td className="p-3 text-center font-medium">
                                    {cm.marks}/{cm.maxMarks}
                                  </td>
                                  <td className="p-3 text-gray-600">{cm.comment}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <h4 className="font-medium text-blue-900 mb-1">Examiner Comment:</h4>
                      <p className="text-blue-800">{qm.generalComment}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">
                        Alignment Score: {qm.alignmentScore}%
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        Marks Awarded: {qm.score} / {qm.maxScore}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 bg-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Score</div>
                <div className="text-4xl font-bold text-gray-900">
                  {result.totalScore} / {result.totalMaxScore}
                </div>
                <div className="text-lg text-gray-600 mt-1">{percentage}%</div>
              </div>
              {result.recommendRedo && (
                <div className="text-right">
                  <div className="text-red-600 font-bold text-lg">REDO REQUIRED</div>
                  <div className="text-sm text-gray-600">AI content over threshold</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
