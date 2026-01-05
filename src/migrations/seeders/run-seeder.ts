import { spawn } from 'child_process';

const args = process.argv.slice(2);

const pathArg = args.find(a => a.startsWith('--path='));
const path = pathArg ? pathArg.split('=')[1] : null;

if (!path) {
    console.error('Error: --path argument is required.');
    process.exit(1);
}

const child_process = spawn('npx', ['ts-node', path, ...args.filter(a => a !== pathArg)], {
    stdio: 'inherit',
    shell: true,
});

child_process.on('close', code => {
    console.log(`Child process exited with code ${code}`);
    process.exit(code ?? 1);
});
