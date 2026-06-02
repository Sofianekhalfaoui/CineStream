import React from 'react';

interface CircularRatingProps {
  rating: number;
}

export default function CircularRating({ rating }: CircularRatingProps) {
  const percentage = Math.round(rating * 10);
  const color = percentage >= 70 ? 'text-green-400' : percentage >= 50 ? 'text-yellow-400' : 'text-red-400';
  const borderColor = percentage >= 70 ? 'border-green-500/50' : percentage >= 50 ? 'border-yellow-500/50' : 'border-red-500/50';
  
  return (
    <div className={`relative w-9 h-9 flex items-center justify-center bg-black/80 rounded-full border-2 ${borderColor} shadow-xl backdrop-blur-sm`}>
      <span className={`text-[10px] font-black ${color}`}>{percentage}%</span>
    </div>
  );
}
