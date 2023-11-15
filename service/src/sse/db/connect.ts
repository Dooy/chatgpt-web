import { DataSource } from 'typeorm';
import { Session,Cache } from "./session"; 
let cc:DataSource ;
export const  getSess = async ()=>{
    if(cc) return cc;
    const connection =new DataSource({
    type: 'sqlite',
    database: 'openaihk.db',
    synchronize: true, 
    logging: false,
    entities: [Session,Cache],
    extra: {
        connectionLimit: 1000, // 设置连接池大小
    }
  });
  await connection.initialize();
  cc= connection;
  return connection;
}