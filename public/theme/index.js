
import { palette } from './colors.js'
const colors = {
  palette,
  sideNav: {
    active: palette.zinc[800],
    hover: palette.zinc[700],
    background: palette.zinc[900],
    headerSeparator: palette.zinc[600],
    text: palette.white
  },
  fileBrowser: {
    link: palette.blue[600],
    table: {
      headerBackground: palette.gray[200],
      border: palette.gray[200],
      selectedRow: palette.blue[100]
    },
    breadcrumbs: {

    }
  },
  actionBar: {
    border: palette.gray[200]
  }
}

const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
}

export const theme = {
  colors,
  fontWeight
}
