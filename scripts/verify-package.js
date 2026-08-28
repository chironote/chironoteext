const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('build/manifest.json');
const pkg = read('package.json');
const config = read('src/amplifyconfiguration.json');
const html = fs.readFileSync(path.join(root, 'build/index.html'), 'utf8');
assert.equal(manifest.version, pkg.version, 'Package and manifest versions must match');
assert.deepEqual(manifest.permissions, ['sidePanel']);
assert.equal(manifest.side_panel.default_path, 'index.html');
assert(!manifest.content_scripts && !manifest.action.default_popup, 'Keep the side-panel boundary');
assert(manifest.host_permissions.every(origin => !origin.includes('*.')), 'No wildcard hosts');
const required = [
  new URL(config.aws_appsync_graphqlEndpoint).origin,
  new URL(config.aws_appsync_graphqlEndpoint).origin.replace('.appsync-api.', '.appsync-realtime-api.'),
  `https://${config.aws_user_files_s3_bucket}.s3.${config.aws_user_files_s3_bucket_region}.amazonaws.com`,
  `https://cognito-idp.${config.aws_cognito_region}.amazonaws.com`,
  `https://cognito-identity.${config.aws_cognito_region}.amazonaws.com`
];
const constants = fs.readFileSync(path.join(root, 'src/components/Recording/recordingConstants.js'), 'utf8');
for (const endpoint of constants.matchAll(/https:\/\/[^']+/g)) required.push(new URL(endpoint[0]).origin);
required.forEach(origin => assert(manifest.host_permissions.includes(`${origin}/*`), 'Backend origin missing from manifest'));
assert.equal(manifest.host_permissions.length, new Set(required).size, 'Unexpected backend host permission');
for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  assert(/\bsrc="\/?static\//.test(script[1]) && !script[2].trim(), 'Inline or remote script found');
}
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(file);
    else {
      assert(!/\.map$|^\.env|^aws-exports\.js$/.test(entry.name), 'Non-release file in build');
      if (entry.name.endsWith('.css')) {
        assert(!/@import\s+url\(['"]?https?:/.test(fs.readFileSync(file, 'utf8')), 'Remote stylesheet found');
      }
    }
  }
}
inspect(path.join(root, 'build'));
console.log(`Verified MV3 package ${pkg.version}: bundled scripts, matching versions, scoped hosts, no source maps.`);
