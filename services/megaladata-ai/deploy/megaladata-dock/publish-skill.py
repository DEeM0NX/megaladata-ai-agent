#!/usr/bin/env python3
"""Retired: product skills are delivered by the application, not Dock Skills API."""

import sys


def main():
    print(
        "MEGALADATA_SKILL_PUBLICATION_DISABLED: megaladata-automation is delivered from "
        "packages/product/skills/megaladata-automation with Desktop and the CLI. "
        "New publication from this repository is disabled. The existing server "
        "record is kept for old clients and baseline evals; removing it "
        "requires a separate command after release and a compatibility check.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
