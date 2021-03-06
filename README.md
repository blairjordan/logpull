[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# logpull

![](img/logo.png?raw=true)

A quick-and-dirty command line tool for retrieving log files from Loggly's API.

Includes a script to upload your log output to Azure. Access blob storage through Office365 Flow, transfer it to your Sharepoint site, display it in an embedded Power BI, etc. The world is your oyster 👍

## Install

  `npm install`

## Configure

In **config.json**, supply the following credentials:

- `CUSTOMER_TOKEN`
- `API_TOKEN`
- `CUSTOMER_SUBDOMAIN`

These details can be located by logging into [Loggly](https://www.loggly.com/).

## Usage

  `node pull.js <from> <to> <query> [-v]`
  
### Examples

#### Pull log files

  `node pull.js -7d now "*" -v`

#### Merge log files

  `node merge.js`

This command will look for files under /logs, flatten their JSON contents, and place into a csv.

Fields to extract from Loggly's **json** object are defined in **config.json**, under **MessageSchema**.
