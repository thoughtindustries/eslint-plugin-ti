# eslint-plugin-ti

Rules specific to Thought Industries

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-ti`:

```
$ yarn add @thoughtindustries/eslint-plugin-ti --save-dev
```


## Usage

Add `ti` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "ti"
    ]
}
```


Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "@thoughtindustries/ti/add-updated-at": ["error", { "indexerPattern": "lms/**/*.js", "limitToIndexedTables": true }],
        "@thoughtindustries/ti/run-indexer": ["error", { "indexerPattern": "lms/**/*.js" }],
        "@thoughtindustries/ti/use-db-layer": ["error", { "tables": ["translations"] }]
    }
}
```

## Supported Rules

* `add-updated-at` Verifies that `updatedAt` has been added where needed. `indexerPattern` Required. The glob pattern to look for `*_indexer.js` files. `limitToIndexedTables`. Optional. If true this will limit the check to indexed tables.
* `run-indexer` Verifies that the indexer has been run. E.g. `learningPaths` table should have `learningPathIndexer` run after the call to the database. `indexerPattern` Required. The glob pattern to look for `*_indexer.js` files.
* `use-db-layer` Verifies that any tables that have been updated to use the database layer are using it instead of calling the database directly.
