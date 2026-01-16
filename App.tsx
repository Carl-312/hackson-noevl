import React, { useState } from 'react';
import { GameState, GalgameScript } from './types';
import { analyzeStory } from './services/geminiService';
import { InputStage } from './components/InputStage';
import { GameEngine } from './components/GameEngine';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [script, setScript] = useState<GalgameScript | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async (text: string) => {
    setGameState(GameState.ANALYZING);
    setError(null);
    try {
      const result = await analyzeStory(text);
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
      {gameState === GameState.IDLE || gameState === GameState.ANALYZING ? (
        <InputStage 
          onAnalyze={handleAnalysis} 
          isLoading={gameState === GameState.ANALYZING} 
        />
      ) : (
        script && (
          <GameEngine 
            script={script} 
            onReset={handleReset} 
          />
        )
      )}

      {/* API Key Modal Check (Simple implementation for prompt requirement) */}
      {!process.env.API_KEY && (
        <div className="fixed inset-0 z-[100] bg-ink/90 flex items-center justify-center p-4">
           <div className="bg-paper p-8 max-w-md w-full border-4 border-signal">
              <h2 className="font-serif text-2xl font-bold mb-4">系统缺失密钥</h2>
              <p className="mb-4">
                叙事引擎需要 Gemini API 密钥才能运行。
                请确保环境变量 <code>process.env.API_KEY</code> 已正确设置。
              </p>
           </div>
        </div>
      )}
    </main>
  );
};

export default App;