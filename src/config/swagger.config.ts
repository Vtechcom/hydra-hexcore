import { DocumentBuilder } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const bearerTokenSecurityScheme: SecuritySchemeObject = {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
};

export const swaggerConfig = new DocumentBuilder()
    .setTitle('Hexcore API')
    .setDescription('Hexcore API description')
    .setVersion('1.0.0')
    .addTag('Hexcore API')
    .addBearerAuth(bearerTokenSecurityScheme)
    .setLicense('MIT', '')
    .build();
