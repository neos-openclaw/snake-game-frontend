import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('playerName', username.trim());
      navigate('/game');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>🐍 贪吃蛇游戏</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            name="username"
            placeholder="输入你的名字"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <button type="submit" disabled={!username.trim()}>
            开始游戏
          </button>
        </form>
      </div>
    </div>
  );
}
