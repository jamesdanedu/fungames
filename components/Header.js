// ------------------------------------------------
// /components/Header.js
// ------------------------------------------------
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function Header({ schoolName }) {
  // Start with null to avoid hydration mismatch
  const [currentTime, setCurrentTime] = useState(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Set mounted to true and initialize the time
    setMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Only format date and time if currentTime exists
  const formattedDate = currentTime ? currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  
  const formattedTime = currentTime ? currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : '';

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md">
      <div className="flex items-center space-x-3">
        {/* Placeholder for school logo */}
        <div className="w-12 h-12 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">
          {schoolName.split(' ').map(word => word[0]).join('')}
        </div>
        <h1 className="text-xl font-semibold">{schoolName}</h1>
      </div>
      <div className="flex items-center space-x-2 text-gray-600">
        <Clock className="w-5 h-5" />
        {mounted ? (
          <div className="text-sm">
            <div>{formattedDate}</div>
            <div>{formattedTime}</div>
          </div>
        ) : (
          <div className="text-sm">
            <div>Loading date...</div>
            <div>Loading time...</div>
          </div>
        )}
      </div>
    </header>
  );
}