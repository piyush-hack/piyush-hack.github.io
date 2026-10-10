/* Every fact shown in the world, with its evidence link where one is public. */

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/piyush-puniya-32b453227/',
  github: 'https://github.com/piyush-hack',
  medium: 'https://medium.com/@piyushpuniya2001',
  email: 'mailto:piyushpuniya2001@gmail.com',
  pageindex: 'https://github.com/piyush-hack/pageindex-ts',
  decorator: 'https://github.com/piyush-hack/structured-node-moongose-with-log-decorator',
  dip: 'https://medium.com/@piyushpuniya2001/concrete-classes-abstractions-hiding-classes-declartion-724e6121f5a1',
  hybrid: 'https://medium.com/@piyushpuniya2001/why-your-ai-cant-tell-an-x200-from-an-x300-and-the-exact-recipe-that-fixes-it-c224fba4f232',
  agents: 'https://medium.com/@piyushpuniya2001/building-a-smart-ai-agent-system-without-giving-it-a-mental-breakdown-fa68e4071a27',
  idk: 'https://medium.com/@piyushpuniya2001/how-i-taught-my-ai-to-say-i-dont-know-and-why-that-s-a-win-a114f967d5bc',
  mutex: 'https://medium.com/@piyushpuniya2001/its-not-a-bug-it-s-a-timing-problem-how-to-stop-duplicate-writes-in-a-distributed-system-883d03111719',
  streams: 'https://medium.com/@piyushpuniya2001/world-of-streams-in-javascript-0292e84c2256',
  joyz: 'https://joyz.ai',
  telecrm: 'https://telecrm.in',
  idesign: 'https://idesign.market',
  redpositive: 'https://redpositive.in',
  amu: 'https://www.amu.ac.in',
};

export const PATTERNS = [
  { name: 'Strategy', plain: 'swap how something works without touching what uses it', use: '4 interchangeable call bridges', href: LINKS.pageindex },
  { name: 'Factory', plain: 'one door that builds the right part for each job', use: 'bridge routing · ParserFactory', href: LINKS.pageindex },
  { name: 'Adapter', plain: 'plug any vendor into the same socket', use: 'one tool schema → Gemini, OpenAI, Bedrock' },
  { name: 'Registry', plain: 'add a new provider by registering one class', use: 'voice engine registry' },
  { name: 'Repository', plain: 'storage hidden behind a clean contract', use: 'call queue over DynamoDB + SQS' },
  { name: 'Chain of responsibility', plain: 'each request finds the first part that can handle it', use: 'tool-call routing' },
  { name: 'Facade', plain: 'one simple front door over a complex system', use: 'pageindex-ts', href: LINKS.pageindex },
  { name: 'Decorator', plain: 'add behaviour like logging without editing the code', use: 'layered Node service', href: LINKS.decorator },
  { name: 'Dependency inversion', plain: 'depend on promises, never on concrete parts', use: 'my write-up', href: LINKS.dip },
];

export const SKILLS = [
  { name: 'Architecture', proof: 'how every system I build is shaped', items: ['System design', 'Design patterns', 'SOLID', 'Distributed systems', 'Serverless', 'Event-driven', 'Monorepos'] },
  { name: 'AI', proof: 'shipped at JoyzAI: agents, RAG and Voice AI in production', items: ['AI agents', 'Multi-agent', 'MCP', 'RAG', 'Hybrid search', 'Voice AI', 'OpenAI', 'Anthropic', 'Gemini', 'Bedrock'] },
  { name: 'Backend', proof: 'every role since 2021', items: ['TypeScript', 'Node.js', 'Express', 'WebSockets', 'REST APIs', 'Puppeteer', 'JavaScript', 'C++'] },
  { name: 'Cloud', proof: 'serverless at JoyzAI, CI/CD from scratch at TeleCRM', items: ['AWS Lambda', 'SQS', 'EventBridge', 'S3', 'EC2', 'CI/CD', 'Firebase', 'Git'] },
  { name: 'Data', proof: 'MongoDB at TeleCRM and JoyzAI, DynamoDB since 2021', items: ['MongoDB', 'Vector search', 'DynamoDB', 'Redis', 'MySQL'] },
  { name: 'Frontend', proof: 'Angular libraries at TeleCRM, a React platform at IDesign.Market', items: ['Angular', 'React', 'Shared UI libraries', 'Web performance'] },
];

export const FLOORS = [
  { name: 'Clients', note: 'web · mobile · chat · voice · partners', tip: 'Anything can plug in. At JoyzAI, 8 channels share one core.' },
  { name: 'Interfaces', note: 'stable contracts that never break', tip: 'Contracts stay fixed while implementations change — that is how 4 voice providers plug into one interface.' },
  { name: 'Services', note: 'stateless · scale out on demand', tip: 'Independent services scale out as load grows — 25 serverless services at JoyzAI.' },
  { name: 'Data', note: 'queues · cache · one source of truth', tip: 'Queues absorb spikes and atomic writes keep data consistent — a serverless call queue on SQS + DynamoDB.' },
];

export const JOURNEY = [
  { company: 'Red Positive', role: 'Backend intern', year: '2021', href: LINKS.redpositive, wins: 'DynamoDB integration · Twilio + SendGrid messaging' },
  { company: 'IDesign.Market', role: 'SWE intern', year: '2022', href: LINKS.idesign, wins: 'Solo-built a B2B platform · WebSockets · Lighthouse 55 → 95 · introduced SOLID' },
  { company: 'TeleCRM', role: 'SWE · team lead', year: '2023', href: LINKS.telecrm, wins: 'Led the team · CI/CD from scratch · 500 → 7,000 concurrent · DB cost −57%' },
  { company: 'JoyzAI', role: 'Software Engineer', year: '2024', href: LINKS.joyz, wins: 'AI CRM agents · provider-agnostic agent SDK · 99% multi-agent loop' },
  { company: 'JoyzAI', role: 'Senior SWE', year: '2025', href: LINKS.joyz, wins: 'Voice AI end to end · public MCP server · serverless call queue' },
];

export const AGENT_NAMES = ['Leads', 'Orders', 'Licences', 'Tracking', 'Knowledge'];
export const AGENT_STATUS = ['INPROGRESS', 'RESOLVED', 'DISCONTINUE', 'INPROGRESS', 'RESOLVED'];

export const QUERIES = [
  { text: '“Can I return my X200 after 20 days?”', points: [[5.7, 0, 0], [5.6, 0, 0], [5.6, 7.4, 3.3]], winner: 2 },
  { text: '“Can I get my money back?”', points: [[5.7, 0, 0], [5.6, 0, 0], [5.6, 0, 0]], winner: 0 },
];

export const OWNERSHIP = 0.67;
