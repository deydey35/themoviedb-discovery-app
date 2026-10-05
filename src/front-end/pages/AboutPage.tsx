import './AboutPage.css';

const technologies = [
  {
    name: 'TypeScript',
    description: 'Typage et fiabilité',
  },
  {
    name: 'React',
    description: 'Interface composable',
  },
  {
    name: 'Node.js + Express',
    description: 'API légère',
  },
  {
    name: 'Vite',
    description: 'Développement rapide',
  },
];

export default function AboutPage() {
  return (
    <main className="app-shell about-page">
      <header className="app-header about-page__header">
        <p className="about-page__eyebrow">TMDB Discovery</p>
        <h1>À propos de l&apos;application</h1>
        <p className="about-page__intro">
          Une application de découverte de films, pensée comme une expérience
          web claire, rapide et maintenable.
        </p>
      </header>

      <section className="about-page__section about-page__project">
        <div>
          <p className="about-page__eyebrow">Le projet</p>
          <h2>Découvrir, comparer, choisir</h2>
        </div>
        <p>
          Cette application utilise l&apos;API de{' '}
          <strong>The Movie Database</strong> pour rendre les films populaires
          faciles à explorer. Elle démontre la construction d&apos;une
          application complète, du front-end à l&apos;API.
        </p>
      </section>

      <section className="about-page__section about-page__stack">
        <div>
          <p className="about-page__eyebrow">Fondations techniques</p>
          <h2>Une stack volontairement simple</h2>
        </div>
        <ul className="about-page__technology-list">
          {technologies.map((technology) => (
            <li key={technology.name} className="about-page__technology">
              <strong>{technology.name}</strong>
              <span>{technology.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-page__source">
        <div>
          <p className="about-page__eyebrow">Code source</p>
          <h2>Voir la réalisation du projet</h2>
        </div>
        <a
          className="about-page__github-link"
          href="https://github.com/deydey35/themoviedb-discovery-app"
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir le dépôt GitHub
        </a>
      </section>
    </main>
  );
}
