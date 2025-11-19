import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-purple-600 mb-4">
          App is Working! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          This is a test component to verify the app is loading correctly.
        </p>
      </div>
    </div>
  );
};

export default TestComponent;