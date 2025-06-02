// /games/FlappyBird.js
import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';

export default function FlappyBird({ onBack }) {
  // Canvas and game refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gameActiveRef = useRef(false);
  const gameOverRef = useRef(false);
  const animationRef = useRef(null);
  const birdRef = useRef({ x: 150, y: 250, width: 40, height: 30, velocity: 0 });
  const pipesRef = useRef([]);
  const scoreRef = useRef(0);
  const passedPipesRef = useRef(0);
  const speedRef = useRef(3);
  
  // State for UI updates only
  const [score, setScore] = useState(0);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  
  // Initialize game
  useEffect(() => {
    // Size the canvas
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Get the container dimensions
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      console.log(`Container size: ${containerWidth}x${containerHeight}`);
      
      // Set canvas dimensions to exactly match the container
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      setCanvasSize({ width: containerWidth, height: containerHeight });
      
      console.log(`Canvas size set to: ${canvas.width}x${canvas.height}`);
      
      // Draw initial state
      const ctx = canvas.getContext('2d');
      if (ctx) drawGame(ctx);
    };
    
    // Call immediately and on resize
    setTimeout(updateCanvasSize, 50); // Short delay to ensure container is fully rendered
    
    // Update when window is resized
    window.addEventListener('resize', updateCanvasSize);
    
    // Set up keyboard and mouse controls
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleJump();
      } else if (e.key === 'Escape') {
        stopGame();
        onBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('keydown', handleKeyDown);
      stopGame();
    };
  }, [onBack]);
  
  // Core game functions
  const startGame = () => {
    // Reset game state
    resetGame();
    
    // Start the game loop
    gameActiveRef.current = true;
    gameOverRef.current = false;
    
    // Give the bird an initial upward velocity to prevent immediate falling
    birdRef.current.velocity = -canvasSize.height * 0.01;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Start animation loop
    let lastTime = 0;
    let pipeTimer = 0;
    
    function gameLoop(timestamp) {
      if (!gameActiveRef.current) return;
      
      // Limit delta time to prevent huge jumps after tab switches or slow frames
      const deltaTime = lastTime ? Math.min(timestamp - lastTime, 30) : 16;
      lastTime = timestamp;
      
      // Create new pipes
      pipeTimer += deltaTime;
      if (pipeTimer > 1500) {
        createPipe();
        pipeTimer = 0;
      }
      
      // Update game state
      updateGameState(deltaTime);
      
      // Draw game
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) drawGame(ctx);
      
      // Continue loop
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
  };
  
  const stopGame = () => {
    gameActiveRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  const resetGame = () => {
    // Reset game objects
    const { width, height } = canvasSize;
    
    birdRef.current = {
      x: width * 0.2,
      y: height / 2,
      width: Math.max(30, width * 0.05),
      height: Math.max(24, width * 0.04),
      velocity: 0
    };
    
    pipesRef.current = [];
    scoreRef.current = 0;
    passedPipesRef.current = 0;
    speedRef.current = width * 0.005;
    
    setScore(0);
    setSpeedLevel(1);
  };
  
  const handleJump = () => {
    // Start game if not active
    if (!gameActiveRef.current && !gameOverRef.current) {
      startGame();
      return;
    }
    
    // Restart if game over
    if (gameOverRef.current) {
      gameOverRef.current = false;
      startGame();
      return;
    }
    
    // Jump the bird - more controlled jump
    if (gameActiveRef.current) {
      // The smaller the current velocity, the stronger the jump
      // This gives better control when the bird is falling fast
      const baseJump = -canvasSize.height * 0.014;
      const boostFactor = Math.min(1, Math.max(0, birdRef.current.velocity / 10));
      
      // Apply a stronger jump if the bird is falling fast
      birdRef.current.velocity = baseJump - (baseJump * boostFactor * 0.5);
    }
  };
  
  const createPipe = () => {
    const { width, height } = canvasSize;
    const gapHeight = height * 0.35;
    const minHeight = height * 0.1;
    const maxHeight = height - gapHeight - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight);
    
    pipesRef.current.push({
      x: width,
      topHeight,
      bottomY: topHeight + gapHeight,
      width: width * 0.1,
      passed: false
    });
  };
  
  const updateGameState = (deltaTime) => {
    const { width, height } = canvasSize;
    const bird = birdRef.current;
    
    // Apply gravity to bird - even more gentle gravity
    bird.velocity += height * 0.000015 * deltaTime;
    bird.y += bird.velocity;
    
    // Check collisions with boundaries
    if (bird.y < 0) {
      bird.y = 0;
      bird.velocity = 0;
    } else if (bird.y + bird.height > height - height * 0.1) { // Stop at ground level
      gameOver();
      return;
    }
    
    // Update pipes
    for (let i = pipesRef.current.length - 1; i >= 0; i--) {
      const pipe = pipesRef.current[i];
      
      // Move pipe
      pipe.x -= speedRef.current;
      
      // Remove off-screen pipes
      if (pipe.x + pipe.width < 0) {
        pipesRef.current.splice(i, 1);
        continue;
      }
      
      // Check for score
      if (!pipe.passed && bird.x > pipe.x + pipe.width) {
        pipe.passed = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        passedPipesRef.current++;
        
        // Increase speed every 5 pipes
        if (passedPipesRef.current % 5 === 0) {
          speedRef.current += width * 0.001;
          setSpeedLevel(prev => prev + 1);
        }
      }
      
      // Check for collision
      if (
        bird.x + bird.width > pipe.x &&
        bird.x < pipe.x + pipe.width &&
        (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)
      ) {
        gameOver();
        return;
      }
    }
  };
  
  const gameOver = () => {
    gameActiveRef.current = false;
    gameOverRef.current = true;
    
    // Update UI immediately with current score
    setScore(scoreRef.current);
    
    // Draw game over screen
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawGame(ctx);
  };
  
  const drawGame = (ctx) => {
    if (!ctx) return;
    
    const { width, height } = canvasSize;
    
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, width, height);
    
    // Draw clouds
    ctx.fillStyle = 'white';
    for (let i = 0; i < 3; i++) {
      drawCloud(ctx, (i * width/3 + scoreRef.current) % width, height * 0.15 + i * 20);
    }
    
    // Draw ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, height - height * 0.1, width, height * 0.1);
    
    // Draw grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, height - height * 0.1, width, height * 0.05);
    
    // Draw pipes
    ctx.fillStyle = '#3CB371';
    pipesRef.current.forEach(pipe => {
      // Top pipe
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      
      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY);
      
      // Pipe caps
      ctx.fillStyle = '#2E8B57';
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 15, pipe.width + 10, 15);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 15);
      ctx.fillStyle = '#3CB371';
    });
    
    // Draw bird
    const bird = birdRef.current;
    
    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    // Bird body
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.beginPath();
    ctx.ellipse(
      bird.x + bird.width / 2,
      bird.y + bird.height / 2,
      bird.width / 2,
      bird.height / 2,
      0, 0, 2 * Math.PI
    );
    ctx.fill();
    
    // Bird wing
    const wingOffset = gameActiveRef.current ? (Math.sin(Date.now() / 100) * (bird.height * 0.2)) : 0;
    ctx.fillStyle = '#FFA500'; // Orange
    ctx.beginPath();
    ctx.ellipse(
      bird.x + bird.width / 3,
      bird.y + bird.height / 2 + wingOffset,
      bird.width / 4,
      bird.height / 3,
      0, 0, 2 * Math.PI
    );
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
      bird.x + bird.width * 0.7,
      bird.y + bird.height * 0.3,
      bird.width / 10,
      0, 2 * Math.PI
    );
    ctx.fill();
    
    // Bird pupil
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(
      bird.x + bird.width * 0.7,
      bird.y + bird.height * 0.3,
      bird.width / 20,
      0, 2 * Math.PI
    );
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#FF6347'; // Tomato
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.width * 0.9, bird.y + bird.height * 0.4);
    ctx.lineTo(bird.x + bird.width * 1.2, bird.y + bird.height * 0.5);
    ctx.lineTo(bird.x + bird.width * 0.9, bird.y + bird.height * 0.6);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw score
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = `bold ${Math.max(20, Math.floor(width * 0.05))}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeText(scoreRef.current.toString(), width / 2, height * 0.1);
    ctx.fillText(scoreRef.current.toString(), width / 2, height * 0.1);
    
    // Draw start screen
    if (!gameActiveRef.current && !gameOverRef.current) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(24, Math.floor(width * 0.06))}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('FLAPPY BIRD', width / 2, height * 0.4);
      
      ctx.font = `${Math.max(16, Math.floor(width * 0.04))}px Arial`;
      ctx.fillText('Click or Press SPACE to Start', width / 2, height * 0.55);
    }
    
    // Draw game over screen
    if (gameOverRef.current) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(24, Math.floor(width * 0.06))}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', width / 2, height * 0.4);
      
      ctx.font = `${Math.max(16, Math.floor(width * 0.04))}px Arial`;
      ctx.fillText(`Score: ${scoreRef.current}`, width / 2, height * 0.5);
      
      ctx.fillText('Click or Press SPACE to Play Again', width / 2, height * 0.6);
    }
  };
  
  // Draw a cloud
  const drawCloud = (ctx, x, y) => {
    const cloudSize = Math.max(15, canvasSize.width * 0.03);
    
    ctx.beginPath();
    ctx.arc(x, y, cloudSize, 0, Math.PI * 2);
    ctx.arc(x + cloudSize, y - cloudSize * 0.4, cloudSize, 0, Math.PI * 2);
    ctx.arc(x + cloudSize, y + cloudSize * 0.4, cloudSize, 0, Math.PI * 2);
    ctx.arc(x + cloudSize * 2, y, cloudSize, 0, Math.PI * 2);
    ctx.fill();
  };
  
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-100 text-gray-800">
      <Header schoolName="Academy High School" />
      
      <div className="flex-grow flex flex-col w-full overflow-hidden">
        <div className="w-full h-full flex flex-col">
          <div className="flex justify-between items-center px-4 py-1">
            <button 
              onClick={onBack}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              Back to Menu
            </button>
            <div className="text-xl font-bold">
              Score: {score} | Speed Level: {speedLevel}
            </div>
          </div>
          
          {/* Game container - takes up all available space */}
          <div className="flex-grow flex items-stretch w-full">
            <div 
              ref={containerRef} 
              className="flex-grow flex items-center justify-center w-full h-full bg-indigo-100"
              onClick={handleJump}
              style={{ position: 'relative' }}
            >
              <canvas 
                ref={canvasRef}
                className="absolute inset-0"
                style={{ 
                  cursor: 'pointer',
                  display: 'block',
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          </div>
          
          <div className="p-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>Click anywhere or press SPACE to jump</div>
              <div>Press ESC to exit</div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-2 bg-white shadow-inner text-center text-gray-500 text-sm">
        <p>Press SPACE to jump, ESC to return to menu</p>
      </footer>
    </div>
  );
}