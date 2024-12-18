import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class ShellService {
  executeShellScript(scriptPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
          return;
        }
        if (stderr) {
          reject(`Stderr: ${stderr}`);
          return;
        }
        resolve(stdout);
      });
    });
  }
}
