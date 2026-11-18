import { useState } from 'react';

export default function Board() {
  const boardSize = 15;
  
  // 棋盘状态
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))
  );
  
  // 当前回合：true 为黑棋，false 为白棋
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  
  // 胜利者信息
  const [winner, setWinner] = useState<string | null>(null);

  // 核心算法：检查是否连成 6 子
  const checkWin = (currentBoard: (string | null)[][], row: number, col: number, player: string) => {
    // 四个方向向量：横向、纵向、左上到右下、右上到左下
    const directions = [
      [0, 1],  // 横
      [1, 0],  // 竖
      [1, 1],  // 右斜
      [1, -1]  // 左斜
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // 当前落子算 1 个

      // 向正方向延伸
      for (let step = 1; step < 6; step++) {
        const newRow = row + dx * step;
        const newCol = col + dy * step;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && currentBoard[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // 向反方向延伸
      for (let step = 1; step < 6; step++) {
        const newRow = row - dx * step;
        const newCol = col - dy * step;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && currentBoard[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // 如果任意方向连成 6 个或以上，返回 true
      if (count >= 6) return true;
    }
    return false;
  };

  const handleClick = (row: number, col: number) => {
    // 如果已经有胜者，或者该位置已经有棋子，直接返回
    if (winner || board[row][col] !== null) return;

    const newBoard = board.map(r => [...r]);
    const currentPlayer = isBlackTurn ? 'black' : 'white';
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    // 检查胜负
    if (checkWin(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer === 'black' ? '黑棋' : '白棋');
    } else {
      // 没分出胜负，交换回合
      setIsBlackTurn(!isBlackTurn);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-amber-100">
      
      {/* 顶部状态栏 */}
      <div className="mb-6 text-2xl font-bold text-gray-800 h-8">
        {winner ? (
          <span className="text-red-600">🎉 游戏结束，{winner} 获胜！</span>
        ) : (
          <span>当前回合：{isBlackTurn ? '黑棋' : '白棋'}</span>
        )}
      </div>

      {/* 棋盘外框 */}
      <div className="bg-amber-300 p-4 rounded-lg shadow-xl">
        {/* 棋盘网格 */}
        <div 
          className="grid border-t border-l border-black"
          style={{ 
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            gridTemplateRows: `repeat(${boardSize}, 1fr)`
          }}
        >
          {board.map((row, rowIndex) => (
            row.map((cell, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleClick(rowIndex, colIndex)}
                className="w-8 h-8 border-r border-b border-black relative flex justify-center items-center cursor-pointer hover:bg-amber-400 transition-colors"
              >
                {/* 渲染棋子 */}
                {cell === 'black' && <div className="w-7 h-7 bg-black rounded-full shadow-md"></div>}
                {cell === 'white' && <div className="w-7 h-7 bg-white rounded-full shadow-md border border-gray-300"></div>}
              </div>
            ))
          ))}
        </div>
      </div>

      {/* 重新开始按钮 */}
      {winner && (
        <button 
          onClick={() => {
            setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
            setIsBlackTurn(true);
            setWinner(null);
          }}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          再来一局
        </button>
      )}
    </div>
  );
}