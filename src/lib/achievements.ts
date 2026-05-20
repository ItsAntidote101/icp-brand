export type AchievementId =
  | 'first_diagnosis'
  | 'quick_win'
  | 'consistent'
  | 'score_climber'
  | 'intelligence_reader'
  | 'csv_analyst'

export type AchievementDef = {
  id: AchievementId
  name: string
  description: string
  iconName: string
  color: string
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_diagnosis',     name: 'First Diagnosis',     description: 'Completed your first ICP diagnostic',     iconName: 'FileSearch', color: '#302161' },
  { id: 'quick_win',           name: 'Quick Win',           description: 'Marked your first fix as complete',       iconName: 'Zap',        color: '#f59e0b' },
  { id: 'consistent',          name: 'Consistent',          description: 'Completed 3 ICP diagnoses',               iconName: 'Target',     color: '#22c55e' },
  { id: 'score_climber',       name: 'Score Climber',       description: 'Improved your ICP score by 10+ points',  iconName: 'TrendingUp', color: '#a855f7' },
  { id: 'intelligence_reader', name: 'Intelligence Reader', description: 'Viewed 5 weekly intelligence briefings', iconName: 'Brain',      color: '#3b82f6' },
  { id: 'csv_analyst',         name: 'CSV Analyst',         description: 'Uploaded and analyzed campaign data',    iconName: 'BarChart2',  color: '#f97316' },
]

export type UserAchievementData = {
  reportCount:      number
  completedWins:    number
  scoreImprovement: number
  briefingsViewed:  number
  csvUploads:       number
}

export function calculateAchievements(data: UserAchievementData): Record<AchievementId, boolean> {
  return {
    first_diagnosis:      data.reportCount >= 1,
    quick_win:            data.completedWins >= 1,
    consistent:           data.reportCount >= 3,
    score_climber:        data.scoreImprovement >= 10,
    intelligence_reader:  data.briefingsViewed >= 5,
    csv_analyst:          data.csvUploads >= 1,
  }
}

export function getNewlyEarned(
  stored: Record<string, boolean>,
  current: Record<AchievementId, boolean>,
): AchievementId[] {
  return (Object.keys(current) as AchievementId[]).filter(id => current[id] && !stored[id])
}
