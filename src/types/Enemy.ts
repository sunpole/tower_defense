// Интерфейс врага (данные из конфига)
export interface IEnemy {
    id: number;                // 1-12
    name: string;              // название
    color: string;             // цвет (hex)
    symbol: string;            // символ для отладки
    hp: number;                // максимальное здоровье
    speed: number;             // скорость движения (клеток в секунду, позже адаптируем под кадры)
    rewardEnergy: number;      // награда энергией за убийство
    currencyDrop: number;      // id валюты, которая может выпасть
    dropChance: number;        // шанс выпадения валюты (0..1)
    isBoss?: boolean;          // флаг босса (для некоторых баффов)
    description: string;
}

// Интерфейс врага на поле боя (с динамическими полями)
export interface IPlacedEnemy extends IEnemy {
    x: number;
    y: number;
    hp: number;                // текущее здоровье
    targetNodeIndex: number;   // индекс текущей целевой точки в пути
    instanceId: string;        // уникальный идентификатор экземпляра для пуль
}
