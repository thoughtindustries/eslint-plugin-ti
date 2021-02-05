# eslint-plugin-ti

Rules specific to Thought Industries

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-ti`:

```
$ yarn add https://github.com/thoughtindustries/eslint-plugin-ti.git --save-dev
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
        "ti/rule-name": 2
    }
}
```

## Supported Rules

* `walk` Runs through and verifies that `updatedAt` has been added where needed. Two options must be passed to the rule: `filePath` This is the path that you want to walk. `indexerPath` This is where you look for indexers.





