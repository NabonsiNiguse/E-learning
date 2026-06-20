import { Play, Clock, Eye, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Video } from './video-data';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: Video;
  onClick?: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'data-structures': 'bg-blue-500',
      'web-dev': 'bg-green-500',
      'cs-fundamentals': 'bg-purple-500',
      'databases': 'bg-amber-500',
      'networking': 'bg-cyan-500',
      'math-algebra': 'bg-rose-500',
      'math-calculus': 'bg-indigo-500',
      'math-trig': 'bg-pink-500',
      'math-stats': 'bg-orange-500',
      'programming': 'bg-emerald-500',
    };
    return colors[category] || 'bg-slate-500';
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        video.isLocked && 'opacity-60'
      )}
      onClick={!video.isLocked ? onClick : undefined}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
          {video.isLocked ? (
            <div className="rounded-full bg-white/90 p-4">
              <Lock className="h-8 w-8 text-slate-700" />
            </div>
          ) : (
            <div className="rounded-full bg-white/90 p-4 transition-transform duration-300 group-hover:scale-110">
              <Play className="h-8 w-8 text-slate-900 fill-slate-900" />
            </div>
          )}
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {video.duration}
        </div>

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {video.isNew && (
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
              New
            </Badge>
          )}
          {video.isPopular && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
              Popular
            </Badge>
          )}
          {video.isRecommended && (
            <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
              Recommended
            </Badge>
          )}
          {video.isCompleted && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category Badge */}
        <Badge className={cn('text-xs font-medium text-white', getCategoryColor(video.category))}>
          Lesson {video.lessonNumber} of {video.totalLessons}
        </Badge>

        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-2 text-slate-900 group-hover:text-blue-600 transition-colors">
          {video.title}
        </h3>

        {/* Course Name */}
        <p className="text-sm text-slate-600 font-medium">
          {video.courseName}
        </p>

        {/* Teacher Info */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={video.teacherAvatar} alt={video.teacherName} />
            <AvatarFallback>{video.teacherName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-slate-600">{video.teacherName}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span>{video.views.toLocaleString()} views</span>
          </div>
        </div>

        {/* Progress Bar (if completed or in progress) */}
        {video.isCompleted && (
          <Progress value={100} className="h-1.5" />
        )}
      </div>
    </Card>
  );
}
