/**
 * Seed script — generates realistic, relationally-consistent IT-company demo data.
 * Run with: npm run seed
 *
 * Counts can be scaled via env (SEED_EMPLOYEES, SEED_PROJECTS, SEED_TASKS...).
 * Defaults match the project spec.
 */
import mongoose, { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Department } from '../models/Department';
import { Team } from '../models/Team';
import { Employee } from '../models/Employee';
import { Project, PROJECT_STATUS, PRIORITY } from '../models/Project';
import { Task, TASK_STATUS, TASK_PRIORITY } from '../models/Task';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';

const N = {
  employees: int(process.env.SEED_EMPLOYEES, 200),
  projects: int(process.env.SEED_PROJECTS, 50),
  clients: int(process.env.SEED_CLIENTS, 25),
  departments: int(process.env.SEED_DEPARTMENTS, 15),
  teams: int(process.env.SEED_TEAMS, 10),
  tasks: int(process.env.SEED_TASKS, 1200),
  notifications: int(process.env.SEED_NOTIFICATIONS, 1000),
  activityLogs: int(process.env.SEED_ACTIVITY, 3000),
};

function int(v: string | undefined, d: number): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : d;
}
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const sample = <T>(arr: T[], n: number): T[] =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);

const DEPARTMENTS = [
  'Engineering', 'Frontend', 'Backend', 'Mobile', 'Cloud & DevOps', 'Data & Analytics',
  'AI/ML', 'Cybersecurity', 'QA & Testing', 'Product', 'Design/UX', 'Infrastructure',
  'ERP Solutions', 'Support', 'Research',
];
const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'AWS', 'Azure',
  'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'TensorFlow', 'PyTorch',
  'Scikit-learn', 'Spark', 'Kafka', 'Terraform', 'Flutter', 'Swift', 'Kotlin', 'C#',
  'Cybersecurity', 'Penetration Testing', 'CI/CD', 'Redis', 'Elasticsearch', 'SQL',
];
const DESIGNATIONS = [
  'Software Engineer', 'Senior Software Engineer', 'Lead Engineer', 'Frontend Developer',
  'Backend Developer', 'Full-Stack Developer', 'DevOps Engineer', 'Data Scientist',
  'ML Engineer', 'Security Engineer', 'QA Engineer', 'Cloud Architect', 'UX Designer',
];
const CATEGORIES = [
  'Web Application', 'Mobile Application', 'Cloud Migration', 'Data Analytics',
  'AI/ML Platform', 'Cybersecurity', 'ERP System', 'CRM System',
];
const INDUSTRIES = ['Finance', 'Healthcare', 'Retail', 'Logistics', 'Telecom', 'Education', 'Manufacturing', 'Government'];
const FIRST = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Isha', 'Kabir', 'Meera', 'Rohan', 'Sara', 'Arjun', 'Priya', 'Neha', 'Karan', 'Riya', 'Sam', 'Alex', 'Jordan', 'Maya', 'Leo'];
const LAST = ['Sharma', 'Patel', 'Nair', 'Reddy', 'Gupta', 'Iyer', 'Khan', 'Mehta', 'Rao', 'Singh', 'Bose', 'Das', 'Kapoor', 'Verma', 'Joshi'];

