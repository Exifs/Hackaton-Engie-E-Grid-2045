# Créer une release sans Git CLI

Le workflow GitHub Actions **Create release tag** permet de créer un tag de release depuis l'interface GitHub, sans passer par `git tag` ou `git push` en local.

## Utilisation

1. Aller dans l'onglet **Actions** du dépôt.
2. Ouvrir le workflow **Create release tag**.
3. Cliquer sur **Run workflow**.
4. Renseigner :
   - `tag_name` : un tag de release commençant par `v`, par exemple `v0.1.0` ou `v2026.06.19` ;
   - `target_ref` : la branche, le tag ou le SHA à publier, généralement `main`.
5. Lancer le workflow.

Le workflow crée le tag Git côté GitHub. Le push de tag déclenche ensuite les workflows de release existants, notamment **Godot release builds**.

## Secret requis

Le workflow doit utiliser un token autre que le `GITHUB_TOKEN` par défaut, sinon les workflows déclenchés par le tag ne se lancent pas.

Configurer au moins un de ces secrets de dépôt :

- `RELEASE_TAG_TOKEN` : recommandé ; token dédié avec permission **Contents: Read and write** sur ce dépôt ;
- `REPO_ADMIN_TOKEN` : fallback déjà utilisé par certains workflows Pages, si ce secret existe déjà avec les droits nécessaires.

Le workflow utilise `RELEASE_TAG_TOKEN` en priorité, puis `REPO_ADMIN_TOKEN` si le token dédié n'est pas configuré.

## Garde-fous

- Le tag doit commencer par `v` afin de rester compatible avec la convention de release et les règles d'environnement Pages.
- Un tag existant n'est jamais écrasé automatiquement.
- Le workflow affiche le SHA réellement taggé dans le résumé GitHub Actions.
