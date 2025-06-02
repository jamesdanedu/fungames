// ------------------------------------------------
// /components/MainMenu.js
// ------------------------------------------------
import Header from './Header';
import Footer from './Footer';

export default function MainMenu({ games, onSelectGame, schoolName }) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800">
      <Header schoolName={schoolName} />
      
      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-indigo-800 mb-3">Educational Games</h2>
          <p className="text-gray-600">Select a game to play. Use keyboard for navigation and gameplay.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          {games.map((game, index) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="game-card group relative overflow-hidden rounded-lg shadow-lg bg-white p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectGame(game.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-center text-center h-full">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-indigo-600">{index + 1}</span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors duration-300">{game.name}</h3>
                <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300">{game.description}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
