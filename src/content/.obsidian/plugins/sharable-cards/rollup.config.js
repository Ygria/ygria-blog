import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'main.tsx',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
  },
  external: ['obsidian', 'react', 'react-dom'],
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
  ],
};
