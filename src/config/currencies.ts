import { ICurrency, IExchangeRate } from '../types/Currency';

export const CURRENCIES: ICurrency[] = [
    { id: 1, name: 'Яшма', color: '#ff7b7b', symbol: '🔴', description: 'Красный камень' },
    { id: 2, name: 'Сапфир', color: '#7ba5ff', symbol: '🔵', description: 'Синий камень' },
    { id: 3, name: 'Изумруд', color: '#8eff8e', symbol: '🟢', description: 'Зелёный камень' }
];

export const EXCHANGE_RATES: IExchangeRate[] = [
    { from: 1, to: 2, rate: 24 },
    { from: 2, to: 3, rate: 12 }
];