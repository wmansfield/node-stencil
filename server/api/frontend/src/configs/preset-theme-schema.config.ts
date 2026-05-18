export type Variables =
   | 'primary'
   | 'primaryDeep'
   | 'primaryMild'
   | 'primarySubtle'
   | 'neutral'
   | 'secondary'
   | 'secondaryDeep'
   | 'secondaryMild'
   | 'grayDeep'
   | 'grayMild'
   | 'graySubtle';

export type ThemeVariables = Record<'light' | 'dark', Record<Variables, string>>;

const defaultTheme: ThemeVariables = {
   light: {
      primary: '#4996ff',
      primaryDeep: '#3369b2',
      primaryMild: '#80b6ff',
      primarySubtle: '#4996ff1a',
      secondary: '#ffb249',
      secondaryDeep: '#bf8637',
      secondaryMild: '#ffc16d',
      grayDeep: '#f6f8fa',
      grayMild: '#475569',
      graySubtle: '#e5e7eb',
      neutral: '#ffffff',
   },
   dark: {
      primary: '#6dabff',
      primaryDeep: '#3e80d9',
      primaryMild: '#80b6ff',
      primarySubtle: '#6dabff1a',
      secondary: '#ffc16d',
      secondaryDeep: '#bf8637',
      secondaryMild: '#ffd192',
      grayDeep: '#1f2937',
      grayMild: '#cbd5e1',
      graySubtle: '#334155',
      neutral: '#ffffff',
   },
};

const alphaTheme: ThemeVariables = {
   light: {
      primary: '#004b5c',
      primaryDeep: '#003746',
      primaryMild: '#6c999f',
      primarySubtle: '#d2eaef',
      secondary: '#ff7d3a',
      secondaryDeep: '#c8612e',
      secondaryMild: '#ffa673',
      grayDeep: '#515254',
      grayMild: '#475569',
      graySubtle: '#e5e7eb',
      neutral: '#ffffff',
   },
   dark: {
      primary: '#00a0bf',
      primaryDeep: '#007b90',
      primaryMild: '#33b8d0',
      primarySubtle: '#00a0bf1a',
      secondary: '#ff9e6a',
      secondaryDeep: '#d57a49',
      secondaryMild: '#ffb78e',
      grayDeep: '#515254',
      grayMild: '#475569',
      graySubtle: '#e5e7eb',
      neutral: '#ffffff',
   },
};

const presetThemeSchemaConfig: Record<string, ThemeVariables> = {
   default: defaultTheme,
   alpha: alphaTheme,
};

export function createThemeFromPalette(palette: Partial<Record<Variables, string>>, baseTheme: ThemeVariables = defaultTheme): ThemeVariables {
   return {
      light: {
         primary: palette.primary ?? baseTheme.light.primary ?? '#2a85ff',
         primaryDeep: palette.primaryDeep ?? baseTheme.light.primaryDeep ?? '#0069f6',
         primaryMild: palette.primaryMild ?? baseTheme.light.primaryMild ?? '#66a9ff',
         primarySubtle: palette.primarySubtle ?? baseTheme.light.primarySubtle ?? '#2a85ff1a',
         secondary: palette.secondary ?? baseTheme.light.secondary ?? '#ff9b49',
         secondaryDeep: palette.secondaryDeep ?? baseTheme.light.secondaryDeep ?? '#bf7437',
         secondaryMild: palette.secondaryMild ?? baseTheme.light.secondaryMild ?? '#ffb870',
         grayDeep: palette.grayDeep ?? baseTheme.light.grayDeep ?? '#f6f8fa',
         grayMild: palette.grayMild ?? baseTheme.light.grayMild ?? '#475569',
         graySubtle: palette.graySubtle ?? baseTheme.light.graySubtle ?? '#e5e7eb',
         neutral: palette.neutral ?? baseTheme.light.neutral ?? '#ffffff',
      },
      dark: {
         primary: palette.primary ?? baseTheme.dark.primary ?? '#5aa5ff',
         primaryDeep: palette.primaryDeep ?? baseTheme.dark.primaryDeep ?? '#3e80d9',
         primaryMild: palette.primaryMild ?? baseTheme.dark.primaryMild ?? '#80bfff',
         primarySubtle: palette.primarySubtle ?? baseTheme.dark.primarySubtle ?? '#5aa5ff1a',
         secondary: palette.secondary ?? baseTheme.dark.secondary ?? '#ffb870',
         secondaryDeep: palette.secondaryDeep ?? baseTheme.dark.secondaryDeep ?? '#bf7437',
         secondaryMild: palette.secondaryMild ?? baseTheme.dark.secondaryMild ?? '#ffd19a',
         grayDeep: palette.grayDeep ?? baseTheme.dark.grayDeep ?? '#1f2937',
         grayMild: palette.grayMild ?? baseTheme.dark.grayMild ?? '#cbd5e1',
         graySubtle: palette.graySubtle ?? baseTheme.dark.graySubtle ?? '#334155',
         neutral: palette.neutral ?? baseTheme.dark.neutral ?? '#ffffff',
      },
   };
}

export default presetThemeSchemaConfig;
