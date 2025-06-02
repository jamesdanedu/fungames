// /pages/index.js
import { useState } from 'react';
import MainMenu from '../components/MainMenu';
import StopTheSprite from '../games/StopTheSprite';
import FlappyBird from '../games/FlappyBird';
import Snake from '../games/Snake';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [schoolName, setSchoolName] = useState('Academy High School');
  
  const games = [
    {
      id: 'stop-sprite',
      name: 'Stop The Sprite',
      description: 'Test your reflexes by stopping the sprite at the right moment'
    },
    {
      id: 'flappy-bird',
      name: 'Flappy Bird',
      description: 'Navigate through obstacles - gets faster every 5 obstacles!'
    },
    {
      id: 'snake',
      name: 'Snake',
      description: 'Classic Nokia-style snake game - eat food to grow longer!'
    },
    {
      id: 'word-scramble',
      name: 'Word Scramble',
      description: 'Coming soon: Unscramble words to improve vocabulary'
    }
  ];
  
  const handleSelectGame = (gameId) => {
    setCurrentScreen(gameId);
  };
  
  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };
  
  // Render the appropriate screen
  if (currentScreen === 'menu') {
    return <MainMenu games={games} onSelectGame={handleSelectGame} schoolName={schoolName} />;
  } else if (currentScreen === 'stop-sprite') {
    return <StopTheSprite onBack={handleBackToMenu} />;
  } else if (currentScreen === 'flappy-bird') {
    return <FlappyBird onBack={handleBackToMenu} />;
  } else if (currentScreen === 'snake') {
    return <Snake onBack={handleBackToMenu} />;
  } else {
    // Placeholder for future games
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
          <p className="mb-6">This game is currently under development.</p>
          <button 
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }
}