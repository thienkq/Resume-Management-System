import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ResumeToGrowHireButtonProps {
  resumeId: string;
}

const ResumeToGrowHireButton: React.FC<ResumeToGrowHireButtonProps> = ({ resumeId }) => {
  const [jobId, setJobId] = useState('');
  const [cookieId, setCookieId] = useState('');

  useEffect(() => {
    // Load values from localStorage on component mount
    const storedJobId = localStorage.getItem('jobId');
    const storedCookieId = localStorage.getItem('cookieId');
    if (storedJobId) setJobId(storedJobId);
    if (storedCookieId) setCookieId(storedCookieId);
  }, []);

  const handleSave = () => {
    // Save inputs to localStorage
    localStorage.setItem('jobId', jobId);
    localStorage.setItem('cookieId', cookieId);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`http://localhost:3000/v1/resume/sendtogrowhire/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cookieString: cookieId,
          jobId,
        }),
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
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Submit Resume
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Details</DialogTitle>
            <DialogDescription>
              Enter your Job ID and Cookie ID to submit your resume.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Job ID</label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter Job ID"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Cookie ID</label>
              <input
                type="text"
                value={cookieId}
                onChange={(e) => setCookieId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Enter Cookie ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeToGrowHireButton;
