import {
  Bell,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  Users
} from 'lucide-react';

const projects = [
  {
    title: 'AI Study Planner',
    description: 'Планировщик учебных задач с рекомендациями по нагрузке.',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    deadline: '18 июня',
    match: 92
  },
  {
    title: 'Hackathon Radar',
    description: 'Каталог хакатонов с командным поиском и дедлайнами.',
    skills: ['TypeScript', 'Figma', 'Redis'],
    deadline: '24 июня',
    match: 86
  }
];

const teammates = [
  { name: 'Айдана Ким', role: 'Frontend', skills: ['React', 'UI/UX'], rating: '4.8' },
  { name: 'Максим Орлов', role: 'Backend', skills: ['Node.js', 'PostgreSQL'], rating: '4.7' },
  { name: 'Самира Нур', role: 'Designer', skills: ['Figma', 'Research'], rating: '4.9' }
];

const requests = [
  { project: 'Campus Events', status: 'pending', label: 'Ожидает' },
  { project: 'Code Mentor', status: 'accepted', label: 'Принята' }
];

export function App() {
  return (
    <main className="shell">
      <aside className="sidebar" aria-label="Главная навигация">
        <div className="brand">
          <span className="brandMark">E</span>
          <span>EduMatch</span>
        </div>
        <nav className="nav">
          <a className="navItem active" href="#dashboard">
            <LayoutDashboard size={18} />
            Дашборд
          </a>
          <a className="navItem" href="#projects">
            <Compass size={18} />
            Проекты
          </a>
          <a className="navItem" href="#teammates">
            <Users size={18} />
            Тиммейты
          </a>
          <a className="navItem" href="#chat">
            <MessageSquare size={18} />
            Чат
          </a>
        </nav>
      </aside>

      <section className="workspace" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Практика · неделя 1</p>
            <h1>Дашборд студента</h1>
          </div>
          <div className="actions">
            <button className="iconButton" aria-label="Уведомления">
              <Bell size={18} />
            </button>
            <button className="primaryButton">
              <Plus size={18} />
              Проект
            </button>
          </div>
        </header>

        <section className="searchPanel" id="projects">
          <Search size={19} />
          <input aria-label="Поиск проектов" placeholder="Поиск по названию, стеку или навыкам" />
          <button className="secondaryButton">Найти</button>
        </section>

        <section className="statsGrid">
          <article className="statCard">
            <span>Активные проекты</span>
            <strong>3</strong>
          </article>
          <article className="statCard accentTeal">
            <span>Заявки</span>
            <strong>2</strong>
          </article>
          <article className="statCard accentOrange">
            <span>Совпадения</span>
            <strong>14</strong>
          </article>
        </section>

        <div className="contentGrid">
          <section className="panel">
            <div className="sectionTitle">
              <Sparkles size={18} />
              <h2>Рекомендуемые проекты</h2>
            </div>
            <div className="projectList">
              {projects.map((project) => (
                <article className="projectCard" key={project.title}>
                  <div className="cardTopline">
                    <h3>{project.title}</h3>
                    <span>{project.match}%</span>
                  </div>
                  <p>{project.description}</p>
                  <div className="chips">
                    {project.skills.map((skill) => (
                      <span className="chip" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <footer>
                    <span>Дедлайн: {project.deadline}</span>
                    <button className="textButton">Открыть</button>
                  </footer>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="sectionTitle">
              <CheckCircle2 size={18} />
              <h2>Мои заявки</h2>
            </div>
            <div className="requestList">
              {requests.map((request) => (
                <article className="requestItem" key={request.project}>
                  <span>{request.project}</span>
                  <strong className={request.status}>{request.label}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="panel" id="teammates">
          <div className="sectionTitle">
            <Users size={18} />
            <h2>Подходящие тиммейты</h2>
          </div>
          <div className="teammateGrid">
            {teammates.map((teammate) => (
              <article className="teammateCard" key={teammate.name}>
                <div className="avatar" aria-hidden="true">
                  {teammate.name.slice(0, 1)}
                </div>
                <div>
                  <h3>{teammate.name}</h3>
                  <p>{teammate.role} · рейтинг {teammate.rating}</p>
                  <div className="chips">
                    {teammate.skills.map((skill) => (
                      <span className="chip muted" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="chatPreview" id="chat">
          <div>
            <p className="eyebrow">Hackathon Radar</p>
            <h2>Чат проекта</h2>
          </div>
          <div className="messages">
            <span className="message teammate">Нужно закрыть дизайн формы заявки.</span>
            <span className="message own">Я подготовлю wireframe и состояния ошибок.</span>
          </div>
          <button className="iconButton sendButton" aria-label="Отправить сообщение">
            <Send size={18} />
          </button>
        </section>
      </section>
    </main>
  );
}