async function run() {
  await connectDB();
  console.log('[seed] clearing collections...');
  await Promise.all([
    User.deleteMany({}), Client.deleteMany({}), Department.deleteMany({}), Team.deleteMany({}),
    Employee.deleteMany({}), Project.deleteMany({}), Task.deleteMany({}),
    Notification.deleteMany({}), ActivityLog.deleteMany({}),
  ]);

  // Departments
  const departments = await Department.insertMany(
    Array.from({ length: N.departments }, (_, i) => ({
      name: DEPARTMENTS[i] ?? `Department ${i + 1}`,
      code: (DEPARTMENTS[i] ?? `DEP${i + 1}`).slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '') + i,
    }))
  );

  // Clients
  const clients = await Client.insertMany(
    Array.from({ length: N.clients }, (_, i) => ({
      name: `${pick(['Nova', 'Apex', 'Vertex', 'Zenith', 'Orbit', 'Quantum', 'Pioneer', 'Summit'])} ${pick(['Systems', 'Corp', 'Labs', 'Digital', 'Global', 'Tech'])} ${i + 1}`,
      industry: pick(INDUSTRIES),
      contactEmail: `contact${i + 1}@client.com`,
      contactPhone: `+91-9${rand(100000000, 999999999)}`,
      country: pick(['India', 'USA', 'UK', 'Germany', 'Singapore']),
    }))
  );

  // Employees
  const employeesData = Array.from({ length: N.employees }, (_, i) => {
    const first = pick(FIRST);
    const last = pick(LAST);
    return {
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@company.com`,
      phone: `+91-8${rand(100000000, 999999999)}`,
      department: pick(departments)._id,
      designation: pick(DESIGNATIONS),
      skills: sample(SKILLS, rand(3, 7)),
      experienceYears: rand(0, 15),
      salary: rand(600000, 3500000),
      availability: pick(['Available', 'Available', 'PartiallyAvailable', 'Unavailable'] as const),
      currentWorkload: rand(20, 100),
      performanceScore: rand(50, 98),
    };
  });
  const employees = await Employee.insertMany(employeesData);
  console.log(`[seed] ${employees.length} employees`);

  // Teams
  const teams = await Team.insertMany(
    Array.from({ length: N.teams }, (_, i) => {
      const members = sample(employees, rand(6, 14));
      return {
        name: `${pick(['Alpha', 'Bravo', 'Delta', 'Falcon', 'Titan', 'Phoenix', 'Nebula', 'Vortex'])} Team ${i + 1}`,
        department: pick(departments)._id,
        lead: members[0]._id,
        members: members.map((m) => m._id),
        capacityHoursPerWeek: members.length * 40,
      };
    })
  );

  // Users (one per role + a handful of managers mapped to employees)
  await User.create([
    { name: 'System Admin', email: 'admin@demo.com', password: 'password123', role: 'Administrator', employee: employees[0]._id },
    { name: 'Project Manager', email: 'pm@demo.com', password: 'password123', role: 'ProjectManager', employee: employees[1]._id },
    { name: 'Team Lead', email: 'lead@demo.com', password: 'password123', role: 'TeamLead', employee: employees[2]._id },
    { name: 'Employee User', email: 'employee@demo.com', password: 'password123', role: 'Employee', employee: employees[3]._id },
  ]);
  console.log('[seed] demo users created (see README for logins)');

  // Projects with milestones
  const projectsData = Array.from({ length: N.projects }, (_, i) => {
    const start = daysFromNow(-rand(10, 200));
    const end = daysFromNow(rand(-30, 180));
    const budget = rand(500000, 8000000);
    const progress = rand(5, 100);
    const status = pick(PROJECT_STATUS);
    const team = pick(teams);
    return {
      name: `${pick(CATEGORIES)} \u2014 ${pick(['Alpha', 'Beta', 'Gamma', 'Nexus', 'Fusion', 'Horizon', 'Catalyst', 'Momentum'])} ${i + 1}`,
      code: `PRJ-${1000 + i}`,
      description: 'Enterprise delivery engagement with iterative milestones and CI/CD.',
      client: pick(clients)._id,
      manager: pick(employees)._id,
      team: team._id,
      department: team.department,
      technology: sample(SKILLS, rand(2, 5)),
      category: pick(CATEGORIES),
      startDate: start,
      endDate: end,
      budget,
      spentBudget: Math.round(budget * (progress / 100) * (0.7 + Math.random() * 0.6)),
      priority: pick(PRIORITY),
      status,
      progress,
      requirements: ['Auth', 'Dashboard', 'Reporting', 'API'].slice(0, rand(2, 4)),
      requirementChanges: rand(0, 6),
      defectCount: rand(0, 12),
      milestones: Array.from({ length: rand(3, 8) }, (_, m) => ({
        title: `Milestone ${m + 1}`,
        dueDate: daysFromNow(rand(-40, 120)),
        completed: Math.random() > 0.5,
      })),
    };
  });
  const projects = await Project.insertMany(projectsData);
  console.log(`[seed] ${projects.length} projects (with milestones)`);

  // Assign projects to employees
  for (const p of projects) {
    const assignees = sample(employees, rand(4, 9));
    await Employee.updateMany(
      { _id: { $in: assignees.map((a) => a._id) } },
      { $addToSet: { assignedProjects: p._id } }
    );
  }

  // Tasks
  const tasksData = Array.from({ length: N.tasks }, (_, i) => {
    const project = pick(projects);
    const est = rand(4, 60);
    const status = pick(TASK_STATUS);
    return {
      title: `${pick(['Implement', 'Fix', 'Refactor', 'Design', 'Test', 'Deploy', 'Review'])} ${pick(['login', 'API', 'dashboard', 'schema', 'pipeline', 'report', 'auth', 'cache'])} #${i + 1}`,
      description: 'Auto-generated demo task.',
      project: project._id,
      assignee: pick(employees)._id,
      priority: pick(TASK_PRIORITY),
      status,
      estimatedHours: est,
      actualHours: status === 'Done' ? est + rand(-5, 15) : rand(0, est),
      dueDate: daysFromNow(rand(-20, 60)),
      progress: status === 'Done' ? 100 : rand(0, 90),
      order: i % 50,
    };
  });
  await Task.insertMany(tasksData);
  console.log(`[seed] ${tasksData.length} tasks`);

  // ---------------------------------------------------------------------------
  // Deterministic ownership wiring for the four DEMO accounts, so role-scoped
  // access is actually demonstrable:
  //   employees[1] -> pm@demo.com    (manages the first 8 projects)
  //   employees[2] -> lead@demo.com  (leads teams[0], used by the first 6 projects)
  //   employees[3] -> employee@demo.com (assigned to the first 5 projects + tasks)
  // ---------------------------------------------------------------------------
  const pmEmp = employees[1]._id;
  const leadEmp = employees[2]._id;
  const empEmp = employees[3]._id;

  // Team lead + membership
  await Team.updateOne(
    { _id: teams[0]._id },
    { $set: { lead: leadEmp }, $addToSet: { members: { $each: [leadEmp, empEmp] } } }
  );

  const firstProjects = projects.slice(0, 8).map((p) => p._id);
  const leadProjects = projects.slice(0, 6).map((p) => p._id);
  const empProjects = projects.slice(0, 5).map((p) => p._id);

  // PM manages the first 8 projects; first 6 belong to the lead's team.
  await Project.updateMany({ _id: { $in: firstProjects } }, { $set: { manager: pmEmp } });
  await Project.updateMany({ _id: { $in: leadProjects } }, { $set: { team: teams[0]._id } });

  // Assign the demo PM / Lead / Employee onto their projects.
  await Employee.updateOne({ _id: pmEmp }, { $addToSet: { assignedProjects: { $each: firstProjects } } });
  await Employee.updateOne({ _id: leadEmp }, { $addToSet: { assignedProjects: { $each: leadProjects } } });
  await Employee.updateOne({ _id: empEmp }, { $addToSet: { assignedProjects: { $each: empProjects } } });

  // Give the demo Employee a real set of tasks to own on their projects.
  const empTaskIds = (
    await Task.find({ project: { $in: empProjects } }).select('_id').limit(40).lean()
  ).map((t) => t._id);
  if (empTaskIds.length) {
    await Task.updateMany({ _id: { $in: empTaskIds } }, { $set: { assignee: empEmp } });
  }
  console.log('[seed] demo ownership wired (pm/lead/employee scoped data)');

  // Notifications
  const users = await User.find().lean();
  const notifsData = Array.from({ length: N.notifications }, () => ({
    user: pick(users)._id as Types.ObjectId,
    title: pick(['Task assigned', 'Deadline approaching', 'Risk alert', 'Budget update', 'New comment']),
    message: 'You have a new update on one of your projects.',
    type: pick(['info', 'success', 'warning', 'error'] as const),
    read: Math.random() > 0.6,
  }));
  await Notification.insertMany(notifsData);

  // Activity logs
  const logsData = Array.from({ length: N.activityLogs }, () => ({
    actor: pick(users)._id as Types.ObjectId,
    action: pick(['project.update', 'task.move', 'employee.update', 'ai.predict', 'user.login']),
    entity: pick(['Project', 'Task', 'Employee', 'User']),
    entityId: pick(projects)._id,
  }));
  await ActivityLog.insertMany(logsData);
  console.log(`[seed] ${notifsData.length} notifications, ${logsData.length} activity logs`);

  console.log('\n[seed] done. Demo logins:');
  console.log('  admin@demo.com / password123     (Administrator)');
  console.log('  pm@demo.com / password123        (Project Manager)');
  console.log('  lead@demo.com / password123      (Team Lead)');
  console.log('  employee@demo.com / password123  (Employee)');

  await disconnectDB();
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[seed] failed', err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
