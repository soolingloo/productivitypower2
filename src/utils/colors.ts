export const categoryColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-cyan-500',
];

export const getRandomColor = (usedColors: string[]): string => {
  const availableColors = categoryColors.filter(color => !usedColors.includes(color));
  if (availableColors.length === 0) {
    return categoryColors[Math.floor(Math.random() * categoryColors.length)];
  }
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};
