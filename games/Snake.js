// /games/Snake.js - Fixed Version
import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';

export default function Snake({ onBack }) {
  // Canvas and game refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const gameActiveRef = useRef(false);
  const gameOverRef = useRef(false);
  const animationRef = useRef(null);
  const lastUpdateTimeRef = useRef(0);
  const updateIntervalRef = useRef(150); // ms between updates (lower = faster)
  const setupTimerRef = useRef(null); // Reference to hold the setup timer
  
  // Game state
  const snakeRef = useRef([{ x: 10, y: 10 }]); // Snake segments starting with head
  const foodRef = useRef({ x: 5, y: 5 });
  const directionRef = useRef('RIGHT'); // Initial direction
  const nextDirectionRef = useRef('RIGHT'); // For handling quick direction changes
  const gridSizeRef = useRef(20); // Size of each grid cell
  const growthRef = useRef(false); // Whether snake should grow on next update
  const caughtFoodRef = useRef([]); // Track food that has been caught for shrinking effect
  const scoreRef = useRef(0); // Reference to track score internally
  
  // State for UI updates
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    // Force a redraw after component is fully mounted
    const redrawTimer = setTimeout(() => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawGame(ctx);
    }, 500);
    
    return () => clearTimeout(redrawTimer);
  }, [canvasDimensions]); // Re-run when dimensions change
  
  // Set up canvas
  useEffect(() => {
    // Initialize the game - this runs once on component mount
    const setupCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Set canvas to fill container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      
      // Ensure we have valid dimensions
      if (containerWidth <= 0 || containerHeight <= 0) {
        // Try again in a moment if container isn't properly sized yet
        setupTimerRef.current = setTimeout(setupCanvas, 100);
        return;
      }
      
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      setCanvasDimensions({ width: containerWidth, height: containerHeight });
      
      // Calculate grid size based on canvas dimensions
      // We want approximately 40-50 cells horizontally (smaller cells)
      const gridSize = Math.floor(containerWidth / 40);
      gridSizeRef.current = gridSize;
      
      // Set initial snake position based on grid size
      snakeRef.current = [{ 
        x: Math.floor((containerWidth / gridSize) / 4), 
        y: Math.floor((containerHeight / gridSize) / 2) 
      }];
      
      // Draw initial screen
      const ctx = canvas.getContext('2d');
      if (ctx) drawGame(ctx);
    };
    
    // Call with a slight delay to ensure DOM is fully rendered
    setupTimerRef.current = setTimeout(setupCanvas, 100);
    
    // Also handle window resize events
    const handleResize = () => {
      // Clear any existing resize timer
      if (setupTimerRef.current) {
        clearTimeout(setupTimerRef.current);
      }
      // Set a new timer to avoid too many resize calls
      setupTimerRef.current = setTimeout(setupCanvas, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Load high score from localStorage if available
    try {
      const savedHighScore = localStorage.getItem('snakeHighScore');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }
    } catch (e) {
      console.log('Could not access localStorage');
    }
    
    // Handle keyboard input
    const handleKeyDown = (e) => {
      // Prevent default browser behavior for game control keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
           'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 
           ' ', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!gameActiveRef.current && !gameOverRef.current && 
          (e.key === 'Enter' || e.key === ' ')) {
        // Start game on Enter or Space
        startGame();
      } else if (gameOverRef.current && 
                (e.key === 'Enter' || e.key === ' ')) {
        // Restart game on Enter or Space when game over
        resetGame();
        startGame();
      } else if (e.key === 'Escape') {
        // Return to menu
        stopGame();
        onBack();
      } else if (gameActiveRef.current) {
        // Handle direction changes
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            if (directionRef.current !== 'DOWN') {
              nextDirectionRef.current = 'UP';
            }
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            if (directionRef.current !== 'UP') {
              nextDirectionRef.current = 'DOWN';
            }
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            if (directionRef.current !== 'RIGHT') {
              nextDirectionRef.current = 'LEFT';
            }
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            if (directionRef.current !== 'LEFT') {
              nextDirectionRef.current = 'RIGHT';
            }
            break;
          default:
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      // Cancel any pending animation frames
      stopGame();
      // Clear any pending timers
      if (setupTimerRef.current) {
        clearTimeout(setupTimerRef.current);
      }
    };
  }, [onBack]);
  
  // Handle canvas click (simplified for single-click game start)
  const handleCanvasClick = (e) => {
    // Handle click based on game state
    if (!gameActiveRef.current && !gameOverRef.current) {
      // Start game on click when not active
      startGame();
    } else if (gameOverRef.current) {
      // Restart game on click when game over
      resetGame();
      startGame();
    }
  };
  
  // Game control functions
  const startGame = () => {
    // Reset game state
    resetGame();
    
    // Start game loop
    gameActiveRef.current = true;
    gameOverRef.current = false;
    setGameStarted(true);
    
    // Generate first food
    generateFood();
    
    // Start animation loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    lastUpdateTimeRef.current = performance.now();
    updateIntervalRef.current = 150; // Reset speed
    
    const gameLoop = (timestamp) => {
      // Check if game is still active
      if (!gameActiveRef.current) return;
      
      // Check if it's time for a game update
      const elapsed = timestamp - lastUpdateTimeRef.current;
      
      if (elapsed > updateIntervalRef.current) {
        // Update game state
        updateGame();
        
        // Draw game
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawGame(ctx);
        
        // Update timestamp
        lastUpdateTimeRef.current = timestamp;
      }
      
      // Continue loop
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the loop immediately
    animationRef.current = requestAnimationFrame(gameLoop);
  };
  
  const stopGame = () => {
    gameActiveRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // Reset game
  const resetGame = () => {
    const { width, height } = canvasDimensions;
    const gridSize = gridSizeRef.current;
    
    // Reset snake to a better starting position
    snakeRef.current = [{ 
      x: Math.floor((width / gridSize) / 4), 
      y: Math.floor((height / gridSize) / 2) 
    }];
    
    // Reset direction
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    
    // Reset score in both state and ref
    setScore(0);
    scoreRef.current = 0;
    
    // Reset growth flag
    growthRef.current = false;
    
    // Reset caught food
    caughtFoodRef.current = [];
    
    // Reset game state
    gameOverRef.current = false;
    
    // Generate new food
    generateFood();
    
    // Draw initial screen
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawGame(ctx);
  };
  
  // Generate food at random position (not on snake)
  const generateFood = () => {
    const { width, height } = canvasDimensions;
    if (width <= 0 || height <= 0) return; // Skip if dimensions aren't available
    
    const gridSize = gridSizeRef.current;
    
    // Calculate grid dimensions
    const gridWidth = Math.floor(width / gridSize);
    const gridHeight = Math.floor(height / gridSize);
    
    // Generate random position
    let newFood;
    let foodOnSnake;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * (gridWidth - 2)) + 1,
        y: Math.floor(Math.random() * (gridHeight - 2)) + 1
      };
      
      // Check if food is on snake
      foodOnSnake = snakeRef.current.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
    } while (foodOnSnake);
    
    foodRef.current = newFood;
  };
  
  // Update game state
  const updateGame = () => {
    const snake = snakeRef.current;
    const food = foodRef.current;
    const direction = directionRef.current;
    
    // Make sure dimensions are available
    if (canvasDimensions.width <= 0 || canvasDimensions.height <= 0) {
      return; // Skip update if dimensions aren't available yet
    }
    
    // Update caught food animation (shrink them)
    updateCaughtFood();
    
    // Update direction from next direction
    directionRef.current = nextDirectionRef.current;
    
    // Calculate new head position
    const head = { ...snake[0] };
    
    switch (direction) {
      case 'UP':
        head.y -= 1;
        break;
      case 'DOWN':
        head.y += 1;
        break;
      case 'LEFT':
        head.x -= 1;
        break;
      case 'RIGHT':
        head.x += 1;
        break;
      default:
        break;
    }
    
    // Check for collisions with walls
    const { width, height } = canvasDimensions;
    const gridSize = gridSizeRef.current;
    const gridWidth = Math.floor(width / gridSize);
    const gridHeight = Math.floor(height / gridSize);
    
    if (
      head.x < 0 || 
      head.y < 0 || 
      head.x >= gridWidth || 
      head.y >= gridHeight
    ) {
      gameOver();
      return;
    }
    
    // Check for collisions with self
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        gameOver();
        return;
      }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
      // Don't remove tail (snake grows)
      growthRef.current = true;
      
      // Add the food to caught food list for animation
      caughtFoodRef.current.push({
        x: food.x,
        y: food.y,
        size: 1.0, // Start at full size
        timeAdded: performance.now()
      });
      
      // Generate new food
      generateFood();
      
      // Update the score in the ref first
      scoreRef.current += 1;
      
      // Then update the React state for UI
      setScore(scoreRef.current);
      
      // Update high score if needed
      if (scoreRef.current > highScore) {
        setHighScore(scoreRef.current);
        try {
          localStorage.setItem('snakeHighScore', scoreRef.current.toString());
        } catch (e) {
          console.log('Could not save to localStorage');
        }
      }
      
      // Increase speed (make the game harder as snake grows)
      updateIntervalRef.current = Math.max(50, 150 - (scoreRef.current * 2));
      
    } else {
      // Remove tail if not growing
      if (!growthRef.current) {
        snake.pop();
      } else {
        growthRef.current = false;
      }
    }
  };
  
  // Update caught food items (shrink them over time)
  const updateCaughtFood = () => {
    const now = performance.now();
    const shrinkDuration = 2000; // 2 seconds to disappear
    
    // Update each caught food item
    caughtFoodRef.current = caughtFoodRef.current.filter(item => {
      const elapsed = now - item.timeAdded;
      
      // Calculate new size (linear shrink)
      item.size = Math.max(0, 1.0 - (elapsed / shrinkDuration));
      
      // Keep the item if it's still visible
      return item.size > 0.05;
    });
  };
  
  // Handle game over
  const gameOver = () => {
    gameActiveRef.current = false;
    gameOverRef.current = true;
    
    // Draw game over screen
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawGame(ctx);
  };
  
  // Draw game
  const drawGame = (ctx) => {
    if (!ctx) return;
    
    const { width, height } = canvasDimensions;
    // Ensure we have valid dimensions
    if (width <= 0 || height <= 0) return;
    
    const gridSize = gridSizeRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid (optional)
    if (false) { // Set to true to see grid
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    
    // Draw food
    const food = foodRef.current;
    ctx.fillStyle = '#F44336'; // Red food
    ctx.fillRect(
      food.x * gridSize,
      food.y * gridSize,
      gridSize,
      gridSize
    );
    
    // Draw caught food (with shrinking effect)
    caughtFoodRef.current.forEach(item => {
      // Use a different color for caught food
      ctx.fillStyle = `rgba(255, 99, 71, ${item.size})`;
      
      // Calculate size and position for shrinking effect
      const currentSize = gridSize * item.size;
      const offset = (gridSize - currentSize) / 2;
      
      ctx.fillRect(
        item.x * gridSize + offset,
        item.y * gridSize + offset,
        currentSize,
        currentSize
      );
    });
    
    // Draw snake
    const snake = snakeRef.current;
    
    // Draw snake body
    ctx.fillStyle = '#4CAF50'; // Green body
    for (let i = 1; i < snake.length; i++) {
      ctx.fillRect(
        snake[i].x * gridSize,
        snake[i].y * gridSize,
        gridSize,
        gridSize
      );
    }
    
    // Draw snake head
    ctx.fillStyle = '#8BC34A'; // Lighter green head
    ctx.fillRect(
      snake[0].x * gridSize,
      snake[0].y * gridSize,
      gridSize,
      gridSize
    );
    
    // Draw eyes on head
    ctx.fillStyle = 'black';
    const headX = snake[0].x * gridSize;
    const headY = snake[0].y * gridSize;
    const eyeSize = Math.max(2, gridSize / 8);
    const eyeOffset = gridSize / 4;
    
    // Position eyes based on direction
    switch (directionRef.current) {
      case 'RIGHT':
        ctx.fillRect(headX + gridSize - eyeOffset, headY + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(headX + gridSize - eyeOffset, headY + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
        break;
      case 'LEFT':
        ctx.fillRect(headX + eyeOffset - eyeSize, headY + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(headX + eyeOffset - eyeSize, headY + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
        break;
      case 'UP':
        ctx.fillRect(headX + eyeOffset, headY + eyeOffset - eyeSize, eyeSize, eyeSize);
        ctx.fillRect(headX + gridSize - eyeOffset - eyeSize, headY + eyeOffset - eyeSize, eyeSize, eyeSize);
        break;
      case 'DOWN':
        ctx.fillRect(headX + eyeOffset, headY + gridSize - eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(headX + gridSize - eyeOffset - eyeSize, headY + gridSize - eyeOffset, eyeSize, eyeSize);
        break;
      default:
        break;
    }
    
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = `${Math.max(16, gridSize)}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, gridSize, gridSize * 1.5);
    
    // Draw high score
    ctx.textAlign = 'right';
    ctx.fillText(`High Score: ${highScore}`, width - gridSize, gridSize * 1.5);
    
    // Draw start screen - simplified to just show key info
    if (!gameStarted && !gameOverRef.current) {
      // No need to draw anything here since we're using the overlay div for better interactivity
      // This allows the canvas to be visible underneath
    }
    
    // Game over screen - simplified and made more clickable
  if (gameOverRef.current) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(24, gridSize * 1.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height * 0.4);
    
    ctx.font = `${Math.max(16, gridSize)}px Arial`;
    ctx.fillText(`Score: ${score}`, width / 2, height * 0.5);
    
    // Show "New High Score!" if applicable
    if (score === highScore && score > 0) {
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.fillText('New High Score!', width / 2, height * 0.56);
      ctx.fillStyle = 'white';
    }
    
    ctx.fillStyle = '#4CAF50'; // Green highlight for call to action
    ctx.fillRect(width/2 - 150, height * 0.65 - 25, 300, 50);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(16, gridSize)}px Arial`;
    ctx.fillText('Click Anywhere to Play Again', width / 2, height * 0.65);
  }
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
              Score: {score} | High Score: {highScore}
            </div>
          </div>
          
          {/* Game container */}
          <div className="flex-grow flex items-stretch w-full">
            <div 
              ref={containerRef} 
              className="flex-grow flex items-center justify-center w-full h-full bg-gray-800"
              onClick={handleCanvasClick}
              style={{ 
                position: 'relative', 
                cursor: 'pointer',
                minHeight: '300px'  // Ensure minimum height
              }}
            >
              <canvas 
                ref={canvasRef}
                className="absolute inset-0"
                onClick={handleCanvasClick}  // Add click handler directly to canvas
                style={{ 
                  display: 'block',
                  width: '100%',
                  height: '100%'
                }}
              />
              {/* Simple, clear start overlay that's clickable anywhere */}
              {!gameStarted && !gameOverRef.current && (
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center text-white text-xl bg-black bg-opacity-50 cursor-pointer"
                  onClick={() => startGame()}
                >
                  <div className="mb-4 text-3xl font-bold">SNAKE</div>
                  <div className="px-6 py-3 mb-4 bg-green-600 rounded-lg text-white font-bold text-xl animate-pulse">
                    Click Anywhere to Start
                  </div>
                  <div className="text-base">Or Press SPACE / ENTER</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-2 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>Arrow Keys or WASD to move</div>
              <div>Press ESC to exit</div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="p-2 bg-white shadow-inner text-center text-gray-500 text-sm">
        <p>Use Arrow Keys or WASD to control, ESC to return to menu</p>
      </footer>
    </div>
  );
}
