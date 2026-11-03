# Modèle de données du tableau de bord

Ce modèle couvre le périmètre du ticket DASHBOARD-01. Il sépare les
référentiels de genres et de pays des associations avec les films afin qu'un
film puisse être relié à plusieurs genres et plusieurs pays sans duplication.

## MCD

```text
FILM (1) ───< OBSERVATION_FILM
FILM (1) ───< FILM_GENRE >─── (1) GENRE
FILM (1) ───< FILM_PAYS_PRODUCTION >─── (1) PAYS
```

### Entités

#### Film

Un film est identifié par son identifiant TMDB. Il conserve les informations
stables ou descriptives nécessaires au tableau de bord :

- `tmdb_id` : identifiant TMDB, unique et non nul ;
- `title`, `original_title`, `overview` et `release_date` ;
- `release_year` : année dérivée de `release_date`, utilisée pour les
  agrégations ;
- `original_language` ;
- `poster_path` et `backdrop_path` ;
- `tagline`.

#### Observation de film

Une observation représente les valeurs mesurées ou récupérées lors d'une
collecte. Elle permet d'actualiser un film sans écraser son historique :

- `observed_at` : date et heure de collecte ;
- `popularity`, `vote_average`, `vote_count` ;
- `runtime`, `budget` et `revenue`.

Les valeurs absentes de TMDB restent nulles. `runtime`, `budget` et `revenue`
sont soit nulles, soit strictement positives ; zéro n'est pas une valeur
connue. Une observation est unique pour un film et un instant de collecte.

#### Genre

Un genre est identifié par son identifiant TMDB, indépendant de son libellé
traduit. Le libellé peut évoluer selon la langue ou l'actualisation du
catalogue.

#### Pays de production

Un pays est identifié par son code ISO/TMDB. Son nom est conservé comme
libellé affiché et peut être actualisé indépendamment des films.

## Relations et cardinalités

- Un `Film` possède une ou plusieurs `ObservationFilm` lorsqu'il a été
  collecté ; une observation appartient à un seul film.
- Un `Film` peut avoir zéro, un ou plusieurs `Genre`. Un `Genre` peut être
  associé à zéro, un ou plusieurs films. L'association `FilmGenre` est unique
  pour le couple `(film, genre)`.
- Un `Film` peut avoir zéro, un ou plusieurs `Pays`. Un `Pays` peut participer
  à zéro, un ou plusieurs films. L'association `FilmPaysProduction` est unique
  pour le couple `(film, pays)`.
- Les suppressions d'un film suppriment ses observations et associations
  dépendantes. La suppression d'un genre ou d'un pays référencé est refusée
  afin de préserver l'intégrité des données.

## Schéma relationnel

```text
FILM(
  tmdb_id PK,
  title NOT NULL,
  original_title NOT NULL,
  overview,
  release_date,
  release_year,
  original_language,
  poster_path,
  backdrop_path,
  tagline
)

OBSERVATION_FILM(
  film_id PK/FK -> FILM.tmdb_id,
  observed_at PK,
  popularity,
  vote_average,
  vote_count,
  runtime,
  budget,
  revenue
)

GENRE(
  tmdb_id PK,
  name NOT NULL
)

FILM_GENRE(
  film_id PK/FK -> FILM.tmdb_id,
  genre_id PK/FK -> GENRE.tmdb_id
)

PAYS(
  code PK,
  name NOT NULL
)

FILM_PAYS_PRODUCTION(
  film_id PK/FK -> FILM.tmdb_id,
  country_code PK/FK -> PAYS.code
)
```

Les clés primaires des tables d'association empêchent les doublons. Les clés
étrangères sont obligatoires et doivent être activées par la base de données.
Les contraintes de domaine suivantes s'appliquent :

- `release_year` est l'année de `release_date` et ne doit pas être renseignée
  sans date de sortie ;
- `runtime`, `budget` et `revenue` sont `NULL` ou strictement supérieurs à
  zéro ;
- `vote_average`, `vote_count` et `popularity` restent `NULL` lorsque TMDB ne
  fournit pas la valeur ;
- `observed_at` est obligatoire pour chaque observation.

Ce modèle constitue le contrat fonctionnel ; son implémentation SQLite et son
CLI d'initialisation sont traités dans DASHBOARD-02.
