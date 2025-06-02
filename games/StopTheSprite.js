import { useState, useEffect, useRef } from 'react';

export default function CanvasStopTheSprite() {
  // Canvas settings
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 300;
  const SPRITE_SIZE = 30;
  const SPRITE_COLOR = 'red';
  const TARGET_WIDTH = 80;
  const TARGET_COLOR = 'rgba(100, 100, 100, 0.5)';
  
  // Game state
  const [score, setScore] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(2); // Start at level 2 (medium-fast)
  const [attempts, setAttempts] = useState(0);
  const [targetHits, setTargetHits] = useState(0);
  
  // Refs
  const canvasRef = useRef(null);
  const spriteXRef = useRef(50);
  const directionRef = useRef(1);
  const animationRef = useRef(null);
  const speedRef = useRef(25); // Increased from 10 to 25 for faster movement
  const targetXRef = useRef(CANVAS_WIDTH / 2);
  
  // Setup canvas and draw initial state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas dimensions
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Set initial speed based on level
    updateSpeedFromLevel(speedLevel);
    
    // Draw initial state
    const ctx = canvas.getContext('2d');
    drawGame(ctx);
    
    setInitialized(true);
  }, []);
  
  // Update speed based on level
  const updateSpeedFromLevel = (level) => {
    switch(level) {
      case 1: // Faster base level
        speedRef.current = 30;
        break;
      case 2: // Medium-fast
        speedRef.current = 45;
        break;
      case 3: // Fast
        speedRef.current = 60;
        break;
      case 4: // Very Fast
        speedRef.current = 80;
        break;
      case 5: // Extreme
        speedRef.current = 100;
        break;
      default:
        speedRef.current = 30;
    }
  };
  
  // Game loop
  useEffect(() => {
    if (!initialized) return;
    
    const updateGame = () => {
      if (isMoving) {
        // Update sprite position
        spriteXRef.current += speedRef.current * directionRef.current;
        
        // Bounce at walls
        if (spriteXRef.current <= 0) {
          spriteXRef.current = 0;
          directionRef.current = 1;
        } else if (spriteXRef.current >= CANVAS_WIDTH - SPRITE_SIZE) {
          spriteXRef.current = CANVAS_WIDTH - SPRITE_SIZE;
          directionRef.current = -1;
        }
      }
      
      // Draw the game
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawGame(ctx);
      }
      
      // Continue animation
      animationRef.current = requestAnimationFrame(updateGame);
    };
    
    // Start game loop
    animationRef.current = requestAnimationFrame(updateGame);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initialized, isMoving]);
  
  // Draw the entire game
  const drawGame = (ctx) => {
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = '#1e3a8a'; // Dark blue background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw target zone
    const targetX = targetXRef.current;
    ctx.fillStyle = TARGET_COLOR;
    ctx.fillRect(targetX - TARGET_WIDTH/2, 0, TARGET_WIDTH, CANVAS_HEIGHT);
    
    // Draw target center line
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(targetX, 0);
    ctx.lineTo(targetX, CANVAS_HEIGHT);
    ctx.stroke();
    
    // Draw sprite
    const spriteX = spriteXRef.current;
    const spriteY = CANVAS_HEIGHT / 2 - SPRITE_SIZE / 2;
    
    // Shadow for visibility
    ctx.shadowColor = 'white';
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = SPRITE_COLOR;
    ctx.fillRect(spriteX, spriteY, SPRITE_SIZE, SPRITE_SIZE);
    
    // Add motion trail when moving
    if (isMoving) {
      // Motion trail
      const trailLength = Math.min(5, Math.floor(speedRef.current / 10)); // Scale trail with speed
      for (let i = 1; i <= trailLength; i++) {
        const trailX = spriteX - (i * directionRef.current * 8);
        const trailSize = SPRITE_SIZE - (i * 3);
        
        // Skip if off screen
        if (trailX < -trailSize || trailX > CANVAS_WIDTH) continue;
        
        ctx.globalAlpha = 0.7 - (i * 0.12);
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(
          trailX, 
          spriteY + (i * 1.5), 
          trailSize, 
          trailSize
        );
      }
      ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Draw status indicator
    ctx.fillStyle = isMoving ? 'green' : 'red';
    ctx.fillRect(CANVAS_WIDTH - 80, 10, 70, 25);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(isMoving ? 'MOVING' : 'STOPPED', CANVAS_WIDTH - 45, 27);
    
    // Draw speed indicator
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 100, 25);
    
    // Color-code speed level
    let speedColor;
    switch(speedLevel) {
      case 1: speedColor = '#22c55e'; break; // Green for slow
      case 2: speedColor = '#eab308'; break; // Yellow for medium
      case 3: speedColor = '#f97316'; break; // Orange for fast
      case 4: speedColor = '#ef4444'; break; // Red for very fast
      case 5: speedColor = '#8b5cf6'; break; // Purple for extreme
      default: speedColor = 'white';
    }
    
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Speed: `, 15, 27);
    
    ctx.fillStyle = speedColor;
    ctx.fillText(`${speedRef.current}px`, 65, 27);
    
    // Draw feedback if any
    if (feedback) {
      // Shadow for better visibility
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 12;
      
      ctx.font = '24px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(feedback, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      
      ctx.shadowBlur = 0;
    }
  };
  
  // Handle space bar press
  const handleAction = () => {
    if (!initialized) return;
    
    // Toggle movement
    const newMovingState = !isMoving;
    setIsMoving(newMovingState);
    
    if (!newMovingState) {
      // Increment attempts
      setAttempts(prev => prev + 1);
      
      // Calculate score when stopping
      const distance = Math.abs(spriteXRef.current + SPRITE_SIZE/2 - targetXRef.current);
      const maxDistance = CANVAS_WIDTH / 2;
      const points = Math.max(0, Math.round((1 - (distance / maxDistance)) * 100));
      
      // Track successful target hits (when scoring more than 70 points)
      if (points > 70) {
        setTargetHits(prev => prev + 1);
      }
      
      setScore(prev => prev + points);
      
      // Set feedback based on score
      if (points > 90) {
        setFeedback(`Perfect! +${points}`);
      } else if (points > 70) {
        setFeedback(`Great! +${points}`);
      } else if (points > 50) {
        setFeedback(`Good! +${points}`);
      } else if (points > 30) {
        setFeedback(`Not bad! +${points}`);
      } else {
        setFeedback(`Try again! +${points}`);
      }
      
      // Progressively increase difficulty based on score and accuracy
      const newScore = score + points;
      const accuracy = targetHits / Math.max(1, attempts) * 100;
      
      // Update speed based on score and accuracy
      if (newScore > 300 || (newScore > 200 && accuracy > 50)) {
        // Level 5 (Extreme) - For high scorers or accurate players
        if (speedLevel < 5) {
          console.log("Upgrading to EXTREME speed!");
          setSpeedLevel(5);
          updateSpeedFromLevel(5);
          setFeedback(feedback + " Speed up!");
        }
      } else if (newScore > 200 || (newScore > 100 && accuracy > 60)) {
        // Level 4 (Very Fast)
        if (speedLevel < 4) {
          console.log("Upgrading to VERY FAST speed!");
          setSpeedLevel(4);
          updateSpeedFromLevel(4);
          setFeedback(feedback + " Speed up!");
        }
      } else if (newScore > 100 || (newScore > 50 && accuracy > 70)) {
        // Level 3 (Fast)
        if (speedLevel < 3) {
          console.log("Upgrading to FAST speed!");
          setSpeedLevel(3);
          updateSpeedFromLevel(3);
          setFeedback(feedback + " Speed up!");
        }
      } else if (newScore > 50) {
        // Ensure at least Level 2 after 50 points
        if (speedLevel < 2) {
          console.log("Upgrading to MEDIUM-FAST speed!");
          setSpeedLevel(2);
          updateSpeedFromLevel(2);
          setFeedback(feedback + " Speed up!");
        }
      }
      
      // Randomly change target position after certain score thresholds
      if (newScore > 150 && Math.random() < 0.3) {
        // 30% chance to move target after 150 points
        const newTargetPos = Math.floor(Math.random() * (CANVAS_WIDTH - 100)) + 50;
        targetXRef.current = newTargetPos;
      }
      
      // Clear feedback after a delay
      setTimeout(() => {
        setFeedback('');
      }, 1500);
    } else {
      setFeedback('');
    }
  };
  
  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleAction();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoving]);
  
  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Canvas Stop The Sprite</h1>
      
      <div className="w-full text-center mb-4">
        <p className="text-xl">Score: {score}</p>
        <p>Press SPACE or use button to {isMoving ? 'stop' : 'start'}</p>
        
        <div className="flex justify-center space-x-4 mt-2">
          <button 
            onClick={handleAction}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isMoving ? 'Stop' : 'Start'} Sprite
          </button>
          
          <div className="px-4 py-2 bg-purple-500 text-white rounded">
            Speed: Level {speedLevel}
          </div>
          
          <div className="flex space-x-1">
            <button 
              onClick={() => {
                const newLevel = Math.max(1, speedLevel - 1);
                setSpeedLevel(newLevel);
                updateSpeedFromLevel(newLevel);
              }}
              disabled={speedLevel <= 1}
              className={`px-2 py-2 ${speedLevel <= 1 ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'} text-white rounded`}
            >
              -
            </button>
            <button 
              onClick={() => {
                const newLevel = Math.min(5, speedLevel + 1);
                setSpeedLevel(newLevel);
                updateSpeedFromLevel(newLevel);
              }}
              disabled={speedLevel >= 5}
              className={`px-2 py-2 ${speedLevel >= 5 ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white rounded`}
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas-based game */}
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="border-4 border-indigo-700 rounded-lg"
        ></canvas>
        
        {/* Overlay to show canvas is working */}
        <div className="absolute top-2 left-2 bg-white/70 text-black text-xs px-2 py-1 rounded">
          Canvas Mode {initialized ? '✓' : '⟳'}
        </div>
      </div>
      
      {/* Debug info */}
      <div className="mt-4 p-4 bg-gray-100 rounded w-full max-w-2xl">
        <p className="font-bold">Debug Info:</p>
        <p>Sprite X: {Math.round(spriteXRef.current)}px</p>
        <p>Target X: {targetXRef.current}px</p>
        <p>Speed: {speedRef.current}px per frame</p>
        <p>Speed Level: {speedLevel} (1=Normal, 2=Fast, 3=Very Fast, 4=Super Fast, 5=Extreme)</p>
        <p>Attempts: {attempts} (Good hits: {targetHits})</p>
        <p>Accuracy: {attempts > 0 ? Math.round((targetHits / attempts) * 100) : 0}%</p>
        
        <div className="mt-4 pt-2 border-t border-gray-300">
          <p className="font-bold">Instructions:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Use the +/- buttons to adjust sprite speed if desired</li>
            <li>Press SPACE to start the sprite moving</li>
            <li>Press SPACE again to stop it</li>
            <li>Try to stop the sprite in the gray target zone</li>
            <li>The closer to the white line, the more points you earn</li>
            <li>The game automatically speeds up as your score and accuracy increase</li>
            <li>At higher scores, the target may start moving to random positions!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}