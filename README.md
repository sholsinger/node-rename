# Usage
A basic example of how to use this package is shown below:

    $ ./node-rename.js -i=~/images/highres -o=~/images/highres-renamed ~/image_mapping.csv

# Mapping File Format
The mapping file is expected to be a CSV file with two labeled columns. The two columns are expected to be identified by the following headings:

    old_name,new_name

The rows following the heading row are evaluated in a case inspecific manner. However the new_name column is used as provided. Some sample rows:

    foo,bar
    HTML,txt

Given the following folder structure:

    images/highres/
     |- foo_1.jpg
     |- foo_2.png
     |- foo_3.gif
     |- baz.pdf
     |- baz.html

The above example row would match the `foo_*.*` and `baz.html` files and rename them to `bar_1.jpg`, `bar_2.png`, `bar_3.gif`, and `baz.txt` respectively.

# Roadmap
Potential support of regular expressions and variable renaming.