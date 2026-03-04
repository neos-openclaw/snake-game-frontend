import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch leaderboard:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-box">
        <h2>🏆 排行榜</h2>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>玩家</th>
                <th>得分</th>
                <th>日期</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={index}>
                  <td className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && index + 1}
                  </td>
                  <td className="name">{entry.name}</td>
                  <td className="score">{entry.score}</td>
                  <td className="date">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button onClick={() => navigate('/game')} className="back-btn">
          返回游戏
        </button>
      </div>
    </div>
  );
}
