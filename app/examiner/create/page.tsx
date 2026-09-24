'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { storage } from '@/lib/storage';
import { Assignment, Question } from '@/lib/types';

export default function CreateAssignment() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [maxAiContentPercent, setMaxAiContentPercent] = useState(20);
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { prompt: '', maxMarks: 10, markingGuide: '' }
  ]);

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
      id: crypto.randomUUID(),
      title: title.trim(),
      subject: subject.trim(),
      totalMarks,
      maxAiContentPercent,
      createdAt: new Date().toISOString(),
      questions: questions.map(q => ({
        id: crypto.randomUUID(),
        prompt: q.prompt!.trim(),
        maxMarks: q.maxMarks!,
        markingGuide: q.markingGuide?.trim() || undefined
      }))
    };

    storage.saveAssignment(assignment);
    router.push('/examiner');
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Assignment</h1>
          <p className="text-gray-600">Set up questions, marking guides, and AI content thresholds</p>
        </div>

        <div className="space-y-6">
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
              Save Assignment
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
