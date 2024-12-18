import { Injectable, OnModuleInit } from '@nestjs/common';
import { exec, spawn } from 'node:child_process';
import { CardanoCliJs } from 'cardanocli-js';
import { InjectRepository } from '@nestjs/typeorm';
import { HydraNode } from './entities/HydraNode.entity';
import { Repository } from 'typeorm';

@Injectable()
export class HydraMainService implements OnModuleInit {
  constructor(
    @InjectRepository(HydraNode)
    private hydraNodeRepository: Repository<HydraNode>,
  ) {}

  cardanoNodeTip = {
    block: 0,
    epoch: 0,
    era: 'Babbage',
    hash: '',
    slot: 0,
    slotInEpoch: 0,
    slotsToEpochEnd: 0,
    syncProgress: '0.00',
  };

  async onModuleInit() {
    console.log('onModuleInit');
    // Configs:
    const cardanoNodePath =
      '/Users/macbookpro/hdev/workspaces/blockchain/hydra-manager/cardano-node';
    // Check cardano node running

    await this.checkCardanoNodeRunning(cardanoNodePath);
    try {
      // test cli
      const cardanocliJs = new CardanoCliJs({
        shelleyGenesis: `${cardanoNodePath}/shelley-genesis.json`,
        cliPath: 'docker exec cardano-node cardano-cli',
        dir: cardanoNodePath,
        era: '',
        network: '1',
        socketPath: `${cardanoNodePath}/node.socket`,
      });
      const updateCaranoNodeTip = () => {
        setTimeout(() => {
          const tip = cardanocliJs.query.tip();
          if (!tip || !tip.syncProgress) {
            console.log('Error while running "cardano-cli query tip"');
            return;
          }
          const syncProgress = Number.parseFloat(tip.syncProgress);
          this.cardanoNodeTip = tip;
          console.log('[Cardano-cli][Node sync process]:', syncProgress);
          if (syncProgress < 100) {
            updateCaranoNodeTip();
          }
        }, 5000);
      };
      updateCaranoNodeTip();

      // get from database
      const allHydraNode = await this.hydraNodeRepository.find();
      console.log('>>> / file: hydra-main.service.ts:64 / allHydraNode:', allHydraNode);
    } catch (error) {
      console.log(error);
    }
  }

  async checkCardanoNodeRunning(cardanoNodePath: string): Promise<boolean> {
    const cardanoDockerServiceName = 'cardano-node';
    const serviceId = await this.dockerCheckServiceRunning(cardanoDockerServiceName);
    if (!serviceId) {
      console.log('Cardano node is not running, try to run cardano-node');
      // Try to running docker service
      const output = await this.dockerComposeStart(`${cardanoNodePath}/docker-compose.yml`);
      console.log('>>> / file: hydra-main.service.ts:60 / output:', output);
      return false;
    }
    console.log(`Cardano node is running with service id: ${serviceId}`);
    return true;
  }

  async dockerCheckServiceRunning(serviceName: string): Promise<string> {
    // return docker service id if running
    return new Promise((resolve) => {
      try {
        exec(`docker ps -qf "name=${serviceName}"`, (error, stdout, stderr) => {
          if (error) {
            console.log(`Error: ${error.message}`);
            resolve('');
          }
          if (stderr) {
            console.log(`Stderr: ${stderr}`);
            resolve('');
          }
          console.log(`docker ps -qf "name=${serviceName}"`, stdout);
          if (!stdout) {
            resolve('');
          }
          resolve(stdout);
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  async dockerComposeStart(dockerComposePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[Docker] Start service: ${dockerComposePath}`);
        const child = spawn('docker', ['compose', '-f', dockerComposePath, 'up', '-d']);
        child.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });
        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
          console.log(`[Docker Process Running][Chunk]: ${data}`);
        });

        child.stderr.on('data', (data: string) => {
          console.log(`[Docker Process Running]: ${data}`);
          if (data.includes('Started')) {
            resolve(output);
          }
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(`Script exited with code: ${code}`);
          }
        });
      } catch (error) {
        console.log(error);
      }
    });
  }
}
