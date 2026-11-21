import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // 加载 .env 里的密钥

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '六子棋后端服务运行中' });
});

// 核心接口：接收棋盘，返回 AI 的落子坐标
app.post('/api/ai-move', async (req, res) => {
  try {
    const { board, currentPlayer } = req.body; 
    
    // 把二维数组的棋盘变成文字，告诉大模型哪里有空位
    // 比如：黑棋在 (7,7)，白棋在 (7,8)...
    let boardString = '当前棋盘状态：\n';
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (board[r][c] === 'black') boardString += `黑棋在 (${r}, ${c})\n`;
        if (board[r][c] === 'white') boardString += `白棋在 (${r}, ${c})\n`;
      }
    }

        // 告诉 AI 的提示词（修改版：要求返回两步）
    const prompt = `你是六子棋AI。六子棋规则是：黑棋先走1子，之后双方每次必须走2子。棋盘是15x15，坐标从(0,0)到(14,14)。
${boardString}
现在是 ${currentPlayer === 'black' ? '黑棋' : '白棋'} 回合。
请给出你的落子坐标：
1. 如果这是全局的第一步（黑棋第一手），只返回1个坐标。
2. 如果是后续回合，必须返回2个合法的空位坐标。
必须且只能严格以 JSON 数组格式返回，不要任何多余的解释。
格式示例：[{"row": 7, "col": 7}, {"row": 8, "col": 8}]`;

    // 发送请求给 DeepSeek
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 解析 AI 的回复
    const aiReply = response.data.choices[0].message.content;
    console.log("AI 原始回复:", aiReply);
    
    // 从回复中提取 JSON 数组格式的坐标
    const match = aiReply.match(/\[.*\]/s); // 注意这里改成了匹配中括号 []
    if (match) {
      const moves = JSON.parse(match[0]); // 解析成数组
      res.json({ success: true, moves }); // 返回数组
    } else {
      res.status(500).json({ error: "AI 格式错误", raw: aiReply });
    }
    

  } catch (error: any) {
    console.error("AI 接口报错:", error.message);
    res.status(500).json({ error: "AI 接口请求失败" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
});