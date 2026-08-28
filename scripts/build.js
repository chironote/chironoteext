// MV3 must ship external, locally bundled scripts regardless of local .env settings.
process.env.INLINE_RUNTIME_CHUNK = 'false';
process.env.GENERATE_SOURCEMAP = 'false';
require('react-scripts/scripts/build');
