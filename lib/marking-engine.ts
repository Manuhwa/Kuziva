import { Question, QuestionMark, InlineComment, MarkingResult } from './types';

interface MarkingEngineOptions {
  useOpenAI?: boolean;
  openAIKey?: string;
  openAIBaseURL?: string;
}

export class MarkingEngine {
  private options: MarkingEngineOptions;

  constructor(options: MarkingEngineOptions = {}) {
    this.options = options;
  }

  async markSubmission(
    assignmentId: string,
    studentName: string,
    questions: Question[],
    answers: { questionId: string; text: string }[],
    maxAiContentPercent: number
  ): Promise<MarkingResult> {
    const questionMarks: QuestionMark[] = [];
    let totalScore = 0;
    let totalMaxScore = 0;

    for (const question of questions) {
      const answer = answers.find(a => a.questionId === question.id);
      
      if (!answer || answer.text.trim().length === 0) {
        questionMarks.push({
          questionId: question.id,
          score: 0,
          maxScore: question.maxMarks,
          alignmentScore: 0,
          inlineComments: [{
            id: crypto.randomUUID(),
            text: '✗ Question not attempted',
            position: 0,
            length: 0,
            type: 'cross'
          }],
          generalComment: 'No response provided for this question. Please attempt all questions.'
        });
        totalMaxScore += question.maxMarks;
        continue;
      }

      const mark = await this.markQuestion(question, answer.text);
      questionMarks.push(mark);
      totalScore += mark.score;
      totalMaxScore += mark.maxScore;
    }

    const aiAnalysis = this.analyzeAIContent(answers.map(a => a.text).join('\n'));
    const recommendRedo = aiAnalysis.percentage > maxAiContentPercent;

    return {
      id: crypto.randomUUID(),
      assignmentId,
      studentName,
      submittedAt: new Date().toISOString(),
      aiContentPercent: aiAnalysis.percentage,
      aiRationale: aiAnalysis.rationale,
      recommendRedo,
      questionMarks,
      totalScore: Math.round(totalScore * 10) / 10,
      totalMaxScore,
      answers
    };
  }

  private async markQuestion(question: Question, answerText: string): Promise<QuestionMark> {
    if (this.options.useOpenAI && this.options.openAIKey) {
      return this.markQuestionWithAI(question, answerText);
    }
    return this.markQuestionLocally(question, answerText);
  }

  private async markQuestionWithAI(question: Question, answerText: string): Promise<QuestionMark> {
    try {
      const baseURL = this.options.openAIBaseURL || 'https://api.openai.com/v1';
      const prompt = this.buildMarkingPrompt(question, answerText);

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.openAIKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert examiner. Provide detailed, fair marking with constructive feedback.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return this.parseAIMarkingResponse(question, answerText, content);
    } catch (error) {
      console.error('AI marking failed, falling back to local:', error);
      return this.markQuestionLocally(question, answerText);
    }
  }

  private buildMarkingPrompt(question: Question, answerText: string): string {
    return `Mark this student answer against the question and criteria below.

QUESTION (${question.maxMarks} marks):
${question.prompt}

${question.markingGuide ? `MARKING GUIDE:\n${question.markingGuide}\n` : ''}

STUDENT ANSWER:
${answerText}

Provide your marking in JSON format:
{
  "score": <number>,
  "alignmentScore": <0-100>,
  "criteriaMarks": [{"criterion": "...", "marks": <number>, "maxMarks": <number>, "comment": "..."}],
  "inlineComments": [{"text": "...", "position": <char index>, "length": <chars>, "type": "tick|warning|cross|comment"}],
  "generalComment": "Overall feedback"
}`;
  }

