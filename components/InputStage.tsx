import React, { useState, useRef } from 'react';
import { IconCpu, IconPlay, IconBook } from './Icons';
import { AnalysisProgress } from '../types';

interface InputStageProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  progress?: AnalysisProgress | null;
}

export const InputStage: React.FC<InputStageProps> = ({ onAnalyze, isLoading, progress }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    onAnalyze(text);
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    // Simple mapping: OUTLINE: 0-20, CHUNKS: 20-60, ASSETS: 60-100
    if (progress.phase === 'OUTLINE') return 10 + (progress.current / progress.total) * 10;
    if (progress.phase === 'CHUNKS') return 20 + (progress.current / progress.total) * 40;
    if (progress.phase === 'ASSETS') return 60 + (progress.current / progress.total) * 40;
    return 0;
  };

  const loadSample = () => {
    setText(`雨没有停。在新东京，雨已经下了三天三夜。
凯尔靠在小巷满是涂鸦的墙上，检查着他的义肢手臂。伺服电机发出轻微的嗡嗡声。
“你迟到了，”一个声音从阴影中传来。
是米拉。她走进了上方拉面店招牌投下的霓虹灯光中。她看起来和战前不同了。更冷酷，更坚硬。
“带来那个驱动器了吗？”她问道，伸出一只手。
凯尔犹豫了。他知道把数据给她意味着背叛公司，但留着它可能意味着死亡。
“我带了，”凯尔拍了拍口袋说。“但我需要知道你为什么要它。”
米拉叹了口气，抬头看着充满烟雾的天空。“因为这是拯救我们仅存之物的唯一方法，凯尔。”`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setText(content);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 md:p-8 animate-slide-up">
      {/* Container simulating a device chassis */}
      <div className="w-full max-w-3xl bg-concrete border-2 border-ink shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] relative overflow-hidden">

        {/* Header Strip */}
        <div className="bg-ink text-paper p-4 flex justify-between items-center border-b-2 border-ink">
          <h1 className="font-serif text-3xl font-black tracking-tighter uppercase italic">
            Narrative<span className="text-signal">Engine</span> <span className="text-lg not-italic text-paper/60 ml-2">/ 叙事引擎</span>
          </h1>
          <div className="font-mono text-xs opacity-60">
            V 2.0.4 [稳定版]
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-10 flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end mb-2">
              <label className="font-mono text-xs uppercase tracking-widest text-ink/60 font-bold">输入源 // 小说文本</label>
              <input
                type="file"
                accept=".txt,.md,.json"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={triggerFileUpload}
                disabled={isLoading}
                className="font-mono text-xs bg-ink/10 hover:bg-ink hover:text-paper px-3 py-1 transition-colors uppercase flex items-center gap-2"
              >
                <IconBook className="w-3 h-3" />
                上传文件 (.txt)
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading}
              className="w-full h-64 bg-paper border-2 border-ink p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-signal focus:border-signal resize-none placeholder-ink/30"
              placeholder="在此粘贴你的故事片段、小说章节，或上传文本文件..."
            />
          </div>

          <div className="flex flex-col gap-6 border-t-2 border-ink/10 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
              <button
                onClick={loadSample}
                disabled={isLoading}
                className="font-mono text-xs underline hover:text-signal transition-colors disabled:opacity-50"
              >
                加载示例文本
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !text.trim()}
                className={`
                  group relative px-8 py-3 bg-ink text-paper font-bold font-sans uppercase tracking-wider
                  border-2 border-transparent hover:bg-signal hover:text-ink transition-all duration-200
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  flex items-center gap-3 overflow-hidden min-w-[180px]
                `}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin"><IconCpu /></span>
                    <span>转化中...</span>
                  </>
                ) : (
                  <>
                    <span>启动游戏</span>
                    <IconPlay className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Granular Progress UI */}
            {isLoading && (
              <div className="w-full bg-ink/5 p-4 border border-ink/10 animate-fade-in">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal font-bold">
                    System Pipeline Status
                  </span>
                  <span className="font-mono text-[10px] text-ink/40">
                    {Math.round(getProgressPercentage())}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-2 bg-paper border border-ink/20 overflow-hidden relative">
                  <div
                    className="h-full bg-signal transition-all duration-500 ease-out"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                  {/* Scanning line effect */}
                  <div className="absolute top-0 bottom-0 w-8 bg-white/20 -skew-x-12 animate-scan" style={{ left: `${getProgressPercentage() - 5}%` }} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-signal rounded-full animate-pulse" />
                  <p className="font-mono text-[11px] text-ink/80 italic">
                    {progress?.message || "正在初始化系统..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Decorative elements - Saul Bass style jagged lines */}
        <div className="absolute top-0 right-10 w-4 h-full bg-ink/5 -skew-x-12 pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-8 h-32 bg-signal/10 skew-x-12 pointer-events-none"></div>
      </div>

      {/* Footer Meta */}
      <div className="mt-8 font-mono text-xs text-ink/40 text-center uppercase tracking-widest">
        LSP Pipeline V2.0 // Powered by Aliyun DashScope
      </div>
    </div>
  );
};