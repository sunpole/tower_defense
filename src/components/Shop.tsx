import React from 'react';
import { TOWERS } from '../config/towers';

export const Shop: React.FC = () => {
    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2>Магазин башен</h2>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {TOWERS.map(tower => (
                    <div key={tower.id} style={{
                        border: '2px solid ' + tower.color,
                        borderRadius: '10px',
                        padding: '10px',
                        width: '150px',
                        backgroundColor: '#1a1a2e'
                    }}>
                        <div style={{ fontSize: '40px', color: tower.color }}>{tower.symbol}</div>
                        <div><strong>{tower.name}</strong></div>
                        <div>Урон: {tower.damage}</div>
                        <div>Радиус: {tower.range}</div>
                        <div>Цена: {tower.cost} {tower.symbol}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};