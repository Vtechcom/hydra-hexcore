import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { HydraConsumerService } from 'src/hydra-consumer/hydra-consumer.service';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
    constructor(private readonly hydraConsumerService: HydraConsumerService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const host = req.headers.host;
        const isSSL = req.headers['x-forwarded-proto'] === 'https';

        // Check if host matches subdomain pattern <apikey>.hydranode.hdev99.io.vn
        const subdomainMatch = host?.match(/^([a-z0-9-]+)\.hydranode\.io\.vn$/);
        if (subdomainMatch) {
            const apikey = subdomainMatch[1];
            const targetHost = await this.hydraConsumerService.getUrlByConsumerKey(apikey);
            const targetUrl = isSSL ? `wss://${targetHost}` : `ws://${targetHost}`;
            console.log('>>> targetUrl:', targetUrl);
            if (targetUrl) {
                const proxy = createProxyMiddleware({
                    target: targetUrl,
                    changeOrigin: true,
                    ws: true, // Enable WebSocket support
                });
                return proxy(req, res, next);
            } else {
                res.status(404).send('API Key not found');
            }
        } else {
            // If not a subdomain, pass to controllers
            next();
        }
    }
}