  private parseAIMarkingResponse(question: Question, answerText: string, aiResponse: string): QuestionMark {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionId: question.id,
          score: Math.min(parsed.score || 0, question.maxMarks),
          maxScore: question.maxMarks,
          alignmentScore: parsed.alignmentScore || 50,
          criteriaMarks: parsed.criteriaMarks || [],
          inlineComments: (parsed.inlineComments || []).map((ic: any) => ({
            ...ic,
            id: crypto.randomUUID()
          })),
          generalComment: parsed.generalComment || ''
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }
    return this.markQuestionLocally(question, answerText);
  }

  private markQuestionLocally(question: Question, answerText: string): QuestionMark {
    const analysis = this.performExhaustiveAnalysis(question, answerText);
    
    const inlineComments: InlineComment[] = [];
    const criteriaMarks: { criterion: string; marks: number; maxMarks: number; comment: string }[] = [];
    
    let totalScore = 0;
    
    if (question.markingGuide) {
      const guideResults = analysis.markingGuideLoop;
      guideResults.criteria.forEach(criterion => {
        criteriaMarks.push({
          criterion: criterion.text,
          marks: criterion.awarded,
          maxMarks: criterion.maxMarks,
          comment: criterion.comment
        });
        totalScore += criterion.awarded;
        
        if (criterion.evidencePositions.length > 0) {
          criterion.evidencePositions.forEach((pos: { start: number; length: number }) => {
            inlineComments.push({
              id: crypto.randomUUID(),
              text: `✓ ${criterion.text.substring(0, 30)}...`,
              position: pos.start,
              length: pos.length,
              type: 'tick'
            });
          });
        }
      });
    } else {
      const noGuideResults = analysis.noGuideLoop;
      totalScore = noGuideResults.totalMarks;
      
      noGuideResults.components.forEach(comp => {
        if (comp.awarded > 0 && comp.evidencePosition) {
          inlineComments.push({
            id: crypto.randomUUID(),
            text: `✓ ${comp.name}`,
            position: comp.evidencePosition.start,
            length: comp.evidencePosition.length,
            type: 'tick'
          });
        }
      });
    }
    
    analysis.questionDemandLoop.unmetDemands.forEach(demand => {
      inlineComments.push({
        id: crypto.randomUUID(),
        text: `✗ Missing: ${demand}`,
        position: 0,
        length: Math.min(answerText.length, 100),
        type: 'cross'
      });
    });
    
    analysis.coverageLoop.omissions.forEach(omission => {
      inlineComments.push({
        id: crypto.randomUUID(),
        text: `⚠ ${omission.issue}`,
        position: omission.position,
        length: omission.length,
        type: 'warning'
      });
    });
    
    analysis.strengthLoop.strengths.forEach(strength => {
      inlineComments.push({
        id: crypto.randomUUID(),
        text: strength.comment,
        position: strength.position,
        length: strength.length,
        type: 'tick'
      });
    });
    
    const finalScore = Math.max(0, Math.min(totalScore, question.maxMarks));
    
    const consistencyCheck = this.performConsistencyLoop(
      finalScore,
      question.maxMarks,
      inlineComments,
      analysis
    );
    
    const generalComment = this.buildGeneralComment(
      analysis,
      finalScore,
      question.maxMarks,
      consistencyCheck
    );

    return {
      questionId: question.id,
      score: finalScore,
      maxScore: question.maxMarks,
      alignmentScore: analysis.questionDemandLoop.alignmentScore,
      criteriaMarks: criteriaMarks.length > 0 ? criteriaMarks : undefined,
      inlineComments,
      generalComment
    };
  }

  private performExhaustiveAnalysis(question: Question, answerText: string) {
    return {
      questionDemandLoop: this.analyzeQuestionDemands(question, answerText),
      markingGuideLoop: this.analyzeMarkingGuide(question, answerText),
      noGuideLoop: this.analyzeWithoutGuide(question, answerText),
      coverageLoop: this.analyzeCoverageAndOmissions(question, answerText),
      strengthLoop: this.analyzeStrengths(question, answerText),
      crossQuestionLoop: { attempted: answerText.trim().length > 0 }
    };
  }

  private analyzeQuestionDemands(question: Question, answerText: string) {
    const demandWords = {
      explain: ['explain', 'describe', 'elaborate', 'clarify'],
      discuss: ['discuss', 'examine', 'explore', 'consider'],
      compare: ['compare', 'contrast', 'differentiate', 'distinguish'],
      define: ['define', 'identify', 'state', 'what is'],
      list: ['list', 'enumerate', 'name', 'identify'],
      evaluate: ['evaluate', 'assess', 'judge', 'critique', 'analyze'],
      calculate: ['calculate', 'compute', 'solve', 'determine'],
      justify: ['justify', 'argue', 'support', 'defend'],
      apply: ['apply', 'use', 'implement', 'demonstrate']
    };

    const questionLower = question.prompt.toLowerCase();
    const answerLower = answerText.toLowerCase();
    const detectedDemands: string[] = [];
    const metDemands: string[] = [];
    const unmetDemands: string[] = [];

    for (const [demand, keywords] of Object.entries(demandWords)) {
      if (keywords.some(kw => questionLower.includes(kw))) {
        detectedDemands.push(demand);
        
        const demandMet = this.checkDemandMet(demand, answerText, question);
        if (demandMet) {
          metDemands.push(demand);
        } else {
          unmetDemands.push(demand);
        }
      }
    }

    const questionKeywords = this.extractKeywords(question.prompt);
    const answerKeywords = this.extractKeywords(answerText);
    const matchedKeywords = questionKeywords.filter(kw => 
      answerKeywords.some(ak => ak.toLowerCase() === kw.toLowerCase())
    );
    
    const alignmentScore = Math.min(100, Math.round(
      (matchedKeywords.length / Math.max(questionKeywords.length, 1)) * 100
    ));

    return {
      detectedDemands,
      metDemands,
      unmetDemands,
      alignmentScore,
      keywordMatches: matchedKeywords.length,
      totalKeywords: questionKeywords.length
    };
  }

  private checkDemandMet(demand: string, answerText: string, question: Question): boolean {
    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = answerText.trim().split(/\s+/);

    switch (demand) {
      case 'explain':
      case 'describe':
        return sentences.length >= 2 && words.length >= 30;
      
      case 'discuss':
      case 'examine':
        return sentences.length >= 3 && words.length >= 50 && 
               this.hasMultiplePerspectives(answerText);
      
      case 'compare':
      case 'contrast':
        return this.hasComparativeLanguage(answerText) && sentences.length >= 2;
      
      case 'define':
      case 'identify':
        return sentences.length >= 1 && words.length >= 10;
      
      case 'list':
      case 'enumerate':
        return this.hasListStructure(answerText);
      
      case 'evaluate':
      case 'assess':
        return this.hasEvaluativeLanguage(answerText) && sentences.length >= 2;
      
      case 'calculate':
      case 'compute':
        return /\d+/.test(answerText) && words.length >= 5;
      
      case 'justify':
      case 'argue':
        return sentences.length >= 2 && this.hasReasoningMarkers(answerText);
      
      case 'apply':
      case 'demonstrate':
        return this.hasConcreteExamples(answerText);
      
      default:
        return true;
    }
  }

  private hasMultiplePerspectives(text: string): boolean {
    const markers = ['however', 'on the other hand', 'alternatively', 'whereas', 
                     'while', 'although', 'conversely', 'in contrast'];
    return markers.some(marker => text.toLowerCase().includes(marker));
  }

  private hasComparativeLanguage(text: string): boolean {
    const markers = ['similar', 'different', 'both', 'while', 'whereas', 'unlike', 
                     'like', 'compared to', 'in contrast', 'difference', 'similarity'];
    return markers.some(marker => text.toLowerCase().includes(marker));
  }

  private hasListStructure(text: string): boolean {
    const bulletPoints = (text.match(/^[-•*]\s/gm) || []).length;
    const numberedPoints = (text.match(/^\d+[.)]\s/gm) || []).length;
    const commas = (text.match(/,/g) || []).length;
    return bulletPoints >= 2 || numberedPoints >= 2 || commas >= 2;
  }

  private hasEvaluativeLanguage(text: string): boolean {
    const markers = ['effective', 'successful', 'important', 'significant', 'advantage', 
                     'disadvantage', 'strength', 'weakness', 'benefit', 'limitation'];
    return markers.some(marker => text.toLowerCase().includes(marker));
  }

  private hasReasoningMarkers(text: string): boolean {
    const markers = ['because', 'therefore', 'thus', 'since', 'as a result', 
                     'consequently', 'due to', 'this means', 'leads to'];
    return markers.some(marker => text.toLowerCase().includes(marker));
  }

  private hasConcreteExamples(text: string): boolean {
    const markers = ['for example', 'for instance', 'such as', 'like', 'specifically', 
                     'in particular', 'namely'];
    return markers.some(marker => text.toLowerCase().includes(marker)) || 
           /\d/.test(text);
  }

  private analyzeMarkingGuide(question: Question, answerText: string) {
    if (!question.markingGuide) {
      return { criteria: [] };
    }

    const criteriaLines = question.markingGuide
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 5);

    const criteria: any[] = [];
    const answerLower = answerText.toLowerCase();

    criteriaLines.forEach((criterionText, idx) => {
      const cleanCriterion = criterionText.replace(/^[-•*]\s*/, '').trim();
      
      const marksMatch = cleanCriterion.match(/\((\d+)\s*marks?\)/i);
      const allocatedMarks = marksMatch 
        ? parseInt(marksMatch[1]) 
        : question.maxMarks / Math.max(criteriaLines.length, 1);

      const keywords = this.extractKeywords(cleanCriterion);
      const matchedKeywords = keywords.filter(kw => 
        answerLower.includes(kw.toLowerCase())
      );

      const coverageRatio = matchedKeywords.length / Math.max(keywords.length, 1);
      
      let awarded = 0;
      let comment = '';
      
      if (coverageRatio >= 0.8) {
        awarded = allocatedMarks;
        comment = 'Fully addressed with clear detail';
      } else if (coverageRatio >= 0.5) {
        awarded = allocatedMarks * 0.7;
        comment = 'Partially addressed, some key points covered';
      } else if (coverageRatio >= 0.3) {
        awarded = allocatedMarks * 0.4;
        comment = 'Minimally addressed, lacks depth';
      } else {
        awarded = 0;
        comment = 'Not adequately addressed or missing';
      }

      const evidencePositions: { start: number; length: number }[] = [];
      matchedKeywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        let match;
        while ((match = regex.exec(answerText)) !== null) {
          const sentenceStart = answerText.lastIndexOf('.', match.index) + 1;
          const sentenceEnd = answerText.indexOf('.', match.index);
          evidencePositions.push({
            start: sentenceStart,
            length: (sentenceEnd > sentenceStart ? sentenceEnd : match.index + kw.length) - sentenceStart
          });
          if (evidencePositions.length >= 2) break;
        }
      });

      criteria.push({
        text: cleanCriterion,
        maxMarks: Math.round(allocatedMarks * 10) / 10,
        awarded: Math.round(awarded * 10) / 10,
        coverageRatio,
        comment,
        matchedKeywords,
        evidencePositions
      });
    });

    return { criteria };
  }

  private analyzeWithoutGuide(question: Question, answerText: string) {
    const components: Array<{
      name: string;
      weight: number;
      score: number;
      awarded: number;
      evidencePosition: { start: number; length: number } | null;
    }> = [
      { name: 'Relevance', weight: 0.25, score: 0, awarded: 0, evidencePosition: null },
      { name: 'Completeness', weight: 0.25, score: 0, awarded: 0, evidencePosition: null },
      { name: 'Accuracy', weight: 0.20, score: 0, awarded: 0, evidencePosition: null },
      { name: 'Structure', weight: 0.15, score: 0, awarded: 0, evidencePosition: null },
      { name: 'Evidence', weight: 0.15, score: 0, awarded: 0, evidencePosition: null }
    ];

    const words = answerText.trim().split(/\s+/);
    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const paragraphs = answerText.split(/\n\n+/).filter(p => p.trim().length > 20);

    const questionKeywords = this.extractKeywords(question.prompt);
    const answerKeywords = this.extractKeywords(answerText);
    const keywordOverlap = questionKeywords.filter(qk => 
      answerKeywords.some(ak => ak.toLowerCase() === qk.toLowerCase())
    ).length;
    
    components[0].score = Math.min(100, (keywordOverlap / Math.max(questionKeywords.length, 1)) * 100);
    if (keywordOverlap > 0) {
      components[0].evidencePosition = { start: 0, length: Math.min(100, answerText.length) };
    }

    const expectedWordCount = question.maxMarks * 20;
    components[1].score = Math.min(100, (words.length / expectedWordCount) * 100);
    if (sentences.length >= 2) {
      const midPoint = Math.floor(answerText.length / 2);
      components[1].evidencePosition = { start: midPoint - 50, length: 100 };
    }

    const hasSpecifics = /\d{4}|\d+%|[A-Z][a-z]+ [A-Z][a-z]+/.test(answerText);
    const hasExamples = this.hasConcreteExamples(answerText);
    components[2].score = (hasSpecifics ? 50 : 0) + (hasExamples ? 50 : 0);
    if (hasSpecifics || hasExamples) {
      const match = answerText.match(/\d{4}|\d+%|[A-Z][a-z]+ [A-Z][a-z]+/);
      if (match) {
        components[2].evidencePosition = { start: match.index!, length: match[0].length };
      }
    }

    const hasParagraphs = paragraphs.length >= 2;
    const hasCoherence = this.hasReasoningMarkers(answerText);
    components[3].score = (hasParagraphs ? 50 : 0) + (hasCoherence ? 50 : 0);

    const hasEvidence = hasExamples || hasSpecifics || this.hasReasoningMarkers(answerText);
    components[4].score = hasEvidence ? 75 : 25;

    components.forEach(comp => {
      comp.awarded = (comp.score / 100) * (comp.weight * question.maxMarks);
    });

    const totalMarks = components.reduce((sum, comp) => sum + comp.awarded, 0);

    return {
      components: components.map(c => ({
        name: c.name,
        weight: c.weight,
        score: c.score,
        awarded: Math.round(c.awarded * 10) / 10,
        evidencePosition: c.evidencePosition
      })),
      totalMarks: Math.round(totalMarks * 10) / 10
    };
  }

  private analyzeCoverageAndOmissions(question: Question, answerText: string) {
    const omissions: { issue: string; position: number; length: number }[] = [];
    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 10);

    if (answerText.trim().length < 20) {
      omissions.push({
        issue: 'Response is too brief',
        position: 0,
        length: answerText.length
      });
    }

    const questionKeywords = this.extractKeywords(question.prompt);
    const answerLower = answerText.toLowerCase();
    const missingKeywords = questionKeywords.filter(kw => 
      !answerLower.includes(kw.toLowerCase())
    );

    if (missingKeywords.length > questionKeywords.length * 0.5) {
      omissions.push({
        issue: `Missing key concepts: ${missingKeywords.slice(0, 3).join(', ')}`,
        position: 0,
        length: Math.min(100, answerText.length)
      });
    }

    sentences.forEach((sentence, idx) => {
      const sentenceStart = answerText.indexOf(sentence.trim());
      const sentenceWords = this.extractKeywords(sentence);
      const questionOverlap = sentenceWords.filter(sw => 
        questionKeywords.some(qk => qk.toLowerCase() === sw.toLowerCase())
      ).length;

      if (questionOverlap === 0 && sentence.trim().split(/\s+/).length > 15) {
        omissions.push({
          issue: 'Potentially off-topic or irrelevant content',
          position: sentenceStart,
          length: sentence.trim().length
        });
      }
    });

    return { omissions };
  }

  private analyzeStrengths(question: Question, answerText: string) {
    const strengths: { comment: string; position: number; length: number }[] = [];
    const sentences = answerText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const questionKeywords = this.extractKeywords(question.prompt);

    sentences.forEach(sentence => {
      const sentenceStart = answerText.indexOf(sentence.trim());
      if (sentenceStart === -1) return;

      const sentenceWords = this.extractKeywords(sentence);
      const relevantWords = sentenceWords.filter(sw => 
        questionKeywords.some(qk => qk.toLowerCase() === sw.toLowerCase())
      );

      if (relevantWords.length >= 2 && sentence.trim().split(/\s+/).length >= 10) {
        const hasEvidence = /\d{4}|\d+%|for example|such as/.test(sentence.toLowerCase());
        if (hasEvidence) {
          strengths.push({
            comment: 'Strong point with specific evidence',
            position: sentenceStart,
            length: sentence.trim().length
          });
        } else if (relevantWords.length >= 3) {
          strengths.push({
            comment: 'Good explanation of key concept',
            position: sentenceStart,
            length: sentence.trim().length
          });
        }
      }

      if (this.hasReasoningMarkers(sentence) && sentenceWords.length >= 8) {
        strengths.push({
          comment: 'Clear reasoning and logic',
          position: sentenceStart,
          length: sentence.trim().length
        });
      }
    });

    return { strengths: strengths.slice(0, 5) };
  }

  private performConsistencyLoop(
    score: number,
    maxScore: number,
    comments: InlineComment[],
    analysis: any
  ): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];

    if (score > maxScore) {
      issues.push(`Score ${score} exceeds maximum ${maxScore}`);
    }

    if (score < 0) {
      issues.push(`Score cannot be negative: ${score}`);
    }

    const tickCount = comments.filter(c => c.type === 'tick').length;
    const crossCount = comments.filter(c => c.type === 'cross' || c.type === 'warning').length;
    const scorePercentage = (score / maxScore) * 100;

    if (scorePercentage >= 70 && tickCount === 0) {
      issues.push('High score but no positive feedback markers');
    }

    if (scorePercentage <= 30 && crossCount === 0) {
      issues.push('Low score but no critical feedback markers');
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }

  private buildGeneralComment(
    analysis: any,
    score: number,
    maxScore: number,
    consistency: any
  ): string {
    const percentage = (score / maxScore) * 100;
    let comment = '';

    const demandStatus = analysis.questionDemandLoop.unmetDemands.length === 0
      ? 'All question demands addressed.'
      : `Unmet demands: ${analysis.questionDemandLoop.unmetDemands.join(', ')}.`;

    if (percentage >= 85) {
      comment = `Excellent work. ${demandStatus} Strong demonstration of understanding with comprehensive coverage of the topic.`;
    } else if (percentage >= 70) {
      comment = `Good response. ${demandStatus} Shows solid understanding but could be strengthened with additional detail or examples.`;
    } else if (percentage >= 50) {
      comment = `Satisfactory attempt. ${demandStatus} Addresses key points but lacks depth and thorough development.`;
    } else if (percentage >= 30) {
      comment = `Needs improvement. ${demandStatus} Response is incomplete or lacks sufficient relevant content.`;
    } else {
      comment = `Inadequate response. ${demandStatus} Please review question requirements and provide comprehensive, relevant content.`;
    }

    if (analysis.coverageLoop.omissions.length > 0) {
      comment += ` Note: ${analysis.coverageLoop.omissions.length} significant omissions or issues flagged.`;
    }

    if (analysis.strengthLoop.strengths.length > 0) {
      comment += ` Positive: ${analysis.strengthLoop.strengths.length} strong points identified.`;
    }

    return comment;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                               'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
                               'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
                               'can', 'could', 'may', 'might', 'must', 'this', 'that', 'these', 'those']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  private analyzeAIContent(text: string): { percentage: number; rationale: string } {
    const signals = {
      genericPhrasing: 0,
      repetitivePatterns: 0,
      lackOfSpecifics: 0,
      unnaturalUniformity: 0,
      missingPersonalContext: 0,
      templateStructure: 0,
      perfectFormality: 0
    };

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = text.toLowerCase().split(/\s+/);

    const genericPhrases = [
      'it is important to note', 'in conclusion', 'furthermore', 'moreover',
      'it can be seen that', 'this demonstrates', 'as previously mentioned',
      'in summary', 'it is clear that', 'one can observe', 'it is evident',
      'this shows that', 'as mentioned above', 'it should be noted',
      'this indicates', 'as a result', 'in other words', 'to summarize',
      'it is worth noting', 'this suggests that', 'consequently',
      'it is well known', 'research shows', 'studies indicate'
    ];
    
    let genericCount = 0;
    genericPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      const matches = text.match(regex);
      if (matches) genericCount += matches.length;
    });
    signals.genericPhrasing = Math.min(25, genericCount * 8);

    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    const highRepetition = Object.values(wordFreq).filter(count => count > 4).length;
    signals.repetitivePatterns = Math.min(20, highRepetition * 4);

    const hasSpecificNumbers = /\d{4}/.test(text) || /\d+%/.test(text);
    const hasSpecificNames = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text);
    const hasPersonalPronouns = /\b(I|my|me|we|our)\b/i.test(text);
    const hasLocalContext = /Zimbabwe|Madziwa|African|locally|in our|here in/i.test(text);
    
    if (!hasSpecificNumbers && !hasSpecificNames) signals.lackOfSpecifics += 15;
    if (!hasPersonalPronouns && text.length > 100) signals.missingPersonalContext += 15;
    if (!hasLocalContext && text.length > 200) signals.missingPersonalContext += 10;

    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    if (sentenceLengths.length >= 3) {
      const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
      const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
      if (variance < 10 && sentenceLengths.length >= 5) {
        signals.unnaturalUniformity = 15;
      }
    }

    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
    const hasIntro = paragraphs.length > 0 && 
                     (paragraphs[0].toLowerCase().includes('introduction') ||
                      paragraphs[0].split(/[.!?]+/).length <= 2);
    const hasConclusion = paragraphs.length > 0 &&
                          paragraphs[paragraphs.length - 1].toLowerCase().includes('conclusion');
    
    if (hasIntro && hasConclusion && paragraphs.length >= 3) {
      signals.templateStructure = 15;
    }

    const grammarErrors = text.match(/\s\s+|[a-z][A-Z]|[.,]{2,}|\s,|\s\./g);
    const spellingLikely = /\b(recieve|occured|seperate|definately|wierd)\b/i.test(text);
    
    if ((!grammarErrors || grammarErrors.length < 2) && !spellingLikely && text.length > 200) {
      signals.perfectFormality = 15;
    }

    const formalWords = ['utilize', 'facilitate', 'implement', 'demonstrate', 
                         'comprehensive', 'fundamental', 'significant', 'substantial',
                         'contemporary', 'integral', 'multifaceted', 'paramount'];
    const formalCount = formalWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    signals.perfectFormality += Math.min(15, formalCount * 3);

    const totalSignals = Object.values(signals).reduce((sum, val) => sum + val, 0);
    const percentage = Math.min(100, Math.round(totalSignals));

    const rationale: string[] = [];
    if (signals.genericPhrasing > 10) rationale.push(`Generic academic phrasing (${genericCount} instances)`);
    if (signals.repetitivePatterns > 10) rationale.push('Repetitive word patterns');
    if (signals.lackOfSpecifics > 0) rationale.push('Lacks specific examples, names, or data');
    if (signals.missingPersonalContext > 0) rationale.push('Missing personal voice or local context');
    if (signals.unnaturalUniformity > 0) rationale.push('Unnaturally uniform sentence structure');
    if (signals.templateStructure > 0) rationale.push('Rigid template-like structure');
    if (signals.perfectFormality > 10) rationale.push('Overly formal/perfect language without typical errors');

    if (rationale.length === 0) {
      rationale.push('Analysis based on natural language patterns, specificity, and authenticity markers');
    }

    return {
      percentage,
      rationale: rationale.join('; ') + '.'
    };
  }
}
