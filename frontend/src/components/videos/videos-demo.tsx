import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideosPage } from './videos-page';
import { VideoPlayerPage } from './video-player-page';

export function VideosDemo() {
  const [currentView, setCurrentView] = useState<'library' | 'player'>('library');

  return (
    <div className="min-h-screen">
      {/* Demo Navigation */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Video Learning Platform Demo</h1>
            <p className="text-sm text-slate-300">Premium e-learning experience</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={currentView === 'library' ? 'default' : 'outline'}
              onClick={() => setCurrentView('library')}
              className={currentView === 'library' ? '' : 'bg-slate-800 hover:bg-slate-700 text-white'}
            >
              Video Library
            </Button>
            <Button
              variant={currentView === 'player' ? 'default' : 'outline'}
              onClick={() => setCurrentView('player')}
              className={currentView === 'player' ? '' : 'bg-slate-800 hover:bg-slate-700 text-white'}
            >
              Video Player
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {currentView === 'library' ? <VideosPage /> : <VideoPlayerPage />}
    </div>
  );
}
