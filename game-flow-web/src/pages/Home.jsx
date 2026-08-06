import React from 'react';
import Layout from '../components/layout/Layout';
import Stories from '../components/layout/Stories';
import { gameData } from '../data/gameData.js';
import HorizontalCard from '../components/layout/HorizontalCard.jsx';

const Home = () => {
  return (
    <Layout>
      <div className="max-w-full space-y-6">
        <Stories />

        {/* Home content */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-800">Top Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gameData.map((game) => (
              <HorizontalCard key={game.id} game={game} />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to ScopeCanvas!</h2>
          <p className="text-gray-600">Explore games, watch creator stories, and build interactive flows.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
