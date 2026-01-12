/**
 * Survey Question Components
 * 
 * Renders different question types with proper styling and validation.
 */

import { SurveyQuestion as SurveyQuestionType } from '@/types/survey';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

interface QuestionProps {
  question: SurveyQuestionType;
  value: string | string[] | number | undefined;
  onChange: (value: string | string[] | number) => void;
}

// Rating component (1-5 stars/numbers)
const RatingQuestion = ({ question, value, onChange }: QuestionProps) => {
  const rating = value as number | undefined;
  
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-foreground">{question.text}</p>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "w-12 h-12 rounded-xl text-lg font-semibold transition-all duration-200",
              "border-2 hover:scale-105",
              rating === num
                ? "bg-primary text-primary-foreground border-primary shadow-lg"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Not useful</span>
        <span>Very useful</span>
      </div>
    </div>
  );
};

// NPS component (0-10)
const NPSQuestion = ({ question, value, onChange }: QuestionProps) => {
  const score = value as number | undefined;
  
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-foreground">{question.text}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "w-10 h-10 rounded-lg text-sm font-semibold transition-all duration-200",
              "border hover:scale-105",
              score === num
                ? num <= 6
                  ? "bg-destructive text-destructive-foreground border-destructive"
                  : num <= 8
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-green-500 text-white border-green-500"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </div>
  );
};

// Single select (radio-like buttons)
const SingleSelectQuestion = ({ question, value, onChange }: QuestionProps) => {
  const selected = value as string | undefined;
  
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-foreground">{question.text}</p>
      <div className="space-y-2">
        {question.options?.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "w-full p-3 rounded-xl text-left transition-all duration-200",
              "border-2",
              selected === option.value
                ? "bg-primary/10 border-primary text-foreground"
                : "bg-background border-border hover:border-primary/50 text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  selected === option.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {selected === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span className="text-sm">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Multi select (checkboxes)
const MultiSelectQuestion = ({ question, value, onChange }: QuestionProps) => {
  const selected = (value as string[]) || [];
  const maxSelections = question.maxSelections;
  
  const handleToggle = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        // Replace the oldest selection
        onChange([...selected.slice(1), optionValue]);
      } else {
        onChange([...selected, optionValue]);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <p className="text-lg font-medium text-foreground">{question.text}</p>
        {maxSelections && (
          <p className="text-sm text-muted-foreground mt-1">
            Select up to {maxSelections} options
          </p>
        )}
      </div>
      <div className="space-y-2">
        {question.options?.map((option) => {
          const isSelected = selected.includes(option.value);
          const isDisabled = maxSelections && selected.length >= maxSelections && !isSelected;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && handleToggle(option.value)}
              disabled={isDisabled}
              className={cn(
                "w-full p-3 rounded-xl text-left transition-all duration-200",
                "border-2",
                isSelected
                  ? "bg-primary/10 border-primary text-foreground"
                  : isDisabled
                  ? "bg-muted/50 border-border text-muted-foreground cursor-not-allowed"
                  : "bg-background border-border hover:border-primary/50 text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  disabled={isDisabled}
                  className="pointer-events-none"
                />
                <span className="text-sm">{option.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Textarea
const TextareaQuestion = ({ question, value, onChange }: QuestionProps) => {
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-foreground">{question.text}</p>
      <Textarea
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder || 'Type your answer...'}
        className="min-h-[120px] resize-none"
      />
    </div>
  );
};

// Main question renderer
export const SurveyQuestionRenderer = ({ question, value, onChange }: QuestionProps) => {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      {question.type === 'rating' && (
        <RatingQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'nps' && (
        <NPSQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'single_select' && (
        <SingleSelectQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'multi_select' && (
        <MultiSelectQuestion question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'textarea' && (
        <TextareaQuestion question={question} value={value} onChange={onChange} />
      )}
    </motion.div>
  );
};
