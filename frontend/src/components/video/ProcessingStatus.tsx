// components/video/ProcessingStatus.tsx
'use client';

export default function ProcessingStatus({
  status,
  progress
}: {
  status: string;
  progress: number;
}) {
  // Define stages of processing
  const stages = [
    { name: 'Transcribing video', threshold: 25 },
    { name: 'Analyzing engaging moments', threshold: 50 },
    { name: 'Generating content', threshold: 75 },
    { name: 'Creating thumbnails', threshold: 90 },
    { name: 'Finalizing', threshold: 100 },
  ];
  
  // Determine current stage
  const currentStageIndex = stages.findIndex(stage => progress < stage.threshold);
  const currentStage = currentStageIndex === -1 ? stages.length - 1 : currentStageIndex;
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-5">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 relative mt-1">
              {index < currentStage ? (
                <div className="h-full w-full rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : index === currentStage ? (
                <div className="h-full w-full rounded-full bg-blue-500 animate-pulse"></div>
              ) : (
                <div className="h-full w-full rounded-full border-2 border-gray-300"></div>
              )}
              
              {index < stages.length - 1 && (
                <div 
                  className={`absolute top-5 left-1/2 w-0.5 h-5 -ml-px ${
                    index < currentStage ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                ></div>
              )}
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${index <= currentStage ? 'text-gray-900' : 'text-gray-500'}`}>
                {stage.name}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {status === 'FAILED' && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Processing failed</h3>
              <p className="mt-2 text-sm text-red-700">
                There was an error processing your video. Please try again.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}