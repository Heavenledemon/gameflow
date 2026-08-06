import React from 'react';
import Layout from '../../../../game-flow-web/src/components/layout/Layout';
import Stories from '../../../../game-flow-web/src/components/layout/Stories';

const Home = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Stories />
        
        {/* Home content */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome to ScopeCanvas!</h2>
          <p className="text-gray-600">Explore games, watch creator stories, and build interactive flows.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Home;
