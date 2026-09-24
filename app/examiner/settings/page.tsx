'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SignatureUpload } from '@/components/signature-upload';
import { examinerStorage, ExaminerProfile } from '@/lib/examiner-storage';

export default function ExaminerSettings() {
  const [profile, setProfile] = useState<ExaminerProfile>({
    name: '',
    institution: '',
    department: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = examinerStorage.getProfile();
    if (stored) {
      setProfile(stored);
    }
  }, []);

  const handleSave = () => {
    examinerStorage.saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Examiner Settings</h1>
          <p className="text-gray-600">Manage your profile and signature for marked scripts</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                This information will appear on marked scripts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Dr. Jane Mutasa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <Input
                  value={profile.institution || ''}
                  onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                  placeholder="Madziwa Teachers College"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <Input
                  value={profile.department || ''}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  placeholder="Educational Psychology"
                />
              </div>

              <Button onClick={handleSave} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {saved ? 'Saved!' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          <SignatureUpload />

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">About Marked Scripts</CardTitle>
              <CardDescription className="text-blue-700">
                Your name and signature will appear at the bottom of all marked scripts.
                This provides authenticity and allows students to identify the examiner.
                You can update these settings at any time.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
