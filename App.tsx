import React, { useState } from 'react';
import { GameState, GalgameScript, AnalysisProgress } from './types';
import { analyzeStory } from './services/aliyunService';
import { InputStage } from './components/InputStage';
import { GameEngine } from './components/GameEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [script, setScript] = useState<GalgameScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);

  const handleAnalysis = async (text: string) => {
    setGameState(GameState.ANALYZING_OUTLINE);
    setError(null);
    setProgress(null);

    try {
      const result = await analyzeStory(text, (p) => {
        setProgress(p);
        if (p.phase === 'OUTLINE') setGameState(GameState.ANALYZING_OUTLINE);
        else if (p.phase === 'CHUNKS') setGameState(GameState.GENERATING_CHUNKS);
        else if (p.phase === 'ASSETS') setGameState(GameState.GENERATING_ASSETS);
      });

      console.log("Script Generated:", result);
      setScript(result);
      setGameState(GameState.PLAYING);
    } catch (err) {
      console.error(err);
      setError("故事转化失败。系统检测到异常，请重试。");
      setGameState(GameState.IDLE);
    }
  };

  const handleReset = () => {
    setGameState(GameState.IDLE);
    setScript(null);
  };

  const isAnalyzing =
    gameState === GameState.ANALYZING_OUTLINE ||
    gameState === GameState.GENERATING_CHUNKS ||
    gameState === GameState.GENERATING_ASSETS;

  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-signal selection:text-white overflow-hidden">

      {/* Global Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-signal text-white px-6 py-3 font-mono text-sm shadow-xl flex items-center gap-2 animate-bounce">
          <span className="font-bold">错误:</span> {error}
          <button onClick={() => setError(null)} className="ml-4 hover:underline">关闭</button>
        </div>
      )}

      {/* State Manager */}
      {gameState === GameState.IDLE || isAnalyzing ? (
        <InputStage
          onAnalyze={handleAnalysis}
          isLoading={isAnalyzing}
          progress={progress}
        />
      ) : (
        script && (
          <GameEngine
            script={script}
            onReset={handleReset}
          />
        )
      )}

      {/* API Key Modal Check */}
      {(!import.meta.env.VITE_ALIYUN_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY && !(typeof process !== 'undefined' && process.env.API_KEY)) && (
        <div className="fixed inset-0 z-[100] bg-ink/90 flex items-center justify-center p-4">
          <div className="bg-paper p-8 max-w-md w-full border-4 border-signal">
            <h2 className="font-serif text-2xl font-bold mb-4">系统缺失密钥</h2>
            <p className="mb-4">
              叙事引擎需要阿里云 API 密钥才能运行。
              请确保环境变量 <code>process.env.API_KEY</code> 已正确设置。
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;