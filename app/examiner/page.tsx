'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Plus, FileText, Settings, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { storage } from '@/lib/storage';
import { sampleAssignments } from '@/lib/sample-data';
import { Assignment } from '@/lib/types';

export default function ExaminerPortal() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = () => {
    const stored = storage.getAssignments();
    if (stored.length === 0) {
      sampleAssignments.forEach(sa => storage.saveAssignment(sa));
      setAssignments(sampleAssignments);
    } else {
      setAssignments(stored);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Kuziva</span>
            </Link>
            <div className="flex gap-4">
              <Link href="/examiner/settings">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Examiner Portal</h1>
          <p className="text-gray-600">Manage assignments, mark submissions, and review results</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/examiner/create">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create New Assignment
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Set up a new exam or assignment with questions and marking criteria
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Quick Stats</CardTitle>
              <CardContent className="p-0 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
                    <div className="text-sm text-blue-700">Assignments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {assignments.reduce((sum, a) => sum + a.questions.length, 0)}
                    </div>
                    <div className="text-sm text-blue-700">Total Questions</div>
                  </div>
                </div>
              </CardContent>
            </CardHeader>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Assignments</h2>
        </div>

        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const results = storage.getResultsForAssignment(assignment.id);
            
            return (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-gray-700">Subject: {assignment.subject}</span>
                          <span>•</span>
                          <span>{assignment.questions.length} questions</span>
                          <span>•</span>
                          <span>{assignment.totalMarks} marks</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Created: {formatDate(assignment.createdAt)}</span>
                          <span className="mx-2">•</span>
                          <span className="text-gray-600">AI threshold: {assignment.maxAiContentPercent}%</span>
                        </div>
                        {results.length > 0 && (
                          <div className="text-sm text-green-600 font-medium mt-2">
                            {results.length} submission{results.length !== 1 ? 's' : ''} marked
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/examiner/mark/${assignment.id}`}>
                        <Button>
                          <Upload className="h-4 w-4 mr-2" />
                          Mark Scripts
                        </Button>
                      </Link>
                      {results.length > 0 && (
                        <Link href={`/examiner/results/${assignment.id}`}>
                          <Button variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            View Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
              <p className="text-gray-600 mb-6">Create your first assignment to get started</p>
              <Link href="/examiner/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
