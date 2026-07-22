import React from 'react'


const HorizontalCard = ({ game }) => {
    if (!game) return null;

    return (
        <div className="relative rounded-lg shadow-sm border border-gray-200 overflow-hidden w-64 h-36 flex-shrink-0 group cursor-pointer">
            <img 
                src={game.coverImage || game.thumbnail} 
                alt={game.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </div>
    )
}

export default HorizontalCard