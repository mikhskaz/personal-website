"""
Compatibility entry point for the canonical app-data builder.

The experimental version previously duplicated build_app_data.py, switched the
heat correlation to an optional LST column, but also reintroduced the incorrect
PIC + MHA headline total and omitted newer metadata. Keep one implementation so
annual LST parsing, crisis-count semantics, and output schemas cannot diverge.
"""

from pathlib import Path
import runpy


if __name__ == "__main__":
    canonical = Path(__file__).with_name("build_app_data.py")
    runpy.run_path(str(canonical), run_name="__main__")
