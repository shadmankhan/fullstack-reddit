import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Response, Request } from "express";
import { Session } from "express-session";


export type MyContext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Session | any };
  res: Response;
}