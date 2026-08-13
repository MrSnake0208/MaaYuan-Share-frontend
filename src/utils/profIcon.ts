export const PROF_ICON_FILENAMES: Record<string, string> = {
  混沌: 'chaos',
  地: 'earth',
  水: 'water',
  火: 'fire',
  风: 'wind',
  阳: 'yang',
  阴: 'yin',
}

export const getProfIconPath = (profId: string) => {
  const filename = PROF_ICON_FILENAMES[profId]
  return filename ? `/assets/prof-icons/${filename}.png` : undefined
}
