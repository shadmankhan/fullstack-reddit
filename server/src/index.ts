import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql';
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from 'cors';

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  // const posts = await orm.em.create(Post, { title: "Sharique Khan" });
  // orm.em.persistAndFlush(posts);
  // const posts = await orm.em.find(Post, {});
  // console.log(posts);

  const app = express();
  const PORT = process.env.PORT || 4000;
  app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
  }))
  const RedisStore = connectRedis(session)
  const redis = new Redis()

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // cookie only will work in https or Production
        sameSite: 'lax',
      },
      saveUninitialized: false,
      secret: 'donotmesswithme',
      resave: false,
    })
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res, redis })
  });

  apolloServer.applyMiddleware({ app, cors: false })

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
}

main().catch(e => console.error(e));