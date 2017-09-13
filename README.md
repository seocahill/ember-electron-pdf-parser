# pdf-to-csv

This an ember electron app that can be used to extract tablar data from PDF files.


## Running

You can run the file from source or build it for your platform:

- ```ember electron```
- ```ember electron:package```

The binaries are located in the electron-out folder.

## Usage

Pick a pdf file and use the domain and threshold controls to adjust the parsing until you are satisfied with the results.

Pdf-to-csv usages D3.js under the hood to collect the parsed information into bins which form the basis for the columns of the outputted CSV file.

All cells are editable! Click on any one and edit the conents in place.

When you are done export the file as a CSV.

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with NPM)
* [Ember CLI](https://ember-cli.com/)
* [PhantomJS](http://phantomjs.org/)

## Installation

* `git clone <repository-url>` this repository
* `cd pdf-to-csv`
* `npm install`

## Running / Development

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details