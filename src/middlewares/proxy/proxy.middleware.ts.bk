import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import configuration from 'src/config/configuration';
import { HydraConsumerService } from 'src/hydra-consumer/hydra-consumer.service';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
    constructor(private readonly hydraConsumerService: HydraConsumerService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const host = req.headers.host;
        const protocol = getProtocol(req);
        // Check if host matches subdomain pattern <apikey>.hydranode.hdev99.io.vn
        const regex = new RegExp(configuration().proxy.matchPattern);
        const subdomainMatch = regex.test(host);
        if (subdomainMatch) {
            const apikey = host.replace(regex, '$1');
            const targetHost = await this.hydraConsumerService.getUrlByConsumerKey(apikey);
            const targetUrl = `${protocol}://${targetHost}`;
            if (targetUrl) {
                const proxy = createProxyMiddleware({
                    target: targetUrl,
                    changeOrigin: true,
                    ws: true,
                    secure: false,
                    logger: console,
                    pathRewrite: (path, req: any) => {
                        return req.originalUrl; 
                    },
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

function getProtocol(req: Request) {
    const isWebSocket = req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket' &&
                        req.headers.connection && req.headers.connection.toLowerCase().includes('upgrade');
    return isWebSocket ? 'ws' : 'http';
}
