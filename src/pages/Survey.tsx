/**
 * Survey Page
 * 
 * Route: /survey
 * Query params:
 * - ?type=pulse | experience
 * - ?trigger=after_complete | abandoned | manual | retention
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SurveyModal } from '@/components/survey/SurveyModal';
import { SurveyType, SurveyTrigger } from '@/types/survey';
import { hasCompletedSurvey } from '@/hooks/useSurvey';
import { SURVEYS } from '@/data/surveyDefinitions';

const Survey = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Parse query params
  const surveyType = (searchParams.get('type') || 'pulse') as SurveyType;
  const trigger = (searchParams.get('trigger') || 'manual') as SurveyTrigger;
  
  // Validate survey type
  const isValidType = surveyType === 'pulse' || surveyType === 'experience';
  
  useEffect(() => {
    if (!isValidType) {
      navigate('/', { replace: true });
      return;
    }
    
    // Check if already completed
    const survey = SURVEYS[surveyType];
    if (hasCompletedSurvey(survey.id)) {
      // Redirect to home if already completed
      navigate('/', { replace: true });
      return;
    }
    
    // Open the modal
    setIsModalOpen(true);
  }, [isValidType, surveyType, navigate]);
  
  const handleClose = () => {
    setIsModalOpen(false);
    // Navigate back or to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
  if (!isValidType) return null;
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <SurveyModal
        isOpen={isModalOpen}
        surveyType={surveyType}
        trigger={trigger}
        onClose={handleClose}
      />
      
      {/* Fallback content if modal somehow isn't shown */}
      {!isModalOpen && (
        <div className="text-center p-8">
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      )}
    </div>
  );
};

export default Survey;
