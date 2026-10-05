import './Footer.css';

declare const __APP_VERSION__: string;

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <p className="footer__copyright">
          TMDB Discovery · Version{' '}
          {__APP_VERSION__}
        </p>
        <ul className="footer__links">
          <li>
            <a
              href="https://github.com/deydey35/themoviedb-discovery-app"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
            >
              The Movie Database
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
