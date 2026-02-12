export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  files: Record<string, string>;
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'saas-landing',
    name: 'Landing SaaS',
    description: 'Page d\'accueil moderne avec hero, features et pricing',
    icon: '🚀',
    files: {
      'App.tsx': `const { useState } = React;

function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-xl font-black tracking-tight">SaaSName</span>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm text-neutral-400 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-neutral-400 hover:text-white transition-colors">Pricing</a>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">Get Started</button>
        </div>
      </nav>
      <header className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 mb-6">✨ Now in Beta</div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">Build faster.<br/>Ship smarter.</h1>
        <p className="text-lg text-neutral-400 max-w-xl mx-auto mb-10">The all-in-one platform that helps teams build, deploy, and scale their products with AI-powered tools.</p>
        <div className="flex items-center justify-center gap-4">
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-lg">Start Free</button>
          <button className="px-8 py-3 border border-white/20 hover:bg-white/5 text-white font-bold rounded-xl transition-colors text-lg">Watch Demo</button>
        </div>
      </header>
      <section id="features" className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-6">
        {[{icon:'⚡',title:'Lightning Fast',desc:'Deploy in seconds with zero config.'},{icon:'🔒',title:'Secure by Default',desc:'Enterprise-grade security built-in.'},{icon:'📊',title:'Real-time Analytics',desc:'Monitor everything in real-time.'}].map((f,i)=>(
          <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/30 transition-colors">
            <span className="text-3xl mb-4 block">{f.icon}</span>
            <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
            <p className="text-sm text-neutral-400">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`,
    },
  },
  {
    id: 'dashboard',
    name: 'Dashboard Analytics',
    description: 'Tableau de bord avec KPIs, graphiques et table',
    icon: '📊',
    files: {
      'App.tsx': `const { useState } = React;

function StatCard({ label, value, change, positive }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      <p className={\`text-xs font-bold mt-2 \${positive ? 'text-emerald-400' : 'text-red-400'}\`}>{change}</p>
    </div>
  );
}

function App() {
  const stats = [
    { label: 'Revenue', value: '$48,290', change: '+12.5%', positive: true },
    { label: 'Users', value: '2,847', change: '+8.2%', positive: true },
    { label: 'Orders', value: '1,024', change: '-2.1%', positive: false },
    { label: 'Conversion', value: '3.6%', change: '+0.8%', positive: true },
  ];
  const rows = [
    { name: 'Alice Martin', email: 'alice@mail.com', plan: 'Pro', spent: '$240' },
    { name: 'Bob Dupont', email: 'bob@mail.com', plan: 'Free', spent: '$0' },
    { name: 'Claire Morel', email: 'claire@mail.com', plan: 'Business', spent: '$890' },
    { name: 'David Leroy', email: 'david@mail.com', plan: 'Pro', spent: '$120' },
  ];
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6">
      <h1 className="text-2xl font-black mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s,i) => <StatCard key={i} {...s} />)}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-neutral-500 text-xs uppercase">
            <th className="text-left p-4">Name</th><th className="text-left p-4">Email</th><th className="text-left p-4">Plan</th><th className="text-right p-4">Spent</th>
          </tr></thead>
          <tbody>{rows.map((r,i)=>(
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-4 font-semibold text-white">{r.name}</td>
              <td className="p-4 text-neutral-400">{r.email}</td>
              <td className="p-4"><span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">{r.plan}</span></td>
              <td className="p-4 text-right font-bold text-white">{r.spent}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`,
    },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Portfolio personnel avec projets et contact',
    icon: '🎨',
    files: {
      'App.tsx': `const { useState } = React;

function App() {
  const projects = [
    { title: 'E-commerce App', tag: 'React', color: 'from-blue-500 to-purple-600' },
    { title: 'AI Dashboard', tag: 'TypeScript', color: 'from-emerald-500 to-teal-600' },
    { title: 'Mobile Banking', tag: 'React Native', color: 'from-orange-500 to-red-600' },
  ];
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="flex items-center justify-between px-8 py-5">
        <span className="text-lg font-black">John Doe</span>
        <div className="flex gap-6 text-sm text-neutral-400">
          <a href="#work" className="hover:text-white transition-colors">Work</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </nav>
      <header className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <p className="text-sm text-blue-400 font-bold mb-4">Full-Stack Developer</p>
        <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">I build digital<br/>experiences that matter.</h1>
        <p className="text-neutral-400 text-lg max-w-lg">Passionate about clean code, pixel-perfect UI, and scalable architecture.</p>
      </header>
      <section id="work" className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-6">Selected Work</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {projects.map((p,i)=>(
            <div key={i} className="group rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <div className={\`h-40 bg-gradient-to-br \${p.color} opacity-60 group-hover:opacity-80 transition-opacity\`}/>
              <div className="p-4">
                <h3 className="font-bold text-white">{p.title}</h3>
                <span className="text-xs text-neutral-500 font-bold">{p.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`,
    },
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Vitrine',
    description: 'Boutique avec catalogue produits et panier',
    icon: '🛒',
    files: {
      'App.tsx': `const { useState } = React;

function App() {
  const [cart, setCart] = useState([]);
  const products = [
    { id: 1, name: 'Wireless Headphones', price: 79, img: '🎧' },
    { id: 2, name: 'Smart Watch', price: 199, img: '⌚' },
    { id: 3, name: 'Laptop Stand', price: 49, img: '💻' },
    { id: 4, name: 'USB-C Hub', price: 39, img: '🔌' },
    { id: 5, name: 'Mechanical Keyboard', price: 129, img: '⌨️' },
    { id: 6, name: 'Desk Lamp', price: 59, img: '💡' },
  ];
  const addToCart = (p) => setCart(prev => [...prev, p]);
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-xl font-black">Store</span>
        <button className="relative px-4 py-2 bg-white/10 rounded-lg text-sm font-bold hover:bg-white/15 transition-colors">
          🛒 Cart ({cart.length})
        </button>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black mb-8">All Products</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {products.map(p=>(
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 transition-all">
              <div className="text-5xl mb-4 text-center py-6">{p.img}</div>
              <h3 className="font-bold text-white">{p.name}</h3>
              <p className="text-blue-400 font-black text-lg my-2">\${p.price}</p>
              <button onClick={()=>addToCart(p)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">Add to Cart</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`,
    },
  },
  {
    id: 'todo',
    name: 'Todo App',
    description: 'Gestionnaire de tâches avec filtres et animations',
    icon: '✅',
    files: {
      'App.tsx': `const { useState } = React;

function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Design the landing page', done: true },
    { id: 2, text: 'Set up authentication', done: false },
    { id: 3, text: 'Deploy to production', done: false },
  ]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos(prev => [...prev, { id: Date.now(), text: input.trim(), done: false }]);
    setInput('');
  };
  const toggle = (id) => setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const remove = (id) => setTodos(prev => prev.filter(t => t.id !== id));
  const filtered = todos.filter(t => filter === 'all' ? true : filter === 'active' ? !t.done : t.done);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-start justify-center pt-20 px-6">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-black tracking-tight mb-8">Todo</h1>
        <div className="flex gap-2 mb-6">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTodo()} placeholder="Add a task…" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-blue-500/50"/>
          <button onClick={addTodo} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm">Add</button>
        </div>
        <div className="flex gap-2 mb-4">
          {['all','active','done'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={\`px-3 py-1 rounded-lg text-xs font-bold transition-colors \${filter===f?'bg-blue-600 text-white':'text-neutral-500 hover:text-white hover:bg-white/5'}\`}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map(t=>(
            <div key={t.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl group">
              <button onClick={()=>toggle(t.id)} className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors \${t.done?'bg-blue-600 border-blue-600':'border-neutral-600 hover:border-blue-500'}\`}>
                {t.done && <span className="text-white text-xs">✓</span>}
              </button>
              <span className={\`flex-1 text-sm \${t.done?'line-through text-neutral-600':'text-white'}\`}>{t.text}</span>
              <button onClick={()=>remove(t.id)} className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-600 mt-4">{todos.filter(t=>!t.done).length} task(s) remaining</p>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`,
    },
  },
  {
    id: 'blog',
    name: 'Blog',
    description: 'Blog minimaliste avec articles et lecture',
    icon: '📝',
    files: {
      'App.tsx': `const { useState } = React;

const posts = [
  { id: 1, title: 'Getting Started with React', excerpt: 'Learn the fundamentals of React and build your first component.', date: 'Jan 15, 2025', tag: 'Tutorial', readTime: '5 min' },
  { id: 2, title: 'The Future of AI in Development', excerpt: 'How artificial intelligence is transforming the way we write code.', date: 'Jan 12, 2025', tag: 'AI', readTime: '8 min' },
  { id: 3, title: 'Designing for Dark Mode', excerpt: 'Best practices for creating beautiful dark mode interfaces.', date: 'Jan 10, 2025', tag: 'Design', readTime: '6 min' },
];

function App() {
  const [selected, setSelected] = useState(null);
  if (selected) {
    const post = posts.find(p => p.id === selected);
    return (
      <div className="min-h-screen bg-[#050505] text-white max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-400 hover:text-blue-300 mb-8 block">← Back</button>
        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">{post.tag}</span>
        <h1 className="text-4xl font-black mt-4 mb-4">{post.title}</h1>
        <p className="text-neutral-500 text-sm mb-8">{post.date} · {post.readTime} read</p>
        <div className="text-neutral-300 leading-relaxed space-y-4">
          <p>{post.excerpt}</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="max-w-2xl mx-auto px-6 pt-16 pb-10">
        <h1 className="text-4xl font-black tracking-tight">Blog</h1>
        <p className="text-neutral-500 mt-2">Thoughts on code, design, and building products.</p>
      </header>
      <main className="max-w-2xl mx-auto px-6 pb-16 space-y-4">
        {posts.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)} className="w-full text-left p-5 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">{p.tag}</span>
              <span className="text-[10px] text-neutral-600">{p.date}</span>
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{p.title}</h2>
            <p className="text-sm text-neutral-400 mt-1">{p.excerpt}</p>
          </button>
        ))}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));`,
    },
  },
];
