import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalPageHeader } from '../patient/portal/ui';
import { TaskLibraryView } from './TaskLibraryView';
import { useLanguageStore } from '../../services/language/LanguageManager';
import { getCognitiveCopy } from '../../services/language/cognitiveCopy';

export const CognitiveTaskLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const copy = getCognitiveCopy(useLanguageStore((state) => state.currentLanguage)).library;
  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <TaskLibraryView onStart={() => navigate('/patient/cognitive')} />
    </div>
  );
};
