/**
 * Survey Modal Component
 * 
 * Responsive modal for displaying surveys.
 * - Modal on desktop (max 560px width)
 * - Full-screen on mobile
 * - Clean, distraction-free UI
 */

import { useEffect } from 'react';
import { X, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSurvey } from '@/hooks/useSurvey';
import { SurveyQuestionRenderer } from './SurveyQuestion';
import { SurveyType, SurveyTrigger } from '@/types/survey';
import { cn } from '@/lib/utils';

interface SurveyModalProps {
  isOpen: boolean;
  surveyType: SurveyType;
  trigger: SurveyTrigger;
  onClose: () => void;
}

export const SurveyModal = ({ isOpen, surveyType, trigger, onClose }: SurveyModalProps) => {
  const {
    survey,
    answers,
    currentQuestion,
    visibleQuestions,
    progress,
    isFirstQuestion,
    isLastQuestion,
    isSubmitting,
    canProceed,
    setAnswer,
    goToNext,
    goToPrevious,
    submit,
    dismiss,
  } = useSurvey({
    surveyType,
    trigger,
    onComplete: onClose,
    onDismiss: onClose,
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dismiss();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, dismiss]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNext = () => {
    if (isLastQuestion) {
      submit();
    } else {
      goToNext();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter' && canProceed && !isSubmitting) {
        e.preventDefault();
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canProceed, isSubmitting, isLastQuestion]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={dismiss}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              "fixed z-50 bg-background rounded-2xl shadow-2xl",
              "flex flex-col overflow-hidden",
              // Mobile: full screen
              "inset-4 md:inset-auto",
              // Desktop: centered modal
              "md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-full md:max-w-[560px] md:max-h-[90vh]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{survey.title}</h2>
                <p className="text-sm text-muted-foreground">
                  ~{survey.estimatedTime} • Question {visibleQuestions.indexOf(currentQuestion!) + 1} of {visibleQuestions.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Progress bar (Experience survey only) */}
            {survey.showProgress && (
              <div className="px-4 pt-4">
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {/* Question content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {currentQuestion && (
                  <SurveyQuestionRenderer
                    key={currentQuestion.id}
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={(value) => setAnswer(currentQuestion.id, value)}
                  />
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border space-y-4">
              {/* Navigation buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                  disabled={isFirstQuestion}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : isLastQuestion ? (
                    'Submit'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              
              {/* Privacy note */}
              <p className="text-xs text-center text-muted-foreground">
                Responses are anonymous and used to improve the product.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
