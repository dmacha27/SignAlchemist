// babel.config.js
export default {
  presets: [
    '@babel/preset-env',
    ['@babel/preset-react', { runtime: 'automatic' }], // Avoids importing React in all files
  ],
};
