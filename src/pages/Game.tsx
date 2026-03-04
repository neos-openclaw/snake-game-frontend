import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import './Game.css';

interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  name: string;
  snake: Position[];
  direction: Position;
  score: number;
  color: string;
}

interface GameState {
  players: Player[];
  foods: Position[];
  boardSize: number;
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const playerName = localStorage.getItem('playerName') || 'Player';

  useEffect(() => {
    // 连接 WebSocket
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join', { name: playerName });
    });

    newSocket.on('connected', (data) => {
      console.log('Connected:', data.id);
    });

    newSocket.on('joined', (data: Player) => {
      setPlayer(data);
    });

    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, [playerName]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!socket) return;

      const directions: { [key: string]: Position } = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      };

      const direction = directions[e.key];
      if (direction) {
        socket.emit('direction', direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [socket]);

  // 触屏控制
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!socket) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      const minSwipe = 30;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        socket.emit('direction', { x: dx > 0 ? 1 : -1, y: 0 });
      } else if (Math.abs(dy) > minSwipe) {
        socket.emit('direction', { x: 0, y: dy > 0 ? 1 : -1 });
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [socket]);

  // Canvas 绘制
  useEffect(() => {
    if (!canvasRef.current || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 20;
    const { boardSize, players, foods } = gameState;

    canvas.width = boardSize * cellSize;
    canvas.height = boardSize * cellSize;

    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= boardSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, boardSize * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(boardSize * cellSize, i * cellSize);
      ctx.stroke();
    }

    // 绘制食物
    foods.forEach((food) => {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // 绘制玩家蛇
    players.forEach((player) => {
      player.snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? player.color : player.color + 'cc';
        ctx.fillRect(
          segment.x * cellSize + 1,
          segment.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );

        if (isHead) {
          // 绘制眼睛
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(
            segment.x * cellSize + cellSize / 3,
            segment.y * cellSize + cellSize / 3,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            segment.x * cellSize + (cellSize * 2) / 3,
            segment.y * cellSize + cellSize / 3,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
    });
  }, [gameState]);

  const handleLogout = () => {
    if (socket) socket.disconnect();
    localStorage.removeItem('playerName');
    navigate('/login');
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="player-info">
          <span className="player-name">{playerName}</span>
          {player && (
            <span className="player-score">
              得分: <strong>{player.score}</strong>
            </span>
          )}
        </div>
        <div className="connection-status">
          {isConnected ? '🟢 已连接' : '🔴 未连接'}
        </div>
        <button onClick={handleLogout} className="logout-btn">
          退出
        </button>
      </div>

      <div className="game-board">
        <canvas ref={canvasRef} />
        {!gameState && (
          <div className="loading">等待游戏开始...</div>
        )}
      </div>

      <div className="game-controls">
        <p>使用方向键或 WASD 控制蛇的移动</p>
        <p>移动端：滑动屏幕控制方向</p>
      </div>

      <button
        onClick={() => navigate('/leaderboard')}
        className="leaderboard-btn"
      >
        🏆 排行榜
      </button>
    </div>
  );
}
