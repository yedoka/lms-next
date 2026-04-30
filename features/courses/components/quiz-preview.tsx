"use client";

import { Quiz, Question, Answer } from "@prisma/client";
import { Button } from "@/shared/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface QuizPreviewProps {
  quiz: Quiz & { questions: (Question & { answers: Answer[] })[] };
  courseId: string;
}

export const QuizPreview = ({ quiz, courseId }: QuizPreviewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const question = quiz.questions[currentQuestionIndex];

  const handleSelectAnswer = (answerId: string) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [question.id]: answerId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsSubmitted(true);
      toast.success("Preview quiz finished! No data was saved.");
    }
  };

  const calculateScore = () => {
    let score = 0;
    let totalPoints = 0;
    quiz.questions.forEach(q => {
      totalPoints += q.points;
      const selected = selectedAnswers[q.id];
      const correct = q.answers.find(a => a.isCorrect);
      if (selected === correct?.id) {
        score += q.points;
      }
    });
    return { score, totalPoints, percentage: Math.round((score / totalPoints) * 100) || 0 };
  };

  if (!question && !isSubmitted) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">No questions in this quiz.</h2>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/dashboard/teacher/courses/${courseId}/edit`}>Back to Course</Link>
        </Button>
      </div>
    );
  }

  const { score, totalPoints, percentage } = isSubmitted ? calculateScore() : { score: 0, totalPoints: 0, percentage: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/teacher/courses/${courseId}/edit`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Preview
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-sky-700 text-white p-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">Preview Mode</span>
          </div>
          <div className="text-sky-100 flex gap-4 text-sm">
            {quiz.timeLimit ? <span>Time Limit: {quiz.timeLimit}m</span> : null}
            <span>Passing Score: {quiz.passingScore}%</span>
            <span>{quiz.questions.length} Questions</span>
          </div>
        </div>

        <div className="p-6">
          {!isSubmitted ? (
            <div className="space-y-8">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length} ({question.points} pts)
                </p>
                <h2 className="text-xl font-semibold text-slate-800">{question.text}</h2>
              </div>

              <div className="space-y-3">
                {question.answers.map(answer => {
                  const isSelected = selectedAnswers[question.id] === answer.id;
                  return (
                    <div 
                      key={answer.id}
                      onClick={() => handleSelectAnswer(answer.id)}
                      className={`p-4 border rounded-md cursor-pointer transition-all duration-200 flex items-center gap-3
                        ${isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}
                      `}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                        ${isSelected ? 'border-sky-600 bg-sky-600' : 'border-slate-300'}
                      `}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`${isSelected ? 'text-sky-900 font-medium' : 'text-slate-700'}`}>
                        {answer.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleNext} disabled={!selectedAnswers[question.id]}>
                  {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 text-center py-10">
              <h2 className="text-3xl font-bold">Quiz Results</h2>
              
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className={`text-5xl font-bold ${percentage >= quiz.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                  {percentage}%
                </div>
                <p className="text-lg text-slate-600">
                  You scored {score} out of {totalPoints} points.
                </p>
                {percentage >= quiz.passingScore ? (
                  <p className="text-green-600 font-medium flex items-center gap-2 mt-4">
                    <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">✓</span>
                    Passed
                  </p>
                ) : (
                  <p className="text-red-600 font-medium flex items-center gap-2 mt-4">
                    <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">✗</span>
                    Failed
                  </p>
                )}
              </div>

              <div className="pt-8 flex justify-center gap-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsSubmitted(false);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers({});
                }}>
                  Retake Preview
                </Button>
                <Button asChild>
                  <Link href={`/dashboard/teacher/courses/${courseId}/lessons/${quiz.lessonId}/quiz`}>
                    Edit Quiz
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
