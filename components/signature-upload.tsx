'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { examinerStorage } from '@/lib/examiner-storage';

export function SignatureUpload() {
  const [signature, setSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const profile = examinerStorage.getProfile();
    if (profile?.signature) {
      setSignature(profile.signature);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSignature(dataUrl);
      examinerStorage.updateSignature(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignature(dataUrl);
    examinerStorage.updateSignature(dataUrl);
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const removeSignature = () => {
    setSignature(null);
    examinerStorage.clearSignature();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Examiner Signature
        </CardTitle>
        <CardDescription>
          Add your signature to appear on marked scripts. Upload an image or draw your signature.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {signature && !isDrawing ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
              <img src={signature} alt="Signature" className="max-h-32 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDrawing(true)}>
                Draw New Signature
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Button>
              <Button variant="destructive" onClick={removeSignature}>
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : isDrawing ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="border border-gray-200 bg-white cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveDrawnSignature}>Save Signature</Button>
              <Button variant="outline" onClick={clearCanvas}>
                Clear
              </Button>
              <Button variant="outline" onClick={() => setIsDrawing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-500 mb-4">No signature uploaded</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={() => setIsDrawing(true)}>
                  Draw Signature
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </CardContent>
    </Card>
  );
}
