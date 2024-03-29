import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ExceptionHandler } from './app.exception';
import {
  ActivityModule,
  AuthModule,
  HealthModule,
  TeamModule,
  TypeModule,
  UserModule
} from './modules';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      formatError: ExceptionHandler.formatApolloError
    }),
    TypeOrmModule.forRoot({
      keepConnectionAlive: true,
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true
    }),
    MailerModule.forRoot({
      transport: process.env.MAILER_TRANSPORT,
      defaults: {
        from: process.env.MAILER_FROM
      },
      template: {
        dir:
          process.env.NODE_ENV === 'development'
            ? 'src/templates'
            : '/app/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true
        }
      }
    }),
    ActivityModule,
    AuthModule,
    HealthModule,
    TeamModule,
    TypeModule,
    UserModule
  ]
})
export class AppModule {}
