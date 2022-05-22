module.exports = api => {
  api.cache(false);

  return {
    plugins: [],
    presets: ['@babel/preset-react'],
  };
};
