// Типы атак башен
export type AttackType = 'projectile' | 'laser' | 'aura';

// Интерфейс башни (данные из конфига)
export interface ITower {
    id: number;                // 1-12
    name: string;              // название
    color: string;             // цвет (hex)
    symbol: string;            // иконка-символ (для отладки)
    level: number;             // уровень (1-4)
    attackType: AttackType;    // тип атаки
    damage: number;            // базовый урон
    range: number;             // радиус атаки (в клетках)
    cooldown: number;          // перезарядка (мс)
    projectileSpeed?: number;  // скорость снаряда (для projectile)
    cost: number;              // стоимость в постоянной валюте (в единицах своей валюты)
    placeCost: number;         // стоимость установки в бою (энергия)
    description: string;       // описание
}

// Интерфейс башни на поле боя (с дополнительными полями)
export interface IPlacedTower extends ITower {
    x: number;
    y: number;
    lastShot: number;          // время последнего выстрела (timestamp)
    buffId: number | null;     // ID баффа, присвоенного на этот портал (0-6)
}