import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HydraMainModule } from './hydra-main/hydra-main.module';
import { ShellModule } from './shell/shell.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv, Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config';
import { HydraHeadsModule } from './hydra-heads/hydra-heads.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventListenerModule } from './event-listener/event-listener.module';

@Module({
    imports: [
        WinstonModule.forRoot(winstonConfig),
        ConfigModule.forRoot({
            envFilePath: '.env',
            load: [configuration],
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot({
            // show event name in memory leak message when more than maximum amount of listeners is assigned
            verboseMemoryLeak: true,
        }),
        CacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                return {
                    stores: [
                        new Keyv({
                            store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
                        }),
                        createKeyv({
                            url: configuration().redis.url,
                            password: configuration().redis.password,
                        }),
                    ],
                };
            },
        }),
        HydraMainModule,
        ShellModule,
        HydraHeadsModule,
        EventListenerModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                ...configService.get('database'),
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
