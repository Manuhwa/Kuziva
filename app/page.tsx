import Link from "next/link";
import { GraduationCap, CheckCircle, FileText, Zap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Kuziva</span>
            </div>
            <div className="flex gap-4">
              <Link href="/examiner">
                <Button variant="outline">Examiner Portal</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Intelligent Assignment & Exam Marking
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI-powered marking assistant for teachers and lecturers. Mark assignments efficiently with automated grading, AI content detection, and detailed feedback.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/examiner">
              <Button size="lg" className="text-lg px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/examiner">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Fast Batch Marking</CardTitle>
              <CardDescription>
                Upload multiple student documents at once and mark them all in seconds
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>AI Content Detection</CardTitle>
              <CardDescription>
                Automatically detect AI-generated content with detailed analysis and threshold controls
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Detailed Feedback</CardTitle>
              <CardDescription>
                In-text comments, criterion-by-criterion marking, and automated feedback generation
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Create Assignment</h3>
              <p className="text-sm text-gray-600">Set up questions, marking guides, and AI content thresholds</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Upload Scripts</h3>
              <p className="text-sm text-gray-600">Batch upload any document format - PDF, Word, text, images</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">Thorough multi-pass marking against criteria and demands</p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Download Results</h3>
              <p className="text-sm text-gray-600">Export marked scripts with annotations and signature</p>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl text-white mb-4">Built for African Educators</CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Designed with Madziwa Teachers College and Zimbabwean educational contexts in mind.
              Works offline with optional API enhancement. No subscriptions, no vendor lock-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/examiner">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Start Marking Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-16 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2026 Kuziva. Built for educators, by educators.</p>
        </div>
      </footer>
    </div>
  );
}
