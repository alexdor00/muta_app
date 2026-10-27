// Todo el aspecto sale de src/shared/ui/tokens.css. Fuera de ese archivo no se escriben
// colores, medidas en px ni tamaños o pesos de letra: solo var(--…).
const onlyTokens = ['/^var\\(--/', 'inherit']

export default {
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
    'unit-disallowed-list': ['px', { ignoreMediaFeatureNames: { px: ['min-width', 'max-width'] } }],
    'declaration-property-value-allowed-list': {
      font: onlyTokens,
      'font-size': onlyTokens,
      'font-weight': onlyTokens,
      'line-height': onlyTokens,
      'font-family': onlyTokens,
    },
    'declaration-no-important': true,
  },
  overrides: [
    {
      files: ['src/shared/ui/tokens.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
        'unit-disallowed-list': null,
        'declaration-property-value-allowed-list': null,
      },
    },
  ],
}
