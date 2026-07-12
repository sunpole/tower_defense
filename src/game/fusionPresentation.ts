export function getAbilityExactEffect(abilityId: string): string {
  switch (abilityId) {
    case 'red-5-focus':
      return '+10% к базовому урону.';
    case 'red-6-pierce':
      return 'До 2 целей; вторая получает 42% урона.';
    case 'red-7-critical':
      return '+18% к базовому урону; каждая 4-я атака наносит ×2 урона.';
    case 'red-8-execute':
      return '+24% к базовому урону; враги с 35% HP или меньше получают ×1,75 урона.';
    case 'red-9-horizon':
      return 'Каждая 4-я атака игнорирует радиус; легендарный состав также даёт +10% урона.';
    case 'green-5-double':
      return 'Каждая 5-я атака повторяет 55% урона по основной цели.';
    case 'green-6-accelerate':
      return 'Перезарядка сокращается на 14%.';
    case 'green-7-burst':
      return 'До 3 целей; каждая 6-я атака дополнительно наносит 45% урона по трём целям.';
    case 'green-8-reset':
      return 'Перезарядка сокращается на 24%; после атаки есть 22% шанс оставить только 22% следующего цикла.';
    case 'green-9-overload':
      return 'Перезарядка сокращается на 42%.';
    case 'blue-5-seeking':
      return '+0,20 клетки к итоговому радиусу.';
    case 'blue-6-ricochet':
      return 'До 2 целей; дополнительная цель получает 42% урона.';
    case 'blue-7-split':
      return 'До 3 целей; дополнительные цели получают по 42% урона.';
    case 'blue-8-chain':
      return 'До 4 целей; дополнительные цели получают по 55% урона.';
    case 'blue-9-network':
      return 'Одновременно поражает все доступные цели в радиусе.';
    default:
      return 'Точный эффект будет уточнён балансировкой.';
  }
}

export function formatFusionCostRange(costs: number[]): string | null {
  if (costs.length === 0) {
    return null;
  }

  const minimum = Math.min(...costs);
  const maximum = Math.max(...costs);

  return minimum === maximum ? `${minimum}` : `${minimum}–${maximum}`;
}
