import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Capas dentro de cada área (src/features/<area>/<capa>).
const LAYERS = ['screens', 'components', 'state', 'use-cases', 'domain']
// Partes de shared/.
const SHARED = ['ui', 'data', 'content', 'platform', 'lib']

const sameFeature = { captured: { feature: '{{ from.element.captured.feature }}' } }
const otherFeature = { captured: { feature: '!{{ from.element.captured.feature }}' } }

// Lo que puede usar cada capa de su propia área y de shared/.
// Es la tabla «Quién puede usar a quién» del documento de rediseño.
const layerRules = {
  screens: { layers: ['screens', 'components', 'state', 'use-cases'], shared: ['ui', 'lib'] },
  components: { layers: ['components'], shared: ['ui', 'lib'] },
  state: { layers: ['state', 'domain'], shared: ['lib'] },
  'use-cases': { layers: ['use-cases', 'state', 'domain'], shared: ['data', 'content', 'platform', 'lib'] },
  domain: { layers: ['domain'], shared: ['lib'] },
}
// Lo que puede usar cada parte de shared/.
const sharedRules = {
  ui: ['ui', 'lib'],
  data: ['data', 'lib'],
  content: ['content', 'lib'],
  platform: ['platform', 'lib'],
  lib: ['lib'],
}

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules', 'private'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Nada se sobrescribe: ni variables que tapan a otras, ni declaraciones repetidas, ni imports duplicados
      '@typescript-eslint/no-shadow': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'no-duplicate-imports': 'error',
      'no-param-reassign': ['error', { props: false }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', partialMatch: false },
        ...LAYERS.map((layer) => ({
          type: layer,
          pattern: `src/features/*/${layer}`,
          partialMatch: false,
          capture: ['feature'],
        })),
        // Lo que queda en la raíz del área (su index.ts) es su API pública.
        { type: 'feature-api', pattern: 'src/features/*', partialMatch: false, capture: ['feature'] },
        ...SHARED.map((part) => ({
          type: `shared-${part}`,
          pattern: `src/shared/${part}`,
          partialMatch: false,
        })),
      ],
      // Los imports llevan siempre extensión (./archivo.ts), así que basta el resolver de Node.
      'import/resolver': { node: { extensions: ['.ts', '.tsx', '.js'] } },
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // app/ puede usarlo todo.
            { from: { element: { type: 'app' } }, allow: { to: { element: { type: '*' } } } },
            // La API pública de un área ve todo lo de su área.
            {
              from: { element: { type: 'feature-api' } },
              allow: { to: { element: { types: { anyOf: LAYERS }, ...sameFeature } } },
            },
            // Una capa usa las capas permitidas de su propia área y su parte de shared/.
            ...Object.entries(layerRules).map(([layer, rule]) => ({
              from: { element: { type: layer } },
              allow: {
                to: [
                  { element: { types: { anyOf: rule.layers }, ...sameFeature } },
                  { element: { types: { anyOf: rule.shared.map((part) => `shared-${part}`) } } },
                ],
              },
            })),
            // Otra área solo se usa por su index.ts.
            {
              from: { element: { types: { anyOf: ['screens', 'state', 'use-cases'] } } },
              allow: { to: { element: { type: 'feature-api', ...otherFeature } } },
            },
            // shared/ nunca usa un área.
            ...Object.entries(sharedRules).map(([part, allowed]) => ({
              from: { element: { type: `shared-${part}` } },
              allow: { to: { element: { types: { anyOf: allowed.map((p) => `shared-${p}`) } } } },
            })),
            // Paquetes externos (preact, idb, vitest…): permitidos en todas partes.
            { allow: { to: { module: { origin: 'external' } } } },
          ],
        },
      ],
    },
  },
  {
    // Scripts de Node que generan contenido (no forman parte de la app)
    files: ['scripts/**/*.cjs'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
)
