import type { ITower } from '../types/Tower';

export const TOWERS: ITower[] = [
    {
        id: 1,
        name: 'Красная башня',
        color: '#ff7b7b',
        symbol: '🔴',
        level: 1,
        attackType: 'projectile',
        damage: 15,
        range: 2,
        cooldown: 800,
        projectileSpeed: 5,
        cost: 10,
        placeCost: 50,
        description: 'Точный снаряд по одной основной цели.'
    },
    {
        id: 2,
        name: 'Синяя башня',
        color: '#7ba5ff',
        symbol: '🔵',
        level: 1,
        attackType: 'laser',
        damage: 20,
        range: 3,
        cooldown: 600,
        cost: 10,
        placeCost: 50,
        description: 'Быстрый лазер с мгновенным попаданием.'
    },
    {
        id: 3,
        name: 'Зелёная башня',
        color: '#8eff8e',
        symbol: '🟢',
        level: 1,
        attackType: 'aura',
        damage: 10,
        range: 2,
        cooldown: 1200,
        cost: 10,
        placeCost: 50,
        description: 'Импульсом поражает всех врагов внутри своего круга.'
    }
];
