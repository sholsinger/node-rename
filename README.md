# Usage
A basic example of how to use this package is shown below:

    $ ./node-rename.js -i=~/images/highres -o=~/images/highres-renamed ~/image_mapping.csv

# Mapping File Format
The mapping file is expected to be a CSV file with two labeled columns being required. The two required columns are expected to be identified by the following headings:

    old_name,new_name

An optional third column called renumber can be included as so. This column is explained below.

    old_name,new_name,renumber

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

The optional 'renumber' column is used to renumber images that were saved using a naming convention where numbering comes right before the extension. The values accepted in this column are a number or the word 'false'. If a number is provided it is added to whatever number is found just before the file extension on the existing filename. For example, take a look at the following rule:

    foo,bar,3

Given the same folder structure used in the previous example, the resulting folder structure would be:

    images/highres/
     |- foo_4.jpg
     |- foo_5.png
     |- foo_6.gif
     |- baz.pdf
     |- baz.html


# Options

## `--help`,`help`, and `-h`
Shows a help message.

## `--dryrun`, `-d`
Writes out renames to console rather than actually doing them.

Sample output:

    images/highres/foo_1.jpg → images/highres-renamed/bar_1.jpg

## `--verbose`, `-v`
Dumps configuration and other extra information to console as it runs.

## `-i`
Sets the folder where images are detected.

## `-o`
Sets the folder where images are moved to after renames. (if the same as `-i` then renames are done in place)

# Roadmap
Some additional functionality would be nice to have. Such as:

* Potential support of regular expressions and variable renaming.
