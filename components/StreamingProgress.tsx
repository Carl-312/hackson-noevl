import React from 'react';
import { SegmentProgress } from '../types';

interface StreamingProgressProps {
  progress: SegmentProgress;
}

export const StreamingProgress: React.FC<StreamingProgressProps> = ({ progress }) => {
  const percentage = Math.round((progress.currentSegment / progress.totalSegments) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 md:p-8 bg-paper animate-slide-up">
      {/* Progress Container */}
      <div className="w-full max-w-2xl bg-concrete border-2 border-ink shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">
        {/* Header */}
        <div className="bg-ink text-paper p-6 border-b-2 border-ink">
          <h1 className="font-serif text-2xl font-black tracking-tighter uppercase italic">
            剧本生成中...
          </h1>
          <p className="font-mono text-xs opacity-60 mt-1">
            STORY CONVERSION IN PROGRESS
          </p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 flex flex-col items-center gap-8">
          {/* Progress Bar */}
          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="font-mono text-xs text-ink/60 uppercase tracking-wider">
                分段进度
              </span>
              <span className="font-mono text-sm font-bold text-signal">
                {progress.currentSegment} / {progress.totalSegments}
              </span>
            </div>
            <div className="h-4 bg-ink/10 border-2 border-ink relative overflow-hidden">
              <div
                className="absolute inset-0 bg-signal transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              >
                {/* Striped pattern animation */}
                <div className="absolute inset-0 opacity-30">
                  <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-right">
              <span className="font-mono text-xs text-ink/40">{percentage}%</span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-4 bg-ink/5 p-4 border border-ink/10 w-full">
            {progress.status === 'loading' && (
              <>
                <div className="w-4 h-4 border-2 border-signal border-t-transparent rounded-full animate-spin"></div>
                <span className="font-mono text-sm text-ink">
                  正在生成第 {progress.currentSegment} 段剧情...
                </span>
              </>
            )}
            {progress.status === 'complete' && (
              <>
                <div className="w-4 h-4 bg-signal rounded-full"></div>
                <span className="font-mono text-sm text-ink">
                  第 {progress.currentSegment} 段生成完成
                </span>
              </>
            )}
            {progress.status === 'error' && (
              <>
                <div className="w-4 h-4 bg-signal"></div>
                <span className="font-mono text-sm text-signal">
                  生成失败，请重试
                </span>
              </>
            )}
          </div>

          {/* Info Text */}
          <div className="text-center">
            <p className="font-mono text-xs text-ink/40 leading-relaxed">
              长文本已自动分段处理。<br />
              后台正在逐段生成剧本，完成后将自动进入游戏。
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-10 w-4 h-full bg-ink/5 -skew-x-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-8 h-32 bg-signal/10 skew-x-12 pointer-events-none"></div>
      </div>
    </div>
  );
};
