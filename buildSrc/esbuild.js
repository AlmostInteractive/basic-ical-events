const esbuild = require('esbuild')

const { nodeExternalsPlugin } = require('esbuild-node-externals')

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, args => ({ path: args.path, external: true }))
  },
}

esbuild.build({
  logLevel: "info",
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index.js',
  bundle: false,
  minify: false,
  platform: 'node',
  sourcemap: true,
  target: 'node14',
  plugins: [makeAllPackagesExternalPlugin,nodeExternalsPlugin()]
}).catch(() => process.exit(1))
