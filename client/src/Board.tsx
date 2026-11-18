import { useState } from 'react';

export default function Board() {
  const boardSize = 15; // 15x15 的棋盘
  
  // 用二维数组表示棋盘状态，null 表示空，'black' 表示黑子，'white' 表示白子
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))
  );

  // 点击交叉点落子（目前先做成随便点击切换黑白，后面再写规则）
  const handleClick = (row: number, col: number) => {
    const newBoard = board.map(r => [...r]);
    if (newBoard[row][col] === null) {
      newBoard[row][col] = 'black'; // 先默认落黑子测试用
      setBoard(newBoard);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-amber-100">
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
    </div>
  );
}