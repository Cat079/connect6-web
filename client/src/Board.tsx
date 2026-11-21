import { useState } from 'react';
import axios from 'axios';

export default function Board() {
  const boardSize = 15;
  
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameMode, setGameMode] = useState<'pvp' | 'pve'>('pve');

  // 新增：记录当前回合已经下了几步（0, 1, 或 2）
  const [stepsInTurn, setStepsInTurn] = useState(0);
  // 判断是否为全局第一步（黑棋第一手只走1步）
  const isFirstMove = board.every(row => row.every(cell => cell === null)) && isBlackTurn;

  const checkWin = (currentBoard: (string | null)[][], row: number, col: number, player: string) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      let count = 1;
      for (let step = 1; step < 6; step++) {
        const newRow = row + dx * step; const newCol = col + dy * step;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && currentBoard[newRow][newCol] === player) count++; else break;
      }
      for (let step = 1; step < 6; step++) {
        const newRow = row - dx * step; const newCol = col - dy * step;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && currentBoard[newRow][newCol] === player) count++; else break;
      }
      if (count >= 6) return true;
    }
    return false;
  };

  // 处理落子，返回是否获胜
  const applyMove = (newBoard: (string | null)[][], row: number, col: number, player: string) => {
    newBoard[row][col] = player;
    return checkWin(newBoard, row, col, player);
  };

  const handleClick = (row: number, col: number) => {
    if (winner || board[row][col] !== null || isAiThinking) return;
    if (gameMode === 'pve' && !isBlackTurn) return;

    const currentPlayer = isBlackTurn ? 'black' : 'white';
    const newBoard = board.map(r => [...r]);
    
    // 落子并检查胜负
    if (applyMove(newBoard, row, col, currentPlayer)) {
      setBoard(newBoard);
      setWinner(currentPlayer === 'black' ? '黑棋' : '白棋');
      return;
    }

    setBoard(newBoard);

    // 判断是否需要切换回合
    const nextStep = stepsInTurn + 1;
    const requiredSteps = isFirstMove ? 1 : 2; // 第一手走1步，其余走2步

    if (nextStep >= requiredSteps) {
      setIsBlackTurn(!isBlackTurn);
      setStepsInTurn(0); // 归零，换人
    } else {
      setStepsInTurn(nextStep); // 继续当前回合
    }
  };

  const callAi = async () => {
    if (gameMode === 'pvp' || winner || isBlackTurn || isAiThinking) return;

    setIsAiThinking(true);
    try {
      const response = await axios.post('http://localhost:3001/api/ai-move', {
        board: board,
        currentPlayer: 'white'
      });

      if (response.data.success) {
        const moves = response.data.moves; // AI 返回的数组
        if (!Array.isArray(moves)) throw new Error("AI 未返回数组");

        const newBoard = board.map(r => [...r]);
        let whiteWins = false;

        // 遍历 AI 返回的两步落子
        for (const move of moves) {
          const { row, col } = move;
          if (row >= 0 && row < boardSize && col >= 0 && col < boardSize && newBoard[row][col] === null) {
            if (applyMove(newBoard, row, col, 'white')) whiteWins = true;
          }
        }

        setBoard(newBoard);
        if (whiteWins) {
          setWinner('白棋');
        } else {
          setIsBlackTurn(true); // 换回黑棋
          setStepsInTurn(0);
        }
      }
    } catch (error) {
      console.error("呼叫 AI 失败", error);
      alert("AI 思考失败，请检查后端是否启动。");
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-amber-100">
      <div className="mb-4 flex flex-col items-center">
        <div className="text-2xl font-bold text-gray-800 h-8 mb-2">
          {winner ? (
            <span className="text-red-600">🎉 游戏结束，{winner} 获胜！</span>
          ) : (
            <span>
              当前回合：{isBlackTurn ? '黑棋' : '白棋'} 
              {isAiThinking && ' (AI 思考中...)'}
              {/* 提示双落子进度 */}
              {!isAiThinking && !winner && ` (本回合已下 ${stepsInTurn} / ${isFirstMove ? 1 : 2} 子)`}
            </span>
          )}
        </div>

        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => { setGameMode('pve'); setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))); setWinner(null); setIsBlackTurn(true); setStepsInTurn(0); }}
            className={`px-4 py-1 rounded ${gameMode === 'pve' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >人机对战</button>
          <button 
            onClick={() => { setGameMode('pvp'); setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))); setWinner(null); setIsBlackTurn(true); setStepsInTurn(0); }}
            className={`px-4 py-1 rounded ${gameMode === 'pvp' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >本地双人</button>
        </div>
      </div>

      <div className="bg-amber-300 p-4 rounded-lg shadow-xl">
        <div 
          className="grid border-t border-l border-black"
          style={{ gridTemplateColumns: `repeat(${boardSize}, 1fr)`, gridTemplateRows: `repeat(${boardSize}, 1fr)` }}
        >
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleClick(rowIndex, colIndex)}
                className="w-8 h-8 border-r border-b border-black relative flex justify-center items-center cursor-pointer hover:bg-amber-400 transition-colors"
              >
                {cell === 'black' && <div className="w-7 h-7 bg-black rounded-full shadow-md"></div>}
                {cell === 'white' && <div className="w-7 h-7 bg-white rounded-full shadow-md border border-gray-300"></div>}
              </div>
            ))
          ))}
        </div>
      </div>

      {gameMode === 'pve' && !isBlackTurn && !winner && stepsInTurn === 0 && (
        <button 
          onClick={callAi}
          disabled={isAiThinking}
          className="mt-6 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
        >
          {isAiThinking ? 'AI 正在思考...' : '🤖 呼叫 AI 落子'}
        </button>
      )}

      {(winner || board.some(r => r.some(c => c !== null))) && !isAiThinking && (
        <button 
          onClick={() => {
            setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
            setIsBlackTurn(true);
            setWinner(null);
            setStepsInTurn(0);
          }}
          className="mt-4 px-6 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
        >
          重新开始
        </button>
      )}
    </div>
  );
}