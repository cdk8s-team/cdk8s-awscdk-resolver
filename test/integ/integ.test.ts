import * as child from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

test('single stack app', () => {

  const appDir = __dirname;
  const outputsFilePath = path.join(appDir, 'outputs.json');
  const program = `npx ts-node ${path.join(appDir, 'single-stack-app.ts')}`;

  try {
    child.execSync(`npx cdk -a '${program}' deploy --outputs-file ${outputsFilePath}`, { cwd: appDir });
    child.execSync(`npx cdk8s synth -a '${program}'`, { cwd: appDir });

    JSON.parse(fs.readFileSync(outputsFilePath, { encoding: 'utf-8' }));

    fs.readFileSync(path.join(appDir, 'dist', 'chart.k8s.yaml'));
  } finally {
    child.execSync(`npx cdk -a 'npx ts-node ${path.join(appDir, 'app.ts')}' destroy`, { cwd: appDir });
  }

});