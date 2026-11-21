import { useState } from 'react';
import axios from 'axios';

export default function Board() {
  const boardSize = 15;
  
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))
  );
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  
  // 新增：AI 是否正在思考的状态
  const [isAiThinking, setIsAiThinking] = useState(false);
  // 新增：游戏模式（本地双人 或 人机对战）
  const [gameMode, setGameMode] = useState<'pvp' | 'pve'>('pve');

  // 核心算法：检查是否连成 6 子（保持不变）
  const checkWin = (currentBoard: (string | null)[][], row: number, col: number, player: string) => {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      let count = 1;
      for (let step = 1; step < 6; step++) {
        const newRow = row + dx * step;
        const newCol = col + dy * step;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && currentBoard[newRow][newCol] === player) count++; else break;
      }
      for (let step = 1; step < 6; step++) {
        const newRow = row - dx * step;
        const newCol = col - dy * step;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && currentBoard[newRow][newCol] === player) count++; else break;
      }
      if (count >= 6) return true;
    }
    return false;
  };

  // 提取一个专门处理落子的函数，方便人和 AI 共用
  const makeMove = (row: number, col: number, currentBoard: (string | null)[][]) => {
    const currentPlayer = isBlackTurn ? 'black' : 'white';
    const newBoard = currentBoard.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWin(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer === 'black' ? '黑棋' : '白棋');
    } else {
      setIsBlackTurn(!isBlackTurn);
    }
  };

  const handleClick = (row: number, col: number) => {
    // 如果是人机模式且现在是白棋回合（假设人执黑），或者 AI 正在思考，或者已经分出胜负，不能下
    if (winner || board[row][col] !== null || isAiThinking) return;
    if (gameMode === 'pve' && !isBlackTurn) return; 

    makeMove(row, col, board);
  };

  // 呼叫 AI 下棋
  const callAi = async () => {
    // 如果是双人模式，或者已经是赢家，或者轮到黑棋（人），就不呼叫
    if (gameMode === 'pvp' || winner || isBlackTurn) return;

    setIsAiThinking(true);
    try {
      const response = await axios.post('http://localhost:3001/api/ai-move', {
        board: board,
        currentPlayer: 'white'
      });

      if (response.data.success) {
        const { row, col } = response.data.move;
        // 检查 AI 返回的坐标是否合法（是不是空的）
        if (row >= 0 && row < boardSize && col >= 0 && col < boardSize && board[row][col] === null) {
          makeMove(row, col, board);
        } else {
          console.error("AI 返回了非法坐标", row, col);
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
      
      {/* 顶部状态栏 */}
      <div className="mb-4 flex flex-col items-center">
        <div className="text-2xl font-bold text-gray-800 h-8 mb-2">
          {winner ? (
            <span className="text-red-600">🎉 游戏结束，{winner} 获胜！</span>
          ) : (
            <span>当前回合：{isBlackTurn ? '黑棋' : '白棋'} {isAiThinking && '(AI 思考中...)'}</span>
          )}
        </div>

        {/* 模式切换按钮 */}
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => { setGameMode('pve'); setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))); setWinner(null); setIsBlackTurn(true); }}
            className={`px-4 py-1 rounded ${gameMode === 'pve' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >人机对战</button>
          <button 
            onClick={() => { setGameMode('pvp'); setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))); setWinner(null); setIsBlackTurn(true); }}
            className={`px-4 py-1 rounded ${gameMode === 'pvp' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >本地双人</button>
        </div>
      </div>

      {/* 棋盘外框 */}
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

      {/* 呼叫 AI 按钮 (人机模式且轮到白棋时显示) */}
      {gameMode === 'pve' && !isBlackTurn && !winner && (
        <button 
          onClick={callAi}
          disabled={isAiThinking}
          className="mt-6 px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
        >
          {isAiThinking ? 'AI 正在思考...' : '🤖 呼叫 AI 落子'}
        </button>
      )}

      {/* 重新开始按钮 */}
      {(winner || board.some(r => r.some(c => c !== null))) && !isAiThinking && (
        <button 
          onClick={() => {
            setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
            setIsBlackTurn(true);
            setWinner(null);
          }}
          className="mt-4 px-6 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
        >
          重新开始
        </button>
      )}
    </div>
  );
}