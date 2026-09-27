# Practice exercise dataset

SetForge currently uses the public
[`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset) repository for
local development and learning.

The catalogue contains 1,324 exercises, English instructions, 180x180 thumbnails, and 180x180
animated GIF demonstrations. SetForge keeps the original exercise source ID so the import can be
run repeatedly without creating another copy of every exercise.

## Media usage

The exercise data and instruction text are provided under the dataset's MIT licence. The images and
GIFs are owned by GymVisual. They are included in this practice project with their original notice
and attribution, but the dataset explicitly says that cloning it does not grant a downstream media
licence.

Before SetForge is published, the media must be licensed directly from GymVisual or replaced with
assets whose licence permits publication.

## Loading the catalogue

In pgAdmin, connect to `setforge_db` as `postgres` and run these files in order:

1. `docs/database/schema.sql`
2. `docs/database/exercise-catalog-data.sql`
3. `docs/database/dev-data.sql`

The catalogue import is repeatable. Existing exercises with an exact matching name are connected to
the dataset record so workout templates keep their current exercise IDs. Other catalogue records are
inserted, and records imported previously are refreshed.

The backend serves thumbnails below `/exercise-media/images/` and animations below
`/exercise-media/gifs/`. Every imported API response includes the required GymVisual attribution.
