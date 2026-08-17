import { Request, Response } from 'express';
import { Client } from '../models/Client';
import { Department } from '../models/Department';
import { Team } from '../models/Team';
import { Employee } from '../models/Employee';
import { ok } from '../utils/ApiResponse';

export async function lookups(_req: Request, res: Response) {
  const [clients, departments, teams, managers] = await Promise.all([
    Client.find().select('name industry').sort({ name: 1 }).lean(),
    Department.find().select('name code').sort({ name: 1 }).lean(),
    Team.find().select('name').sort({ name: 1 }).lean(),
    Employee.find({ status: 'Active' }).select('name designation').sort({ name: 1 }).limit(300).lean(),
  ]);
  return ok(res, { clients, departments, teams, managers });
}
