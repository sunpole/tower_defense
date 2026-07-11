export interface ICurrency {
    id: number;                // 1-12
    name: string;
    color: string;
    symbol: string;
    description: string;
}

// Интерфейс для курсов обмена
export interface IExchangeRate {
    from: number;              // id валюты
    to: number;
    rate: number;              // сколько from надо для 1 to
}