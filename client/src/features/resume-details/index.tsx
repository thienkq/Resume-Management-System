import { useParams } from 'react-router-dom';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetResumeByIdQuery } from '@/services/apiSlice';

import { ParsedJsonViewer } from './components/parsed-json-viewer';

import ResumePdfViewer from './components/resume-pdf-viewer';
import ResumeToGrowHireButton from './components/resume-to-growhire';

const ResumeDetails = () => {
  const { id: resumeId } = useParams();

  const { data: resume, isSuccess } = useGetResumeByIdQuery(resumeId!);

  if (!isSuccess) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-full overflow-hidden">
      <div className="w-1/2 min-w-[700px]">
        <ResumePdfViewer resume={resume} />
      </div>
      <div className='mr-3'>
        <ScrollArea className="h-[calc(100vh-120px)] rounded-lg border-solid border-2 border-slate-400">
          <ResumeToGrowHireButton resumeId={resume.id}/>
          <ParsedJsonViewer resume={resume} />
        </ScrollArea>
      </div>
    </div>
  );
};

export default ResumeDetails;
