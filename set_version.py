#!/usr/bin/env python3

import os.path
import json
import sys
from argparse import ArgumentParser


# List of files to generate. The source/template file for each file
# is determined by inserting the string "_template" just before
# the file extension, so "foo.bar" becomes "foo_template.bar".
FILES = ["sonar-project.properties"]


def make_src_dest_tuples(dest_paths):
    # Insert "_template" between file basename and file extension:
    return [("%s_template%s" % os.path.splitext(x), x)
            for x in dest_paths]

def get_argparser():
    p = ArgumentParser(
        description="Generate build files by replacing %__version__% tokens "
                    "in template files.",
        epilog="Processed files (TEMPLATE -> OUTPUT): " + \
                ", ".join("(%s -> %s)" % x
                          for x in make_src_dest_tuples(FILES))
    )

    p.add_argument(
        "-k", "--version-key",
        default="version",
        help="Key in package.json that specifies the project version. "
             "Default: %(default)s"
    )

    return p

def main():
    args = get_argparser().parse_args()

    with open("package.json", "r", encoding="utf-8") as fh:
        version = json.load(fh)[args.version_key]

    for in_path, out_path in make_src_dest_tuples(FILES):
        with open(out_path, "wb") as fout, open(in_path, "rb") as fin:
            for line in fin:
                fout.write(line.replace(b"%__version__%", version.encode()))


if __name__ == "__main__":
    sys.exit(main())
