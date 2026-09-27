param(
    [Parameter(Mandatory = $true)]
    [string]$DatasetJsonPath,

    [string]$OutputPath = (Join-Path $PSScriptRoot '..\docs\database\exercise-catalog-data.sql')
)

$ErrorActionPreference = 'Stop'

function ConvertTo-SqlLiteral {
    param([AllowNull()][object]$Value)

    if ($null -eq $Value) {
        return 'NULL'
    }

    $escaped = ([string]$Value).Replace("'", "''")
    return "'$escaped'"
}

function Get-ExerciseType {
    param([string]$Name)

    $normalizedName = $Name.Trim().ToLowerInvariant()
    if ($normalizedName -match 'stretch' -or
        $normalizedName -match '(^|\s)hold($|\s|\()' -or
        $normalizedName -match 'wall sit' -or
        $normalizedName -match '^(front |reverse |side |bodyweight )?plank( \([^)]*\))?$') {
        return 'TIMED'
    }

    return 'WEIGHT_AND_REPS'
}

$dataset = Get-Content -Raw -LiteralPath $DatasetJsonPath | ConvertFrom-Json
$rows = foreach ($exercise in $dataset) {
    $secondaryMuscles = $exercise.secondary_muscles -join ', '
    $thumbnailUrl = "/exercise-media/$($exercise.image.Replace('\', '/'))"
    $animationFilename = Split-Path -Leaf $exercise.gif_url
    $animationUrl = "/exercise-media/gifs/$animationFilename"

    $values = @(
        ConvertTo-SqlLiteral $exercise.id
        ConvertTo-SqlLiteral $exercise.name
        ConvertTo-SqlLiteral $exercise.target
        ConvertTo-SqlLiteral $exercise.equipment
        ConvertTo-SqlLiteral (Get-ExerciseType $exercise.name)
        ConvertTo-SqlLiteral $exercise.instructions.en
        ConvertTo-SqlLiteral $exercise.body_part
        ConvertTo-SqlLiteral $exercise.muscle_group
        ConvertTo-SqlLiteral $secondaryMuscles
        ConvertTo-SqlLiteral $thumbnailUrl
        ConvertTo-SqlLiteral $animationUrl
        ConvertTo-SqlLiteral $exercise.attribution
    )

    "    ($($values -join ', '))"
}

$header = @'
-- Generated from https://github.com/hasaneyldrm/exercises-dataset
-- Practice use only. The images and GIFs remain © Gym visual.
-- Run schema.sql before this repeatable catalogue import.

BEGIN;

CREATE TEMP TABLE setforge_exercise_import
(
    source_id          VARCHAR(50) PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    primary_muscle     VARCHAR(50) NOT NULL,
    equipment          VARCHAR(50) NOT NULL,
    exercise_type      VARCHAR(30) NOT NULL,
    instructions       TEXT,
    body_part          VARCHAR(50),
    muscle_group       VARCHAR(100),
    secondary_muscles  TEXT,
    thumbnail_url      VARCHAR(255),
    animation_url      VARCHAR(255),
    attribution        VARCHAR(255)
) ON COMMIT DROP;

INSERT INTO setforge_exercise_import (
    source_id, name, primary_muscle, equipment, exercise_type, instructions,
    body_part, muscle_group, secondary_muscles, thumbnail_url, animation_url, attribution
)
VALUES
'@

$footer = @'
;

-- Attach an exact-name legacy exercise to its dataset record while preserving its ID and type.
UPDATE exercises existing
SET source_name = 'hasaneyldrm/exercises-dataset',
    source_id = imported.source_id,
    name = imported.name,
    primary_muscle = imported.primary_muscle,
    equipment = imported.equipment,
    instructions = imported.instructions,
    body_part = imported.body_part,
    muscle_group = imported.muscle_group,
    secondary_muscles = imported.secondary_muscles,
    thumbnail_url = imported.thumbnail_url,
    animation_url = imported.animation_url,
    attribution = imported.attribution
FROM setforge_exercise_import imported
WHERE existing.source_name IS NULL
  AND existing.source_id IS NULL
  AND LOWER(existing.name) = LOWER(imported.name)
  AND (
      SELECT COUNT(*)
      FROM setforge_exercise_import duplicate_check
      WHERE LOWER(duplicate_check.name) = LOWER(imported.name)
  ) = 1;

-- Refresh rows that were imported on an earlier run.
UPDATE exercises existing
SET name = imported.name,
    primary_muscle = imported.primary_muscle,
    equipment = imported.equipment,
    exercise_type = imported.exercise_type,
    instructions = imported.instructions,
    body_part = imported.body_part,
    muscle_group = imported.muscle_group,
    secondary_muscles = imported.secondary_muscles,
    thumbnail_url = imported.thumbnail_url,
    animation_url = imported.animation_url,
    attribution = imported.attribution
FROM setforge_exercise_import imported
WHERE existing.source_name = 'hasaneyldrm/exercises-dataset'
  AND existing.source_id = imported.source_id;

-- Insert catalogue exercises that do not exist yet.
INSERT INTO exercises (
    name, primary_muscle, equipment, exercise_type, instructions, body_part, muscle_group,
    secondary_muscles, source_name, source_id, thumbnail_url, animation_url, attribution
)
SELECT
    imported.name,
    imported.primary_muscle,
    imported.equipment,
    imported.exercise_type,
    imported.instructions,
    imported.body_part,
    imported.muscle_group,
    imported.secondary_muscles,
    'hasaneyldrm/exercises-dataset',
    imported.source_id,
    imported.thumbnail_url,
    imported.animation_url,
    imported.attribution
FROM setforge_exercise_import imported
WHERE NOT EXISTS (
    SELECT 1
    FROM exercises existing
    WHERE existing.source_name = 'hasaneyldrm/exercises-dataset'
      AND existing.source_id = imported.source_id
);

COMMIT;
'@

$content = $header + "`n" + ($rows -join ",`n") + "`n" + $footer
$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
[System.IO.File]::WriteAllText($resolvedOutputPath, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host "Generated $($dataset.Count) exercise rows at $resolvedOutputPath"
