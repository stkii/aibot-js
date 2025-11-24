import { db } from '../client';

export abstract class BaseDao {
  protected readonly db = db;
}
