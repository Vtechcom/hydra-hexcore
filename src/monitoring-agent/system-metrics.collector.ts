import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';
import { execSync } from 'child_process';

/**
 * Collects system metrics: CPU %, RAM %, Network RX/TX bytes-per-second, latency.
 *
 * - CPU is measured by sampling os.cpus() over a short window.
 * - Network delta is computed between successive calls.
 * - Latency is measured via a small exec ping to localhost (fallback 0).
 */
@Injectable()
export class SystemMetricsCollector {
    private readonly logger = new Logger(SystemMetricsCollector.name);

    private prevNetRx = 0;
    private prevNetTx = 0;
    private prevTimestamp = Date.now();

    /** Return current CPU usage percentage (averaged across cores). */
    async getCpuUsage(): Promise<number> {
        const start = this.cpuSnapshot();
        await this.sleep(200); // short sample window
        const end = this.cpuSnapshot();

        const idleDiff = end.idle - start.idle;
        const totalDiff = end.total - start.total;
        if (totalDiff === 0) return 0;

        const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
        return Math.round(usage * 10) / 10; // 1-decimal precision
    }

    /** Return current RAM usage percentage. */
    getRamUsage(): number {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        return Math.round((used / total) * 100 * 10) / 10;
    }

    /**
     * Return network bytes received / transmitted **per second** since last call,
     * based on /proc/net/dev (Linux).  Falls back to 0 on non-Linux.
     */
    getNetworkDelta(): { rx: number; tx: number } {
        try {
            const { rx, tx } = this.readProcNetDev();
            const now = Date.now();
            const elapsedSec = (now - this.prevTimestamp) / 1000 || 1;

            const deltaRx = Math.max(0, Math.round((rx - this.prevNetRx) / elapsedSec));
            const deltaTx = Math.max(0, Math.round((tx - this.prevNetTx) / elapsedSec));

            this.prevNetRx = rx;
            this.prevNetTx = tx;
            this.prevTimestamp = now;

            return { rx: deltaRx, tx: deltaTx };
        } catch {
            return { rx: 0, tx: 0 };
        }
    }

    /** Measure network latency (ms) via /dev/tcp or ping to the RabbitMQ host. */
    getNetworkLatency(host = 'localhost'): number {
        try {
            const start = Date.now();
            execSync(`ping -c 1 -W 1 ${host}`, { stdio: 'ignore', timeout: 2000 });
            return Date.now() - start;
        } catch {
            return 0;
        }
    }

    // ─── private helpers ───

    private cpuSnapshot(): { idle: number; total: number } {
        const cpus = os.cpus();
        let idle = 0;
        let total = 0;
        for (const cpu of cpus) {
            const t = cpu.times;
            idle += t.idle;
            total += t.user + t.nice + t.sys + t.idle + t.irq;
        }
        return { idle, total };
    }

    private readProcNetDev(): { rx: number; tx: number } {
        const fs = require('fs') as typeof import('fs');
        const data = fs.readFileSync('/proc/net/dev', 'utf8');
        let rx = 0;
        let tx = 0;
        const lines = data.split('\n').slice(2); // skip header lines
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('lo:')) continue; // skip loopback
            const parts = trimmed.split(/\s+/);
            rx += parseInt(parts[1], 10) || 0; // receive bytes
            tx += parseInt(parts[9], 10) || 0; // transmit bytes
        }
        return { rx, tx };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }
}
