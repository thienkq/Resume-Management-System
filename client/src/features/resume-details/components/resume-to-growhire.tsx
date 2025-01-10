import React from 'react';
import { Button } from '@/components/ui/button';

interface ResumeToGrowHireButtonProps {
  resumeId: string;
}
const ResumeToGrowHireButton: React.FC<ResumeToGrowHireButtonProps> = ({ resumeId }) => {

  const handleSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:3000/v1/resume/sendtogrowhire/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to send resume to GrowHire.');
      }
  
      const data = await response.json();
      console.log('Resume sent successfully:', data);
      alert('Resume sent successfully to GrowHire.');
    } catch (error) {
      console.error('Error sending resume to GrowHire:', error.message);
      alert('Failed to send resume to GrowHire.');
    }
  };
  
  return (
    <div>
      <Button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Submit Resume
      </Button>
    </div>
  );
};

export default ResumeToGrowHireButton;
