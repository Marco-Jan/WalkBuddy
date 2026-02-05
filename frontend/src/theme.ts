import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  ...defaultConfig,
  globalCss: {
    ...defaultConfig.globalCss,
    '*': {
      fontFamily: `'Nunito', sans-serif`,
    },
    '@keyframes pulse-glow': {
      '0%, 100%': { boxShadow: '0 0 6px rgba(45,106,79,0.3)' },
      '50%': { boxShadow: '0 0 18px rgba(45,106,79,0.6)' },
    } as any,
    '@keyframes badge-bounce': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.25)' },
    } as any,
  },
  theme: {
    ...defaultConfig.theme,
    tokens: {
      ...defaultConfig.theme?.tokens,
      colors: {
        ...defaultConfig.theme?.tokens?.colors,
// charchar stadard

forest: { 50: { value: '#E8F5E9' }, 100: { value: '#C8E6C9' }, 200: { value: '#A5D6A7' }, 300: { value: '#6DBF80' }, 400: { value: '#48A95C' }, 500: { value: '#2D6A4F' }, 600: { value: '#265E45' }, 700: { value: '#1B4332' }, 800: { value: '#143528' }, 900: { value: '#0D261C' }, 950: { value: '#071A12' }, }, bark: { 50: { value: '#FAF0E6' }, 100: { value: '#F0DCC8' }, 200: { value: '#D9B896' }, 300: { value: '#C09468' }, 400: { value: '#9B6B3C' }, 500: { value: '#6B4226' }, 600: { value: '#5A3720' }, 700: { value: '#472B19' }, 800: { value: '#352012' }, 900: { value: '#24150C' }, 950: { value: '#150C07' }, }, ember: { 50: { value: '#FFF0E8' }, 100: { value: '#FDDCC8' }, 200: { value: '#F5B898' }, 300: { value: '#E88E60' }, 400: { value: '#D97A44' }, 500: { value: '#D4652A' }, 600: { value: '#B85424' }, 700: { value: '#8F3F1B' }, 800: { value: '#6B2F14' }, 900: { value: '#48200E' }, 950: { value: '#2A1308' }, }, sand: { 50: { value: '#FFFCF7' }, 100: { value: '#FEF6EC' }, 200: { value: '#F9EDDA' }, 300: { value: '#F5E6D0' }, 400: { value: '#EDD8BA' }, 500: { value: '#E2C9A0' }, 600: { value: '#C9AD82' }, 700: { value: '#A88C60' }, 800: { value: '#7E6945' }, 900: { value: '#54462E' }, 950: { value: '#2D241A' }, }, amber: { 50: { value: '#FDF8E8' }, 100: { value: '#F9EDC4' }, 200: { value: '#F2DB8A' }, 300: { value: '#E5C45E' }, 400: { value: '#D4A847' }, 500: { value: '#C49A30' }, 600: { value: '#A37E24' }, 700: { value: '#7D611B' }, 800: { value: '#594513' }, 900: { value: '#3A2E0D' }, 950: { value: '#1E1807' }, },
// // Schema1
// Schema1
// forest: { 50: { value: '#E6F4EF' }, 100: { value: '#C1E3D7' }, 200: { value: '#98D0BC' }, 300: { value: '#64B89A' }, 400: { value: '#3FA281' }, 500: { value: '#1F6F5C' }, 600: { value: '#1A5E4E' }, 700: { value: '#13473C' }, 800: { value: '#0D342C' }, 900: { value: '#07241E' }, 950: { value: '#041813' }, },
// bark: { 50: { value: '#F6EFEA' }, 100: { value: '#E8D7C8' }, 200: { value: '#D1B79B' }, 300: { value: '#B9966E' }, 400: { value: '#9B6F45' }, 500: { value: '#6E4327' }, 600: { value: '#5D3921' }, 700: { value: '#482C19' }, 800: { value: '#352012' }, 900: { value: '#22150C' }, 950: { value: '#140B06' }, },
// ember: { 50: { value: '#FFF1EC' }, 100: { value: '#FFD8C9' }, 200: { value: '#FFB295' }, 300: { value: '#FF8658' }, 400: { value: '#F05F2A' }, 500: { value: '#D94A1C' }, 600: { value: '#B83E18' }, 700: { value: '#8C2F12' }, 800: { value: '#66210D' }, 900: { value: '#3F1508' }, 950: { value: '#220B04' }, },
// sand: { 50: { value: '#FFFEFB' }, 100: { value: '#FDF6EE' }, 200: { value: '#F6E8D5' }, 300: { value: '#EFDBC0' }, 400: { value: '#E3C8A4' }, 500: { value: '#D0B184' }, 600: { value: '#B8976A' }, 700: { value: '#9A7B54' }, 800: { value: '#725C3E' }, 900: { value: '#4F402C' }, 950: { value: '#2C2418' }, },
// amber: { 50: { value: '#FFFBEB' }, 100: { value: '#FEF3C7' }, 200: { value: '#FDE68A' }, 300: { value: '#FCD34D' }, 400: { value: '#FBBF24' }, 500: { value: '#F59E0B' }, 600: { value: '#D97706' }, 700: { value: '#B45309' }, 800: { value: '#92400E' }, 900: { value: '#78350F' }, 950: { value: '#451A03' }, },

// Schema2        

// forest: { 50: { value: '#EAFBFF' }, 100: { value: '#C9F2FF' }, 200: { value: '#9EE7FF' }, 300: { value: '#63D8FF' }, 400: { value: '#2FC4F2' }, 500: { value: '#1294C7' }, 600: { value: '#0F7BA6' }, 700: { value: '#0C5E80' }, 800: { value: '#09435B' }, 900: { value: '#062A3A' }, 950: { value: '#031821' }, },
// bark:   { 50: { value: '#F2F4F8' }, 100: { value: '#D9DEE7' }, 200: { value: '#B9C1D3' }, 300: { value: '#98A3BC' }, 400: { value: '#707C9E' }, 500: { value: '#4C577C' }, 600: { value: '#404968' }, 700: { value: '#313853' }, 800: { value: '#23283D' }, 900: { value: '#171A28' }, 950: { value: '#0C0E15' }, },
// ember:  { 50: { value: '#FFF0F4' }, 100: { value: '#FFD6E3' }, 200: { value: '#FFADC7' }, 300: { value: '#FF7AA6' }, 400: { value: '#FF4F8A' }, 500: { value: '#E6336E' }, 600: { value: '#C6285E' }, 700: { value: '#991F49' }, 800: { value: '#6F1635' }, 900: { value: '#460E22' }, 950: { value: '#240710' }, },
// sand:   { 50: { value: '#FBFCFE' }, 100: { value: '#F1F3F9' }, 200: { value: '#E3E7F2' }, 300: { value: '#D3D9EA' }, 400: { value: '#BFC7DD' }, 500: { value: '#A5AEC8' }, 600: { value: '#8C95AE' }, 700: { value: '#71778E' }, 800: { value: '#545867' }, 900: { value: '#383A44' }, 950: { value: '#1F2027' }, },
// amber:  { 50: { value: '#FFF7E6' }, 100: { value: '#FFE6B8' }, 200: { value: '#FFD27A' }, 300: { value: '#FFBB3D' }, 400: { value: '#FFA500' }, 500: { value: '#E68A00' }, 600: { value: '#C47200' }, 700: { value: '#965700' }, 800: { value: '#6B3E00' }, 900: { value: '#422600' }, 950: { value: '#241400' }, },


// Schema3

// forest: { 50: { value: '#F1FAF7' }, 100: { value: '#DCF2EB' }, 200: { value: '#BEE6D9' }, 300: { value: '#94D5C2' }, 400: { value: '#6BC3AB' }, 500: { value: '#43A78F' }, 600: { value: '#3A8E7B' }, 700: { value: '#2F7263' }, 800: { value: '#24574C' }, 900: { value: '#183A33' }, 950: { value: '#0D211E' }, },
// bark:   { 50: { value: '#FBF6F9' }, 100: { value: '#F3E4EE' }, 200: { value: '#E6C8DC' }, 300: { value: '#D6A8C7' }, 400: { value: '#C184AF' }, 500: { value: '#A96296' }, 600: { value: '#8E527F' }, 700: { value: '#6F4063' }, 800: { value: '#52304A' }, 900: { value: '#362031' }, 950: { value: '#1F131D' }, },
// ember:  { 50: { value: '#FFF5F2' }, 100: { value: '#FFE2DA' }, 200: { value: '#FFC1B0' }, 300: { value: '#FF9A82' }, 400: { value: '#FF7054' }, 500: { value: '#E8563F' }, 600: { value: '#C64834' }, 700: { value: '#9A3728' }, 800: { value: '#6F281D' }, 900: { value: '#451A13' }, 950: { value: '#260E0A' }, },
// sand:   { 50: { value: '#FFFEFC' }, 100: { value: '#FBF5EF' }, 200: { value: '#F5E8DD' }, 300: { value: '#EEDAC8' }, 400: { value: '#E3C7AE' }, 500: { value: '#D4AE8E' }, 600: { value: '#B89473' }, 700: { value: '#9A775B' }, 800: { value: '#715743' }, 900: { value: '#4E3C2F' }, 950: { value: '#2B221C' }, },
// amber:  { 50: { value: '#FFF9ED' }, 100: { value: '#FFF0D1' }, 200: { value: '#FFE1A3' }, 300: { value: '#FFD16F' }, 400: { value: '#FFC041' }, 500: { value: '#E6A82E' }, 600: { value: '#C48F26' }, 700: { value: '#9A6F1D' }, 800: { value: '#705014' }, 900: { value: '#47320D' }, 950: { value: '#261A07' }, },


// Schema4

// forest: { 50: { value: '#F0F6FF' }, 100: { value: '#D6E4FF' }, 200: { value: '#AFC7FF' }, 300: { value: '#7FA1FF' }, 400: { value: '#557BFF' }, 500: { value: '#3B5BDB' }, 600: { value: '#324EC2' }, 700: { value: '#273E9C' }, 800: { value: '#1C2E73' }, 900: { value: '#121E4A' }, 950: { value: '#0A122E' }, },
// bark:   { 50: { value: '#F7F3F0' }, 100: { value: '#E7DDD6' }, 200: { value: '#D1BFB4' }, 300: { value: '#B89F8F' }, 400: { value: '#9B7A66' }, 500: { value: '#7A5A4B' }, 600: { value: '#654A3E' }, 700: { value: '#503A31' }, 800: { value: '#3B2A23' }, 900: { value: '#261C17' }, 950: { value: '#160F0C' }, },
// ember:  { 50: { value: '#FFF3ED' }, 100: { value: '#FFDCCB' }, 200: { value: '#FFB894' }, 300: { value: '#FF8E52' }, 400: { value: '#FF6A1F' }, 500: { value: '#E55314' }, 600: { value: '#BF4410' }, 700: { value: '#92330C' }, 800: { value: '#692509' }, 900: { value: '#421705' }, 950: { value: '#230C03' }, },
// sand:   { 50: { value: '#FFFEF9' }, 100: { value: '#FAF3E5' }, 200: { value: '#F2E3C8' }, 300: { value: '#E9D1A7' }, 400: { value: '#DDBA80' }, 500: { value: '#CFA05A' }, 600: { value: '#B68646' }, 700: { value: '#946B36' }, 800: { value: '#6C4E28' }, 900: { value: '#47331A' }, 950: { value: '#261C0E' }, },
// amber:  { 50: { value: '#FFF8E8' }, 100: { value: '#FFE9BC' }, 200: { value: '#FFD27D' }, 300: { value: '#FFB93D' }, 400: { value: '#FF9F0A' }, 500: { value: '#DB7C00' }, 600: { value: '#B56500' }, 700: { value: '#8A4C00' }, 800: { value: '#623600' }, 900: { value: '#3E2200' }, 950: { value: '#211200' }, },



      },
      fonts: {
        ...defaultConfig.theme?.tokens?.fonts,
        heading: { value: `'Nunito', sans-serif` },
        body: { value: `'Nunito', sans-serif` },
      },
    },
    semanticTokens: {
      ...defaultConfig.theme?.semanticTokens,
      colors: {
        ...defaultConfig.theme?.semanticTokens?.colors,
      },
    },
  },
});

export const system = createSystem(config);
