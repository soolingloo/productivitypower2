export const categoryColors = [
  'bg-blue-200',
  'bg-purple-200',
  'bg-green-200',
  'bg-orange-200',
  'bg-pink-200',
  'bg-teal-200',
  'bg-indigo-200',
  'bg-rose-200',
  'bg-amber-200',
  'bg-cyan-200',
];

export const getRandomColor = (usedColors: string[]): string => {
  const availableColors = categoryColors.filter(color => !usedColors.includes(color));
  if (availableColors.length === 0) {
    return categoryColors[Math.floor(Math.random() * categoryColors.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};
