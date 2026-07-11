export type AttackType = 'projectile' | 'laser' | 'aura';

export interface ITower {
    id: number;
    name: string;
    color: string;
    symbol: string;
    level: number;
    attackType: AttackType;
    damage: number;
    range: number;
    cooldown: number;
    projectileSpeed?: number;
    cost: number;
    placeCost: number;
    description: string;
}

export interface IPlacedTower extends ITower {
    x: number;
    y: number;
    lastShot: number;
    buffId: number | null;
}