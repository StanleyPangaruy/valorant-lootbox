import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

interface Skin {
  name: string;
  weapon: string;
  rarity: string;
  icon: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#aaa',
  rare: '#3498db',
  epic: '#9b59b6',
  ultra: '#e67e22',
  legendary: '#f1c40f',
};

const RARITY_PROBABILITIES: Record<string, number> = {
  common: 0.7992,
  rare: 0.1598,
  epic: 0.032,
  ultra: 0.0064,
  legendary: 0.0026,
};

function App() {
  const [skinPool, setSkinPool] = useState<Record<string, Skin[]>>({
    common: [],
    rare: [],
    epic: [],
    ultra: [],
    legendary: [],
  });

  const [drop, setDrop] = useState<Skin | null>(null);
  const [history, setHistory] = useState<Skin[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const weaponsRes = await axios.get('https://valorant-api.com/v1/weapons');
      const tiersRes = await axios.get('https://valorant-api.com/v1/contenttiers');

      const rarityMap: Record<string, string> = {};
      tiersRes.data.data.forEach((tier: any) => {
        const name = tier.displayName.toLowerCase();
        if (name.includes('select') || name.includes('standard')) rarityMap[tier.uuid] = 'common';
        else if (name.includes('deluxe')) rarityMap[tier.uuid] = 'rare';
        else if (name.includes('premium')) rarityMap[tier.uuid] = 'epic';
        else if (name.includes('ultra')) rarityMap[tier.uuid] = 'ultra';
        else if (name.includes('exclusive')) rarityMap[tier.uuid] = 'legendary';
      });

      const pool: Record<string, Skin[]> = {
        common: [],
        rare: [],
        epic: [],
        ultra: [],
        legendary: [],
      };

      weaponsRes.data.data.forEach((weapon: any) => {
        weapon.skins.forEach((skin: any) => {
          const rarity = rarityMap[skin.contentTierUuid];
          if (rarity && skin.displayIcon) {
            pool[rarity].push({
              name: skin.displayName,
              weapon: weapon.displayName,
              rarity,
              icon: skin.displayIcon,
            });
          }
        });
      });

      setSkinPool(pool);
    };

    fetchData();
  }, []);

  const weightedRandom = () => {
    const r = Math.random();
    let total = 0;
    for (const [rarity, weight] of Object.entries(RARITY_PROBABILITIES)) {
      total += weight;
      if (r < total) return rarity;
    }
    return 'common';
  };

  const openLootbox = () => {
    const rarity = weightedRandom();
    const options = skinPool[rarity];
    if (!options.length) return;

    const chosen = options[Math.floor(Math.random() * options.length)];
    setDrop(chosen);
    setHistory(prev => [chosen, ...prev.slice(0, 19)]); // Keep last 20 drops
  };

  return (
    <div className="App">
      <h1>Valorant Lootbox</h1>
      <button onClick={openLootbox}>Open Lootbox</button>

      {drop && (
        <div className="drop-card" style={{ borderColor: RARITY_COLORS[drop.rarity] }}>
          <img src={drop.icon} alt={drop.name} />
          <h2>{drop.name}</h2>
          <p>{drop.weapon}</p>
          <p style={{ color: RARITY_COLORS[drop.rarity] }}>Rarity: {drop.rarity.toUpperCase()}</p>
        </div>
      )}

      {history.length > 0 && (
        <>
          <h2>History</h2>
          <div className="history-grid">
            {history.map((item, i) => (
              <div key={i} className="history-card" style={{ borderColor: RARITY_COLORS[item.rarity] }}>
                <img src={item.icon} alt={item.name} />
                <p>{item.name}</p>
                <small style={{ color: RARITY_COLORS[item.rarity] }}>{item.rarity.toUpperCase()}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
