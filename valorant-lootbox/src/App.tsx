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
  select: '#aaa',
  deluxe: '#3498db',
  premium: '#9b59b6',
  ultra: '#e67e22',
  exclusive: '#f1c40f',
};

const RARITY_PROBABILITIES: Record<string, number> = {
  select: 0.7992,
  deluxe: 0.1598,
  premium: 0.032,
  ultra: 0.0064,
  exclusive: 0.0026,
};

function App() {
  const [skinPool, setSkinPool] = useState<Record<string, Skin[]>>({
    select: [],
    deluxe: [],
    premium: [],
    ultra: [],
    exclusive: [],
  });

  const [drop, setDrop] = useState<Skin | null>(null);
  const [history, setHistory] = useState<Skin[]>([]);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const weaponsRes = await axios.get('https://valorant-api.com/v1/weapons');
      const tiersRes = await axios.get('https://valorant-api.com/v1/contenttiers');

      const rarityMap: Record<string, string> = {};
      tiersRes.data.data.forEach((tier: any) => {
        const name = tier.displayName.toLowerCase();
        if (name.includes('select') || name.includes('standard')) rarityMap[tier.uuid] = 'select';
        else if (name.includes('deluxe')) rarityMap[tier.uuid] = 'deluxe';
        else if (name.includes('premium')) rarityMap[tier.uuid] = 'premium';
        else if (name.includes('ultra')) rarityMap[tier.uuid] = 'ultra';
        else if (name.includes('exclusive')) rarityMap[tier.uuid] = 'exclusive';
      });

      const pool: Record<string, Skin[]> = {
        select: [],
        deluxe: [],
        premium: [],
        ultra: [],
        exclusive: [],
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

  useEffect(() => {
  if (showEmbed) {
    const script = document.createElement('script');
    script.src = 'https://tenor.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }
}, [showEmbed]);


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
    setShowEmbed(true);
    setDrop(null);
    setTimeout(() => {
      const rarity = weightedRandom();
      const options = skinPool[rarity];
      if (!options.length) return;

      const chosen = options[Math.floor(Math.random() * options.length)];
      setDrop(chosen);
      setHistory(prev => [chosen, ...prev.slice(0, 19)]);
      setShowEmbed(false);
    }, 3000); // Adjust this if you want a longer GIF duration
  };


  return (
    <div className="App">
      <h1>Valorant Lootbox</h1>
      <button onClick={openLootbox}>Open Lootbox</button>

      {showEmbed && (
        <div style={{ width: '100%', maxWidth: '400px', height: '400px', margin: '0 auto' }}>
          <div
            className="tenor-gif-embed"
            data-postid="13110493423513625082"
            data-share-method="host"
            data-aspect-ratio="1"
            data-width="100%"
          >
            <a href="https://tenor.com/view/nifty-league-nifty-smashers-loot-box-lootbox-loot-gif-13110493423513625082">
              Nifty League Nifty Smashers GIF
            </a>
            <a href="https://tenor.com/search/nifty+league-gifs">Nifty League GIFs</a>
          </div>
        </div>
      )}

      {drop && !showEmbed && (
        <div className="drop-card" style={{ borderColor: RARITY_COLORS[drop.rarity] }}>
          <img src={drop.icon} alt={drop.name} className="skin-img" />
          <h2>{drop.name}</h2>
          <p>{drop.weapon}</p>
          <p style={{ color: RARITY_COLORS[drop.rarity] }}>Rarity: {drop.rarity.toUpperCase()}</p>
        </div>
      )}

      {/* {drop && (
        <div className="drop-card" style={{ borderColor: RARITY_COLORS[drop.rarity] }}>
          <img src={drop.icon} alt={drop.name} className="skin-img"/>
          <h2>{drop.name}</h2>
          <p>{drop.weapon}</p>
          <p style={{ color: RARITY_COLORS[drop.rarity] }}>Rarity: {drop.rarity.toUpperCase()}</p>
        </div>
      )} */}

      {history.length > 0 && (
        <>
          <h2>History</h2>
          <div className="history-grid">
            {history.map((item, i) => (
              <div key={i} className="history-card" style={{ borderColor: RARITY_COLORS[item.rarity] }}>
                <img src={item.icon} alt={item.name} className="skin-img"/>
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
