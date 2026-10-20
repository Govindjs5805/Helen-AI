import type { AccessibilityNeedType } from '../types'

export type ThemePresetName =
  | 'dyslexia'
  | 'adhd'
  | 'visual_impairment'
  | 'hearing_impairment'
  | 'learning_disability'

export interface ThemeTokens {
  colors: {
    background: string
    surface: string
    text: string
    primary: string
    accent: string
  }
  font: {
    family: string
    sizeMultiplier: number
    letterSpacing: string
    lineHeight: string
  }
  layout: {
    reducedMotion: boolean
    singleFocusLayout: boolean
    largeTouchTargets: boolean
    captionsAlwaysOn: boolean
    visualNotifications: boolean
    forcesOwnContrast: boolean
  }
}

interface ThemePreset extends ThemeTokens {
  darkColors: ThemeTokens['colors']
}

const BASE_TOKENS: Record<'light' | 'dark', ThemeTokens['colors']> = {
  light: {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    text: '#16261E',
    primary: '#1B5E3F',
    accent: '#7ED957',
  },
  dark: {
    background: '#0B120D',
    surface: '#131B15',
    text: '#E7F5EC',
    primary: '#4ADE80',
    accent: '#7ED957',
  },
}

const DEFAULT_FONT = 'Inter, system-ui, sans-serif'

function layoutFlags(
  overrides: Partial<ThemeTokens['layout']> = {}
): ThemeTokens['layout'] {
  return {
    reducedMotion: false,
    singleFocusLayout: false,
    largeTouchTargets: false,
    captionsAlwaysOn: false,
    visualNotifications: false,
    forcesOwnContrast: false,
    ...overrides,
  }
}

export const THEME_PRESETS: Record<ThemePresetName, ThemePreset> = {
  dyslexia: {
    colors: {
      background: '#FDF6E3',
      surface: '#FFFCF3',
      text: '#3E2E22',
      primary: '#1B5E3F',
      accent: '#7ED957',
    },
    darkColors: {
      background: '#2C2418',
      surface: '#3A3025',
      text: '#F0E6D3',
      primary: '#8FE3A4',
      accent: '#7ED957',
    },
    font: {
      family: "'Atkinson Hyperlegible', Inter, system-ui, sans-serif",
      sizeMultiplier: 1,
      letterSpacing: '0.04em',
      lineHeight: '1.75',
    },
    layout: layoutFlags(),
  },
  adhd: {
    colors: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: '#0B1020',
      primary: '#1E2F9E',
      accent: '#C8F169',
    },
    darkColors: {
      background: '#1E2F9E',
      surface: '#26378F',
      text: '#FFFFFF',
      primary: '#C8F169',
      accent: '#C8F169',
    },
    font: {
      family: "'Lexend', system-ui, sans-serif",
      sizeMultiplier: 1,
      letterSpacing: '0em',
      lineHeight: '1.5',
    },
    layout: layoutFlags({ singleFocusLayout: true }),
  },
  visual_impairment: {
    colors: {
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFD500',
      primary: '#FFD500',
      accent: '#FFD500',
    },
    darkColors: {
      background: '#000000',
      surface: '#1A1A1A',
      text: '#FFD500',
      primary: '#FFD500',
      accent: '#FFD500',
    },
    font: {
      family: DEFAULT_FONT,
      sizeMultiplier: 1.3,
      letterSpacing: '0em',
      lineHeight: '1.5',
    },
    layout: layoutFlags({ largeTouchTargets: true, forcesOwnContrast: true }),
  },
  hearing_impairment: {
    colors: BASE_TOKENS.light,
    darkColors: BASE_TOKENS.dark,
    font: {
      family: DEFAULT_FONT,
      sizeMultiplier: 1,
      letterSpacing: '0em',
      lineHeight: '1.5',
    },
    layout: layoutFlags({ captionsAlwaysOn: true, visualNotifications: true }),
  },
  learning_disability: {
    colors: {
      ...BASE_TOKENS.light,
      background: '#EAF4EC',
    },
    darkColors: {
      background: '#1A2B21',
      surface: '#253530',
      text: '#E7F5EC',
      primary: '#4ADE80',
      accent: '#7ED957',
    },
    font: {
      family: DEFAULT_FONT,
      sizeMultiplier: 1.1,
      letterSpacing: '0.02em',
      lineHeight: '1.5',
    },
    layout: layoutFlags(),
  },
}

export function getPresetName(
  needType: AccessibilityNeedType | null
): ThemePresetName | null {
  if (needType && Object.prototype.hasOwnProperty.call(THEME_PRESETS, needType)) {
    return needType as ThemePresetName
  }
  return null
}

export function getThemeTokens(
  presetName: ThemePresetName | null,
  lightDark: 'light' | 'dark'
): ThemeTokens {
  const preset = presetName ? THEME_PRESETS[presetName] : null
  const colors = preset?.layout.forcesOwnContrast
    ? preset.colors
    : preset
      ? lightDark === 'dark'
        ? preset.darkColors
        : preset.colors
      : BASE_TOKENS[lightDark]

  return {
    colors,
    font: preset?.font ?? {
      family: DEFAULT_FONT,
      sizeMultiplier: 1,
      letterSpacing: '0em',
      lineHeight: '1.5',
    },
    layout: preset?.layout ?? layoutFlags(),
  }
}

export function getThemeSlug(presetName: ThemePresetName | null): string {
  return presetName ?? 'default'
}

export function shouldHideThemeToggle(tokens: ThemeTokens): boolean {
  return tokens.layout.forcesOwnContrast
}