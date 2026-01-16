import React, { useEffect, useState, useRef } from 'react';
import { GalgameScript, GameState, StoryNode, Character } from '../types';
import { IconRefresh, IconHistory, IconArrowRight } from './Icons';

interface GameEngineProps {
  script: GalgameScript;
  onReset: () => void;
}

interface LogEntry {
  characterName: string;
  text: string;
}

export const GameEngine: React.FC<GameEngineProps> = ({ script, onReset }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>(script.startNodeId);
  const currentNode = script.nodes.find(n => n.id === currentNodeId);

  // Interaction State
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [historyLog, setHistoryLog] = useState<LogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Refs needed for auto-scroll
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Derived Data
  const currentScene = script.scenes.find(s => s.id === currentNode?.sceneId);
  const currentCharacter = script.characters.find(c => c.id === currentNode?.characterId);

  // Logic: Is this a branching point or a linear continuation?
  const isBranching = currentNode && (currentNode.choices?.length ?? 0) > 1;
  const isLinear = currentNode && (currentNode.choices?.length ?? 0) === 1;

  // Typewriter effect
  useEffect(() => {
    if (!currentNode) return;

    setTypingText('');
    setIsTyping(true);

    const text = currentNode.text || "";
    let i = 0;
    const speed = 25;

    if (text.length === 0) {
      setIsTyping(false);
      return;
    }

    const interval = setInterval(() => {
      if (i < text.length) {
        const nextCharIndex = i + 1;
        setTypingText(text.substring(0, nextCharIndex));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [currentNodeId, currentNode]);

  // Scroll history to bottom when opened
  useEffect(() => {
    if (showHistory && historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showHistory]);

  // Actions
  const handleInteraction = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // 1. If typing, skip to end
    if (isTyping && currentNode) {
      setTypingText(currentNode.text);
      setIsTyping(false);
      return;
    }

    // 2. If finished typing AND it's a linear node, advance automatically
    if (!isTyping && isLinear && currentNode) {
      advanceNode(currentNode.choices[0].nextNodeId);
      return;
    }

    // 3. If branching, do nothing on click (user must click a specific button)
  };

  const advanceNode = (nextNodeId: string) => {
    if (!currentNode) return;

    // Record History
    const speaker = currentCharacter ? currentCharacter.name : "旁白";
    setHistoryLog(prev => [...prev, { characterName: speaker, text: currentNode.text }]);

    setCurrentNodeId(nextNodeId);
  };

  if (!currentNode) return (
    <div className="flex flex-col items-center justify-center h-screen bg-ink text-signal">
      <h2 className="text-xl font-bold mb-4">错误: 剧情节点丢失 (ID: {currentNodeId})</h2>
      <button onClick={onReset} className="underline">返回主菜单</button>
    </div>
  );

  const getCharacterImage = (char: Character) => {
    const seed = char.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `https://picsum.photos/seed/${seed}/400/800`;
  };

  const getBackgroundImage = (sceneId: string) => {
    const seed = sceneId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return `https://picsum.photos/seed/${seed}_bg/1280/720?grayscale&blur=2`;
  };

  return (
    <div className="relative w-full h-screen bg-ink overflow-hidden font-sans select-none">

      {/* 1. Background Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${getBackgroundImage(currentNode.sceneId)})`,
          opacity: 0.4
        }}
      />

      {/* 2. Scene/Mood Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/50 pointer-events-none" />

      {/* 3. Character Layer */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10">
        {currentCharacter && (
          <div className="relative animate-slide-up">
            <img
              src={getCharacterImage(currentCharacter)}
              alt={currentCharacter.name}
              className="h-[80vh] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter contrast-125 sepia-[0.3]"
            />
            <div className="absolute top-1/2 -left-12 bg-signal text-ink font-black text-4xl uppercase -rotate-90 px-4 py-2 shadow-lg">
              {currentCharacter.name}
            </div>
          </div>
        )}
      </div>

      {/* 4. UI Layer */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-8">

        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="bg-paper/90 border-l-4 border-signal p-4 max-w-sm shadow-lg backdrop-blur-sm">
            <h2 className="font-mono text-xs text-ink/50 uppercase tracking-widest mb-1">当前场景</h2>
            <p className="font-serif font-bold text-lg leading-tight text-ink">{currentScene?.description || "未知地点"}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="bg-ink/80 text-paper p-3 hover:bg-signal hover:text-ink transition-colors flex items-center gap-2"
            >
              <IconHistory className="w-5 h-5" />
              <span className="font-mono text-xs hidden md:inline">历史记录</span>
            </button>
            <button onClick={onReset} className="bg-ink/80 text-paper p-3 hover:bg-signal hover:text-ink transition-colors">
              <IconRefresh className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History Modal Overlay */}
        {showHistory && (
          <div className="absolute inset-0 z-50 bg-ink/95 backdrop-blur-md flex flex-col p-8 animate-slide-up">
            <div className="flex justify-between items-center border-b border-paper/20 pb-4 mb-4">
              <h2 className="text-paper font-serif text-2xl font-bold">剧情记录 // LOGS</h2>
              <button onClick={() => setShowHistory(false)} className="text-signal hover:text-paper font-mono text-lg">[关闭]</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
              {historyLog.length === 0 && <p className="text-gray-500 font-mono">暂无记录...</p>}
              {historyLog.map((log, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="font-mono text-xs text-signal uppercase tracking-wider">{log.characterName}</span>
                  <p className="text-paper/80 font-serif text-lg leading-relaxed">{log.text}</p>
                </div>
              ))}
              <div ref={historyEndRef} />
            </div>
          </div>
        )}

        {/* Bottom Dialogue Area */}
        <div className="w-full max-w-5xl mx-auto mb-4 md:mb-12 flex flex-col gap-4 pointer-events-auto">

          {/* A. Branching Choices (Only show if multiple choices exist and typing is done) */}
          {!isTyping && isBranching && (
            <div className="flex flex-col md:flex-row gap-4 justify-center items-end mb-4 animate-slide-up">
              {currentNode.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    advanceNode(choice.nextNodeId);
                  }}
                  className="bg-paper border-2 border-ink shadow-[4px_4px_0px_0px_#ff3300] hover:shadow-[2px_2px_0px_0px_#ff3300] hover:translate-y-[2px] hover:translate-x-[2px] text-ink px-6 py-4 font-bold text-lg transition-all text-left min-w-[200px]"
                >
                  <span className="font-mono text-xs text-signal block mb-1">分支 0{idx + 1}</span>
                  {choice.text}
                </button>
              ))}
            </div>
          )}

          {/* B. Dead End Warning */}
          {!isTyping && (currentNode.choices?.length ?? 0) === 0 && !currentNode.isEnding && (
            <div className="flex justify-center mb-4">
              <div className="bg-signal text-paper px-4 py-2 font-mono text-xs">
                SYSTEM WARNING: END OF DATA STREAM (NO BRANCHES FOUND)
              </div>
            </div>
          )}

          {/* C. Main Text Box */}
          <div
            onClick={handleInteraction}
            className={`
                bg-ink/95 border-t-4 border-signal text-paper p-6 md:p-10 shadow-2xl backdrop-blur-md relative min-h-[180px]
                transition-colors hover:bg-ink
                ${isBranching && !isTyping ? 'cursor-default' : 'cursor-pointer'}
            `}
          >

            {/* Decorative Grid */}
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-2 h-2 bg-paper/20 rounded-full"></div>
              <div className="w-2 h-2 bg-paper/20 rounded-full"></div>
              <div className="w-2 h-2 bg-paper/20 rounded-full"></div>
            </div>

            {/* Speaker Name */}
            {currentNode.characterId ? (
              <h3 className="font-mono text-signal text-sm uppercase tracking-[0.2em] mb-3 border-b border-paper/10 pb-2 inline-block">
                {currentCharacter?.name} ///
              </h3>
            ) : (
              <h3 className="font-mono text-gray-500 text-sm uppercase tracking-[0.2em] mb-3 border-b border-paper/10 pb-2 inline-block">
                旁白 ///
              </h3>
            )}

            {/* Text Content */}
            <p className="font-serif text-xl md:text-2xl leading-relaxed tracking-wide select-none text-paper/90">
              {/* 对话自动添加「」 */}
              {currentCharacter && '「'}
              {typingText}
              {currentCharacter && '」'}
              {isTyping && <span className="animate-flicker inline-block w-2 h-6 bg-signal ml-1 align-middle"></span>}
            </p>

            {/* Visual Indicators */}
            {!isTyping && (
              <div className="absolute bottom-6 right-6 animate-bounce">
                {/* If linear, show arrow. If branching, show nothing (buttons are above). If ending, show square. */}
                {isLinear && <IconArrowRight className="w-6 h-6 text-signal" />}
                {currentNode.isEnding && <div className="w-4 h-4 bg-signal"></div>}
              </div>
            )}

            {/* Hint text */}
            {isTyping && (
              <div className="absolute bottom-4 right-4 text-xs font-mono text-gray-500 animate-pulse">
                [点击跳过]
              </div>
            )}

            {!isTyping && isLinear && (
              <div className="absolute bottom-4 right-12 text-xs font-mono text-gray-500">
                [点击继续]
              </div>
            )}

            {/* End Game State */}
            {!isTyping && currentNode.isEnding && (
              <div className="mt-6 text-center">
                <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="text-signal font-mono text-sm underline hover:text-white">
                  故事终结。重启系统？
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};